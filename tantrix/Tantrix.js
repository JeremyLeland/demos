// Useful hexagon info: https://www.redblobgames.com/grids/hexagons/

// http://www.tantrix.com/english/TantrixTiles.html
export const ColorSequences = [
  'YYBRBR',
  'YYBRRB',
  'RRBBYY',
  'YRBRYB',
  'YYRBBR',
  'RBYBRY',
  'BBYRYR',
  'BBRYRY',
  'YBRBYR',
  'YYRBRB',
  'RRBYBY',
  'RRYBYB',
  'BBYRRY',
  'YYBBRR',
  'GGRYYR',
  'GGYRRY',
  'YYGRGR',
  'YYRGRG',
  'RRGYGY',
  'RRYGYG',
  'GGRRYY',
  'YYGRRG',
  'GYYRRG',
  'GGBRRB',
  'GGRRBB',
  'BBGRRG',
  'RRBGBG',
  'GGBBRR',
  'RRGBGB',
  'GGRBBR',
  'GGRYRY',
  'RYGYRG',
  'GGYRYR',
  'GYRYGR',
  'GRYRGY',
  'GGRBRB',
  'BBGRGR',
  'BBRGRG',
  'RBGBRG',
  'RGBGRB',
  'GGBRBR',
  'BGRGBR',
  'GGBBYY',
  'BGYGBY',
  'GGYYBB',
  'GGBYBY',
  'GGYBBY',
  'GGBYYB',
  'YYGBBG',
  'YGBGYB',
  'BYGYBG',
  'GGYBYB',
  'YYGBGB',
  'YYBGBG',
  'BBGYGY',
  'BBYGYG',
];

export const NumTiles = ColorSequences.length;

export const Colors = {
  'Y': 'yellow',
  'G': 'green',
  'B': 'blue',
  'R': 'red',
};

export const HexagonPath = new Path2D();
for ( let i = 0; i < 6; i ++ ) {
  const angle = i * Math.PI * 2 / 6;
  HexagonPath.lineTo( Math.cos( angle ), Math.sin( angle ) );
}
HexagonPath.closePath();

export function gridX( col, row ) {
  return 1.5 * col;
}

export function gridY( col, row ) {
  return Math.sqrt( 3 ) * ( row + ( Math.abs( col ) % 2 ) / 2 );
}

export function getHexCoord( mouseX, mouseY ) {
  const HALF_WIDTH = 0.5;
  const HALF_HEIGHT = 0.5 * Math.sqrt( 3 );

  const halfCol = Math.floor( mouseX / HALF_WIDTH );
  const halfRow = Math.floor( mouseY / HALF_HEIGHT );

  // console.log( `mouseX = ${ mouseX }, halfCol = ${ halfCol } )` );
  // console.log( `mouseY = ${ mouseY }, halfRow = ${ halfRow } )` );

  let mouseCol, mouseRow;

  mouseCol = Math.floor( ( halfCol + 1 ) / 3 );
  mouseRow = Math.floor( mouseY / Math.sqrt( 3 ) + ( Math.abs( mouseCol + 1 ) % 2 ) / 2 );

  if ( ( halfCol - 1 ) % 3 == 0 ) {
    let x1, y1, w, h;

    const oddCol = Math.abs( halfCol ) % 2;
    const oddRow = Math.abs( halfRow ) % 2;

    if ( oddRow == oddCol ) {
      x1 = HALF_WIDTH * halfCol;
      y1 = HALF_HEIGHT * halfRow;
      w = HALF_WIDTH;
      h = HALF_HEIGHT;
    }
    else {
      x1 = HALF_WIDTH * ( halfCol + 1 );
      y1 = HALF_HEIGHT * halfRow;
      w = -HALF_WIDTH;
      h = HALF_HEIGHT;
    }

    // ( x - x1 ) * ( y1 - y2 ) + ( y - y1 ) * ( x2 - x1 ) < 0;
    const dist = ( mouseX - x1 ) * -h + ( mouseY - y1 ) * w;

    // console.log( `dist = ${ dist }` );

    if ( dist < 0 ) {
      mouseCol ++;
      mouseRow += ( oddCol == 1 ? -1 : 1 ) * oddRow;
    }
  }

  return {
    col: mouseCol,
    row: mouseRow,
  }
}

export function drawGrid( ctx, startCol, startRow, endCol, endRow ) {
  for ( let row = startRow; row <= endRow; row ++ ) {
    for ( let col = startCol; col <= endCol; col ++ ) {
      const x = gridX( col, row );
      const y = gridY( col, row );

      ctx.translate( x, y );

      ctx.strokeStyle = 'black';
      ctx.stroke( HexagonPath );

      ctx.translate( -x, -y );
    }
  }
}

