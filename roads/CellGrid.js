import { Cell } from './Cell.js';

export function getSquareGrid( cols, rows, size = 64, offset = 32 ) {
  const cellPoints = Array.from(
    Array( cols + 1 ), ( _, col ) => Array.from(
      Array( rows + 1 ), ( _, row ) => ( [
        col * size + ( Math.random() - 0.5 ) * offset,
        row * size + ( Math.random() - 0.5 ) * offset,
      ] )
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

  const cells = [];

  for ( let row = 0; row < rows; row ++ ) {
    for ( let col = 0; col < cols; col ++ ) {
      const cell = cellGrid[ col ][ row ];

      if ( col > 0 )  cell.edges[ 0 ].neighbor = cellGrid[ col - 1 ][ row ].edges[ 2 ];
      if ( row < rows - 1 )  cell.edges[ 1 ].neighbor = cellGrid[ col ][ row + 1 ].edges[ 3 ];
      if ( col < cols - 1 )  cell.edges[ 2 ].neighbor = cellGrid[ col + 1 ][ row ].edges[ 0 ];
      if ( row > 0 )  cell.edges[ 3 ].neighbor = cellGrid[ col ][ row - 1 ].edges[ 1 ];
      
      cells.push( cell );
    }
  }

  return cells;
}

export function getHexGrid( cols, rows, size = 64, offset = 0 ) {
  const cellPoints = Array.from(
    Array( cols * 2 + 1 ), ( _, col ) => Array.from(
      Array( rows + 2 ), ( _, row ) => ( [
        ( col + ( ( col + ( row + 1 ) % 2 ) % 2 ) * 0.3 ) * size + ( Math.random() - 0.5 ) * offset,
        row * 0.6 * size + ( Math.random() - 0.5 ) * offset,
      ] )
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

  const cells = [];

  for ( let row = 0; row < rows; row ++ ) {
    for ( let col = 0; col < cols; col ++ ) {
      const cell = cellGrid[ col ][ row ];

      // TODO: Make these point to edges, not cells
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

      cells.push( cell );
    }
  }

  return cells;
}

export function getHexTriangleGrid( cols, rows, size = 64, offset = 32 ) {
  const cellPoints = Array.from(
    Array( cols + 1 ), ( _, col ) => Array.from(
      Array( rows + 1 ), ( _, row ) => ( [
        ( col + ( ( /*col +*/ ( row + 1 ) % 2 ) /*% 2*/ ) * 0.5 ) * size + ( Math.random() - 0.5 ) * offset,
        row * size + ( Math.random() - 0.5 ) * offset,
      ] )
    )
  );

  const cellGrid = Array.from( Array( cols * 2 ), _ => Array.from( Array( rows ).fill() ) );

  for ( let row = 0; row < rows; row ++ ) {
    for ( let col = 0; col < cols; col ++ ) {
      cellGrid[ col * 2 ][ row ] = new Cell( [
        cellPoints[ col ][ row ],
        cellPoints[ col ][ row + 1 ],
        cellPoints[ col + 1 ][ row + 1 ],
      ] );
      cellGrid[ col * 2 + 1 ][ row ] = new Cell( [
        cellPoints[ col ][ row ],
        cellPoints[ col + 1 ][ row + 1 ],
        cellPoints[ col + 1 ][ row ],
      ] );
    }
    
    row ++;

    for ( let col = 0; col < cols; col ++ ) {
      cellGrid[ col * 2 ][ row ] = new Cell( [
        cellPoints[ col ][ row ],
        cellPoints[ col ][ row + 1 ],
        cellPoints[ col + 1 ][ row ],
      ] );
      cellGrid[ col * 2 + 1 ][ row ] = new Cell( [
        cellPoints[ col + 1 ][ row ],
        cellPoints[ col ][ row + 1 ],
        cellPoints[ col + 1 ][ row + 1 ],
      ] );
    }
  }

  const cells = [];

  // TODO: Make these point to edges, not cells
  for ( let row = 0; row < rows; row ++ ) {
    for ( let col = 0; col < cols; col ++ ) {
      let cell = cellGrid[ col * 2 ][ row ];
      if ( col > 0 )    cell.edges[ 0 ].neighbor = cellGrid[ col * 2 - 1 ][ row ];
      if ( row < rows ) cell.edges[ 1 ].neighbor = cellGrid[ col * 2 ][ row + 1 ];
      if ( col < cols ) cell.edges[ 2 ].neighbor = cellGrid[ col * 2 + 1 ][ row ];

      cells.push( cell );

      cell = cellGrid[ col * 2 + 1 ][ row ];
                            cell.edges[ 0 ].neighbor = cellGrid[ col * 2 ][ row ];
      if ( col < cols - 1 ) cell.edges[ 1 ].neighbor = cellGrid[ col * 2 + 2 ][ row ];
      if ( row > 0 )        cell.edges[ 2 ].neighbor = cellGrid[ col * 2 + 1 ][ row - 1 ];

      cells.push( cell );
    }
    
    row ++;

    for ( let col = 0; col < cols; col ++ ) {
      let cell = cellGrid[ col * 2 ][ row ];
      if ( col > 0 )    cell.edges[ 0 ].neighbor = cellGrid[ col * 2 - 1 ][ row ];
      if ( col < cols ) cell.edges[ 1 ].neighbor = cellGrid[ col * 2 + 1 ][ row ];
      if ( row > 0 )    cell.edges[ 2 ].neighbor = cellGrid[ col * 2 ][ row - 1 ];

      cells.push( cell );

      cell = cellGrid[ col * 2 + 1 ][ row ];
                            cell.edges[ 0 ].neighbor = cellGrid[ col * 2 ][ row ];
      if ( row < rows - 1 ) cell.edges[ 1 ].neighbor = cellGrid[ col * 2 + 1 ][ row + 1 ];
      if ( col < cols - 1 ) cell.edges[ 2 ].neighbor = cellGrid[ col * 2 + 2 ][ row ];

      cells.push( cell );
    }
  }

  return cells;
}

export function linkMaze( cell ) {
  const edges = cell.edges.filter( e => e.neighbor ).sort( ( a, b ) => Math.random() > 0.5 ? 1 : -1 );
  edges.forEach( edge => doEdge( edge ) );
}

function doEdge( edge ) {
  const nextCell = edge.neighbor.parent;
  if ( nextCell.edges.find( e => e.linked ) ) {
    return;
  }
  else {
    edge.linked = true;
    edge.neighbor.linked = true;

    linkMaze( nextCell );
  }
}