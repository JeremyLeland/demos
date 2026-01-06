// Goal: Click and drag to create streets. 
// Make routes, then make appropriate turning lanes between intersecting streets.

// TODO:
// - Get rid of control points, just resize based on hover and figure out new arc on fly
// - Don't alter streets -- these are what we will load, routes will be result. 
//   - Routes can reference street name to get that static info
// - Drawing
//   - outline of streets by following right-most routes!
//   - lanes between routes!

const LANE_WIDTH = 0.25;

const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

// TODO: We might not need to persist this. 
// Since we are already detecting when we are hovering over streets,
// we can see when we are near u = 0 or u = 1 and treat drags as moving end points
// If not near end points, treat drag as moving a control point (or the whole street, depending on modifer keys?)
// May just call circleFromThreePoints as part of these drags, rather than saving this?
const streets = {
  A: Object.assign( {
    lanes: {
      left: 2,
      right: 2,
    },
  }, arcFromThreePoints( [ -4, 1 ], [ 0, 0 ], [ 4, 1 ] ) ),
  B: Object.assign( {
    lanes: {
      left: 2,
      right: 2,
    },
  }, arcFromThreePoints( [ 1, -4 ], [ 0, 0 ], [ 1, 4 ] ) ),
  C: {
    start: [ -4, 4 ],
    end: [ -1, 4 ],
    lanes: {
      left: 1,
      right: 1,
    },
  },
};

// TODO: Make these part of some sort of level object separate from controlPoints?
//       Combine streetsFrom and routesFrom function to one function that returns level from control points?
let routes = {};

