echo "Filename,Codec,Resolution"

for file in *.*; do
  jq_output=$(mediainfo --Output=JSON "$file" | jq -r '
    .media as $media |
    ($media.track[] | select(."@type" == "Video")) as $video |
    "\"\($media."@ref")\",\($video.Format),\($video.Width)x\($video.Height)"
')

  echo "$jq_output"
done

