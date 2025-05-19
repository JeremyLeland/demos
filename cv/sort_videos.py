import os
import shutil
from datetime import datetime, timedelta

# Set your source and destination directories here
SOURCE_DIR = '/home/iggames/Downloads/olivia sleep/raw'
DEST_DIR = '/home/iggames/Downloads/olivia sleep/'

# Time boundaries
NIGHT_START_HOUR = 19  # 7 PM
NIGHT_END_HOUR = 6   # 6 AM

# Walk through the source directory
for root, dirs, files in os.walk(SOURCE_DIR):
  for file in files:
    if not file.endswith('.mp4'):
      continue

    try:
      # Expecting structure like 20250519/13/59.mp4
      parts = root.split(os.sep)
      date_str = parts[-2]  # 20250519
      hour_str = parts[-1]  # 13 (hour)

      date = datetime.strptime(date_str, "%Y%m%d")
      hour = int(hour_str)

      # Determine if time is between 19:00 and 06:00
      if NIGHT_START_HOUR <= hour <= 23:
        night_date = date
      elif 0 <= hour < NIGHT_END_HOUR:
        night_date = date - timedelta(days=1)
      else:
        continue  # Skip if not in the time window

      # Determine night name (e.g., "monday night")
      night_name = night_date.strftime('%A').lower() + ' night'

      # Build destination path
      relative_path = os.path.relpath(os.path.join(root, file), SOURCE_DIR)
      destination_path = os.path.join(DEST_DIR, night_name, relative_path)

      os.makedirs(os.path.dirname(destination_path), exist_ok=True)
      shutil.copy2(os.path.join(root, file), destination_path)
      #print(f"Copied to: {destination_path}")

    except Exception as e:
      print(f"Error processing {file} in {root}: {e}")
