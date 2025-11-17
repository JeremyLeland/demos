// See what kind of shapes we can make with arcs

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

import * as Route from '../../src/Route.js';
import * as Arc from '../../src/common/Arc.js';


const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const LANE_WIDTH = 1;

const routes = {
  North: {
    center: [ -6, 4 ],
    radius: 12,
    startAngle: 0.5,
    endAngle: -0.5,
    counterclockwise: true,
  },
  South: {
    center: [ -6, 4 ],
    radius: 12 - LANE_WIDTH,
    startAngle: -0.5,
    endAngle: 0.5,
    counterclockwise: false,
  },
  East: {
    center: [ 4, -6 ],
    radius: 10,
    startAngle: 1,
    endAngle: 2,
    counterclockwise: false,
  },
  West: {
    center: [ 4, -6 ],
    radius: 10 + LANE_WIDTH,
    startAngle: 2,
    endAngle: 1,
    counterclockwise: true,
  },
};

const paths = {
  North_East: {
    from: 'North',
    to: 'East',
    radius: 2,
  },
  West_South: {
    from: 'West',
    to: 'South',
    radius: 1,
  },
  
  North_West: {
    from: 'North',
    to: 'West',
    radius: 1,
  },
  East_South: {
    from: 'East',
    to: 'South',
    radius: 2,
  },
  
  South_West: {
    from: 'South',
    to: 'West',
    radius: 2,
  },
  East_North: {
    from: 'East',
    to: 'North',
    radius: 1,
  },

  South_East: {
    from: 'South',
    to: 'East',
    radius: 1,
  },  
  West_North: {
    from: 'West',
    to: 'North',
    radius: 2,
  },
  
};
  
Object.values( paths ).forEach( path => {
  Arc.getArcsBetweenArcs( routes[ path.from ], routes[ path.to ], path.radius ).forEach( ( arc, index ) => {
    routes[ `${ path.from }_TO_${ path.to }_ARC` ] = arc;
  } );

  // TODO: _BEFORE and _AFTER can be arcs in this case, the remaining pieces of from and to inside the intersection
  //       In line-arc-line case, these are also pieces of from and to inside intersection
} );


// Arc.getArcsBetweenArcs( routes.loop2_W, routes.loop1_S, 0.4 ).forEach( ( arc, index ) => {
//   routes[ `join1_${ index }` ] = arc;
// } );

// Arc.getArcsBetweenArcs( routes.loop1, routes.loop2, 0.4 ).forEach( ( arc, index ) => {
//   routes[ `join2_${ index }` ] = arc;
// } );

//
// Routes list
//

let hoverRouteName;

const nameDiv = document.createElement( 'div' );
for ( const name of Object.keys( routes ) ) {
  // const label = document.createTextNode( name );
  // nameDiv.appendChild( label );

  const div = document.createElement( 'div' );
  div.innerText = name;

  div.addEventListener( 'mouseover', _ => {
    hoverRouteName = name;
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

const DEBUG_ARROW_WIDTH = 0.05, DEBUG_ARROW_LENGTH = 0.1;

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    drawRoute( ctx, route );    
  } );

  if ( hoverRouteName ) {
    drawRoute( ctx, routes[ hoverRouteName ], true );
  }
}

function drawRoute( ctx, route, debugDrawSolid = false ) {
  // Debug route
  ctx.lineWidth = LANE_WIDTH - 0.1;
  ctx.strokeStyle = debugDrawSolid ? '#777' : '#5555';
  
  ctx.beginPath();
  if ( route.center ) {
    ctx.arc( ...route.center, route.radius, route.startAngle, route.endAngle, route.counterclockwise );
  }
  else {
    ctx.lineTo( ...route.start );
    ctx.lineTo( ...route.end );
  }
  ctx.stroke();

  // Debug direction
  ctx.fillStyle = ctx.strokeStyle = debugDrawSolid ? '#ff0' : '#ff05';
  ctx.lineWidth = 0.05;
  
  const roadLength = Route.getLength( route );
  
  for ( let length = 0; length < roadLength; length += DEBUG_ARROW_LENGTH ) {
    Route.drawAtDistance( ctx, route, length, drawArrow );
  }
}

function drawArrow( ctx, pos, angle, width = DEBUG_ARROW_WIDTH, length = DEBUG_ARROW_LENGTH ) {
  const cos = Math.cos( angle );
  const sin = Math.sin( angle );
  
  ctx.beginPath();
  ctx.moveTo( pos[ 0 ] +  width * sin, pos[ 1 ] -  width * cos );
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.lineTo( pos[ 0 ] -  width * sin, pos[ 1 ] +  width * cos );
  ctx.closePath();
  ctx.fill();
  // ctx.stroke();
}