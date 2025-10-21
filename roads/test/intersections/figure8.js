// Trying a controlled intersection (e.g. stop sign or traffic lights)
// Manually specify routes for now

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const streets = {

}

const routes = {
  loop1: {
    center: [ 3, 3 ],
    radius: 2,
    startAngle: 0,
    endAngle: Math.PI / 2,
    counterclockwise: true,
  },
  start1: {
    start: [ 5, 4.5 ],
    end: [ 5, 3 ],
  },
  end1: {
    start: [ 3, 5 ],
    end: [ 4.5, 5 ],
  },
  loop2: {
    center: [ 7, 7 ],
    radius: 2,
    startAngle: -Math.PI / 2,
    endAngle: Math.PI,
    counterclockwise: false,
  },
  start2: {
    start: [ 5.5, 5 ],
    end: [ 7, 5 ],
  },
  end2: {
    start: [ 5, 7 ],
    end: [ 5, 5.5 ],
  },

  loop1_TO_loop1_ARC: {
    center: [ 4.5, 4.5 ],
    radius: 0.5,
    startAngle: Math.PI / 2,
    endAngle: 0,
    counterclockwise: true,
  },
  loop1_TO_loop2_LINE1: {
    start: [ 4.5, 5 ],
    end: [ 5.5, 5 ],
  },

  loop2_TO_loop1_LINE1: {
    start: [ 5, 5.5 ],
    end: [ 5, 4.5 ],
  },
  loop2_TO_loop2_ARC: {
    center: [ 5.5, 5.5 ],
    radius: 0.5,
    startAngle: Math.PI,
    endAngle: -Math.PI / 2,
    counterclockwise: false,
  }
};

// const intersections = {
//   middle: [
//     [ 'loop1', 'loop1' ],
//   ],
// };

// Routes: keep track of the routes making up a connection (e.g. might have line + arc + line)
// Yield: We cannot go if these connections are active (either with a light or with a car in them)
//          - can we figure these out automatially? any routes not ending in our desired end?
//          - also need to avoid routes that cross our path, that's tougher...

const intersections = {
  middle: {
    loop1_TO_loop1: {
      routes: [ 'loop1_TO_loop1_ARC' ],
      yield: [ 'loop2_TO_loop1' ],
    },
    loop1_TO_loop2: {
      routes: [ 'loop1_TO_loop2_LINE1' ],
      yield: [ 'loop2_TO_loop1', 'loop2_TO_loop2' ],
    },
    loop2_TO_loop1: {
      routes: [ 'loop2_TO_loop1_LINE1' ],
      yield: [ 'loop1_TO_loop1', 'loop1_TO_loop2' ],
    },
    loop2_TO_loop2: {
      routes: [ 'loop2_TO_loop2_ARC' ],
      yield: [ 'loop1_TO_loop2' ],
    },
  },
};

//
// UI to hover intersections for more info
//

let hoverIntersectionName;

const nameDiv = document.createElement( 'div' );
for ( const name of Object.keys( intersections.middle ) ) {
  // const label = document.createTextNode( name );
  // nameDiv.appendChild( label );

  const div = document.createElement( 'div' );
  div.innerText = name;

  div.addEventListener( 'mouseover', _ => {
    hoverIntersectionName = name;
    canvas.redraw();
  } );

  nameDiv.appendChild( div );
}

document.body.appendChild( nameDiv );

Object.assign( nameDiv.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  overflow: 'scroll',
  fontSize: '12px'
} );


//
// Drawing
//

canvas.draw = ( ctx ) => {
  // Routes
  ctx.strokeStyle = '#555a';
  ctx.lineWidth = 0.4;

  Object.entries( routes ).forEach( ( [ name, route ] ) => drawRoute( ctx, route ) );

  // Intersection debug
  if ( hoverIntersectionName ) {
    const intersection = intersections.middle[ hoverIntersectionName ];

    ctx.strokeStyle = '#f00a'
    intersection.yield.forEach( yieldName => {
      intersections.middle[ yieldName ].routes.forEach( routeName => {
        drawRoute( ctx, routes[ routeName ] );
      } );
    } );

    ctx.strokeStyle = '#0f0a'
    intersection.routes.forEach( routeName => {
      drawRoute( ctx, routes[ routeName ] );
    } );
  }

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.02;
  grid.draw( ctx );
}

function drawRoute( ctx, route ) {
  ctx.beginPath();

  if ( route.center ) {
    ctx.arc( route.center[ 0 ], route.center[ 1 ], route.radius, route.startAngle, route.endAngle, route.counterclockwise );
  }
  else {
    ctx.moveTo( ...route.start );
    ctx.lineTo( ...route.end );
  }

  ctx.stroke();
}