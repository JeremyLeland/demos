// Multiple circles connected like Olympics logo? 
// (lets us confirm CW and CCW, different lane numbers)
// Also maybe try the different next stuff here

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

import * as Route from '../../src/Route.js';
import * as Arc from '../../src/common/Arc.js';
import * as Intersections from '../../src/common/Intersections.js';

import { vec2 } from '../../lib/gl-matrix.js'

const GridSize = 15;

const grid = new Grid( -GridSize, -GridSize, GridSize, GridSize );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const LANE_WIDTH = 0.5;

const BigRadius = 24;

const streets = {
  Orange: {
    center: [ -BigRadius / 2, -BigRadius / 2 ],
    radius: BigRadius,

    startAngle: -Math.PI,
    endAngle: Math.PI,
    counterclockwise: false,

    // startAngle: 2,
    // endAngle: -1,
    // counterclockwise: true,

    lanes: {
      left: 2,
      right: 3,
    },

    color: 'orange',
  },
  Teal: {
    center: [ BigRadius / 2, BigRadius / 2 ],
    radius: BigRadius,

    startAngle: 0,
    endAngle: Math.PI * 2,
    counterclockwise: false,

    // startAngle: -1,
    // endAngle: 1,
    // counterclockwise: true,

    lanes: {
      left: 3,
      right: 2,
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

linkToSelf( streets.Orange );
linkToSelf( streets.Teal );

// Link a loop street to itself
function linkToSelf( street ) {
  Object.values( street.routes ).forEach( lanes => 
    lanes.forEach( name => {
      const route = routes[ name ];

      route.links ??= [];
      route.links.push( {
        name: name,
        fromDistance: Route.getLength( route ),
        toDistance: 0,
      } );
    } )
  );
}

//
// Intersection
//



doStuff( streets.Orange, streets.Teal );

function doStuff( A, B ) {

  const intersections = Intersections.getArcArcIntersections(
    ...A.center, A.radius, A.startAngle, A.endAngle, A.counterclockwise,
    ...B.center, B.radius, B.startAngle, B.endAngle, B.counterclockwise,
  );

  intersections.forEach( ( intersection, intersection_index ) => {

    const pairs = [];

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
      const outerLeft = [];
      const localPairs = [];

      const baseRadius = 0;

      // Can create all the radii without radius, then add this at the end
      
      e.lanePairs.forEach( lanes => {
        // Left
        const leftFromLanes = e.from.lanes[ lanes.from ];
        const leftToLanes = e.to.lanes[ lanes.to ];

        const leftLanes = Math.min( leftFromLanes, leftToLanes );

        // Left-most lane should always be able to turn left, so work left-to-right
        // For simplicity, each from-lane can only go to one to-lane

        for ( let i = 0; i < leftLanes; i ++ ) {
          const pair = {
            from: e.from.routes[ lanes.from ][ i ],
            to:     e.to.routes[ lanes.to   ][ i ],
            radius: baseRadius - LANE_WIDTH * ( leftLanes - i - 1 ),

            // debug
            arrowColor: 'lime',
          };

          if ( i == leftLanes - 1 ) {
            outerLeft.push( pair );
          }

          localPairs.push( pair );
        }

        // Right
        // This needs to be the opposite values of above, not just switched order
        const rightFromLanes = e.to.lanes[ lanes.to == 'right' ? 'left' : 'right' ];
        const rightToLanes = e.from.lanes[ lanes.from == 'right' ? 'left' : 'right' ];

        const rightLanes = Math.min( rightFromLanes, rightToLanes );

        // Right-most lane should always be able to turn right, so work right-to-left

        for ( let i = 0; i < rightLanes; i ++ ) {
          localPairs.push( {
            from:   e.to.routes[ lanes.to == 'right' ? 'left' : 'right' ][ rightFromLanes - i - 1 ],
            to:   e.from.routes[ lanes.from == 'right' ? 'left' : 'right' ][ rightToLanes - i - 1 ],
            radius: baseRadius - LANE_WIDTH * ( leftLanes + rightLanes - i - 1 + Math.abs( rightFromLanes - rightToLanes ) ),
            // radius: baseRadius - LANE_WIDTH * ( rightLanes - i ),
            // TODO: Is there a way to modify this radius to be better in asymetrical cases? e.g. left 1, right 2
            // This helps somewhat. At least its symmetrical now.

            // debug
            arrowColor: 'red',
          } );
        }
      } );

      let minRadius = Infinity;
      localPairs.forEach( pair => minRadius = Math.min( minRadius, pair.radius ) );

      console.log( `minRadius = ${ minRadius }` );

      // const radius = getRadiusForPairs( ...outerLeft, intersection );
      const radius = Math.max( -minRadius + 1, getRadiusForPairs( ...outerLeft, intersection ) );
      localPairs.forEach( pair => pair.radius += radius );

      pairs.push( ...localPairs );
    } );


    // TODO: Should we try to do this at street level instead of route level?
    //       They won't all line up nicely if there are uneven numbers of lanes
    
    const fromEndAngles = new Map(), toStartAngles = new Map();
    
    pairs.forEach( pair => {
      const fromRoute = routes[ pair.from ];
      const toRoute = routes[ pair.to ];

      const arc = Arc.getArcsBetweenArcs( fromRoute, toRoute, pair.radius ?? 1, intersection );

      // Find min and max start and end angles for each route as we process pairs
      const startPos = [
        arc.center[ 0 ] + Math.cos( arc.startAngle ) * arc.radius,
        arc.center[ 1 ] + Math.sin( arc.startAngle ) * arc.radius,
      ];

      const endPos = [
        arc.center[ 0 ] + Math.cos( arc.endAngle ) * arc.radius,
        arc.center[ 1 ] + Math.sin( arc.endAngle ) * arc.radius,
      ];
      
      const fromEndAngle = Math.atan2( startPos[ 1 ] - fromRoute.center[ 1 ], startPos[ 0 ] - fromRoute.center[ 0 ] );
      const toStartAngle = Math.atan2(   endPos[ 1 ] -   toRoute.center[ 1 ],   endPos[ 0 ] -   toRoute.center[ 0 ] );

      if ( !fromEndAngles.has( pair.from ) ||
            Intersections.isBetweenAngles( fromEndAngle, fromRoute.startAngle, fromEndAngles.get( pair.from ), fromRoute.counterclockwise ) ) {
        fromEndAngles.set( pair.from, fromEndAngle );
      }

      if ( !toStartAngles.has( pair.to ) ||
            Intersections.isBetweenAngles( toStartAngle, toStartAngles.get( pair.to ), toRoute.endAngle, toRoute.counterclockwise ) ) {
        toStartAngles.set( pair.to, toStartAngle );
      }

      // Create route
      arc.arrowColor = pair.arrowColor;

      const arcName = `${ pair.from }_TO_${ pair.to }_#${ intersection_index }_ARC`;
      routes[ arcName ] = arc;

      // Keep track of our connections, and where they connect distance-wise
      fromRoute.links ??= [];
      fromRoute.links.push( {
        name: arcName,
        fromDistance: Route.getDistanceAtAngle( fromRoute, fromEndAngle ),
        toDistance: 0,
      } );

      arc.links ??= [];
      arc.links.push( {
        name: pair.to,
        fromDistance: Route.getLength( arc ),
        toDistance: Route.getDistanceAtAngle( toRoute, toStartAngle ),
      } );
    } );

    console.log( fromEndAngles );
    console.log( toStartAngles );

  } );
}


// NOTE: This runs into issues when the arc between needs to be outside the original arcs due to large radius
//       If the original road is truly that short, then maybe it needs to constrain the radius somehow?

function getRadiusForPairs( A, B, intersection ) {
  let left = 0, right = 10;   // TODO: How to determine appropriate max?

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

  // Linked routes
  ctx.strokeStyle = 'black';

  route.links?.forEach( link => {
    const toRoute = routes[ link.name ];

    // Draw last piece of our route, then first piece of next route
    ctx.beginPath();
    ctx.arc( 
      ...route.center, 
      route.radius, 
      Route.getAngleAtDistance( route, link.fromDistance - 0.5 ),
      Route.getAngleAtDistance( route, link.fromDistance ),
      route.counterclockwise,
    );
    ctx.arc(
      ...toRoute.center,
      toRoute.radius,
      Route.getAngleAtDistance( toRoute, link.toDistance ),
      Route.getAngleAtDistance( toRoute, link.toDistance + 0.5 ),
      toRoute.counterclockwise,
    );
    ctx.stroke();
  } )

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

//
// Input
//

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {
    canvas.translate( -m.dx, -m.dy );

    canvas.redraw();
  }
}

canvas.wheelInput = ( m ) => {
  canvas.zoom( m.x, m.y, 0.1 * Math.sign( m.wheel ) );
  canvas.redraw();
}