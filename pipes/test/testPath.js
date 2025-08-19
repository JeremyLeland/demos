import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

const canvas = new Canvas();
canvas.backgroundColor = '#321';
// canvas.lineWidth = 1;
canvas.zoom = 1 / 10;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 8, 8 );

const flowPath = [
  [ 1, 1 ],
  [ 2, 1 ],
  [ 2, 2 ],
  [ 2, 3 ],
  [ 3, 3 ],
  [ 3, 2 ],
  [ 4, 2 ],
];

let flowLength = 4.75;

const COLS = 8, ROWS = 8;
const map = Array( COLS * ROWS ).fill( 0 );
map[ 1 + 1 * COLS ] = 0b1010;
map[ 2 + 1 * COLS ] = 0b0110;
map[ 2 + 2 * COLS ] = 0b0101;
map[ 2 + 3 * COLS ] = 0b1001;
map[ 3 + 3 * COLS ] = 0b0011;
map[ 3 + 2 * COLS ] = 0b1100;
map[ 4 + 2 * COLS ] = 0b1111;

canvas.draw = ( ctx ) => {

  // Grid
  ctx.lineWidth = 0.05;
  grid.draw( ctx );

  // Pipes
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'black';

  for ( let row = 0; row < ROWS; row ++ ) {
    for ( let col = 0; col < COLS; col ++ ) {
      drawPipe( ctx, map[ col + row * COLS ], col, row );
    }
  }

  // Flow
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = 'dodgerblue';

  ctx.beginPath();

  for ( let i = 0; i < flowLength; i ++ ) {
    const prev = flowPath[ i - 1 ];
    const curr = flowPath[ i ];
    const next = flowPath[ i + 1 ];

    const start = offset.findIndex( prev ? e => e[ 0 ] == prev[ 0 ] - curr[ 0 ] && e[ 1 ] == prev[ 1 ] - curr[ 1 ] :
                                           e => e[ 0 ] == curr[ 0 ] - next[ 0 ] && e[ 1 ] == curr[ 1 ] - next[ 1 ] );
    const end   = offset.findIndex( next ? e => e[ 0 ] == next[ 0 ] - curr[ 0 ] && e[ 1 ] == next[ 1 ] - curr[ 1 ] :
                                           e => e[ 0 ] == curr[ 0 ] - prev[ 0 ] && e[ 1 ] == curr[ 1 ] - prev[ 1 ] );

    addPath( ctx, start, end, curr[ 0 ], curr[ 1 ], Math.min( 1, flowLength - i ), i == 0 );
  }

  ctx.stroke();


}

function addCurve( path, x1, y1, cx, cy, x2, y2, t = 1 ) {
  if ( t < 1 ) {
    // https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm
    const x01 = ( 1 - t ) * x1 + t * cx;
    const y01 = ( 1 - t ) * y1 + t * cy;

    const x12 = ( 1 - t ) * cx + t * x2;
    const y12 = ( 1 - t ) * cy + t * y2;

    const x012 = ( 1 - t ) * x01 + t * x12;
    const y012 = ( 1 - t ) * y01 + t * y12;

    path.quadraticCurveTo( x01, y01, x012, y012 );
  }
  else {
    path.quadraticCurveTo( cx, cy, x2, y2 );
  }
}

const offset = [
  [  0, -1 ], // top
  [ -1,  0 ], // left
  [  0,  1 ], // bottom
  [  1,  0 ], // right
];


// TODO: How to handle just 1 active bit? The "start" is middle in that case, and end is only bit

function addPath( path, start, end, x, y, t, newPath = false ) {
  const startX = x + 0.5 * offset[ start ][ 0 ];
  const startY = y + 0.5 * offset[ start ][ 1 ];
  const endX = x + 0.5 * offset[ end ][ 0 ];
  const endY = y + 0.5 * offset[ end ][ 1 ];

  if ( newPath ) {
    path.moveTo( startX, startY );
  }

  addCurve( path, startX, startY, x, y, endX, endY, t );
}

function drawPipe( ctx, pipe, x, y ) {
  if ( pipe == 0 ) {
    return;
  }

  ctx.beginPath();
  
  if ( pipe == 0b1111 ) {
    addPath( ctx, 0, 2, x, y, 1, true );
    addPath( ctx, 1, 3, x, y, 1, true );
  }
  else {
    let whichIndex = 0;
    const sideIndices = [ -1, -1 ];
      
    // Assumes exactly two active bits
    for ( let side = 0; side < 4; side ++ ) {
      if ( pipe & ( 1 << side ) ) {
        sideIndices[ whichIndex ] = side;
        whichIndex ++;
      }
    }

    addPath( ctx, sideIndices[ 0 ], sideIndices[ 1 ], x, y, 1, true );
  }

  ctx.stroke();
}