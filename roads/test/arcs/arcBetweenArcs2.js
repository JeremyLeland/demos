
function tangentPoint(c1, c3) {
  const dx = c3.x - c1.x;
  const dy = c3.y - c1.y;
  const d = Math.hypot(dx, dy);
  const t = c1.r / (c1.r + c3.r);
  return { x: c1.x + dx * t, y: c1.y + dy * t };
}

const circles = [
  { pos: [ -2, 0 ], radius: 3 },
  { pos: [ 2, 0 ], radius: 2.5 }
];

let r3 = 0.5;

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
  ctx.strokeStyle = 'white';

  circles.forEach( circle => drawCircle( ctx, ...circle.pos, circle.radius ) );

  // TODO: What's a good radius to use? Should it be based on size of circles? Or size of road?
  // Previous one was using the size of the overlap region
  // Also, should it be the same for all quadrents? Or does it look better if bigger for some, smaller for others?
  // Maybe we should try to make it so all the tangent points line up?
  //  - It'll be different streets trying to connect, though, so maybe it doesn't matter? Or will it?
  // const r3 = 0.5;

  ctx.lineWidth = 0.02;
  ctx.strokeStyle = 'tan';
  drawCircle( ctx, ...circles[ 0 ].pos, circles[ 0 ].radius + r3 );
  drawCircle( ctx, ...circles[ 1 ].pos, circles[ 1 ].radius + r3 );

  ctx.strokeStyle = 'brown';
  drawCircle( ctx, ...circles[ 0 ].pos, circles[ 0 ].radius - r3 );
  drawCircle( ctx, ...circles[ 1 ].pos, circles[ 1 ].radius - r3 );

  const external_external = [ 1, 1 ];
  const internal_external = [ -1, 1 ];
  const external_internal = [ 1, -1 ];
  const internal_internal = [ -1, -1 ];

  const colors = [ 'orange', 'yellow', 'lime', 'dodgerblue' ];

  [ external_external, internal_external, external_internal, internal_internal ].forEach( ( signs, index ) => {
    const intersections = Intersections.getCircleCircleIntersections( 
      ...circles[ 0 ].pos, circles[ 0 ].radius + signs[ 0 ] * r3, 
      ...circles[ 1 ].pos, circles[ 1 ].radius + signs[ 1 ] * r3,
    );

    ctx.fillStyle = ctx.strokeStyle = colors[ index ];

    intersections.forEach( p => {
      // drawPoint( ctx, ...p );
      drawCircle( ctx, ...p, r3 );

      for ( let i = 0; i < 2; i ++ ) {
        const tangent = vec2.scaleAndAdd( [], 
          circles[ i ].pos, 
          vec2.subtract( [], p, circles[ i ].pos ), 
          circles[ i ].radius / ( circles[ i ].radius + signs[ i ] * r3 )
        );
        drawPoint( ctx, ...tangent );
      }
    } );
  } );
}

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
      closest.pos[ 0 ] += m.dx;
      closest.pos[ 1 ] += m.dy;

      canvas.redraw();
    }
  }
}

canvas.wheelInput = ( m ) => {
  const closest = closestCircle( m );

  if ( closest ) {
    closest.radius = Math.max( r3, closest.radius + 0.1 * Math.sign( m.wheel ) );
    canvas.redraw();
  }
}

function closestCircle( m ) {
  let closest, closestDist = Infinity;

  circles.forEach( circle => {
    const dist = Math.hypot( m.x - circle.pos[ 0 ], m.y - circle.pos[ 1 ] );

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
const r3Slider = document.createElement( 'input' );

Object.assign( r3Slider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( r3Slider, {
  type: 'range',
  min: 0,
  max: 1,
  step: 0.01,
  value: r3,
} );

document.body.appendChild( r3Slider );

r3Slider.addEventListener( 'input', _ => {
  r3 = +r3Slider.value;

  canvas.redraw();
} );