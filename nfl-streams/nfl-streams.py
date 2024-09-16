import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import quote

# STREAMEAST_URL = 'https://www.streameast.gd/nfl-streams'
WEAKSPELL_URL = 'https://weakspell.to/category/nfl-streams'

print( '#EXTM3U' )

list_html = requests.get( WEAKSPELL_URL ).text
list_soup = BeautifulSoup( list_html, 'html.parser' )

for link in list_soup.find_all( 'a', 'btn' ):
  title = link.find( 'h4' ).text
  img = link.find( 'img' )[ 'src' ]
  date = link.find( 'p' ).text

  page_url = link.get( 'href' )
  page_html = requests.get( page_url ).text
  #page_soup = BeautifulSoup( page_html, 'html.parser' )

  idgstream = quote( re.search( 'var vidgstream = "(.+?)";', page_html ).group( 1 ) )

  match = re.search( 'gethlsUrl\((.+?),(.+?),(.+?)\);', page_html )
  # idgstream = match.group( 1 )
  serverid = match.group( 2 ).strip()
  cid = match.group( 3 ).strip()

  gethls_url = f'https://weakspell.to/gethls?idgstream={ idgstream }&serverid={ serverid }&cid={ cid }'
  gethls_json = requests.get( gethls_url ).json()

  playlist = gethls_json[ 'rawUrl' ]

  print( f'#EXTINF:-1 tvg-logo={ img } , { title }' )
  print( playlist )
  