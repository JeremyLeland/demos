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

const grid = new Grid( -20, -20, 20, 20 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const LANE_WIDTH = 1;

const streets = {
  Orange: {
    center: [ -10, -10 ],
    radius: 20,

    startAngle: -1,
    endAngle: 2,
    counterclockwise: false,

    // startAngle: 2,
    // endAngle: -1,
    // counterclockwise: true,

    lanes: {
      left: 1,
      right: 1,
    },

    color: 'orange',
  },
  Teal: {
    center: [ 10, 10 ],
    radius: 20,

    startAngle: 1,
    endAngle: -1,
    counterclockwise: false,

    // startAngle: -1,
    // endAngle: 1,
    // counterclockwise: true,

    lanes: {
      left: 1,
      right: 1,
    },

    color: 'teal',
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

          streetColor: street.color,
          arrowColor: laneDir == 'left' ? 'lime' : 'red',
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

// doStuff( streets.Horizontal, streets.Vertical );
// doStuff( streets.Horizontal2, streets.Vertical2 );
// doStuff( streets.Horizontal3, streets.Vertical3 );
// doStuff( streets.Horizontal4, streets.Vertical4 );



doStuff( streets.Orange, streets.Teal );

function doStuff( A, B ) {

  const intersections = Intersections.getArcArcIntersections(
    ...A.center, A.radius, A.startAngle, A.endAngle, A.counterclockwise,
    ...B.center, B.radius, B.startAngle, B.endAngle, B.counterclockwise,
  );

  // To handle multiple intersections, need a way of generating arcs that won't be confused by multiple intersections
  // That is, use the getArcArcIntersections to find all intersections, but do get Arc some other way?

  intersections.forEach( ( intersection, intersection_index ) => {

    const pairs = [];

    // For sanity sake, make from and to match what we are called with (A and B)
    // TODO: Figure out fromLaneDir and toLaneDir from turn, counterclockwiseness, etc?


    const angles = [ A, B ].map( a =>
      fixAngle( 
        Math.atan2( 
          intersection[ 1 ] - a.center[ 1 ], 
          intersection[ 0 ] - a.center[ 0 ],
        ) + ( a.counterclockwise ? -1 : 1 ) * Math.PI / 2 
      )
    );

    const turn = deltaAngle( ...angles );
    console.log( 'turn = ' + turn );


    const Same = [
      { from: 'left', to: 'left' },
      { from: 'right', to: 'right' },
    ];

    const Opposite = [
      { from: 'left', to: 'right' },
      { from: 'right', to: 'left' },
    ];

    [
      { from: A, to: B, lanePairs: turn < 0 ? Same : Opposite },
      { from: B, to: A, lanePairs: turn > 0 ? Same : Opposite },
    ].forEach( e => {
      // Left
      const outer = e.lanePairs.map( lanes => (
        {
          from: e.from.routes[ lanes.from ][ 0 ],
          to:   e.to.routes[ lanes.to ][ 0 ],
        }
      ) );

      const radius = getRadiusForPairs( ...outer, intersection );
      outer.forEach( pair => pair.radius = radius );
      pairs.push( ...outer );

      // Right
      e.lanePairs.forEach( lanes => {
        pairs.push( {
          from: e.to.routes[ lanes.to ][ 0 ],
          to: e.from.routes[ lanes.from ][ 0 ],
          radius: radius - 1,
        } );
      } );
    } );


    

    // const B_left_A_outer = B_left_A_lanes.map( lanes => (
    //   {
    //     from: B.routes[ lanes.from ][ 0 ],
    //     to:   A.routes[ lanes.to   ][ 0 ],
    //   }
    // ) );
    
    // const B_left_A_radius = getRadiusForPairs( ...B_left_A_outer, intersection );
    // B_left_A_outer[ 0 ].radius = B_left_A_outer[ 1 ].radius = B_left_A_radius;
    // pairs.push( ...B_left_A_outer );

    // const fromStreet = turn > 0 ? A : B;
    // const toStreet   = turn > 0 ? B : A;

    // // TODO: Is this line affected by counterclockwise-ness?
    // const fromLeftToRightLanes = Math.min( fromStreet.lanes.left, toStreet.lanes.right );

    // // Outermost left turns

    // const outerLeftToRight = {
    //   from: fromStreet.routes.left[ fromLeftToRightLanes - 1 ],
    //   to: toStreet.routes.right[ fromLeftToRightLanes - 1 ],
    // };

    // console.log( outerLeftToRight );

    // const fromRightToLeftLanes = Math.min( fromStreet.lanes.right, toStreet.lanes.left );

    // const outerRightToLeft = {
    //   from: fromStreet.routes.right[ fromRightToLeftLanes - 1 ],
    //   to: toStreet.routes.left[ fromRightToLeftLanes - 1 ],
    // };

    // console.log( outerRightToLeft );

    // const radius1 = 4; //getRadiusForPairs( outerLeftToRight, outerRightToLeft, intersection );
    // outerLeftToRight.radius = outerRightToLeft.radius = radius1;

    // pairs.push( outerLeftToRight );
    // pairs.push( outerRightToLeft );

    // // Rest of left turns
    // for ( let i = 1; i < fromLeftToRightLanes; i ++ ) {
    //   const index = fromLeftToRightLanes - 1 - i;

    //   pairs.push( {
    //     from: fromStreet.routes.left[ index ],
    //     to: toStreet.routes.right[ index ],
    //     radius: radius1 - LANE_WIDTH * i,
    //   } );
    // }

    // for ( let i = 1; i < fromRightToLeftLanes; i ++ ) {
    //   const index = fromRightToLeftLanes - 1 - i;
    
    //   pairs.push( {
    //     from: fromStreet.routes.right[ index ],
    //     to: toStreet.routes.left[ index ],
    //     radius: radius1 - LANE_WIDTH * i,
    //   } );
    // }

    // // Inner right turns
    // for ( let i = 0; i < fromRightToLeftLanes; i ++ ) {

    //   const toIndex = i + fromStreet.lanes.right - toStreet.lanes.left;

    //   pairs.push( {
    //     from: toStreet.routes.left[ i ],
    //     to: fromStreet.routes.right[ toIndex ],
    //     radius: radius1 - LANE_WIDTH * ( fromLeftToRightLanes + toIndex ),
    //   } );
    // }

    // for ( let i = 0; i < fromLeftToRightLanes; i ++ ) {
    //   const fromIndex = i + toStreet.lanes.right - fromStreet.lanes.left;

    //   pairs.push( {
    //     from: toStreet.routes.right[ fromIndex ],
    //     to: fromStreet.routes.left[ i ],
    //     radius: radius1 - LANE_WIDTH * ( fromRightToLeftLanes + fromIndex ),
    //   } );
    // }

    pairs.forEach( pair => {
      const arc = Arc.getArcsBetweenArcs( routes[ pair.from ], routes[ pair.to ], pair.radius ?? 1, intersection );

      // console.log( arcs );

      // const arc = arcs[ 0 ];

      const arcName = `${ pair.from }_TO_${ pair.to }_#${ intersection_index }_ARC`;
      routes[ arcName ] = arc;
    } );

    // console.log( pairs );
  } );
}


// NOTE: This runs into issues when the arc between needs to be outside the original arcs due to large radius
//       If the original road is truly that short, then maybe it needs to constrain the radius somehow?

function getRadiusForPairs( A, B, intersection ) {
  let left = 0, right = 10;   // TODO: How to determine appropriate max?


  // TODO: Instead of generating arc, can I use my bisector code here?


      // const v1 = vec2.subtract( [], intersection, circles[ 0 ].center );
      // const v2 = vec2.subtract( [], intersection, circles[ 1 ].center );
      // vec2.normalize( v1, v1 );
      // vec2.normalize( v2, v2 );

      // const bisector = vec2.add( [], v1, v2 );
      // vec2.normalize( bisector, bisector );

      // const center = vec2.scaleAndAdd( [], intersection, bisector, offset );
      // const radius = vec2.distance( center, circles[ 0 ].center ) - circles[ 0 ].radius;
      // const gap = offset - radius;



  for ( let i = 0; i < 10; i ++ ) {
    const mid = ( left + right ) / 2;

    // console.log( 'trying radius ' + mid );

    const Aarc = Arc.getArcsBetweenArcs( routes[ A.from ], routes[ A.to ], mid, intersection );
    
    if ( !Aarc ) {
      console.error( 'Could not find arc for A pair!' );
      return;
    }

    const Barc = Arc.getArcsBetweenArcs( routes[ B.from ], routes[ B.to ], mid, intersection );
    
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

  ctx.globalAlpha = debugDrawSolid ? 1.0 : 0.5;

  // Debug route
  ctx.lineWidth = LANE_WIDTH - 0.1; // -0.1 so there's a gap between them for now
  ctx.strokeStyle = route.streetColor ?? 'gray'; //( debugDrawSolid ? '#777' : '#5555' );
  
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
  ctx.fillStyle = ctx.strokeStyle = route.arrowColor ?? 'yellow';//( debugDrawSolid ? '#ff0' : '#ff05' );
  ctx.lineWidth = 0.05;
  
  const roadLength = Route.getLength( route );
  
  for ( let length = 0; length < roadLength; length += DEBUG_ARROW_LENGTH ) {
    Route.drawAtDistance( ctx, route, length, drawArrow );
  }

  ctx.globalAlpha = 1;
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