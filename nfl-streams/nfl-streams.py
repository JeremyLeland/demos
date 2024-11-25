import argparse
import base64
import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import quote

parser = argparse.ArgumentParser()
parser.add_argument( '--output', type = str, help = "Destination playlist file" )
args = parser.parse_args()

lines = []

def doStreameast():
  STREAMEAST_URL = 'https://www.streameast.gd/nfl-streams'

  list_html = requests.get( STREAMEAST_URL ).text
  list_soup = BeautifulSoup( list_html, 'html.parser' )

  upcoming = list_soup.find( 'div', { 'id': 'tab-upcoming' } )

  for link in upcoming.find_all( 'a' ):
    title = link.find( 'span', 'd-md-inline' ).text.strip()
    page_url = link.get( 'href' )

    for end in [ '', '/1', '/2' ]:
      page_html = requests.get( page_url + end ).text

      match = re.search( r"source: window.atob\('(.+?)'\),", page_html )
      if match:
        encoded_url = match.group( 1 )
        playlist = base64.b64decode( encoded_url ).decode( 'utf-8' )

        lines.append( f'#EXTINF:-1 , { title }\n' )
        lines.append( f'{ playlist }\n' )

def doMediastreams():
  MEDIASTREAMS_URL = 'https://techcabal.net/'

  list_html = requests.get( MEDIASTREAMS_URL + 'schedule/nflstreams' ).text
  list_soup = BeautifulSoup( list_html, 'html.parser' )

  for link in list_soup.find_all( 'a', 'w-full' ):
    try:
      # Button text is: Date <TAB> Teams <TAB> Time
      # Using -2 because REDZONE entry doesn't have TAB after date for some reason
      title = link.find( 'h3' ).text.split('\t')[ -2 ]
      
      page_url = MEDIASTREAMS_URL + link.get( 'href' )
      page_html = requests.get( page_url ).text
      page_soup = BeautifulSoup( page_html, 'html.parser' )

      iframe_url = MEDIASTREAMS_URL + page_soup.find( 'iframe' ).get( 'src' )
      iframe_html = requests.get( iframe_url ).text
      
      serv_match = re.search( r'var servs = \[\"(.+?)\"\]', iframe_html )
      m3u8_match = re.search( r"'([^']*?.m3u8)'", iframe_html )
      playlist = 'https://' + serv_match.group( 1 ) + m3u8_match.group( 1 )

      lines.append( f'#EXTINF:-1 , { title }\n' )
      lines.append( f'{ playlist }\n' )
    except Exception as e:
      print( str( e ) )


def doWeakspell():
  WEAKSPELL_URL = 'https://weakspell.to/category/nfl-streams'

  list_html = requests.get( WEAKSPELL_URL ).text
  list_soup = BeautifulSoup( list_html, 'html.parser' )

  for link in list_soup.find_all( 'a', 'btn' ):
    title = link.find( 'h4' ).text
    img = link.find( 'img' )[ 'src' ]
    date = link.find( 'p' ).text

    page_url = link.get( 'href' )
    page_html = requests.get( page_url ).text
    #page_soup = BeautifulSoup( page_html, 'html.parser' )

    idgstream = quote( re.search( r'var vidgstream = "(.+?)";', page_html ).group( 1 ) )

    match = re.search( r'gethlsUrl\(vidgstream,(.+?),(.+?)\);', page_html )
    serverid = match.group( 1 ).strip()
    cid = match.group( 2 ).strip()

    gethls_url = f'https://weakspell.to/gethls?idgstream={ idgstream }&serverid={ serverid }&cid={ cid }'
    gethls_json = requests.get( gethls_url ).json()

    playlist = gethls_json[ 'rawUrl' ]

    lines.append( f'#EXTINF:-1 tvg-logo="{ img }" , { title }\n' )
    lines.append( f'{ playlist }\n' )



lines.append( '#EXTM3U\n' )

# doStreameast()
# doWeakspell()
doMediastreams()

if args.output is not None:
  with open( args.output, mode='w' ) as file:
    file.writelines( lines )

print( ''.join( lines ) )