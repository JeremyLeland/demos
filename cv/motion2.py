#
# This time, look at the sped up video and score each frame
# Should give us quicker results while we tweak analysis method
#

import argparse
import csv
import cv2
import glob

def score_movement(video_path, frame_skip=1):
  cap = cv2.VideoCapture( video_path )
  fps = cap.get( cv2.CAP_PROP_FPS )

  #fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=False)

  prev_frame = None
  total_frames = 0

  rows = []

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

    # Timestamp
    total_seconds = total_frames / fps
    minutes = total_seconds // 60
    seconds = total_seconds % 60

    # e.g. 01:02.345
    time_str = f"{int( minutes ):02d}:{int( seconds ):02d}.{int( ( seconds % 1 ) * 1000 ):03d}"

    rows.append( {
      'time': time_str,
      'score': total_motion,
    } )

    prev_frame = gray

  cap.release()

  sorted_rows = sorted( rows, key = lambda x: x[ 'time' ] )

  return sorted_rows

def processFile( input_path ):
  result = score_movement( input_path, 2 )

  # Save to CSV
  csv_path = input_path.replace( '.mp4', '_scores.csv' )

  print( f"\nSaving output to { csv_path }" )

  with open( csv_path, mode='w', newline='', encoding='utf-8' ) as csv_file:
    writer = csv.DictWriter( csv_file, fieldnames = result[ 0 ].keys() )
    writer.writeheader()
    writer.writerows( result )


parser = argparse.ArgumentParser()
parser.add_argument( 'files', nargs='+', help='Path to input video file(s)' )
args = parser.parse_args()

for entry in args.files:
  for inputFile in glob.glob( entry ):
    processFile( inputFile )
