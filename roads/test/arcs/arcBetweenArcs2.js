
function tangentPoint(c1, c3) {
  const dx = c3.x - c1.x;
  const dy = c3.y - c1.y;
  const d = Math.hypot(dx, dy);
  const t = c1.r / (c1.r + c3.r);
  return { x: c1.x + dx * t, y: c1.y + dy * t };
}

const c1 = { pos: [ -2, 0 ], radius: 3 };
const c2 = { pos: [ 2, 0 ], radius: 2.5 };

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  ctx.strokeStyle = 'white';

  [ c1, c2 ].forEach( circle => drawCircle( ctx, ...circle.pos, circle.radius ) );

  // TODO: What's a good radius to use? Should it be based on size of circles? Or size of road?
  // Previous one was using the size of the overlap region
  // Also, should it be the same for all quadrents? Or does it look better if bigger for some, smaller for others?
  const r3 = 0.5;

  ctx.strokeStyle = 'tan';
  drawCircle( ctx, ...c1.pos, c1.radius + r3 );
  drawCircle( ctx, ...c2.pos, c2.radius + r3 );

  ctx.strokeStyle = 'brown';
  drawCircle( ctx, ...c1.pos, c1.radius - r3 );
  drawCircle( ctx, ...c2.pos, c2.radius - r3 );

  const external_external = Intersections.getCircleCircleIntersections( ...c1.pos, c1.radius + r3, ...c2.pos, c2.radius + r3 );
  const internal_external = Intersections.getCircleCircleIntersections( ...c1.pos, c1.radius - r3, ...c2.pos, c2.radius + r3 );
  const external_internal = Intersections.getCircleCircleIntersections( ...c1.pos, c1.radius + r3, ...c2.pos, c2.radius - r3 );
  const internal_internal = Intersections.getCircleCircleIntersections( ...c1.pos, c1.radius - r3, ...c2.pos, c2.radius - r3 );

  const colors = [ 'orange', 'yellow', 'lime', 'dodgerblue' ];

  [ external_external, internal_external, external_internal, internal_internal ].forEach( ( side, index ) => {
    side.forEach( p => {
      ctx.fillStyle = ctx.strokeStyle = colors[ index ];
      drawPoint( ctx, ...p );
      drawCircle( ctx, ...p, r3 );
    } );
  } );  

  // ctx.fillStyle = 'red';
  // [ t1, t2 ].forEach( p => {
  //   ctx.beginPath();
  //   ctx.arc( p.x, p.y, 0.05, 0, Math.PI * 2 );
  //   ctx.fill();
  // })
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