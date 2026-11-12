import { BOOKS } from '../data/books';
import { toWin1252Escaped } from './arcMath';

function measureLineWidth(ctx: CanvasRenderingContext2D | null, text: string): number {
  if (ctx) {
    return ctx.measureText(text).width;
  }
  // Fallback for Node test environment without canvas
  return text.length * 5.1;
}

function wrapParagraph(ctx: CanvasRenderingContext2D | null, text: string, maxWidthPt: number): string[] {
  const safeMax = maxWidthPt * 0.98; // 2% safety margin per spec
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (measureLineWidth(ctx, candidate) <= safeMax || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function makePdf(bookId: string): Blob {
  const book = BOOKS.find((b) => b.id === bookId) ?? BOOKS[5];

  let ctx: CanvasRenderingContext2D | null = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '11px "Times New Roman", Times, serif';
    }
  }

  // Page size: A5 portrait, 419.53 x 595.28 pt, margins 48pt
  const W = 419.53;
  const H = 595.28;
  const M = 48;
  const contentWidth = W - 2 * M; // 323.53 pt
  const leading = 15.5;

  // Gather all paragraphs from sample
  const samplePages = (book as unknown as { samplePages?: string[][] }).samplePages;
  // Import SAMPLE dynamically or pass paragraphs
  return buildPdfFromBook(book.id, book.title, book.author, book.year, W, H, M, contentWidth, leading, ctx);
}

import { SAMPLE } from '../data/books';

