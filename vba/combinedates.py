import sys
import csv
import datetime

rowIndex = 0

with open( sys.argv[ 1 ] ) as f:
  reader = csv.reader(f)
  with open( sys.argv[ 2 ], 'w') as g:
    writer = csv.writer(g)
    for row in reader:
      if rowIndex > 0:
        rawDate = row[ 0 ] + row[ 1 ] + row[ 2 ] + row[ 3 ] + row[ 4 ] + row[ 5 ]
        date = datetime.datetime.strptime( rawDate, "%y%m%d%H%M%S" )
        if rowIndex == 1:
          firstDate = date
        hoursSince = ( date - firstDate ).total_seconds() / 3600
        new_row = [ hoursSince ] + row[6:]
        writer.writerow(new_row)
      else:
        writer.writerow(['Hour'] + row[6:])
      rowIndex = rowIndex + 1