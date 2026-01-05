// Goal: Click and drag to create streets. 
// Make routes, then make appropriate turning lanes between intersecting streets.

// NOW: Trying to support lines as well as arcs, so I can insert lines (and make them arcs after insertion)

const LANE_WIDTH = 0.25;

const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

const controlPoints = {
  A: {
    start: [ -4, 1 ],
    // middle: [ 0, 0.9 ],
    end: [ 4, 1 ],
  },
  B: {
    start: [ 1, -4 ],
    middle: [ 0.9, 0 ],
    end: [ 1, 4 ],
  },
};



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
  const streets = {};

  Object.entries( controlPoints ).forEach( ( [ name, points ] ) => {
    streets[ name ] = points.middle ? arcFromThreePoints( points.start, points.middle, points.end ) : structuredClone( points );

    // TODO: Get this from controlPoints (which should be called something else)
    streets[ name ].lanes = { left: 2, right: 2 };
  } );

  // console.log( 'Streets:' );
  // console.log( streets );

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'gray';
  Object.values( streets ).forEach( street => {
    if ( street.center ) {
      drawArc( ctx, street );
    }
    else {
      drawLine( ctx, street.start, street.end );
    }
  } );

  // Routes
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

            streetColor: street.color,
            arrowColor: laneDir == 'left' ? 'green' : 'darkred',
            // parent: name,
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

  Object.values( routes ).forEach( route => {
    const routeLength = getLength( route );
    
    ctx.fillStyle = route.arrowColor;

    for ( let length = 0; length < routeLength; length += DEBUG_ARROW_LENGTH ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }
  } );

  // Control points
  const controlColors = {
    start: 'lime',
    middle: 'yellow',
    end: 'red',
  };

  Object.values( controlPoints ).forEach( points => {
    Object.entries( points ).forEach( ( [ name, point ] ) => {
      ctx.fillStyle = controlColors[ name ];
      drawPoint( ctx, point );
    } );
  } );
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

function drawPoint( ctx, p ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], 0.05, 0, Math.PI * 2 );
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

let selected;
let nameIndex = 0;

canvas.pointerDown = ( m ) => {
  if ( m.buttons == 1 ) {
    selected = closestPoint( m.x, m.y );
    
    if ( !selected ) {
      const newStreet = {
        start: [ m.x, m.y ],
        end: [ m.x, m.y ],
      };
      
      selected = newStreet.end;
      
      controlPoints[ `street_${ nameIndex ++ }` ] = newStreet;
    }
  }
}

canvas.pointerUp = ( m ) => {
  selected = null;
}

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {
    if ( selected ) {
      selected[ 0 ] += m.dx;
      selected[ 1 ] += m.dy;
      
      canvas.redraw();
    }
  }
  else if ( m.buttons == 4 ) {
    canvas.translate( -m.dx, -m.dy );
    canvas.redraw();
  }
}

canvas.wheelInput = ( m ) => {
  canvas.zoom( m.x, m.y, 0.1 * Math.sign( m.wheel ) );
  canvas.redraw();
}


function closestPoint( x, y ) {
  let closest, closestDist = Infinity;

  Object.values( controlPoints ).forEach( points => {
    Object.values( points ).forEach( p => {
      const dist = Math.hypot( x - p[ 0 ], y - p[ 1 ] );

      if ( dist < 1 && dist < closestDist ) {
        closest = p;
        closestDist = dist;
      }
    } );
  } );

  return closest;
}