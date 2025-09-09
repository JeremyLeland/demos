import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Arc from '../src/common/Arc.js';

const A = [ 3, 3 ];
const B = [ 5, 3 ];
const C = [ 7, 4 ];
const D = [ 7, 6 ];

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 14;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 12, 12 );

canvas.draw = ( ctx ) => {

  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'gray';

  ctx.beginPath();
  ctx.moveTo( ...A );
  ctx.lineTo( ...B );

  ctx.moveTo( ...C );
  ctx.lineTo( ...D );
  ctx.stroke();

  ctx.lineWidth = 0.05;
  ctx.fillStyle = ctx.strokeStyle = 'yellow';

  const arc = Arc.getArcBetweenLines( ...A, ...B, ...C, ...D, ctx );

  console.log( arc );

  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'white';
  ctx.beginPath();
  ctx.arc( ...arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

canvas.pointerMove = ( p ) => {
  if ( p.buttons == 1 ) {
    let closest, closestDist = Infinity;
    [ A, B, C, D ].forEach( e => {
      const dist = Math.hypot( p.x - e[ 0 ], p.y - e[ 1 ] );
      if ( dist < closestDist ) {
        closest = e;
        closestDist = dist;
      }
    } );

    if ( closest ) {
      closest[ 0 ] += p.dx;
      closest[ 1 ] += p.dy;
      
      canvas.redraw();
    }
  }
}