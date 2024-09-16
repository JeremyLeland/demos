import base64
import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import quote


def doStreameast():
  STREAMEAST_URL = 'https://www.streameast.gd/nfl-streams'

  list_html = requests.get( STREAMEAST_URL ).text
  list_soup = BeautifulSoup( list_html, 'html.parser' )

  upcoming = list_soup.find( 'div', { 'id': 'tab-upcoming' } )

  for link in upcoming.find_all( 'a' ):
    title = link.find( 'span', 'd-md-inline' ).text.strip()
    page_url = link.get( 'href' )
    page_html = requests.get( page_url ).text

    match = re.search( r"source: window.atob\('(.+?)'\),", page_html )
    if match:
      encoded_url = match.group( 1 )
      playlist = base64.b64decode( encoded_url ).decode( 'utf-8' )

      print( f'#EXTINF:-1 , { title }' )
      print( playlist )


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

    print( f'#EXTINF:-1 tvg-logo="{ img }" , { title }' )
    print( playlist )



print( '#EXTM3U' )

doStreameast()
# doWeakspell()