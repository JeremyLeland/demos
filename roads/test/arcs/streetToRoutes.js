// Create lanes and all the various turns from streets
// TODO: A 3-lane street intersection and all the joins. Just use R3 = 2 for now, 
// I've wasted way too much time trying to figure out a smart R3

// Though to waste just a bit more time:
// "If your streets are circular arcs with radii A and B and intersection interior angle θ, 
// and the left-turn lane offsets are w (lane + shoulder), then a first-order geometric approximation 
// of the maximum fillet radius is:
// Rmax ≈ ( D − 2w ) / 2 ( 1 − cos⁡θ )

// Where D is the distance between the centers of the two approach arcs measured at the turn origin.
// This is not exact but provides a good upper bound for starting your binary search."

// Is it full of shit? Who knows. It also recommends testing several Rs to see if the resulting fillet
// circles intersect. Stuff to try later.

// For now, focus on the street -> lanes.

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

import * as Route from '../../src/Route.js';
import * as Arc from '../../src/common/Arc.js';
import * as Intersections from '../../src/common/Intersections.js';

import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 30, 30 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const LANE_WIDTH = 1;

const streets = {
  Vertical: {
    center: [ -25, 4 ],
    radius: 30,
    startAngle: 0.3,
    endAngle: -0.3,
    counterclockwise: true,
    
    lanes: {
      left: 3,
      right: 2,
    },
  },
  Horizontal: {
    center: [ 4, -20 ],
    radius: 25,
    startAngle: 1.8,
    endAngle: 1.2,
    counterclockwise: true,

    lanes: {
      left: 2,
      right: 3,
    },
  },

  Vertical2: {
    center: [ -5, 4 ],
    radius: 30,
    startAngle: -0.3,
    endAngle: 0.3,
    counterclockwise: false,
    
    lanes: {
      left: 3,
      right: 2,
    },
  },
  Horizontal2: {
    center: [ 21, -20 ],
    radius: 25,
    startAngle: 1.8,
    endAngle: 1.2,
    counterclockwise: true,

    lanes: {
      left: 2,
      right: 3,
    },
  },

  Vertical3: {
    center: [ -23, 24 ],
    radius: 30,
    startAngle: 0.4,
    endAngle: -0.4,
    counterclockwise: true,
    
    lanes: {
      left: 3,
      right: 2,
    },
  },
  Horizontal3: {
    center: [ 4, -1 ],
    radius: 25,
    startAngle: 1,
    endAngle: 2,
    counterclockwise: false,

    lanes: {
      left: 2,
      right: 3,
    },
  },

  Vertical4: {
    center: [ -8, 24 ],
    radius: 30,
    startAngle: -0.4,
    endAngle: 0.4,
    counterclockwise: false,
    
    lanes: {
      left: 3,
      right: 2,
    },
  },
  Horizontal4: {
    center: [ 21, -1 ],
    radius: 25,
    startAngle: 1,
    endAngle: 2,
    counterclockwise: false,

    lanes: {
      left: 2,
      right: 3,
    },
  },
};

const routes = {}

//
// Streets to routes
//
Object.entries( streets ).forEach( ( [ name, street ] ) => {
  const numLanes = street.lanes.left + street.lanes.right;

  // TODO: don't assume here, generate as needed? (in case there's middle, turning, etc)
  street.routes = { left: [], right: [] };     // link lanes to parent street so we can find them for connecting intersections


  // Create lanes from the center out so that the left-most lane in direction of travel is at index 0

  const ccDir = street.counterclockwise ? 1 : -1;

  if ( street.center ) {
    [ 'left', 'right' ].forEach( laneDir => {

      const laneDirDir = laneDir == 'right' ? 1 : -1;    // needs a better name...

      for ( let i = 0; i < street.lanes[ laneDir ]; i ++ ) {

        // Left lanes are backwards
        const route = {
          center: street.center,
          radius: street.radius + ccDir * laneDirDir * LANE_WIDTH * ( 0.5 + i ),
          startAngle: laneDir == 'left' ? street.endAngle   : street.startAngle,
          endAngle:   laneDir == 'left' ? street.startAngle : street.endAngle,
          counterclockwise: laneDir == 'left' ? !street.counterclockwise : !!street.counterclockwise,

          // parent: name,
        };

        const newName = `${ name }_lane_${ laneDir }_${ i }`;
        routes[ newName ] = route;
        street.routes[ laneDir ].push( newName );
      }
    } );
  }
} );

//
// Intersection
//

doStuff( streets.Horizontal, streets.Vertical );
doStuff( streets.Horizontal2, streets.Vertical2 );
doStuff( streets.Horizontal3, streets.Vertical3 );
doStuff( streets.Horizontal4, streets.Vertical4 );

