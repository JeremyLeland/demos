import argparse
import requests
import re
import subprocess
import shlex

from urllib.parse import urlparse

parser = argparse.ArgumentParser()
parser.add_argument( 'url' )
args = parser.parse_args()

r = requests.get( args.url )

print( 'Looking for chunk list URLS...' )

# TODO: Find a smaller chunk of text to search in? This seems quite slow

title = re.findall( '"video_title":"([^"]+)"', r.text )[ 0 ].replace( '\\/', '' )
chunklistURLs = list( map( lambda url: url.replace( '\\', '' ), re.findall( '([^"]+m3u8[^"]+)', r.text ) ) )

print( 'Found chunk list URLs: ' + str( chunklistURLs ) )
print()

# TODO: Pick best one? (for now, just use first one)

ffmpegCmd = [
  "ffmpeg",
  "-referer", f"http://{ urlparse( args.url ).hostname}/",
  "-user_agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "-i", chunklistURLs[ 0 ],
  "-codec", "copy",
  f"{ title }.mp4"
]

print( shlex.join( ffmpegCmd ) )
print()

subprocess.run( ffmpegCmd )
