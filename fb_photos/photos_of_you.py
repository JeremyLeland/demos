import re
import requests
from bs4 import BeautifulSoup

URL = 'https://www.facebook.com/jeremy.leland/photos_of'
cookie_str = "" # cookie string from the network panel

cookie_dict = { k: v for k, v in ( item.split( '=' ) for item in cookie_str.split( '; ' ) ) }


fbids = [
  # Facebook photo IDs
]

session = requests.Session()

session.cookies.update( cookie_dict )

for fbid in fbids:
  url = f"https://www.facebook.com/photo.php?fbid={ fbid }"

  print( url )

  page_html = session.get( url ).text

  # Find chunk of text with 'creation_time' in it, this is the JSON?
  match = re.search( r"creation_time", page_html )

  page_soup = BeautifulSoup( page_html, 'html.parser' )

  for script in page_soup.find_all( 'script' ):
    if 'creation_time' in script.text:
      print( script.text )