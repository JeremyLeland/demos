// Goal: Click and drag to create streets. 
// Make routes, then make appropriate turning lanes between intersecting streets.

const LANE_WIDTH = 0.25;

const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

const controlPoints = {
  A: {
    start: [ -3, 1 ],
    middle: [ 0, -2 ],
    end: [ 3, 1 ],
  },
  B: {
    start: [ 1, -3 ],
    middle: [ -1, 0 ],
    end: [ 1, 3 ],
  },
};



import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

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
    streets[ name ] = arcFromThreePoints( points.start, points.middle, points.end );

    // TODO: Get this from controlPoints (which should be called something else)
    streets[ name ].lanes = { left: 2, right: 1 };
  } );

  console.log( 'Streets:' );
  console.log( streets );

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'gray';
  Object.values( streets ).forEach( street => {
    drawArc( ctx, street );
  } );

  // Routes
  const routes = {};

  Object.entries( streets ).forEach( ( [ name, street ] ) => {
    const numLanes = street.lanes.left + street.lanes.right;

    // TODO: don't assume here, generate as needed? (in case there's middle, turning, etc)
    street.routes = { left: [], right: [] };     // link lanes to parent street so we can find them for connecting intersections


    // Create lanes from the center out so that the left-most lane in direction of travel is at index 0
    const ccDir = street.counterclockwise ? 1 : -1;

    if ( street.center ) {
      Object.keys( street.lanes ).forEach( laneDir => {

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

          const routeName = `${ name }_lane_${ laneDir }_${ i }`;
          routes[ routeName ] = route;
          street.routes[ laneDir ].push( routeName );
        }
      } );
    }
  } );

  // TODO: Turns at intersections
  const streetList = Object.values( streets );

  streetList.forEach( A => {
    streetList.forEach( B => {
      if ( A != B ) {
        // const intersections = getIntersections( A, B );

        // intersections.forEach( ( intersection, index ) => {
        //   const arc = getArcBetween( A, B, 1, intersection, ctx );

        //   if ( arc ) {
        //     drawStreet( ctx, arc );
        //   }
        // } );
      }
    } );
  } );

  console.log( 'Routes:' );
  console.log( routes );

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

let selected;

canvas.pointerDown = ( m ) => {
  selected = closestPoint( m.x, m.y );
}

canvas.pointerUp = ( m ) => {
  selected = null;
}

canvas.pointerMove = ( m ) => {
  if ( selected ) {
    selected[ 0 ] += m.dx;
    selected[ 1 ] += m.dy;
    
    canvas.redraw();
  }
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