$ErrorActionPreference = "Continue"
Set-Location D:\Websites\motion-sites\wendland-bibliothek\reels
New-Item -ItemType Directory -Force clips | Out-Null
# name, start, dur, speed, cropW, cropH, x, y
$c = @(
 @("IMG_6704", 0.5, 9.0, 1.2, 1080, 810, 0, 390),
 @("IMG_6709", 0.4, 9.0, 1.3, 880, 660, 90, 560),
 @("IMG_6712", 0.0, 3.4, 1.0, 900, 675, 80, 500),
 @("IMG_6711", 1.0, 21.0, 1.75, 900, 675, 0, 580),
 @("IMG_6721", 0.0, 21.0, 1.75, 940, 705, 60, 400)
)
foreach ($k in $c) {
  $n=$k[0]; $pre="crop=$($k[4]):$($k[5]):$($k[6]):$($k[7])"
  Push-Location clips
  ffmpeg -v error -y -ss $k[1] -t $k[2] -i "..\src\$n.MOV" -vf "$pre,vidstabdetect=shakiness=8:accuracy=15:result=$n.trf" -f null -
  ffmpeg -v error -y -ss $k[1] -t $k[2] -i "..\src\$n.MOV" -an -vf "$pre,vidstabtransform=input=$n.trf:smoothing=30:zoom=4,setpts=PTS/$($k[3]),fps=30,scale=984:738:flags=lanczos,eq=contrast=1.06:saturation=1.08,unsharp=5:5:0.6" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "$n.mp4"
  Pop-Location
}
