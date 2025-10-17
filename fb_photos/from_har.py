import datetime
from io import BytesIO
import json
from pathlib import Path
import piexif
import piexif.helper
from PIL import Image
import requests

path = '/home/iggames/Downloads/test.har'

output_dir = Path( '/home/iggames/Downloads/FB_TEST' )
output_dir.mkdir( parents = True, exist_ok = True )

with open( path, 'r', encoding='utf-8' ) as f:
  har_data = json.load( f )

  for entry in har_data.get( 'log' ).get( 'entries' ):
    url = entry.get( 'request' ).get( 'url' )
    
    if url == 'https://www.facebook.com/api/graphql/':
      print()

      all_content = entry.get( 'response' ).get( 'content' ).get( 'text' ).splitlines()
      first_content = all_content[ 0 ]
      first_data = json.loads( first_content )
      
      currMedia = first_data.get( 'data' ).get( 'currMedia' )

      # TODO: Handle videos (different fields than images)

      if currMedia:
        fbid = currMedia.get( 'id' )

        created_time = currMedia.get( 'created_time' )

        if created_time:
          dt = datetime.datetime.fromtimestamp( created_time, datetime.UTC )
          exif_time = dt.strftime( "%Y:%m:%d %H:%M:%S" )
          print( exif_time )

        #currMedia.get( 'videoDeliveryResponseFragment' ).get( 'videoDeliveryResponseResult' ).get( 'progressive_urls' )[ 1 ]

        uri = currMedia.get( 'image' ).get( 'uri' )
        print( uri )
      
      # TODO: Don't assume 9, maybe check them all?
      description = ''

      if len( all_content ) >= 9:
        last_content = all_content[ 8 ]
        last_data = json.loads( last_content )

        message = last_data.get( 'data' ).get( 'message' )
        
        if message:
          description = message.get( 'text' )
          print( description )
      
      # --- DOWNLOAD IMAGE ---
      if uri:
        response = requests.get( uri )
        response.raise_for_status()  # Will raise an error if the download failed

        # Load image into PIL
        img = Image.open( BytesIO( response.content ) )

        # --- PREPARE EXIF ---
        # Load existing EXIF data (if any), or create new
        exif_data = img.info.get( "exif" )

        if exif_data:
          exif_dict = piexif.load( exif_data )
        else:
          # exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
          exif_dict = { "Exif": {} }

        # Set the EXIF DateTimeOriginal and DateTimeDigitized
        if exif_time:
          exif_dict[ "Exif" ][ piexif.ExifIFD.DateTimeOriginal ] = exif_time
          exif_dict[ "Exif" ][ piexif.ExifIFD.DateTimeDigitized ] = exif_time

        if description:
          exif_dict[ "Exif" ][ piexif.ExifIFD.UserComment ] = piexif.helper.UserComment.dump( description, encoding="unicode" )

        # Create EXIF bytes
        exif_bytes = piexif.dump( exif_dict )

        # --- SAVE IMAGE WITH NEW EXIF ---
        filename = f"{ fbid }.jpg"
        output_path = output_dir / filename
        img.save( output_path, exif = exif_bytes )


