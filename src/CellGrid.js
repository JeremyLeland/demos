import { Cell } from './Cell.js';

export function getSquareGrid( cols, rows, size = 64, offset = 32 ) {
  const cellPoints = Array.from(
    Array( cols + 1 ), ( _, col ) => Array.from(
      Array( rows + 1 ), ( _, row ) => ( {
        x: col * size + ( Math.random() - 0.5 ) * offset,
        y: row * size + ( Math.random() - 0.5 ) * offset,
      } )
    )
  );

  const cellGrid = Array.from(
    Array( cols ), ( _, col ) => Array.from(
      Array( rows ), ( _, row ) => new Cell( [
        cellPoints[ col ][ row ],
        cellPoints[ col ][ row + 1 ],
        cellPoints[ col + 1 ][ row + 1 ],
        cellPoints[ col + 1 ][ row ],
      ] )
    )
  );

  for ( let row = 0; row < rows; row ++ ) {
    for ( let col = 0; col < cols; col ++ ) {
      const cell = cellGrid[ col ][ row ];

      if ( col > 0 )  cell.edges[ 0 ].neighbor = cellGrid[ col - 1 ][ row ];
      if ( row < rows - 1 )  cell.edges[ 1 ].neighbor = cellGrid[ col ][ row + 1 ];
      if ( col < cols - 1 )  cell.edges[ 2 ].neighbor = cellGrid[ col + 1 ][ row ];
      if ( row > 0 )  cell.edges[ 3 ].neighbor = cellGrid[ col ][ row - 1 ];
    }
  }

  return cellGrid;
}

export function getHexGrid( cols, rows, size = 64, offset = 0 ) {
  const cellPoints = Array.from(
    Array( cols * 2 + 1 ), ( _, col ) => Array.from(
      Array( rows + 2 ), ( _, row ) => ( {
        x: ( col + ( ( col + ( row + 1 ) % 2 ) % 2 ) * 0.3 ) * size + ( Math.random() - 0.5 ) * offset,
        y: row * 0.6 * size + ( Math.random() - 0.5 ) * offset,
      } )
    )
  );

  const cellGrid = Array.from(
    Array( cols ), ( _, col ) => Array.from(
      Array( rows ), ( _, row ) => {
        const c = col * 2 + ( row % 2 ), r = row;
        return new Cell( [
          cellPoints[ c ][ r ],
          cellPoints[ c ][ r + 1 ],
          cellPoints[ c ][ r + 2 ],
          cellPoints[ c + 1 ][ r + 2 ],
          cellPoints[ c + 1 ][ r + 1 ],
          cellPoints[ c + 1 ][ r ],
        ] );
      }
    )
  );

  for ( let row = 0; row < rows; row ++ ) {
    for ( let col = 0; col < cols; col ++ ) {
      const cell = cellGrid[ col ][ row ];

      if ( col > -1 * row % 2 ) {
        if ( row > 0 )        cell.edges[ 0 ].neighbor = cellGrid[ col - 1 * ( row - 1 ) % 2 ][ row - 1 ];
        if ( row < rows - 1 ) cell.edges[ 1 ].neighbor = cellGrid[ col - 1 * ( row + 1 ) % 2 ][ row + 1 ];
      }
      if ( row < rows - 2 )   cell.edges[ 2 ].neighbor = cellGrid[ col ][ row + 2 ];
      if ( col < cols - 1 * row % 2 ) {
        if ( row < rows - 1 ) cell.edges[ 3 ].neighbor = cellGrid[ col + 1 * row % 2 ][ row + 1 ];
        if ( row > 0 )        cell.edges[ 4 ].neighbor = cellGrid[ col + 1 * row % 2 ][ row - 1 ];
      }
      if ( row > 1 )          cell.edges[ 5 ].neighbor = cellGrid[ col ][ row - 2 ];
    }
  }

  return cellGrid;
}