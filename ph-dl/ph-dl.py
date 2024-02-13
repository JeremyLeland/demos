import argparse
import os
import requests
import re

parser = argparse.ArgumentParser()
parser.add_argument( 'url' )
args = parser.parse_args()

r = requests.get( args.url )

title = re.search( '"video_title":".+?"', r.text )[ 0 ].split( ':' )[ 1 ]
chunklistURL = re.search( '[^"]+m3u8[^"]+', r.text )[ 0 ].replace( '\\', '' )

print( 'Found chunk list URL: ' + chunklistURL )

os.system( 'ffmpeg -i "' + chunklistURL + '" -codec copy ' + title + '.mp4' )