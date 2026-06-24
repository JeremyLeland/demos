import * as Angle from './Angle.js';
import { GameCanvas } from './GameCanvas.js';


const path = [
  [ 'M', [ 0, 0 ] ],
  [ 'L', [ 2, 0 ] ],
  [ 'L', [ 1, 1 ] ],
  [ 'Q', [ 0, 2 ], [ 2, 2 ] ],
  [ 'C', [ 4, 2.5 ], [ 1, 3 ], [ 2, 4 ] ],
];

const TWO_PI = Math.PI * 2;
const PI_2 = Math.PI / 2;

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = 'gray';

let selected = null;

gameCanvas.draw = ( ctx ) => {

  const pathStr = path.map( e => e.join( ' ' ) ).join( ' ' );

  console.log( pathStr );

  // Actual path
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 0.05;
  ctx.stroke( new Path2D( pathStr ) );

  // Points and control points
  path.forEach( part => {
    // Point
    if ( part.length > 1 ) {
      ctx.fillStyle = 'yellow';
      drawPoint( ctx, part[ part.length - 1 ] );
    }

    // Control points
    if ( part.length > 2 ) {
      ctx.fillStyle = 'lightblue';
      drawPoint( ctx, part[ 1 ] );
    }
    if ( part.length > 3 ) {
      ctx.fillStyle = 'aqua';
      drawPoint( ctx, part[ 2 ] );
    }
  } );

  if ( selected ) {
    ctx.fillStyle = '#fff8';
    drawPoint( ctx, path[ selected.partIndex ][ selected.pointIndex ] );
  }
}

// gameCanvas.start();


//
// Draw utils
//

function drawArc( ctx, arc ) {
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();
}

function drawLine( ctx, start, end ) {
  ctx.beginPath();
  ctx.moveTo( ...start );
  ctx.lineTo( ...end );
  ctx.stroke();
}

function drawPoint( ctx, p, radius = 0.05 ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], radius, 0, Math.PI * 2 );
  ctx.fill();
}


//
// Input
//

gameCanvas.pointerDown = ( m ) => {
  // Find closest point
  const closest = {
    partIndex: null,
    pointIndex: null,
    dist: Infinity,
  };

  path.forEach( ( part, partIndex ) => {
    part.forEach( ( point, pointIndex ) => {
      if ( pointIndex > 0 ) {
        const dist = Math.hypot( m.x - point[ 0 ], m.y - point[ 1 ] );

        if ( dist < closest.dist ) {
          closest.partIndex = partIndex;
          closest.pointIndex = pointIndex;
          closest.dist = dist;
        }
      }
    } );
  } );

  selected = closest.dist < 0.1 ? closest : null;

  gameCanvas.redraw();
}

gameCanvas.pointerMove = ( m ) => {
  if ( selected ) {
    const point = path[ selected.partIndex ][ selected.pointIndex ];

    point[ 0 ] += m.dx;
    point[ 1 ] += m.dy;
  }

  gameCanvas.redraw();
}

gameCanvas.pointerUp = ( m ) => {
  selected = null;

  gameCanvas.redraw();
}