function doStuff( A, B ) {

  const intersections = Intersections.getArcArcIntersections(
    ...A.center, A.radius, A.startAngle, A.endAngle, A.counterclockwise,
    ...B.center, B.radius, B.startAngle, B.endAngle, B.counterclockwise,
  );

  const intersection = intersections[ 0 ];

  const pairs = [];

  const fromStreet = A.counterclockwise == B.counterclockwise ? B : A;
  const toStreet   = A.counterclockwise == B.counterclockwise ? A : B;

  // TODO: Is this line affected by counterclockwise-ness?
  const fromLeftToRightLanes = Math.min( fromStreet.lanes.left, toStreet.lanes.right );

  // Outermost left turns
  const outerLeftToRight = {
    from: fromStreet.routes.left[ fromLeftToRightLanes - 1 ],
    to: toStreet.routes.right[ fromLeftToRightLanes - 1 ],
  };

  const fromRightToLeftLanes = Math.min( fromStreet.lanes.right, toStreet.lanes.left );

  const outerRightToLeft = {
    from: fromStreet.routes.right[ fromRightToLeftLanes - 1 ],
    to: toStreet.routes.left[ fromRightToLeftLanes - 1 ],
  };

  const radius1 = getRadiusForPairs( outerLeftToRight, outerRightToLeft );
  outerLeftToRight.radius = outerRightToLeft.radius = radius1;

  pairs.push( outerLeftToRight );
  pairs.push( outerRightToLeft );

  // Rest of left turns
  for ( let i = 1; i < fromLeftToRightLanes; i ++ ) {
    const index = fromLeftToRightLanes - 1 - i;

    pairs.push( {
      from: fromStreet.routes.left[ index ],
      to: toStreet.routes.right[ index ],
      radius: radius1 - LANE_WIDTH * i,
    } );
  }

  for ( let i = 1; i < fromRightToLeftLanes; i ++ ) {
    const index = fromRightToLeftLanes - 1 - i;
  
    pairs.push( {
      from: fromStreet.routes.right[ index ],
      to: toStreet.routes.left[ index ],
      radius: radius1 - LANE_WIDTH * i,
    } );
  }

  // Inner right turns
  for ( let i = 0; i < fromRightToLeftLanes; i ++ ) {

    const toIndex = i + fromStreet.lanes.right - toStreet.lanes.left;

    pairs.push( {
      from: toStreet.routes.left[ i ],
      to: fromStreet.routes.right[ toIndex ],
      radius: radius1 - LANE_WIDTH * ( fromLeftToRightLanes + toIndex ),
    } );
  }

  for ( let i = 0; i < fromLeftToRightLanes; i ++ ) {
    const fromIndex = i + toStreet.lanes.right - fromStreet.lanes.left;

    pairs.push( {
      from: toStreet.routes.right[ fromIndex ],
      to: fromStreet.routes.left[ i ],
      radius: radius1 - LANE_WIDTH * ( fromRightToLeftLanes + fromIndex ),
    } );
  }

  pairs.forEach( pair => {
    const arcs = Arc.getArcsBetweenArcs( routes[ pair.from ], routes[ pair.to ], pair.radius ?? 1 );
    const arc = arcs[ 0 ];

    const arcName = `${ pair.from }_TO_${ pair.to }_ARC`;
    routes[ arcName ] = arc;
  } );
}

// NOTE: This runs into issues when the arc between needs to be outside the original arcs due to large radius
//       If the original road is truly that short, then maybe it needs to constrain the radius somehow?

function getRadiusForPairs( A, B ) {
  let left = 0, right = 10;   // TODO: How to determine appropriate max?

  for ( let i = 0; i < 10; i ++ ) {
    const mid = ( left + right ) / 2;

    // console.log( 'trying radius ' + mid );

    const Aarcs = Arc.getArcsBetweenArcs( routes[ A.from ], routes[ A.to ], mid );
    const Aarc = Aarcs[ 0 ];

    if ( !Aarc ) {
      console.error( 'Could not find arc for A pair!' );
      return;
    }

    const Barcs = Arc.getArcsBetweenArcs( routes[ B.from ], routes[ B.to ], mid );
    const Barc = Barcs[ 0 ];

    if ( !Barc ) {
      console.error( 'Could not find arc for B pair!' );
      return;
    }

    const dist = vec2.distance( Aarc.center, Barc.center );
    const rads = Aarc.radius + Barc.radius + LANE_WIDTH;

    if ( dist < rads ) {
      left = mid;
    }
    else {
      right = mid;
    }
  }

  return ( left + right ) / 2;
}


  
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

const DEBUG_ARROW_LENGTH = 0.2;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2; 

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
  ctx.lineWidth = LANE_WIDTH - 0.1; // -0.1 so there's a gap between them for now
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



function fixAngle( a ) {
  const TWO_PI = Math.PI * 2;
  
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