import csv
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument( 'filename' )
parser.add_argument( '-t', '--type', default='serum' )
args = parser.parse_args()

inPath = Path( args.filename )
typeStr = '_' + args.type + '_'

analyte_replace = {
  ' ': '_', 
  '(': '', 
  ')': '', 
  'albumin/globulin' : 'albumin_to_globulin',
  'bun/createinine' : 'bun_to_creatinine',
  'non-afr.': 'non_african',
  '-': '_',
  '+': '_plus_',
  # These will already be transformed by - to _ above
  'il_17e/il_25': 'il_17e_per_il_25',
  'mig/cxcl9' : 'mig_per_cxcl9',
  'pdgf_ab/bb' : 'pdgf_ab_per_bb',
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

with open( inPath, encoding='utf-8-sig' ) as csv_file:
  csv_reader = csv.DictReader( csv_file )

  for row in csv_reader:
    # CMP, AlamarPanel, and EvePanel use different column names
    sample_name = row.get( 'SUBJECT_ID', '' ) + row.get( 'ID', '' )
    sample_name += typeStr
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


outPath = Path( inPath.parent, inPath.stem + '_TRANSFORMED' + inPath.suffix )
print( 'Saving to ' + str( outPath ) )

with open( outPath, mode='w', newline='', encoding='utf-8' ) as csv_file:
  writer = csv.DictWriter( csv_file, fieldnames = fieldnames )

  writer.writeheader()

  for sample_name in sorted( values.keys() ):
    writer.writerow( { 'Sample Name': sample_name } | values[ sample_name ] )