// NOTE: This modifies streets -- eventually combine with above to return level
// TODO: Why does this need to modify streets? Can routes just keep reference to parent? Why does street need to know routes?
//       Seems like we could search all routes with parent == 'name' if we need to find them...
function routesFromStreets( streets ) {
  const routes = {};

  Object.entries( streets ).forEach( ( [ name, street ] ) => {
    const numLanes = street.lanes.left + street.lanes.right;

    // TODO: don't assume here, generate as needed? (in case there's middle, turning, etc)
    street.routes = { left: [], right: [] };     // link lanes to parent street so we can find them for connecting intersections


    // Create lanes from the center out so that the left-most lane in direction of travel is at index 0
    const ccDir = street.counterclockwise ? 1 : -1;

    Object.keys( street.lanes ).forEach( laneDir => {

      const laneDirDir = laneDir == 'right' ? 1 : -1;    // needs a better name...

      for ( let i = 0; i < street.lanes[ laneDir ]; i ++ ) {

        const laneOffset = ccDir * laneDirDir * LANE_WIDTH * ( 0.5 + i );

        // TODO: Less duplication below

        if ( street.center ) {
          // Left lanes are backwards
          const route = {
            center: street.center,
            radius: street.radius + laneOffset,
            startAngle: laneDir == 'left' ? street.endAngle   : street.startAngle,
            endAngle:   laneDir == 'left' ? street.startAngle : street.endAngle,
            counterclockwise: laneDir == 'left' ? !street.counterclockwise : !!street.counterclockwise,

            // TODO: Can we save parent name and lane index here, rather than altering original street?
            parent: name,

            streetColor: street.color,
            arrowColor: laneDir == 'left' ? 'green' : 'darkred',
          };

          const routeName = `${ name }_lane_${ laneDir }_${ i }`;
          routes[ routeName ] = route;
          street.routes[ laneDir ].push( routeName );
        }
        else {

          // TODO: Don't recalculate this every loop?
          const v1 = vec2.subtract( [], street.end, street.start );
          vec2.normalize( v1, v1 );

          const normal = [ v1[ 1 ], -v1[ 0 ] ];

          // Left lanes are backwards
          const A = vec2.scaleAndAdd( [], street.start, normal, laneOffset );
          const B = vec2.scaleAndAdd( [], street.end,   normal, laneOffset );
          const route = {
            start: laneDir == 'left' ? B : A,
            end:   laneDir == 'left' ? A : B,

            streetColor: street.color,
            arrowColor: laneDir == 'left' ? 'green' : 'darkred',
            // parent: name,
          };

          const routeName = `${ name }_lane_${ laneDir }_${ i }`;
          routes[ routeName ] = route;
          street.routes[ laneDir ].push( routeName );
        }
      }
    } );
  } );

  // TODO: Turns at intersections
  const streetList = Object.values( streets );

  streetList.forEach( A => {
    streetList.forEach( B => {
      if ( A != B ) {
        const intersections = getIntersections( A, B );

        intersections.forEach( ( intersection, index ) => {
        //   const arc = getArcBetween( A, B, 1, intersection, ctx );

        //   if ( arc ) {
        //     drawStreet( ctx, arc );
        //   }
          const pairs = [];
          
          const angles = [ A, B ].map( a => getAngle( a, intersection ) );
      
          const turn = deltaAngle( ...angles );
          // console.log( 'turn = ' + turn );
      
      
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
      
            // console.log( `minRadius = ${ minRadius }` );
      
            // const radius = getRadiusForPairs( ...outerLeft, intersection );
            const radius = Math.max( -minRadius + 1, getRadiusForPairs( ...outerLeft, intersection, routes ) );
            // const radius = 1;

            // console.log( 'Radius for pairs: ' + radius );

            localPairs.forEach( pair => pair.radius += radius );
      
            pairs.push( ...localPairs );
          } );
      
      
          // TODO: Eventually use this for figuring out intersection bounds
          // TODO: This should be saved as distances, not angles, so it can work with lines too
          //       Arcs can convert distance to angles later as needed
          // const fromEndAngles = new Map(), toStartAngles = new Map();
          
          pairs.forEach( pair => {
            const fromRoute = routes[ pair.from ];
            const toRoute = routes[ pair.to ];
      
            const arc = getArcBetween( fromRoute, toRoute, pair.radius ?? 1, intersection );

            if ( arc ) {
              // Find min and max start and end angles for each route as we process pairs
              const startPos = [
                arc.center[ 0 ] + Math.cos( arc.startAngle ) * arc.radius,
                arc.center[ 1 ] + Math.sin( arc.startAngle ) * arc.radius,
              ];
        
              const endPos = [
                arc.center[ 0 ] + Math.cos( arc.endAngle ) * arc.radius,
                arc.center[ 1 ] + Math.sin( arc.endAngle ) * arc.radius,
              ];
              
              const fromDistance = fromRoute.center ? getDistanceAtAngle(
                Math.atan2( startPos[ 1 ] - fromRoute.center[ 1 ], startPos[ 0 ] - fromRoute.center[ 0 ] )
              ) : vec2.distance( fromRoute.start, startPos );

              const toDistance = toRoute.center ? getDistanceAtAngle(
                Math.atan2( endPos[ 1 ] - toRoute.center[ 1 ], endPos[ 0 ] - toRoute.center[ 0 ] )
              ) : vec2.distance( toRoute.start, endPos );

        
              // if ( !fromEndAngles.has( pair.from ) ||
              //       isBetweenAngles( fromEndAngle, fromRoute.startAngle, fromEndAngles.get( pair.from ), fromRoute.counterclockwise ) ) {
              //   fromEndAngles.set( pair.from, fromEndAngle );
              // }
        
              // if ( !toStartAngles.has( pair.to ) ||
              //       isBetweenAngles( toStartAngle, toStartAngles.get( pair.to ), toRoute.endAngle, toRoute.counterclockwise ) ) {
              //   toStartAngles.set( pair.to, toStartAngle );
              // }
        
              // Create route
              arc.arrowColor = pair.arrowColor;
        
              const arcName = `${ pair.from }_TO_${ pair.to }_#${ index }_ARC`;
              routes[ arcName ] = arc;
        
              // Keep track of our connections, and where they connect distance-wise
              fromRoute.links ??= [];
              fromRoute.links.push( {
                name: arcName,
                fromDistance: fromDistance,
                toDistance: 0,
              } );
        
              routes[ arcName ].links ??= [];
              routes[ arcName ].links.push( {
                name: pair.to,
                fromDistance: getLength( routes[ arcName ] ),
                toDistance: toDistance,
              } );
            }
          } );
        } );
      }
    } );
  } );

  // console.log( 'Routes:' );
  // console.log( routes );

  return routes;
}


