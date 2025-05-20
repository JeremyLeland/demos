import cv2
import os

def score_movement(video_path, frame_skip=1):
  cap = cv2.VideoCapture(video_path)
  fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=False)

  movement_score = 0
  prev_frame = None
  total_frames = 0

  while True:
    ret, frame = cap.read()
    if not ret:
      break

    total_frames += 1
    if total_frames % frame_skip != 0:
      continue

    # Resize for faster processing (optional)
    frame = cv2.resize(frame, (640, 360))

    # Convert to grayscale and blur to reduce noise
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)

    if prev_frame is None:
      prev_frame = gray
      continue

    # Compute absolute difference between current and previous frame
    frame_delta = cv2.absdiff(prev_frame, gray)
    thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]

    # Count number of non-zero pixels (movement)
    movement = cv2.countNonZero(thresh)
    movement_score += movement

    prev_frame = gray

  cap.release()
  return movement_score

# Example usage:
video_dir = "/home/iggames/Downloads/olivia sleep/monday night/20250512/21/"
for filename in os.listdir(video_dir):
  if filename.endswith(".mp4"):
    path = os.path.join(video_dir, filename)
    score = score_movement(path)
    print(f"{filename}: movement score = {score}")
