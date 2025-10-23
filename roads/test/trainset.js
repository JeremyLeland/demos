// Experimenting with pre-defined pieces 
// instead of trying to figure out intersections between arbitrary lines and curves

import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import { vec2 } from '../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const streets = {

}

const routes = {
  main1: {
    start: [ 2.5, 3 ],
    end: [ 4, 3 ],
  },
  main2: {
    start: [ 5, 3 ],
    end: [ 6.5, 3 ],
  },
  // right_side_turn: {
  //   center: [ 6.5, 3.5 ],
  //   radius: 0.5,
  //   startAngle: -Math.PI / 2,
  //   endAngle: 0,
  // },
  arc1: {
    center: [ 5, 3.5 ],
    radius: 2,
    startAngle: 0,
    endAngle: Math.PI / 2,
  },
  arc2: {
    center: [ 4, 3.5 ],
    radius: 2,
    startAngle: Math.PI / 2,
    endAngle: Math.PI,
  },
  // left_side_turn: {
  //   center: [ 2.5, 3.5 ],
  //   radius: 0.5,
  //   startAngle: Math.PI,
  //   endAngle: -Math.PI / 2,
  // },
  middle: {
    start: [ 4.5, 3.5 ],
    end: [ 4.5, 5 ],
  },
};

const intersections = {
  right_side: [
    [ 'main2', 'arc1' ],
  ],
  left_side: [
    [ 'arc2', 'main1' ],
  ],
  top: [
    [ 'main1', 'main2' ],
    [ 'main1', 'middle' ],
    [ 'main2', 'middle' ],
  ],
  bottom: [
    [ 'arc1', 'arc2' ],
    [ 'arc1', 'middle' ],
    [ 'arc2', 'middle' ],
  ],  
};

// Can I describe everything I need with those connections?
// See if I can alternate which route is open with timer
// Try generating all links as line->arc->line using our arcTo
//    - skip lines, arc, etc if not needed


canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 0.2;

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    ctx.beginPath();
    
    if ( route.center ) {
      ctx.arc( route.center[ 0 ], route.center[ 1 ], route.radius, route.startAngle, route.endAngle );
    }
    else {
      ctx.moveTo( ...route.start );
      ctx.lineTo( ...route.end );
    }

    ctx.stroke();
  } );
}