import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';

import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  // Streets
  Object.entries( streets ).forEach( ( [ name, street ] ) => {
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = name == hover?.name ? 'darkgray' : 'gray';

    if ( street.center ) {
      drawArc( ctx, street );
    }
    else {
      drawLine( ctx, street.start, street.end );
    }
  } );

  // Routes
  routes = routesFromStreets( streets );

  Object.values( routes ).forEach( route => {
    const routeLength = getLength( route );
    
    ctx.fillStyle = route.arrowColor;

    for ( let length = 0; length < routeLength; length += DEBUG_ARROW_LENGTH ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }
  } );

  // TODO: Draw outline of streets based on the routes (and connections between them)
  // TODO: Ignore parts of street with no more connections? (this might make joins nicer)

  // Control points
  const controlColors = {
    start: 'lime',
    middle: 'yellow',
    end: 'red',
  };

  if ( hover ) {
    ctx.fillStyle = controlColors[ hover.action ];
    drawPoint( ctx, hover.point, 0.1 );
  }
}

function getPointAtAngle( arc, angle ) {
  return [
    arc.center[ 0 ] + Math.cos( angle ) * arc.radius, 
    arc.center[ 1 ] + Math.sin( angle ) * arc.radius,
  ];
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


// TODO: Can we find different radiuses for each pair member? 
// (depending on angles involved, radius can put some curves much further away than needed)

function getRadiusForPairs( A, B, intersection, routes ) {
  let left = 0, right = 10;   // TODO: How to determine appropriate max?

  for ( let i = 0; i < 10; i ++ ) {
    const mid = ( left + right ) / 2;

    // console.log( 'trying radius ' + mid );

    const Aarc = getArcBetween( routes[ A.from ], routes[ A.to ], mid, intersection );
    
    if ( !Aarc ) {
      // console.log( 'Could not find arc for A pair!' );
      right = mid;
      continue;
    }

    const Barc = getArcBetween( routes[ B.from ], routes[ B.to ], mid, intersection );
    
    if ( !Barc ) {
      // console.log( 'Could not find arc for B pair!' );
      right = mid;
      continue;
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
// Getting arc between routes
//

function getArcBetween( A, B, radius, intersection, ctx ) {
  const angleA = getAngle( A, intersection );
  const angleB = getAngle( B, intersection );
  
  // TODO: Should we pass some combination of A/B.counterclockwise into deltaAngle to simplify this?
  const turn = deltaAngle( angleA, angleB );

  const s0 = ( turn < 0 ? 1 : -1 ) * ( A.counterclockwise ? -1 : 1 );

  // If turn is left and we're counter clockwise, then must be coming from inside
  // If turn is left and we're clockwise, then must be coming from outside
  // If turn is right and we're counter clockwise, then must be coming from outside
  // If turn is right and we're clockwise, then must be coming from inside

  const s1 = ( turn > 0 ? 1 : -1 ) * ( B.counterclockwise ? 1 : -1 );
  
  const closestToLine = {
    point: null,
    dist: Infinity,
  };

  const offsetA = getOffset( A, s0 * radius );
  const offsetB = getOffset( B, s1 * radius );

  const offsetIntersections = getIntersections( offsetA, offsetB );

  offsetIntersections.forEach( testIntersection => {
    const angleOffsetA = getAngle( offsetA, testIntersection );
    const angleOffsetB = getAngle( offsetB, testIntersection );
    const turnOffset = deltaAngle( angleOffsetA, angleOffsetB );

    if ( Math.sign( turn ) == Math.sign( turnOffset ) ) {
      const startDist = A.center ?
        deltaAngle( 
          A.startAngle,
          Math.atan2( 
            testIntersection[ 1 ] - A.center[ 1 ],
            testIntersection[ 0 ] - A.center[ 0 ], 
          ),
          A.counterclockwise,
        ) :
        vec2.distance( testIntersection, A.start );
              
      if ( startDist < closestToLine.dist ) {
        closestToLine.point = testIntersection;
        closestToLine.dist = startDist;
      }
    }
  } );

  if ( closestToLine.point ) {
    const tangentA = getTangent( A, closestToLine.point, s0 * radius );
    const tangentB = getTangent( B, closestToLine.point, s1 * radius );

    const tangentVectorA = vec2.subtract( [], tangentA, closestToLine.point );
    const tangentVectorB = vec2.subtract( [], tangentB, closestToLine.point );

    return {
      center: closestToLine.point,
      radius: radius,
      startAngle: Math.atan2( tangentVectorA[ 1 ], tangentVectorA[ 0 ] ),
      endAngle: Math.atan2( tangentVectorB[ 1 ], tangentVectorB[ 0 ] ),
      counterclockwise: turn < 0,
    }
  }
}

function getAngle( A, intersection ) {
  if ( A.center ) {
    return fixAngle( 
      Math.atan2( 
        intersection[ 1 ] - A.center[ 1 ], 
        intersection[ 0 ] - A.center[ 0 ],
      ) + ( A.counterclockwise ? -1 : 1 ) * Math.PI / 2 
    );
  }
  else {
    return Math.atan2( 
      A.end[ 1 ] - A.start[ 1 ], 
      A.end[ 0 ] - A.start[ 0 ],
    );
  }
}

function getOffset( A, offsetDist ) {
  if ( A.center ) {
    const offset = structuredClone( A );
    offset.radius += offsetDist;
    return offset;
  }
  else {
    const v1 = vec2.subtract( [], A.end, A.start );
    vec2.normalize( v1, v1 );
    
    return {
      start: [
        A.start[ 0 ] + v1[ 1 ] * offsetDist,
        A.start[ 1 ] - v1[ 0 ] * offsetDist,
      ],
      end: [
        A.end[ 0 ] + v1[ 1 ] * offsetDist,
        A.end[ 1 ] - v1[ 0 ] * offsetDist,
      ],
    };
  }
}

function getTangent( A, point, radius ) {
  if ( A.center ) {
    return vec2.scaleAndAdd( [],
      A.center, 
      vec2.subtract( [], point, A.center ),
      A.radius / ( A.radius + radius )
    );
  }
  else {
    const v1 = vec2.subtract( [], A.end, A.start );
    vec2.normalize( v1, v1 );

    return [
      point[ 0 ] - v1[ 1 ] * radius,
      point[ 1 ] + v1[ 0 ] * radius,
    ];
  }    
}

function getIntersections( A, B ) {
  if ( A.center && B.center ) {
    return Intersections.getArcArcIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
    );
  }
  else if ( A.center ) {
    return Intersections.getArcLineIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
  else if ( B.center ) {
    return Intersections.getArcLineIntersections(
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
    );
  }
  else {
    return Intersections.getLineLineIntersections(
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
}

//
// Arc utils
//

function arcFromThreePoints( p1, p2, p3 ) {
  const [ x1, y1 ] = p1;
  const [ x2, y2 ] = p2;
  const [ x3, y3 ] = p3;

  // Check for duplicate points
  if ( ( x1 === x2 && y1 === y2 ) ||
       ( x2 === x3 && y2 === y3 ) ||
       ( x3 === x1 && y3 === y1 ) ) {
    throw new Error( "Duplicate points" );
  }

  const D = 2 * (
    x1 * ( y2 - y3 ) +
    x2 * ( y3 - y1 ) +
    x3 * ( y1 - y2 )
  );

  // Collinear (or nearly collinear)
  if ( Math.abs(D) < 1e-12 ) {
    throw new Error( "Points are collinear" );
  }

  const x1sq = x1 * x1 + y1 * y1;
  const x2sq = x2 * x2 + y2 * y2;
  const x3sq = x3 * x3 + y3 * y3;

  const cx = (
      x1sq * ( y2 - y3 ) +
      x2sq * ( y3 - y1 ) +
      x3sq * ( y1 - y2 )
  ) / D;

  const cy = (
      x1sq * ( x3 - x2 ) +
      x2sq * ( x1 - x3 ) +
      x3sq * ( x2 - x1 )
  ) / D;

  const r = Math.hypot( cx - x1, cy - y1 );

  const startAngle  = Math.atan2( y1 - cy, x1 - cx );
  const middleAngle = Math.atan2( y2 - cy, x2 - cx );
  const endAngle    = Math.atan2( y3 - cy, x3 - cx );

  return { 
    center: [ cx, cy ], 
    radius: r,
    startAngle: startAngle,
    endAngle: endAngle,
    counterclockwise: !isBetweenAngles( middleAngle, startAngle, endAngle ),
  };
}

function getAngleAtDistance( arc, distance ) {
  return arc.startAngle + ( distance / arc.radius ) * ( arc.counterclockwise ? -1 : 1 );
}

function getDistanceAtAngle( arc, angle ) {
  return ( angle - arc.startAngle ) * arc.radius * ( arc.counterclockwise ? -1 : 1 );
}

//
// Draw utils
//

function drawArc( ctx, arc ) {
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();
}

function drawLine( ctx, start, end ) {
  ctx.beginPath();
  ctx.moveTo( ...start );
  ctx.lineTo( ...end );
  ctx.stroke();
}

function drawPoint( ctx, p, radius = 0.05 ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], radius, 0, Math.PI * 2 );
  ctx.fill();
}

//
// Angle utils
//
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

function deltaAngle( a, b, counterclockwise = false ) {
  return counterclockwise ? fixAngle( a - b ) : fixAngle( b - a );
}

function isBetweenAngles( testAngle, startAngle, endAngle, counterclockwise = false ) {
  // Normalize angles
  const test = fixAngle( testAngle );
  const start = fixAngle( counterclockwise ? endAngle : startAngle );
  const end = fixAngle( counterclockwise ? startAngle : endAngle );

  // Handle wrap-around
  if ( start < end ) {
    // return test >= start && test <= end;
    return test > start && test < end;
  }
  else {
    // return test >= start || test <= end;
    return test > start || test < end;
  }
}

//
// Route utils
//
function getLength( route ) {
  if ( route.center ) {
    let sweepAngle = route.endAngle - route.startAngle;

    if ( !route.counterclockwise && sweepAngle < 0 ) {
      sweepAngle += 2 * Math.PI;
    }
    else if ( route.counterclockwise && sweepAngle > 0 ) {
      sweepAngle -= 2 * Math.PI;
    }

    return Math.abs( sweepAngle * route.radius );
  }
  else {
    return vec2.distance( route.start, route.end );
  }
}

function drawAtDistance( ctx, route, distance, drawFunc ) {
  let pos, angle;
 
  if ( route.center ) {
    const angleAtD = getAngleAtDistance( route, distance );

    pos = vec2.scaleAndAdd( [], route.center, [ Math.cos( angleAtD ), Math.sin( angleAtD ) ], route.radius );
    angle = angleAtD + ( route.counterclockwise ? -1 : 1 ) * Math.PI / 2;
  }
  else {
    const lineVec = vec2.subtract( [], route.end, route.start );
    vec2.normalize( lineVec, lineVec );

    pos = vec2.scaleAndAdd( [], route.start, lineVec, distance );
    angle = Math.atan2( lineVec[ 1 ], lineVec[ 0 ] );
  }

  drawFunc( ctx, pos, angle );
}

//
// Input
//

// TODO:
//  - Hover streets
//    - Delete streets (right click)
//    - Move streets (w/left click? vs insert)
//  - Key to snap to grid/whole numbers (maybe shift?)

let hover;
let nameIndex = 0;

canvas.pointerDown = ( m ) => {
  if ( m.buttons == 1 ) {
    // if ( hover ) {

    // }
    
    // if ( !selected ) {
    //   const newStreet = {
    //     start: [ m.x, m.y ],
    //     end: [ m.x, m.y ],
    //   };
      
    //   selected = newStreet.end;
      
    //   controlPoints[ `street_${ nameIndex ++ }` ] = newStreet;
    // }
  }
  else if ( m.buttons == 2 ) {
    if ( hover ) {
      delete streets[ hover.name ];
    }
  }

  canvas.redraw();
}

canvas.pointerUp = ( m ) => {
  // selected = null;
}

canvas.pointerMove = ( m ) => {
  // Hover if no buttons pressed
  if ( m.buttons == 0 ) {
    hover = hoverUnderCursor( m.x, m.y );

    canvas.redraw();
  }

  // Drag selected point if left button pressed
  else if ( m.buttons == 1 ) {
    if ( hover ) {
      const street = streets[ hover.name ];
      const moveVector = [ m.dx, m.dy ];

      if ( street.center ) {
        const points = {
          start:  hover.action == 'start'  ? hover.point : getPointAtAngle( street, street.startAngle ),
          middle: hover.action == 'middle' ? hover.point : getPointAtAngle( street, street.startAngle + deltaAngle( street.startAngle, street.endAngle ) / 2 ),
          end:    hover.action == 'end'    ? hover.point : getPointAtAngle( street, street.endAngle ),
        };

        // NOTE: Via side effect, this is also moving the hover point
        vec2.add( points[ hover.action ], points[ hover.action ], moveVector );

        Object.assign( street, arcFromThreePoints( points.start, points.middle, points.end ) );
      }
      else {
        vec2.add( hover.point, hover.point, moveVector );

        // If dragging a middle point, turn street into arc
        if ( hover.action == 'middle' ) {
          Object.assign( street, arcFromThreePoints( street.start, hover.point, street.end ) );
          delete street.start;
          delete street.end;
        }
        else {
          vec2.add( street[ hover.action ], street[ hover.action ], moveVector );
        }
      }
      
      canvas.redraw();
    }
  }

  // Pan if middle button pressed
  else if ( m.buttons == 4 ) {
    canvas.translate( -m.dx, -m.dy );
    canvas.redraw();
  }
}

canvas.wheelInput = ( m ) => {
  canvas.zoom( m.x, m.y, 0.1 * Math.sign( m.wheel ) );
  canvas.redraw();
}


function hoverUnderCursor( x, y ) {
  // TODO: what if multiple streets overlap here? This isn't actually closest at moment, it's just latest.

  let closestHover;

  Object.entries( streets ).forEach( ( [ name, street ] ) => {

    // TODO: Here's a trade-off of defining lanes as being to one side or other of center point
    //       Since the point defining the street may not be the actual center, determining whether we are overlapping is harder
    // Should we look at routes instead of streets? Each route could say which street it is part of...

    const HOVER_DIST = LANE_WIDTH * ( street.lanes.left + street.lanes.right ) / 2;   // wrong, but close-ish for now
    const ENDPOINT_DIST = 0.4;

    if ( street.center ) {
      const dist = vec2.distance( [ x, y ], street.center );
      const angle = Math.atan2( y - street.center[ 1 ], x - street.center[ 0 ] );

      if ( ( Math.abs( dist - street.radius ) < HOVER_DIST ) && isBetweenAngles( angle, street.startAngle, street.endAngle, street.counterclockwise ) ) {
        const nearStart = Math.abs( deltaAngle( angle, street.startAngle ) * street.radius ) < ENDPOINT_DIST;
        const nearEnd   = Math.abs( deltaAngle( angle, street.endAngle   ) * street.radius ) < ENDPOINT_DIST;

        closestHover = {
          name: name,
          action: nearStart ? 'start' : nearEnd ? 'end' : 'middle',
          point: getPointAtAngle( street, angle ),
        };
      }
    }
    else {
      const AB = vec2.subtract( [], street.end, street.start );
      const AP = vec2.subtract( [], [ x, y ], street.start );
      const u = vec2.dot( AP, AB ) / vec2.sqrLen( AB );
      const t = Math.max( 0, Math.min( 1, u ) );

      const closest = vec2.scaleAndAdd( [], street.start, AB, t );
      const dist = vec2.distance( [ x, y ], closest );

      if ( dist < HOVER_DIST ) {
        const nearStart = vec2.distance( street.start, [ x, y ] ) < ENDPOINT_DIST;
        const nearEnd   = vec2.distance( street.end,   [ x, y ] ) < ENDPOINT_DIST;

        closestHover = {
          name: name,
          action: nearStart ? 'start' : nearEnd ? 'end' : 'middle',
          point: closest,
        };
      }
    }
  } );

  return closestHover;
}