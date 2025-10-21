// See what kind of shapes we can make with arcs

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];


const routes = {
  //
  // Peanut
  //
  loop1: {
    center: [ 5, 3 ],
    radius: 2,
    startAngle: 0,
    endAngle: Math.PI / 2,
    counterclockwise: true,
  },
  loop2 : {
    center: [ 5, 6 ],
    radius: 1,
    startAngle: -Math.PI / 2,
    endAngle: 0,
    counterclockwise: false,
  },
  loop3 : {
    center: [ 8, 3 ],
    radius: 1,
    startAngle: Math.PI,
    endAngle: Math.PI / 2,
    counterclockwise: true,
  },
  loop4: {
    center: [ 8, 6 ],
    radius: 2,
    startAngle: -Math.PI / 2,
    endAngle: Math.PI,
    counterclockwise: false,
  },

  // Lane change 1
  lane_change_start: {
    center: [ 1.5, 10 ],
    radius: 0.5,
    startAngle: Math.PI,
    endAngle: -0.5 * Math.PI,
    counterclockwise: false,
  },
  lane_change_end: {
    center: [ 1.5, 9 ],
    radius: 0.5,
    startAngle: 0.5 * Math.PI,
    endAngle: 0,
    counterclockwise: true,
  },

  // Lane change 2
  lane_change2_start: {
    center: [ 1.5, 8 ],
    radius: 0.5,
    startAngle: Math.PI,
    endAngle: -0.75 * Math.PI,
    counterclockwise: false,
  },
  lane_change2_middle: {
    start: [ 1.5 + 0.5 * Math.cos( -0.75 * Math.PI ), 8 + 0.5 * Math.sin( -0.75 * Math.PI ) ],
    end: [ 1.5 + 0.5 * Math.cos( 0.25 * Math.PI ), 6.5 + 0.5 * Math.sin( 0.25 * Math.PI ) ],
  },
  lane_change2_end: {
    center: [ 1.5, 6.5 ],
    radius: 0.5,
    startAngle: 0.25 * Math.PI,
    endAngle: 0,
    counterclockwise: true,
  },

  // Lane change 3
  lane_change3_start: {
    center: [ 3, 6 ],
    radius: 2.5,
    startAngle: -Math.PI,
    endAngle: Math.asin( 2 / 2.5 ) - Math.PI,
    counterclockwise: false,
  },
  lane_change3_end: {
    center: [ 0, 2 ],
    radius: 2.5,
    startAngle: Math.asin( 2 / 2.5 ),
    endAngle: 0,
    counterclockwise: true,
  },
};



canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 0.2;

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    ctx.beginPath();
    
    if ( route.center ) {
      ctx.arc( route.center[ 0 ], route.center[ 1 ], route.radius, route.startAngle, route.endAngle, route.counterclockwise );
    }
    else {
      ctx.moveTo( ...route.start );
      ctx.lineTo( ...route.end );
    }

    ctx.stroke();
  } );
}