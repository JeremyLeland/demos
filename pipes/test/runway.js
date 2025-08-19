import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

const canvas = new Canvas();
canvas.backgroundColor = '#222';
// canvas.lineWidth = 1;
canvas.zoom = 1 / 10;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 8, 8 );

canvas.draw = ( ctx ) => {

  ctx.lineWidth = 0.05;
  grid.draw( ctx );

  //
  // Example line
  //

  ctx.lineWidth = 0.4;
  ctx.strokeStyle = 'dodgerblue';

  ctx.beginPath();

  ctx.lineTo( 1 - 0.5, 1 );
  ctx.lineTo( 1 + 0.5, 1 );

  ctx.quadraticCurveTo( 2, 1, 2, 1 + 0.5 );

  ctx.lineTo( 2, 2 + 0.5 );
  
  ctx.quadraticCurveTo( 2, 3, 2 + 0.5, 3 );

  ctx.stroke();

  //
  // Example pipes
  //

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'black';

  drawPipe( ctx, 0b0011, 0, 4 );
  drawPipe( ctx, 0b0101, 1, 4 );
  drawPipe( ctx, 0b1001, 2, 4 );
  drawPipe( ctx, 0b0110, 0, 5 );
  drawPipe( ctx, 0b1010, 1, 5 );
  drawPipe( ctx, 0b1100, 2, 5 );
  drawPipe( ctx, 0b1111, 1, 6 );

  //
  // Partial line
  //

  ctx.lineWidth = 0.4;
  ctx.strokeStyle = 'dodgerblue';

  ctx.beginPath();

  ctx.moveTo( 5, 2 - 0.5 );
  drawPartialCurve( ctx, 5, 2 - 0.5, 5 + 0.5, 2, 5, 2, 0.95 );

  ctx.stroke();
}

function drawPartialCurve( path, x1, y1, x2, y2, cx, cy, t ) {

  // https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm
  const x01 = ( 1 - t ) * x1 + t * cx;
  const y01 = ( 1 - t ) * y1 + t * cy;

  const x12 = ( 1 - t ) * cx + t * x2;
  const y12 = ( 1 - t ) * cy + t * y2;

  const x012 = ( 1 - t ) * x01 + t * x12;
  const y012 = ( 1 - t ) * y01 + t * y12;


  path.quadraticCurveTo( x01, y01, x012, y012 );
}

const offset = [
  [  0,   -0.5 ], // top
  [ -0.5,  0   ], // left
  [  0,    0.5 ], // bottom
  [  0.5,  0   ], // right
];

function pathFrom( path, start, end, x, y ) {
  path.moveTo( x + offset[ start ][ 0 ], y + offset[ start ][ 1 ] );
  path.quadraticCurveTo( x, y, x + offset[ end ][ 0 ], y + offset[ end ][ 1 ] );
}

function drawPipe( ctx, pipe, x, y ) {
  ctx.beginPath();
  
  if ( pipe == 0b1111 ) {
    pathFrom( ctx, 0, 2, x, y );
    pathFrom( ctx, 1, 3, x, y );
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

    pathFrom( ctx, sideIndices[ 0 ], sideIndices[ 1 ], x, y );
  }

  ctx.stroke();
}