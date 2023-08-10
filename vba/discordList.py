import csv
from pathlib import Path
import sys

# Usage: discordList.py <path to messages folder>

path = Path( sys.argv[ 1 ] )
for p in path.rglob( "*.csv" ):

  # Print channel number
  print( p.parts[ -2 ].replace( "c", "" ) + ":" )

  # Print all the message ids in that channel's CSV
  with p.open( encoding='utf-8' ) as f:
    next( f )   # skip header
    reader = csv.reader(f)

    ids = []
    for row in reader:
      ids.append( row[ 0 ] )
    print( ', '.join( ids ) )
  
  # Blank line between channels
  print()