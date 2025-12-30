// TODO: Start with dragging a line from start to end, then click anywhere in line to add a middle and drag that?

const controlPoints = {
  start: [ -2, 1 ],
  middle: [ 0, -2 ],
  end: [ 2, 1 ],
};

function arcFromThreePoints( p1, p2, p3 ) {
  const [ x1, y1 ] = p1;
  const [ x2, y2 ] = p2;
  const [ x3, y3 ] = p3;

  // Check for duplicate points
  if ( ( x1 === x2 && y1 === y2 ) ||
       ( x2 === x3 && y2 === y3 ) ||
       ( x3 === x1 && y3 === y1 ) ) {
    throw new Error( "Duplicate points" );
  }

  const D = 2 * (
    x1 * ( y2 - y3 ) +
    x2 * ( y3 - y1 ) +
    x3 * ( y1 - y2 )
  );

  // Collinear (or nearly collinear)
  if ( Math.abs(D) < 1e-12 ) {
    throw new Error( "Points are collinear" );
  }

  const x1sq = x1 * x1 + y1 * y1;
  const x2sq = x2 * x2 + y2 * y2;
  const x3sq = x3 * x3 + y3 * y3;

  const cx = (
      x1sq * ( y2 - y3 ) +
      x2sq * ( y3 - y1 ) +
      x3sq * ( y1 - y2 )
  ) / D;

  const cy = (
      x1sq * ( x3 - x2 ) +
      x2sq * ( x1 - x3 ) +
      x3sq * ( x2 - x1 )
  ) / D;

  const r = Math.hypot( cx - x1, cy - y1 );

  const startAngle  = Math.atan2( y1 - cy, x1 - cx );
  const middleAngle = Math.atan2( y2 - cy, x2 - cx );
  const endAngle    = Math.atan2( y3 - cy, x3 - cx );

  return { 
    center: [ cx, cy ], 
    radius: r,
    startAngle: startAngle,
    endAngle: endAngle,
    counterclockwise: !isBetweenAngles( middleAngle, startAngle, endAngle ),
  };
}


import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  const arc = arcFromThreePoints( controlPoints.start, controlPoints.middle, controlPoints.end );

  ctx.strokeStyle = 'white';
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();

  const controlColors = {
    start: 'lime',
    middle: 'yellow',
    end: 'red',
  };

  // Control points
  [ 'start', 'middle', 'end' ].forEach( e => {
    ctx.fillStyle = controlColors[ e ];
    drawPoint( ctx, controlPoints[ e ] );
  } );
}

//
// Draw utils
//

function drawLine( ctx, start, end ) {
  ctx.beginPath();
  ctx.moveTo( ...start );
  ctx.lineTo( ...end );
  ctx.stroke();
}

function drawPoint( ctx, p ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], 0.05, 0, Math.PI * 2 );
  ctx.fill();
}

//
// Angle utils
//
function fixAngle( a ) {
  const TWO_PI = Math.PI * 2;
  
  if ( a > Math.PI ) {
    return a % TWO_PI - TWO_PI;
  }
  else if ( a < -Math.PI ) {
    return a % TWO_PI + TWO_PI;
  }
  else {
    return a;
  }
}

function deltaAngle( a, b, counterclockwise = false ) {
  return counterclockwise ? fixAngle( a - b ) : fixAngle( b - a );
}

function isBetweenAngles( testAngle, startAngle, endAngle, counterclockwise = false ) {
  // Normalize angles
  const test = fixAngle( testAngle );
  const start = fixAngle( counterclockwise ? endAngle : startAngle );
  const end = fixAngle( counterclockwise ? startAngle : endAngle );

  // Handle wrap-around
  if ( start < end ) {
    // return test >= start && test <= end;
    return test > start && test < end;
  }
  else {
    // return test >= start || test <= end;
    return test > start || test < end;
  }
}

//
// Input
//

let selected;

canvas.pointerDown = ( m ) => {
  selected = closestPoint( m.x, m.y );
}

canvas.pointerUp = ( m ) => {
  selected = null;
}

canvas.pointerMove = ( m ) => {
  if ( selected ) {
    selected[ 0 ] += m.dx;
    selected[ 1 ] += m.dy;
    
    canvas.redraw();
  }
}

function closestPoint( x, y ) {
  let closest, closestDist = Infinity;

  Object.values( controlPoints ).forEach( p => {
    const dist = Math.hypot( x - p[ 0 ], y - p[ 1 ] );

    if ( dist < 1 && dist < closestDist ) {
      closest = p;
      closestDist = dist;
    }
  } );

  return closest;
}