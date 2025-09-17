import requests
import re
from bs4 import BeautifulSoup

# urls = []

LIST_URL = 'https://pbskids.org/videos/carl-the-collector'

list_html = requests.get( LIST_URL ).text
list_soup = BeautifulSoup( list_html, 'html.parser' )

for link in list_soup.find_all( 'a' ):
  url = link.get( 'href' )

  if 'full-episodes' in url:

    episode_url = f"https://pbskids.org{ url }"

    # print( episode_url )

    episode_html = requests.get( episode_url ).text
    episode_soup = BeautifulSoup( episode_html, 'html.parser' )

    title = episode_soup.select_one( 'div[class*=videoTitle]' ).contents[ 0 ].replace('/',' - ')

    # Example:
    # "profile":"hls-16x9-1080p","url":"https://urs.pbs.org/redirect/6aab210556d64a649378b46d92f3575f/"

    match = re.search( r'"profile":"hls-16x9-1080p","url":"(.+?)"', episode_html )
    if match:
      video_url = match.group( 1 )

      print( f"yt-dlp -o \"{ title }\" { video_url }")

      # urls.append( video_url )

# Can use this as argument to yt-dlp
# print( ' '.join( urls ) )