export function drawCoords( ctx, startCol, startRow, endCol, endRow ) {
  for ( let row = startRow; row <= endRow; row ++ ) {
    for ( let col = startCol; col <= endCol; col ++ ) {
      const x = gridX( col, row );
      const y = gridY( col, row );

      ctx.translate( x, y );
      
      ctx.font = '0.4px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'black';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = 'white';
      ctx.fillText( `(${ col }, ${ row })`, 0, 0 );

      ctx.shadowColor = 'transparent';
      ctx.translate( -x, -y );
    }
  }
}

export function drawPiece( ctx, piece ) {
  const x = piece.x ?? gridX( piece.col, piece.row );
  const y = piece.y ?? gridY( piece.col, piece.row );
  const ang = piece.rot * Math.PI / 3;

  ctx.translate( x, y );
  ctx.rotate( ang );

  drawTile( ctx, piece.id );

  ctx.rotate( -ang );
  ctx.translate( -x, -y );
}

export function drawTile( ctx, tileIndex ) {
  const colorSequence = ColorSequences[ tileIndex ];

  ctx.fillStyle = 'black';
  ctx.fill( HexagonPath );

  let start = 0, end = 0;
  for ( let i = 0; i < 3; i ++ ) {
    for ( end = start + 1; end < 6; end ++ ) {
      if ( colorSequence[ start ] == colorSequence[ end ] ) {
        break;
      }
    }

    ctx.beginPath();

    drawSegment( ctx, start, end );

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.15;
    ctx.stroke();

    ctx.strokeStyle = Colors[ colorSequence[ start ] ];
    ctx.lineWidth = 0.1;
    ctx.stroke();

    start ++;
    if ( start == end ) {
      start ++;
    }
  }
}

export function drawSegment( ctx, start, end ) {
  const DIST = 0.85;
  const angle1 = ( start - 0.5 ) * Math.PI * 2 / 6;
  ctx.moveTo( Math.cos( angle1 ) * DIST, Math.sin( angle1 ) * DIST );

  // NOTE: If we want smooth lines, we need to use lineTo above 
  //       We also need to somehow have a consistent clockwise/counterclockwise order (via parameter?)
  //       Otherwise we get lines all over the place

  const angle2 = ( end - 0.5 ) * Math.PI * 2 / 6;
  ctx.quadraticCurveTo( 0, 0, Math.cos( angle2 ) * DIST, Math.sin( angle2 ) * DIST );
}


const Direction = {
  NE: 0,
  SE: 1,
  S:  2,
  SW: 3,
  NW: 4,
  N:  5,
};

const DirName = [
  'NE',
  'SE',
  'S',
  'SW',
  'NW',
  'N',
];

export function colFrom( col, row, dir ) {
  switch( dir ) {
    case Direction.NW: case Direction.SW: return col - 1;
    case Direction.NE: case Direction.SE: return col + 1;
    default: return col;
  }
}

export function rowFrom( col, row, dir ) {
  const oddOffset = Math.abs( col ) % 2;

  switch( dir ) {
    case Direction.N: return row - 1;
    case Direction.NW: case Direction.NE: return row + oddOffset - 1;
    case Direction.SW: case Direction.SE: return row + oddOffset;
    case Direction.S: return row + 1;
  }
}

export function isValidMove( board, move ) {
  debug( `isValidMove( board, ${ JSON.stringify( move ) } )` );

  if ( move.col == null || move.row == null ) {
    debug( `Invalid move` );
    return false;
  }

  if ( board.length == 0 ) {
    debug( `Empty board, any move is valid` );
    return true;
  }

  let hasNeighbors = false;

  const hasConflict = board.some( m => {
    if ( m.col == move.col && m.row == move.row ) {
      debug( `Existing move at ${ m.col },${ m.row }!` );
      return true;
    }

    debug( `Checking ${ JSON.stringify( m ) }...` );

    for ( let dir = 0; dir < 6; dir ++ ) {
      debug( `Testing for ${ DirName[ dir ] } ( ${ colFrom( move.col, move.row, dir ) }, ${ rowFrom( move.col, move.row, dir ) } )` );

      if ( m.col == colFrom( move.col, move.row, dir ) && m.row == rowFrom( move.col, move.row, dir ) ) {
        hasNeighbors = true;

        const us   = ColorSequences[ move.id ][ fixRot( dir - move.rot ) ];
        const them = ColorSequences[    m.id ][ fixRot( dir + 3 - m.rot ) ];
        debug( `Our ${ DirName[ dir ] } is ${ us }, their ${ DirName[ fixRot( dir + 3 ) ] } is ${ them }` );
        if ( us != them ) {
          return true;
        }
      }
    }

    return false;
  } );

  return !hasConflict && hasNeighbors; 
}

export function fixRot( rot ) {
  return modulo( rot, 6 );
}

function modulo( n, m ) {
  return ( ( n % m ) + m ) % m;
}

export let Debug = false;
function debug( str ) {
  if ( Debug ) {
    console.log( str );
  }
}