import csv
from datetime import datetime, timedelta
import cv2
import os

def score_movement(video_path, frame_skip=1):
  cap = cv2.VideoCapture( video_path )
  fps = cap.get( cv2.CAP_PROP_FPS )
  #fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=False)

  movement_score = 0
  prev_frame = None
  total_frames = 0

  biggest_move = 0
  biggest_frame = 0

  # Get start_time from filename
  parts = video_path.split( os.sep )

  # Extract relevant parts (date, hour, minute)
  date_str = parts[ -3 ]  # '20250512'
  hour_str = parts[ -2 ]  # '21'
  minute_str = os.path.splitext( parts[ -1 ] )[ 0 ]  # '12' (remove .mp4)

  # Combine into datetime format
  datetime_str = f"{ date_str } { hour_str }:{ minute_str }"
  start_time = datetime.strptime( datetime_str, "%Y%m%d %H:%M" )

  while True:
    ret, frame = cap.read()
    if not ret:
      break

    total_frames += 1
    if total_frames % frame_skip != 0:
      continue

    # Resize for faster processing (optional)
    frame = cv2.resize(frame, (640, 360))

    # Get dimensions
    height, width = frame.shape[:2]

    # Crop to left half
    left_half = frame[:, :width // 2]

    # Convert to grayscale and blur to reduce noise
    gray = cv2.cvtColor(left_half, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)

    if prev_frame is None:
      prev_frame = gray
      continue

    # Compute absolute difference between current and previous frame
    frame_delta = cv2.absdiff(prev_frame, gray)
    thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]

    # Dilate to fill in gaps
    thresh = cv2.dilate(thresh, None, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Compute total motion score as sum of contour areas
    total_motion = sum(cv2.contourArea(c) for c in contours if cv2.contourArea(c) > 50)

    movement_score += total_motion

    if total_motion > biggest_move:
      biggest_move = total_motion
      biggest_frame = total_frames

    prev_frame = gray

  cap.release()
  return {
    'time': start_time,
    'score': movement_score,
    'timestamp': start_time + timedelta( seconds = biggest_frame / fps ),
  }

# Example usage:

rows = []

video_dir = "/home/iggames/Downloads/olivia sleep/monday night"

for root, dirs, files in os.walk( video_dir ):
  for file in files:
    if file.endswith(".mp4"):
      path = os.path.join( root, file )
      row = score_movement(path)

      print( row )
      rows.append( row )

sorted_rows = sorted( rows, key = lambda x: x[ 'time' ] )

# Save to CSV
csv_path = os.path.join( video_dir, 'motion.csv' )

print( f"\nSaving output to { csv_path }" )

with open( csv_path, mode='w', newline='', encoding='utf-8' ) as csv_file:
  writer = csv.DictWriter( csv_file, fieldnames = rows[ 0 ].keys() )
  writer.writeheader()
  writer.writerows( sorted_rows )