import argparse
import os
import requests
import re

parser = argparse.ArgumentParser()
parser.add_argument( 'url' )
args = parser.parse_args()

r = requests.get( args.url )

title = re.findall( '"video_title":"([^"]+)"', r.text )[ 0 ].replace( '\\/', '' )
chunklistURL = re.findall( '"defaultQuality":true.+?([^"]+m3u8[^"]+)', r.text )[ 0 ].replace( '\\', '' )

print( 'Found chunk list URL: ' + chunklistURL )
print()

ffmpegCmd = 'ffmpeg -i "' + chunklistURL + '" -codec copy "' + title + '.mp4"'

print( 'Running command: ' + ffmpegCmd )

os.system( ffmpegCmd )
