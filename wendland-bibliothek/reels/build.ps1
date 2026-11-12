Set-Location D:\Websites\motion-sites\wendland-bibliothek\reels
New-Item -ItemType Directory -Force seg, out | Out-Null
$enc = "-c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -r 30".Split(" ")
function dur($f){ [double](ffprobe -v error -show_entries format=duration -of csv=p=0 $f) }

# intro
ffmpeg -v error -y -f lavfi -i "color=c=#050303:s=1080x1920:r=30:d=2.6" -loop 1 -t 2.6 -i gfx/logo_intro.png -filter_complex "[1]format=rgba,fade=in:st=0.25:d=0.8:alpha=1,scale=w='iw*(0.92+0.08*min(t/2.6\,1))':h=-1:eval=frame[l];[0][l]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p" @enc seg/intro.mp4

# scenes
$map = @{ kv="IMG_6704"; wb="IMG_6709"; rw="IMG_6712"; tp="IMG_6711"; nl="IMG_6721" }
foreach($k in $map.Keys){
  $c = "clips/$($map[$k]).mp4"; $d = dur $c
  ffmpeg -v error -y -loop 1 -t $d -i gfx/bg.png -loop 1 -t $d -i "gfx/scene_$k.png" -i $c -loop 1 -t $d -i gfx/mask_panel.png -filter_complex "[3]format=gray[m];[2][m]alphamerge[v];[0][1]overlay[b];[b][v]overlay=48:560:shortest=1,format=yuv420p" @enc "seg/$k.mp4"
}

# outros
function outro($n, $a, $b, $c){
  $box = "scale=-2:372,crop=272:372"
  ffmpeg -v error -y -loop 1 -t 7 -i "gfx/outro$n.png" -stream_loop -1 -i "clips/$a.mp4" -stream_loop -1 -i "clips/$b.mp4" -stream_loop -1 -i "clips/$c.mp4" -loop 1 -t 7 -i gfx/mask_box.png -loop 1 -t 7 -i "gfx/outro$($n)_lbl.png" -filter_complex "[4]format=gray,split=3[m1][m2][m3];[1]$box[a];[a][m1]alphamerge[A];[2]$box[b];[b][m2]alphamerge[B];[3]$box[c];[c][m3]alphamerge[C];[0][A]overlay=96:1180[o1];[o1][B]overlay=404:1180[o2];[o2][C]overlay=712:1180[o3];[o3][5]overlay,trim=duration=7,format=yuv420p" @enc "seg/outro$n.mp4"
}
outro 1 IMG_6704 IMG_6709 IMG_6712
outro 2 IMG_6711 IMG_6721 IMG_6704

function reel($name, $segs){
  $T = 0.5; $args2 = @(); foreach($s in $segs){ $args2 += "-i"; $args2 += "seg/$s.mp4" }
  $fc = ""; $off = 0; $prev = "[0]"
  for($i=1; $i -lt $segs.Count; $i++){
    $off += (dur "seg/$($segs[$i-1]).mp4") - $T
    $tr = if($i -eq 1){"fadeblack"}elseif($i -eq $segs.Count-1){"fade"}else{"smoothleft"}
    $fc += "$prev[$i]xfade=transition=$($tr):duration=$($T):offset=$([math]::Round($off,3))[x$i];"
    $prev = "[x$i]"
    if($i -gt 1){ }
    $off = $off  # offset accumulates relative to output timeline
  }
  $fc = $fc.TrimEnd(";")
  ffmpeg -v error -y @args2 -filter_complex $fc -map $prev -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -r 30 -movflags +faststart "out/$name.mp4"
}
reel "MindMerit_Reel_1" @("intro","kv","wb","rw","outro1")
reel "MindMerit_Reel_2" @("intro","tp","nl","outro2")
gci out | select Name, Length
