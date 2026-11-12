import { NATIVE_CATALOG } from '../data/catalog';
import {
  type BagEntry,
  validateCatalog,
  sanitizeBagEntries,
  findVariantInCatalog,
  addBagItems,
  formatUSD,
  formatShortlistText,
} from './runwayMath';

const STORAGE_KEY = 'runway-styling-bag-v3';

class StylingBagController {
  private entries: BagEntry[] = [];
  private toastTimer: number | null = null;
  private initialized = false;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = sanitizeBagEntries(JSON.parse(raw));
      }
    } catch {
      this.entries = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // ignore storage errors
    }
  }

  public initDOM() {
    if (this.initialized) {
      this.updateCounts();
      this.renderDialog();
      return;
    }
    this.initialized = true;
    this.load();
    this.updateCounts();
    this.renderDialog();

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const openBtn = target.closest('#open-bag');
      if (openBtn) {
        e.preventDefault();
        this.openDialog();
        return;
      }

      const closeBtn = target.closest('#close-bag');
      if (closeBtn) {
        e.preventDefault();
        this.closeDialog();
        return;
      }

      const removeBtn = target.closest('[data-bag-remove]') as HTMLElement | null;
      if (removeBtn) {
        e.preventDefault();
        const id = Number(removeBtn.dataset.bagRemove);
        this.remove(id);
        return;
      }

      const exportBtn = target.closest('#export-bag');
      if (exportBtn) {
        e.preventDefault();
        this.exportShortlist();
        return;
      }

      const dialog = document.getElementById('bag-dialog') as HTMLDialogElement | null;
      if (dialog && dialog.open && target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const me = e as MouseEvent;
        if (
          me.clientX < rect.left ||
          me.clientX > rect.right ||
          me.clientY < rect.top ||
          me.clientY > rect.bottom
        ) {
          this.closeDialog();
        }
      }
    });
  }

  public getTotalCount(): number {
    return this.entries.reduce((sum, e) => sum + e.quantity, 0);
  }

  public updateCounts() {
    const total = this.getTotalCount();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(total);
    });
  }

  public async add(items: BagEntry[]): Promise<void> {
    const catalog = validateCatalog(NATIVE_CATALOG);
    await new Promise((r) => setTimeout(r, 220));
    this.entries = addBagItems(this.entries, items, catalog);
    this.save();
    this.updateCounts();
    this.renderDialog();
    this.showToast(
      items.length > 1
        ? 'Kompletter Look in deiner Styling-Tasche gespeichert'
        : 'Piece in deiner Styling-Tasche gespeichert'
    );
  }

  public remove(variantId: number) {
    this.entries = this.entries.filter((e) => e.id !== variantId);
    this.save();
    this.updateCounts();
    this.renderDialog();
  }

  public showToast(msg: string) {
    const statusEl = document.getElementById('bag-status');
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.add('is-on');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      statusEl.classList.remove('is-on');
    }, 2500);
  }

  public openDialog() {
    this.renderDialog();
    const dialog = document.getElementById('bag-dialog') as HTMLDialogElement | null;
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal();
    }
  }

  public closeDialog() {
    const dialog = document.getElementById('bag-dialog') as HTMLDialogElement | null;
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  public renderDialog() {
    const container = document.getElementById('bag-items');
    const totalEl = document.getElementById('bag-total');
    const exportBtn = document.getElementById('export-bag') as HTMLButtonElement | null;
    if (!container || !totalEl || !exportBtn) return;

    const catalog = validateCatalog(NATIVE_CATALOG);
    container.innerHTML = '';

    if (this.entries.length === 0) {
      const p = document.createElement('p');
      p.className = 'bag-note';
      p.textContent =
        'Deine Styling-Tasche ist noch leer. Wähle deine Größe bei einem Piece, um es dir zu sichern.';
      container.appendChild(p);
      totalEl.textContent = '';
      exportBtn.disabled = true;
      return;
    }

    let subtotal = 0;

    for (const entry of this.entries) {
      const found = findVariantInCatalog(entry.id, catalog);
      if (!found) continue;
      const { item, variant } = found;
      const parsedUrl = new URL(item.url);
      if (parsedUrl.hostname !== 'nike-makknzjs.myshopify.com') {
        throw new Error('Ungültige Produkt-URL.');
      }

      subtotal += item.price * entry.quantity;
      const size = variant.o[0] || '';

      const row = document.createElement('div');
      row.className = 'bag-row';

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      img.width = 60;
      img.height = 80;

      const details = document.createElement('div');
      details.className = 'bag-details';

      const h3 = document.createElement('h3');
      h3.textContent = item.name;

      const meta = document.createElement('p');
      meta.textContent = `Größe ${size} · Anzahl ${entry.quantity} · ${formatUSD(item.price)}`;

      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Piece im Shop ansehen ↗';

      details.appendChild(h3);
      details.appendChild(meta);
      details.appendChild(link);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'bag-remove';
      removeBtn.dataset.bagRemove = String(entry.id);
      removeBtn.setAttribute('aria-label', `${item.name} entfernen`);
      removeBtn.textContent = '×';

      row.appendChild(img);
      row.appendChild(details);
      row.appendChild(removeBtn);

      container.appendChild(row);
    }

    totalEl.textContent = `Referenz-Zwischensumme ${formatUSD(subtotal)}`;
    exportBtn.disabled = false;
  }

  public exportShortlist() {
    if (this.entries.length === 0) return;
    const catalog = validateCatalog(NATIVE_CATALOG);
    const text = formatShortlistText(this.entries, catalog);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runway-outfit-shortlist.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const stylingBag = new StylingBagController();
