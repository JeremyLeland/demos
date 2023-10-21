import csv

analyte_replace = {
  ' ': '_', 
  '(': '', 
  ')': '', 
  '/': '_to_',
  'non-afr.': 'non_african',
  '-': '_',
  '+': '_plus_',
  # '/': '_per_',     # in EvePanel file, used 'per'    # TODO: Hardcode these full replacements? IL17_per_IL25, etc
}

units_replace = {
  'mg/dL': 'milligram_per_deciliter',
  'mL/min/1.73m2': 'milliliter_per_minute_per_1.73_meter_squared',
  'mmol/L': 'millimol_per_liter',
  'g/dL': 'gram_per_deciliter',
  'U/L': 'units_per_liter',
  '(calc)': '',
  'NPQ': 'npq',
  'pg/ml': 'picogram_per_milliliter',
}

analytes = {}
values = {}

# with open( 'C:\\Users\\iggam\\Downloads\\serum\\CMP.upload_SUBMITTED.csv' ) as csv_file:
# with open( 'C:\\Users\\iggam\\Downloads\\serum\\curation_serum.immune.AlamarPanel_SUBMITTED.csv' ) as csv_file:
with open( 'C:\\Users\\iggam\\Downloads\\serum\\serum.immune.EvePanel_SUBMITTED.csv', encoding='utf-8-sig' ) as csv_file:
  csv_reader = csv.DictReader( csv_file )

  for row in csv_reader:
    # CMP, AlamarPanel, and EvePanel use different column names
    sample_name = row.get( 'SUBJECT_ID', '' ) + row.get( 'ID', '' )
    sample_name += '_serum_'    # TODO: Not always serum -- get this from command line?
    sample_name += row.get( 'timepoint', '' ) + row.get( 'Timepoint', '' )
    
    analyte = row.get( 'ANALYTE', '' ) + row.get( 'Analyte', '' )
    analyte = analyte.lower()

    if ( analyte.endswith( '; total') ):
      analyte = 'total_' + analyte.replace( '; total', '' )

    for before, after in analyte_replace.items():
      analyte = analyte.replace( before, after )
    
    units = row.get( 'UNITS', '' ) + row.get( 'Unit', '' )
    for before, after in units_replace.items():
      units = units.replace( before, after )
    
    # Avoid dangling '_' if units is empty
    if ( units != '' ):
      units = '_' + units
    
    analytes.setdefault( analyte, {} )    # using dictionary of None to preserve insertion order
    values.setdefault( sample_name, {} )

    for column in [ 'VALUE', 'RANGE_MIN', 'RANGE_MAX', 'Concentration', 'Percent_normalized_value', 'Percent' ]:
      val = row.get( column )
      if val:
        col_and_unit = column.lower()
        if not column.startswith( 'Percent' ):  # special cases without units
          col_and_unit += units
        
        analytes[ analyte ][ '_' + col_and_unit ] = None
        values[ sample_name ][ analyte + '_' + col_and_unit ] = val

fieldnames = [ 'Sample Name' ]
for analyte in sorted( analytes.keys() ):
  for rest_of_column in analytes[ analyte ].keys():
    fieldnames.append( analyte + rest_of_column )
  
print( fieldnames )

# TODO: Modify input filename (NOT PATH) to replace TRANSFORMED, etc

with open( 'transformed.csv', mode='w', newline='', encoding='utf-8' ) as csv_file:
  writer = csv.DictWriter( csv_file, fieldnames = fieldnames )

  writer.writeheader()

  for sample_name in sorted( values.keys() ):
    writer.writerow( { 'Sample Name': sample_name } | values[ sample_name ] )

# TODO: Why an extra newline? Something from utf-8? does it do it for all files?