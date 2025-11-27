#!/usr/bin/env bash

DIR="${1:-.}"

find "$DIR" -type f -print0 | while IFS= read -r -d '' file; do
    # Extract metadata
    width=$(mediainfo --Inform="Video;%Width%" "$file")
    height=$(mediainfo --Inform="Video;%Height%" "$file")
    codec=$(mediainfo --Inform="Video;%Format%" "$file")

    # Skip if missing metadata (non-video files)
    [[ -z "$width" || -z "$height" || -z "$codec" ]] && continue

    # Normalize codec to lowercase for comparison
    codec_lc=$(echo "$codec" | tr '[:upper:]' '[:lower:]')

    # Conditions:
    # 1) resolution > 1080p
    # 2) codec is NOT vp9
    if (( width > 1920 && height > 1080 )) && [[ "$codec_lc" != "vp9" ]]; then
        echo "$file : ${width}x${height} : codec=$codec"
    fi
done

