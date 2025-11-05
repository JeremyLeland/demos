// TODO: Make visual test demo out of this
// Trying to see if I can use this to make good intersections between curves

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import { vec2 } from '../../lib/gl-matrix.js'

const A = {
  pos: [ 3, 3 ],
  radius: 2,
  color: 'gray',
};

const B = {
  pos: [ 6, 6 ],
  radius: 3,
  color: 'dimgray',
};


const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  [ A, B ].forEach( arc => {
    ctx.beginPath();
    ctx.arc( arc.pos[ 0 ], arc.pos[ 1 ], arc.radius, 0, Math.PI * 2 );
    ctx.strokeStyle = arc.color;
    ctx.stroke();
  } );

  const dx = B.pos[ 0 ] - A.pos[ 0 ];
  const dy = B.pos[ 1 ] - A.pos[ 1 ];
  const D = Math.hypot( dx, dy );

  // const D = vec2.distance( A.pos, B.pos );

  console.log( D );

  if ( D < 1e-6 ) {
    console.log( 'Circles have same center, infinite or no solutions!' );
    // TODO: Handle this case in some meaninful way
  }

  // Possible combinations of internal/external tangency
  const signs = [
    { s1: 1, s2: 1, type: "external-external", color: 'red' },
    { s1: 1, s2: -1, type: "external-internal", color: 'orange' },
    { s1: -1, s2: 1, type: "internal-external", color: 'yellow' },
    { s1: -1, s2: -1, type: "internal-internal", color: 'green' }
  ];

  const results = [];

  for (const { s1, s2, type, color } of signs) {

    const R1 = s1 * A.radius;
    const R2 = s2 * B.radius;

    const numerator = D - R1 - R2;
    if ( numerator <= 0 ) continue; // no valid tangent circle for this config
    const r3 = numerator / 2;

    // Ratio for center placement along line connecting c1–c2
    // const u = ( A.radius + s1 * r3 ) / ( B.radius + s2 * r3 );

    const u = r3 + R1;
    const t = u / D;

    // Coordinates of tangent circle center
    // const x3 = ( A.pos[ 0 ] + u * B.pos[ 0 ] ) / ( 1 + u );
    // const y3 = ( A.pos[ 1 ] + u * B.pos[ 1 ] ) / ( 1 + u );

    const x3 = A.pos[ 0 ] + t * dx;
    const y3 = A.pos[ 1 ] + t * dy;

    results.push( { pos: [ x3, y3 ], radius: r3, type: type, color: color } );
  }

  console.log( results );

  results.forEach( circle => {
    ctx.beginPath();
    ctx.arc( circle.pos[ 0 ], circle.pos[ 1 ], circle.radius, 0, Math.PI * 2 );
    ctx.strokeStyle = circle.color;
    ctx.stroke();
  } );
};
