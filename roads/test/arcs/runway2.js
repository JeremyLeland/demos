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
    radius: 10 + LANE_WIDTH,
    startAngle: 2,
    endAngle: 1,
    counterclockwise: true,
  },
  West: {
    center: [ 4, -6 ],
    radius: 10,
    startAngle: 1,
    endAngle: 2,
    counterclockwise: false,
  },
};

// The ratio of radii seems necessary so that cars are properly parallel to each other
// The absolute radii ideally should seem "balanced" so left turns and right turns start at the same point
//  - how to calculate this? Set up an equation for the start tangent points to make them equal?

const Radii = {
  R1: 1,
  R2: 1,
  R3: 1,
  R4: 1,
};

function updateJoins() {
  const paths = {
    South_West: {
      from: 'South',
      to: 'West',
      radius: Radii.R1,
    },
    East_North: {
      from: 'East',
      to: 'North',
      radius: Radii.R1 + LANE_WIDTH,
    },

    South_East: {
      from: 'South',
      to: 'East',
      radius: Radii.R2 + LANE_WIDTH,
    },  
    West_North: {
      from: 'West',
      to: 'North',
      radius: Radii.R2,
    },

    North_West: {
      from: 'North',
      to: 'West',
      radius: Radii.R3 + LANE_WIDTH,
    },
    East_South: {
      from: 'East',
      to: 'South',
      radius: Radii.R3,
    },
    
    North_East: {
      from: 'North',
      to: 'East',
      radius: Radii.R4,
    },
    West_South: {
      from: 'West',
      to: 'South',
      radius: Radii.R4 + LANE_WIDTH,
    },
  };

  Object.values( paths ).forEach( path => {
    Arc.getArcsBetweenArcs( routes[ path.from ], routes[ path.to ], path.radius ).forEach( ( arc, index ) => {
      routes[ `${ path.from }_TO_${ path.to }_ARC` ] = arc;
    } );
    
    // TODO: _BEFORE and _AFTER can be arcs in this case, the remaining pieces of from and to inside the intersection
    //       In line-arc-line case, these are also pieces of from and to inside intersection
  } );
}
updateJoins();
  
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
// Radius sliders
//

const MIN_POS = '15%', MAX_POS = '70%';

const sliderInfo = {
  R1: {
    left: MIN_POS,
    top: MIN_POS,
  },
  R2: {
    left: MAX_POS,
    top: MIN_POS,
  },
  R3: {
    left: MIN_POS,
    top: MAX_POS,
  },
  R4: {
    left: MAX_POS,
    top: MAX_POS,
  },
};

Object.entries( sliderInfo ).forEach( ( [ item, info ] ) => {
  const slider = document.createElement( 'input' );

  Object.assign( slider.style, {
    position: 'absolute',
    left: info.left,
    top: info.top,
    width: '20%',
  } );

  Object.assign( slider, {
    type: 'range',
    min: 0,
    max: 4,
    step: 0.01,
    value: Radii[ item ],
  } );

  document.body.appendChild( slider );

  slider.addEventListener( 'input', _ => {
    Radii[ item ] = +slider.value;

    updateJoins();

    canvas.redraw();
  } );
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