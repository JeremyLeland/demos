import csv

analyte_replace = {
  ' ': '_', 
  '(': '', 
  ')': '', 
  '/': '_to_',
  'non-afr.': 'non_african'
}

units_replace = {
  'mg/dL': 'milligram_per_deciliter',
  'mL/min/1.73m2': 'milliliter_per_minute_per_1.73_meter_squared',
  'mmol/L': 'millimol_per_liter',
  'g/dL': 'gram_per_deciliter',
  'U/L': 'units_per_liter'
}

column_names = set()
values = {}

with open( 'C:\\Users\\iggam\\Downloads\\serum\\CMP.upload_SUBMITTED.csv' ) as csv_file:
  csv_reader = csv.DictReader( csv_file )
  firstLine = True

  for row in csv_reader:
    if firstLine:
      firstLine = False
    else:
      sample_name = row[ 'SUBJECT_ID'] + '_serum_' + row[ 'timepoint' ]

      analyte = row[ 'ANALYTE' ].lower()

      if ( analyte.endswith( '; total') ):
        analyte = 'total_' + analyte.replace( '; total', '' )

      for before, after in analyte_replace.items():
        analyte = analyte.replace( before, after )
      
      units = row[ 'UNITS' ]
      for before, after in units_replace.items():
        units = units.replace( before, after )
      
      column_names.add( f'{ analyte }_value_{ units }' )
      column_names.add( f'{ analyte }_range_min_{ units }' )
      column_names.add( f'{ analyte }_range_max_{ units }' )

      values.setdefault( sample_name, {} )
      values[ sample_name ][ f'{ analyte }_value_{ units }' ] = row[ 'VALUE' ]
      values[ sample_name ][ f'{ analyte }_range_min_{ units }' ] = row[ 'RANGE_MIN' ]
      values[ sample_name ][ f'{ analyte }_range_max_{ units }' ] = row[ 'RANGE_MAX' ]

# TODO: This gives us max, min, (...potentially other analytes...), value
# Group these by analyte somehow? we want value, min, max

fieldnames = [ 'Sample Name' ] + sorted( list( column_names ) )

with open( 'transformed.csv', mode='w', newline='' ) as csv_file:
  writer = csv.DictWriter( csv_file, fieldnames = fieldnames )

  writer.writeheader()

  for sample_name in sorted( values.keys() ):
    writer.writerow( { 'Sample Name': sample_name } | values[ sample_name ] )
