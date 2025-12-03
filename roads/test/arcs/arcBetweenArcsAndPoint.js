//
// Seeing if I can come up with a good center and radius for a fillet circle
// Try to find it based on distance along bisector from center


const circles = [
  { center: [ -2.5, -1 ], radius: 3 },
  { center: [ 2.5, -1 ], radius: 3 }
];

let goalGap = 1;

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  ctx.lineWidth = 0.05;
  ctx.fillStyle = ctx.strokeStyle = 'white';

  circles.forEach( circle => {
    drawCircle( ctx, ...circle.center, circle.radius );
    drawPoint( ctx, ...circle.center );
  } );

  // TODO: What's a good radius to use? Should it be based on size of circles? Or size of road?
  // Previous one was using the size of the overlap region
  // Also, should it be the same for all quadrents? Or does it look better if bigger for some, smaller for others?
  // Maybe we should try to make it so all the tangent points line up?
  //  - It'll be different streets trying to connect, though, so maybe it doesn't matter? Or will it?
  // const r3 = 0.5;


  const external_external = [ 1, 1 ];
  const internal_external = [ -1, 1 ];
  const external_internal = [ 1, -1 ];
  const internal_internal = [ -1, -1 ];

  const colors = [ 'orange', 'yellow', 'lime', 'dodgerblue' ];

  [ external_external /*, internal_external, external_internal, internal_internal*/ ].forEach( ( signs, index ) => {

    ctx.fillStyle = ctx.strokeStyle = colors[ index ];

    
    ctx.lineWidth = 0.02;

    const intersections = Intersections.getCircleCircleIntersections( 
      ...circles[ 0 ].center, circles[ 0 ].radius,
      ...circles[ 1 ].center, circles[ 1 ].radius,
    );

    intersections.forEach( ( intersection, index ) => {
      if ( index != 0 ) {
        return;
      }
      
      const v1 = vec2.subtract( [], intersection, circles[ 0 ].center );
      const v2 = vec2.subtract( [], intersection, circles[ 1 ].center );
      vec2.normalize( v1, v1 );
      vec2.normalize( v2, v2 );

      const bisector = vec2.add( [], v1, v2 );
      vec2.normalize( bisector, bisector );
      
      ctx.beginPath();
      ctx.moveTo( ...intersection );
      ctx.lineTo( ...vec2.scaleAndAdd( [], intersection, v1, 1 ) );
      ctx.moveTo( ...intersection );
      ctx.lineTo( ...vec2.scaleAndAdd( [], intersection, v2, 1 ) );
      ctx.moveTo( ...intersection );
      ctx.lineTo( ...vec2.scaleAndAdd( [], intersection, bisector, 4 ) );
      ctx.stroke();

      ctx.strokeStyle = 'cyan';
      ctx.beginPath();
      ctx.moveTo( ...intersection );
      ctx.lineTo( ...vec2.scaleAndAdd( [], intersection, bisector, goalGap ) );
      ctx.stroke();


      // TODO: Binary search this


      for ( let i = 0; i < 100; i ++ ) {
        const offset = i * 0.2;
        const center = vec2.scaleAndAdd( [], intersection, bisector, offset );
        const radius = vec2.distance( center, circles[ 0 ].center ) - circles[ 0 ].radius;
        const gap = offset - radius;

        console.log( gap );

        if ( goalGap - gap < 1e-6 ) {
          drawPoint( ctx, ...center );
          drawCircle( ctx, ...center, radius );

          break;
        }
      }

      ctx.beginPath();
      ctx.moveTo( ...circles[ 0 ].center );
      ctx.lineTo( ...intersection );
      ctx.moveTo( ...circles[ 1 ].center );
      ctx.lineTo( ...intersection );
      ctx.stroke();

      // for ( let i = 0; i < 2; i ++ ) {
      //   const tangent = vec2.scaleAndAdd( [], 
      //     circles[ i ].center, 
      //     vec2.subtract( [], intersection, circles[ i ].center ), 
      //     circles[ i ].radius / ( circles[ i ].radius + signs[ i ] * r3 )
      //   );
      //   drawPoint( ctx, ...tangent );
      // }
    } );
  } );
}


//
// Math
//

const TWO_PI = Math.PI * 2;

function fixAngle( a ) {
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

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

//
// Draw shortcuts
//

function drawCircle( ctx, x, y, r ) {
  ctx.beginPath();
  ctx.arc( x, y, r, 0, Math.PI * 2 );
  ctx.stroke();
}

function drawPoint( ctx, x, y ) {
  ctx.beginPath();
  ctx.arc( x, y, 0.05, 0, Math.PI * 2 );
  ctx.fill();
}

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {
    const closest = closestCircle( m );

    if ( closest ) {
      closest.center[ 0 ] += m.dx;
      closest.center[ 1 ] += m.dy;

      canvas.redraw();
    }
  }
}

canvas.wheelInput = ( m ) => {
  const closest = closestCircle( m );

  if ( closest ) {
    closest.radius = Math.max( goalGap, closest.radius + 0.1 * Math.sign( m.wheel ) );
    canvas.redraw();
  }
}

function closestCircle( m ) {
  let closest, closestDist = Infinity;

  circles.forEach( circle => {
    const dist = Math.hypot( m.x - circle.center[ 0 ], m.y - circle.center[ 1 ] );

    if ( dist < circle.radius && dist < closestDist ) {
      closest = circle;
      closestDist = dist;
    }
  } );

  return closest;
}

//
// Slider
//
const gapSlider = document.createElement( 'input' );

Object.assign( gapSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( gapSlider, {
  type: 'range',
  min: 0,
  max: 10,
  step: 0.01,
  value: goalGap,
} );

document.body.appendChild( gapSlider );

gapSlider.addEventListener( 'input', _ => {
  goalGap = +gapSlider.value;

  canvas.redraw();
} );
