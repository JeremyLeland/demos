import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

let distance = 0;


const road = {
  start: [ 5, 6 ],
  end: [ 3, 4 ],
  control: [
    [ 5, 4 ],
  ],
};


const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 10;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 8, 8 );

canvas.draw = ( ctx ) => {
  // Road itself
  ctx.lineWidth = 0.3;// 0.8;
  ctx.lineCap = 'square';
  ctx.strokeStyle = 'gray';

  ctx.beginPath();
  ctx.moveTo( ...road.start );
  if ( road.control ) {
    if ( road.control.length == 1 ) {
      ctx.quadraticCurveTo( ...road.control[ 0 ], ...road.end );
    }
    else if ( road.control.length == 2 ) {
      ctx.bezierCurveTo( ...road.control[ 0 ], ...road.control[ 1 ], ...road.end );
    }
  }
  else {
    ctx.lineTo( ...road.end );
  }
  ctx.stroke();


  const table = getQuadraticBezierTable( road.start, road.control[ 0 ], road.end );

  // console.log( table );

  // Direction arrows
  ctx.fillStyle = 'yellow';

  for ( let length = 0; length < 4; length += 0.5 ) {
    drawArrowOnCurveAtTime( ctx, road, getTimeFromTable( table, length ) );
  }

  ctx.fillStyle = 'cyan';
  drawArrowOnCurveAtTime( ctx, road, getTimeFromTable( table, distance ) );

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function drawArrowOnCurveAtTime( ctx, road, t, width = 0.05, length = 0.1 ) {
  const pos = quadraticBezier( t, road.start, road.control[ 0 ], road.end );
  
  const tangent = quadraticTangent( t, road.start, road.control[ 0 ], road.end );
  const angle = Math.atan2( tangent[ 1 ], tangent[ 0 ] );
  
  const cos = Math.cos( angle );
  const sin = Math.sin( angle );
  
  ctx.beginPath();
  ctx.moveTo( pos[ 0 ] + width * sin, pos[ 1 ] - width * cos );
  ctx.lineTo( pos[ 0 ] - width * sin, pos[ 1 ] + width * cos );
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.closePath();
  ctx.fill();
}

function getTimeFromTable( table, length ) {
  const afterIndex = table.findIndex( e => e.length >= length );

  if ( afterIndex == -1 ) {
    return null;
  }
  else if ( afterIndex == 0 ) {
    return table[ afterIndex ].t;
  }

  const after = table[ afterIndex ];
  const beforeIndex = afterIndex - 1;

  const before = table[ beforeIndex ];

  // console.log( `Before ${ length }: ${ JSON.stringify( before ) } (index ${ beforeIndex })` );
  // console.log( `After ${ length }: ${ JSON.stringify( after ) } (index ${ afterIndex })` );

  // Linear interpolate for now, see if this is accurate enough
  const ratio = ( length - before.length ) / ( after.length - before.length );
  const time = before.t + ratio * ( after.t - before.t );

  // console.log( `Time of ${ length } is approximately ${ time }` );

  return time;
}

function getQuadraticBezierTable( P0, P1, P2 ) {
  const steps = 100;
  const table = [ { t: 0, length: 0 } ];
  
  let prev = quadraticBezier( 0, P0, P1, P2 );
  let totalLength = 0;

  for ( let i = 1; i <= steps; i ++ ) {
    const t = i / steps;

    const point = quadraticBezier( t, P0, P1, P2 );
    const dist = Math.hypot( point[ 0 ] - prev[ 0 ], point[ 1 ] - prev[ 1 ] );
    prev = point;

    totalLength += dist;
    table.push( { t: t, length: totalLength } );
  }

  return table;
}

function quadraticBezier( t, P0, P1, P2 ) {
  return [ 0, 1 ].map( i => 
    P0[ i ] *     ( 1 - t ) ** 2          +
    P1[ i ] * 2 * ( 1 - t ) ** 1 * t ** 1 +
    P2[ i ]                      * t ** 2
  );
}

function cubicBezier( t, P0, P1, P2, P3 ) {
  return [ 0, 1 ].map( i => 
    P0[ i ] *     ( 1 - t ) ** 3          +
    P1[ i ] * 3 * ( 1 - t ) ** 2 * t ** 1 +
    P2[ i ] * 3 * ( 1 - t ) ** 1 * t ** 2 +
    P3[ i ]                      * t ** 3
  );
}

function quadraticTangent( t, P0, P1, P2 ) {
  return [ 0, 1 ].map( i => 
    ( P1[ i ] - P0[ i ] ) * 2 * ( 1 - t ) + 
    ( P2[ i ] - P1[ i ] ) * 2 * t
  );
}

function cubicTangent( t, P0, P1, P2, P3 ) {
  return [ 0, 1 ].map( i => 
    ( P1[ i ] - P0[ i ] ) * 3 * ( 1 - t ) ** 2          + 
    ( P2[ i ] - P1[ i ] ) * 6 * ( 1 - t ) ** 1 * t ** 1 + 
    ( P3[ i ] - P2[ i ] ) * 3                  * t ** 2
  );
}

//
// Slider
//
const distSlider = document.createElement( 'input' );

Object.assign( distSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( distSlider, {
  type: 'range',
  value: 0,
  min: 0,
  max: 4,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
