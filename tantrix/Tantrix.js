// Useful hexagon info: https://www.redblobgames.com/grids/hexagons/

// http://www.tantrix.com/english/TantrixTiles.html
const ColorSequences = [
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

const Colors = {
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

export function drawPiece( ctx, piece ) {
  const x = gridX( piece.col, piece.row );
  const y = gridY( piece.row );
  const ang = piece.rot * Math.PI / 3;

  ctx.translate( x, y );
  ctx.rotate( ang );

  drawTile( ctx, piece.id );

  ctx.rotate( -ang );

  ctx.font = '0.4px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'black';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = 'white';
  ctx.fillText( `(${ piece.col }, ${ piece.row })`, 0, 0 );

  ctx.shadowColor = 'transparent';
  
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

    const DIST = 0.85;
    const angle1 = ( start - 0.5 ) * Math.PI * 2 / 6;
    ctx.moveTo( Math.cos( angle1 ) * DIST, Math.sin( angle1 ) * DIST );

    const angle2 = ( end - 0.5 ) * Math.PI * 2 / 6;
    ctx.quadraticCurveTo( 0, 0, Math.cos( angle2 ) * DIST, Math.sin( angle2 ) * DIST );

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
]

function colFrom( col, row, dir ) {
  const oddOffset = Math.abs( row ) % 2;

  switch( dir ) {
    case Direction.NW: case Direction.SW: return col + oddOffset - 1;
    case Direction.NE: case Direction.SE: return col + oddOffset;
    default: return col;
  }
}

function rowFrom( row, dir ) {
  switch( dir ) {
    case Direction.N: return row - 2;
    case Direction.NW: case Direction.NE: return row - 1;
    case Direction.SW: case Direction.SE: return row + 1;
    case Direction.S: return row + 2;
  }
}

export function isValidMove( board, move ) {
  console.log( `isValidMove( board, ${ JSON.stringify( move ) } )` );
  return board.every( m => {
    if ( m.col == move.col && m.row == move.row ) {
      console.log( `Existing move at ${ m.col },${ m.row }!` );
      return false;
    }

    for ( let dir = 0; dir < 6; dir ++ ) {
      // console.log( `testing ${ DirName[ dir ] } @ ${ colFrom( move.col, move.row, dir ) },${ rowFrom( move.row, dir ) }` );
      if ( m.col == colFrom( move.col, move.row, dir ) && m.row == rowFrom( move.row, dir ) ) {
        console.log( `Found ${ DirName[ dir ] }: ${ JSON.stringify( m ) }` );
        const us   = ColorSequences[ move.id ][ fixRot( dir - move.rot ) ];
        const them = ColorSequences[    m.id ][ fixRot( dir + 3 - m.rot ) ];
        console.log( `Our ${ DirName[ dir ] } is ${ us }, their ${ DirName[ fixRot( dir + 3 ) ] } is ${ them }` );
        if ( us != them ) {
          return false;
        }
      }
    }

    return true;
  } );
}

function fixRot( rot ) {
  return rot < 0 ? rot + 6 : rot % 6;
}