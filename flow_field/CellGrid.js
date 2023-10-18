import { Cell } from './Cell.js';
import './lib/poly2tri.js';

export function getSquareGrid( cols, rows, size = 1, offset = 0 ) {
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

export function fromPoints( points, holes ) {
  const contour = points.map( p => new poly2tri.Point( p[ 0 ], p[ 1 ] ) );
  const swctx = new poly2tri.SweepContext( contour );

  holes?.forEach( holePoints => {
    const hole = holePoints.map( p => new poly2tri.Point( p[ 0 ], p[ 1 ] ) );
    swctx.addHole( hole );
  } );

  swctx.triangulate();
  const triangles = swctx.getTriangles();

  const cells = [];

  triangles.forEach( triangle => {
    const [ a, b, c ] = triangle.getPoints();

    // Altering order so normals point inward
    const cell = new Cell( [ [ b.x, b.y ], [ a.x, a.y ], [ c.x, c.y ] ] );

    triangle.cell = cell;

    cells.push( cell );
  } );

  triangles.forEach( triangle => {
    triangle.cell.edges.forEach( ( edge, index ) => {
      // Account for reverse edge order due to above
      const neighbor = triangle.getNeighbor( 2 - index );
      if ( neighbor?.cell ) {
        for ( let i = 0; i < 3; i ++ ) {
          const neighborNeighbor = neighbor.getNeighbor( 2 - i );
          if ( neighborNeighbor == triangle ) {
            edge.neighbor = neighbor.cell.edges[ i ];
          }
        }
      }
    } );
  } );

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

// See: http://leifnode.com/2013/12/flow-field-pathfinding/
export function getFlowField( target ) {
  const bestCost = new Map();
  const bestEdge = new Map();

  bestCost.set( target, 0 );
  bestEdge.set( target, null );

  const open = new Set( [ target ] );

  while ( open.size > 0 ) {
    const [ cell ] = open;
    open.delete( cell );

    cell.edges.filter( e => e.linked ).forEach( edge => {
      const neighborCell = edge.neighbor.parent;

      if ( !bestCost.has( neighborCell ) ) {
        bestCost.set( neighborCell, Infinity );
        // bestEdge.set( neighborCell, null );
      }

      const endNodeCost = bestCost.get( cell ) + Math.hypot( cell.x - neighborCell.x, cell.y - neighborCell.y );

      if ( endNodeCost < bestCost.get( neighborCell ) ) {
        open.add( neighborCell );
        bestCost.set( neighborCell, endNodeCost );
        bestEdge.set( neighborCell, edge.neighbor );
      }
    } );
  }

  return bestEdge;
}
