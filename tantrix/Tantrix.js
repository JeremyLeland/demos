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

const hexagon = new Path2D();
for ( let i = 0; i < 6; i ++ ) {
  const angle = i * Math.PI * 2 / 6;
  hexagon.lineTo( Math.cos( angle ), Math.sin( angle ) );
}
hexagon.closePath();

export function drawPiece( ctx, piece ) {
  const x = 3 * ( piece.col + ( Math.abs( piece.row ) % 2 ) / 2 );
  const y = Math.sin( Math.PI / 3 ) * piece.row;
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
  ctx.fill( hexagon );

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

export function isValidMove( board, move ) {
  const oddOffset = Math.abs( move.row ) % 2;

  return board.every( m => {
    if ( m.col == move.col && m.row == move.row ) {
      console.log( `Existing move at ${ m.col },${ m.row }!` );
      return false;
    }

    // NE
    if ( m.col == move.col + oddOffset && m.row == move.row - 1 ) {
      console.log( 'Found NE: ' + JSON.stringify( m ) );
      const us   = ColorSequences[ move.id ][ fixRot( Direction.NE - move.rot ) ];
      const them = ColorSequences[    m.id ][ fixRot( Direction.SW - m.rot ) ];
      console.log( `Our NE is ${ us }, their SW is ${ them }` );
      if ( us != them ) {
        return false;
      }
    }
    // SE
    if ( m.col == move.col + oddOffset && m.row == move.row + 1 ) {
      console.log( 'Found SE: ' + JSON.stringify( m ) );
      const us   = ColorSequences[ move.id ][ fixRot( Direction.SE - move.rot ) ];
      const them = ColorSequences[    m.id ][ fixRot( Direction.NW - m.rot ) ];
      console.log( `Our SE is ${ us }, their NW is ${ them }` );
      if ( us != them ) {
        return false;
      }
    }
    // S
    if ( m.col == move.col && m.row == move.row + 2 ) {
      console.log( 'Found S: ' + JSON.stringify( m ) );
      const us   = ColorSequences[ move.id ][ fixRot( Direction.S - move.rot ) ];
      const them = ColorSequences[    m.id ][ fixRot( Direction.N - m.rot ) ];
      console.log( `Our S is ${ us }, their N is ${ them }` );
      if ( us != them ) {
        return false;
      }
    }
    // SW
    if ( m.col == move.col - 1 + oddOffset && m.row == move.row + 1 ) {
      console.log( 'Found SW: ' + JSON.stringify( m ) );
      const us   = ColorSequences[ move.id ][ fixRot( Direction.SW - move.rot ) ];
      const them = ColorSequences[    m.id ][ fixRot( Direction.NE - m.rot ) ];
      console.log( `Our SW is ${ us }, their NE is ${ them }` );
      if ( us != them ) {
        return false;
      }
    }
    // NW
    if ( m.col == move.col - 1 + oddOffset && m.row == move.row - 1 ) {
      console.log( 'Found NW: ' + JSON.stringify( m ) );
      const us   = ColorSequences[ move.id ][ fixRot( Direction.NW - move.rot ) ];
      const them = ColorSequences[    m.id ][ fixRot( Direction.SE - m.rot ) ];
      console.log( `Our NW is ${ us }, their SE is ${ them }` );
      if ( us != them ) {
        return false;
      }
    }
    // N
    if ( m.col == move.col && m.row == move.row - 2 ) {
      console.log( 'Found N: ' + JSON.stringify( m ) );
      const us   = ColorSequences[ move.id ][ fixRot( Direction.N - move.rot ) ];
      const them = ColorSequences[    m.id ][ fixRot( Direction.S - m.rot ) ];
      console.log( `Our N is ${ us }, their S is ${ them }` );
      if ( us != them ) {
        return false;
      }
    }
    
    return true;
  } );
}

function fixRot( rot ) {
  return rot < 0 ? rot + 6 : rot % 6;
}