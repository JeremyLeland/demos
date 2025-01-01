import argparse
import requests
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument( 'url' )
args = parser.parse_args()

r = requests.get( args.url )

cookies = r.cookies

print( cookies )

title = re.findall( '"video_title":"([^"]+)"', r.text )[ 0 ].replace( '\\/', '' )
chunklistURLs = list( map( lambda url: url.replace( '\\', '' ), re.findall( '([^"]+m3u8[^"]+)', r.text ) ) )

print( 'Found chunk list URLs: ' + str( chunklistURLs ) )
print()

# TODO: Pick best one

# Build a Cookie string for ffmpeg
cookie_header = "; ".join([f"{key}={value}" for key, value in cookies.items()])

ffmpegCmd = [
  "ffmpeg",
  "-headers", f"Cookie: { cookie_header }",
  "-i", chunklistURLs[ 0 ],
  "-codec", "copy",
  f"{ title }.mp4"
]

print( ffmpegCmd )

subprocess.run( ffmpegCmd )
