$ErrorActionPreference = "Continue"
Set-Location D:\Websites\motion-sites\wendland-bibliothek\reels\clips
# name, start, dur, speed  (full 1080x1920 frame, no crop)
$c = @(
 @("IMG_6704", 0.5, 9.0, 1.2),
 @("IMG_6709", 0.4, 9.0, 1.3),
 @("IMG_6712", 0.0, 3.4, 1.0),
 @("IMG_6711", 1.0, 21.0, 1.75),
 @("IMG_6721", 0.0, 21.0, 1.75)
)
foreach ($k in $c) {
  $n=$k[0]
  ffmpeg -v error -y -ss $k[1] -t $k[2] -i "..\src\$n.MOV" -vf "vidstabdetect=shakiness=10:accuracy=15:stepsize=6:mincontrast=0.2:result=full_$n.trf" -f null -
  ffmpeg -v error -y -ss $k[1] -t $k[2] -i "..\src\$n.MOV" -an -vf "vidstabtransform=input=full_$n.trf:smoothing=90:optzoom=1:interpol=bicubic,unsharp=5:5:0.5,setpts=PTS/$($k[3]),fps=30,scale=1080:1920:flags=lanczos" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "full_$n.mp4"
}
