import argparse
import os
import requests
import re

parser = argparse.ArgumentParser()
parser.add_argument( 'url' )
args = parser.parse_args()

r = requests.get( args.url )

title = re.findall( '"video_title":"([^"]+)"', r.text )[ 0 ].replace( '\\/', '' )
chunklistURLs = list( map( lambda url: url.replace( '\\', '' ), re.findall( '([^"]+m3u8[^"]+)', r.text ) ) )

print( 'Found chunk list URLs: ' + str( chunklistURLs ) )
print()

# TODO: Pick best one

ffmpegCmd = 'ffmpeg -i "' + chunklistURLs[ 0 ] + '" -codec copy "' + title + '.mp4"'

print( 'Running command: ' + ffmpegCmd )

os.system( ffmpegCmd )