function buildPdfFromBook(
  id: string,
  title: string,
  author: string,
  year: number,
  W: number,
  H: number,
  M: number,
  contentWidth: number,
  leading: number,
  ctx: CanvasRenderingContext2D | null
): Blob {
  const sample = SAMPLE[id] ?? SAMPLE.verwandlung;
  const allParagraphs: string[] = [];
  for (const pg of sample.pages) {
    for (const para of pg) {
      allParagraphs.push(para);
    }
  }

  // Wrap all paragraphs into lines with paragraph breaks
  const allLines: { text: string; isParaStart: boolean }[] = [];
  for (const para of allParagraphs) {
    const wrapped = wrapParagraph(ctx, para, contentWidth);
    wrapped.forEach((line, idx) => {
      allLines.push({ text: line, isParaStart: idx === 0 });
    });
  }

  // Paginate lines into sample pages (Pages 2 to n)
  const topY = H - M - 24;
  const bottomY = M + 36;
  const linesPerPage = Math.floor((topY - bottomY) / leading); // ~29 lines per page

  const textPages: { text: string; isParaStart: boolean }[][] = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    textPages.push(allLines.slice(i, i + linesPerPage));
  }

  const pageStreams: string[] = [];

  // Page 1: Title page (title, author, year)
  {
    let titleCtx: CanvasRenderingContext2D | null = null;
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      titleCtx = c.getContext('2d');
      if (titleCtx) titleCtx.font = 'bold 20px "Times New Roman", Times, serif';
    }
    const titleLines = wrapParagraph(titleCtx, title, contentWidth);
    const cmds: string[] = [];
    cmds.push('0.08 0.08 0.08 rg');
    let ty = 370;
    for (const tLine of titleLines) {
      cmds.push(`BT /F2 20 Tf ${M} ${ty.toFixed(2)} Td (${toWin1252Escaped(tLine)}) Tj ET`);
      ty -= 26;
    }
    ty -= 14;
    cmds.push(`BT /F3 13 Tf ${M} ${ty.toFixed(2)} Td (${toWin1252Escaped(author)}) Tj ET`);
    ty -= 24;
    cmds.push(`BT /F1 11 Tf ${M} ${ty.toFixed(2)} Td (${toWin1252Escaped(String(year))}) Tj ET`);
    cmds.push(`BT /F1 9 Tf ${M} ${M} Td (WENDLAND BIBLIOTHEK) Tj ET`);
    pageStreams.push(cmds.join('\n'));
  }

  // Pages 2 to n: Sample text, folio at the foot, and diagonal light-grey "DEMO" watermark (0.9 g, rotated 35 deg with Tm)
  const cos35 = Math.cos((35 * Math.PI) / 180).toFixed(4);
  const sin35 = Math.sin((35 * Math.PI) / 180).toFixed(4);
  const negSin35 = (-Math.sin((35 * Math.PI) / 180)).toFixed(4);

  textPages.forEach((lines, pageIdx) => {
    const folioNum = pageIdx + 2;
    const cmds: string[] = [];
    // Diagonal light-grey "DEMO" watermark (0.9 g, rotated 35 deg with Tm)
    cmds.push('q');
    cmds.push('0.9 g');
    cmds.push(`BT /F2 68 Tf ${cos35} ${sin35} ${negSin35} ${cos35} 118 235 Tm (DEMO) Tj ET`);
    cmds.push('Q');

    // Body text in Times-Roman 11pt, leading 15.5pt
    cmds.push('0.08 0.08 0.08 rg');
    let y = topY;
    for (let j = 0; j < lines.length; j++) {
      const ln = lines[j];
      if (j > 0 && ln.isParaStart) {
        y -= 4; // subtle paragraph spacing
      }
      cmds.push(`BT /F1 11 Tf ${M} ${y.toFixed(2)} Td (${toWin1252Escaped(ln.text)}) Tj ET`);
      y -= leading;
    }

    // Folio at the foot
    cmds.push(`BT /F1 9.5 Tf ${(W / 2 - 4).toFixed(2)} ${M} Td (${folioNum}) Tj ET`);
    pageStreams.push(cmds.join('\n'));
  });

  // Last page: One line: "Dies ist eine Demo."
  {
    const cmds: string[] = [];
    cmds.push('q');
    cmds.push('0.9 g');
    cmds.push(`BT /F2 68 Tf ${cos35} ${sin35} ${negSin35} ${cos35} 118 235 Tm (DEMO) Tj ET`);
    cmds.push('Q');
    cmds.push('0.08 0.08 0.08 rg');
    cmds.push(`BT /F1 11 Tf ${M} ${(H / 2).toFixed(2)} Td (${toWin1252Escaped('Dies ist eine Demo.')}) Tj ET`);
    pageStreams.push(cmds.join('\n'));
  }

  // Assemble PDF 1.4 objects
  // Object 1: Catalog
  // Object 2: Pages
  // Object 3: Font F1 (Times-Roman)
  // Object 4: Font F2 (Times-Bold)
  // Object 5: Font F3 (Times-Italic)
  // Object 6: Document Info (/Title, /Author)
  // Objects 7..: Each Page and its Contents stream
  const objects: string[] = [];
  const totalPages = pageStreams.length;
  const pageObjNums: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    pageObjNums.push(7 + i * 2);
  }

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${totalPages} >>\nendobj\n`
  );
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>\nendobj\n'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>\nendobj\n'
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>\nendobj\n'
  );
  objects.push(
    `6 0 obj\n<< /Title (${toWin1252Escaped(title)}) /Author (${toWin1252Escaped(author)}) >>\nendobj\n`
  );

  for (let i = 0; i < totalPages; i++) {
    const pObj = 7 + i * 2;
    const cObj = pObj + 1;
    const stream = pageStreams[i];
    objects.push(
      `${pObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${cObj} 0 R >>\nendobj\n`
    );
    objects.push(
      `${cObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
  }

  // Build binary string with running byte offsets
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [0]; // index 0 is free object
  for (const objStr of objects) {
    offsets.push(pdf.length);
    pdf += objStr;
  }

  const xrefStart = pdf.length;
  const size = objects.length + 1;
  pdf += `xref\n0 ${size}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < size; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offStr} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${size} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 255;
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

export function download(blob: Blob, name: string): void {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}

export function downloadDemoPdf(bookId: string): void {
  download(makePdf(bookId), bookId + '-demo.pdf');
}
