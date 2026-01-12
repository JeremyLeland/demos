// Goal: Draw outline of simple street layouts

import * as Angle from '../../src/common/Angle.js';
import * as Arc from '../../src/common/Arc.js';

const LANE_WIDTH = 0.25;

const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

const streets = {
  line: {
    start: [ -3, 0 ],
    end: [ 3, 0 ],
    lanes: {
      left: 2,
      right: 3,
    },
  },
  arc: {
    center: [ 3, -1 ],
    radius: 1,
    startAngle: Math.PI / 2,
    endAngle: 0,
    counterclockwise: true,
    lanes: {
      left: 2,
      right: 3,
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

          // TODO: Save this in a different intermediate structure (so we aren't altering streets)
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

  // Turns at intersections
  const streetList = Object.values( streets );

  for ( let i = 0; i < streetList.length - 1; i ++ ) {
    for ( let j = i + 1; j < streetList.length; j ++ ) {
      const one = streetList[ i ];
      const two = streetList[ j ];

      const intersections = Intersections.getIntersections( one, two );

      intersections.forEach( ( intersection, index ) => {

        const angles = [ one, two ].map( e => getHeadingAtPoint( e, intersection ) );

        const turn = Angle.deltaAngle( ...angles );

        const A = turn < 0 ? two : one;
        const B = turn < 0 ? one : two;

        const pairs = [];

        function addPairs( streets, laneDirs ) {
          let radius = 2;

          {
            const fromLanes = streets[ 0 ].routes[ laneDirs[ 0 ][ 0 ] ];
            const toLanes   = streets[ 1 ].routes[ laneDirs[ 0 ][ 1 ] ];

            const numLanes = Math.min( fromLanes.length, toLanes.length );

            for ( let k = 0; k < numLanes; k ++ ) {
              pairs.push( { from: fromLanes[ numLanes - 1 - k ], to: toLanes[ numLanes - 1 - k ], radius: radius, arrowColor: 'lime' } );
              radius -= LANE_WIDTH;
            }
          }

          {
            const fromLanes = streets[ 1 ].routes[ laneDirs[ 1 ][ 0 ] ];
            const toLanes   = streets[ 0 ].routes[ laneDirs[ 1 ][ 1 ] ];

            const numLanes = Math.min( fromLanes.length, toLanes.length );

            for ( let k = 0; k < numLanes; k ++ ) {
              pairs.push( { from: fromLanes[ k + fromLanes.length - numLanes ], to: toLanes[ k + toLanes.length - numLanes ], radius: radius, arrowColor: 'red' } );
              radius -= LANE_WIDTH;
            }
          }
        }

        addPairs( [ B, A ], [ [ 'right', 'right' ], [ 'left', 'left' ] ] );
        addPairs( [ B, A ], [ [ 'left', 'left' ], [ 'right', 'right' ] ] );
        addPairs( [ A, B ], [ [ 'left', 'right' ], [ 'left', 'right' ] ] );
        addPairs( [ A, B ], [ [ 'right', 'left' ], [ 'right', 'left' ] ] );

        // TODO: Somewhere in here, figure out a good radius
        // Instead of doing this with pairs, can we keep increasing radius until edge of arc is at intersection
        // That is, distance( center, intersection ) > radius

        pairs.forEach( pair => {
          const arc = Arc.getArcBetween( routes[ pair.from ], routes[ pair.to ], pair.radius, intersection );

          if ( arc ) {
            arc.arrowColor = pair.arrowColor;
            
            const arcName = `${ pair.from }_TO_${ pair.to }_#${ index }_ARC`;
            routes[ arcName ] = arc;
          }
        } );
      } );
    }
  }

  return routes;
}

// NOTE: This is copied from Arc's helper functions, where's a better place for this to live?
function getHeadingAtPoint( A, point ) {
  if ( A.center ) {
    return Angle.fixAngle( 
      Math.atan2( 
        point[ 1 ] - A.center[ 1 ], 
        point[ 0 ] - A.center[ 0 ],
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



import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';

import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  routes = routesFromStreets( streets );


  ctx.lineWidth = 0.02;
  grid.draw( ctx );


  // TODO: Draw outline of streets based on the routes (and connections between them)
  
  const outline = new Path2D();
  addRouteToPath( routes[ streets.line.routes.right[ streets.line.routes.right.length - 1 ] ], outline, 1 );
  addRouteToPath( routes[ streets.arc.routes.right[ streets.arc.routes.right.length - 1 ] ], outline, 1 );
  addRouteToPath( routes[ streets.arc.routes.left[ streets.arc.routes.left.length - 1 ] ], outline, 1 );
  addRouteToPath( routes[ streets.line.routes.left[ streets.line.routes.left.length - 1 ] ], outline, 1 );
  outline.closePath();

  ctx.fillStyle = 'gray';
  ctx.lineWidth = 0.02;
  ctx.setLineDash( [] );
  ctx.fill( outline );

  const betweenRightLanes = new Path2D();

  addRouteToPath( routes[ streets.line.routes.right[ 0 ] ], betweenRightLanes, 1 );
  addRouteToPath( routes[ streets.arc.routes.right[ 0 ] ], betweenRightLanes, 1 );

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.02;
  ctx.setLineDash( [ 0.1, 0.1 ] );
  ctx.stroke( betweenRightLanes );

  const betweenRightLanes2 = new Path2D();

  addRouteToPath( routes[ streets.line.routes.right[ 1 ] ], betweenRightLanes2, 1 );
  addRouteToPath( routes[ streets.arc.routes.right[ 1 ] ], betweenRightLanes2, 1 );

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.02;
  ctx.setLineDash( [ 0.1, 0.1 ] );
  ctx.stroke( betweenRightLanes2 );
  
  const CENTER_LINE_OFFSET = -0.8;

  const rightCenterLine = new Path2D();
  
  addRouteToPath( routes[ streets.line.routes.right[ 0 ] ], rightCenterLine, CENTER_LINE_OFFSET  );
  addRouteToPath( routes[ streets.arc.routes.right[ 0 ] ], rightCenterLine, CENTER_LINE_OFFSET );
  

  const leftCenterLine = new Path2D();
  
  addRouteToPath( routes[ streets.arc.routes.left[ 0 ] ], leftCenterLine, CENTER_LINE_OFFSET );
  addRouteToPath( routes[ streets.line.routes.left[ 0 ] ], leftCenterLine, CENTER_LINE_OFFSET );

  
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 0.02;
  ctx.setLineDash( [] );
  ctx.stroke( rightCenterLine );
  ctx.stroke( leftCenterLine );

  const betweenLeftLanes = new Path2D();

  addRouteToPath( routes[ streets.arc.routes.left[ 0 ] ], betweenLeftLanes, 1 );
  addRouteToPath( routes[ streets.line.routes.left[ 0 ] ], betweenLeftLanes, 1 );

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.02;
  ctx.setLineDash( [ 0.1, 0.1 ] );
  ctx.stroke( betweenLeftLanes );

  // NOTE: Doted lanes don't line up due to starting at different places
  // Not sure if its noticeable enough to try to do the left lane in reverse
  // Do dotted lanes line up in real life?

  ctx.globalAlpha = 0.5;
  Object.values( routes ).forEach( route => {
    const routeLength = getLength( route );
    
    ctx.fillStyle = route.arrowColor;

    for ( let length = 0; length < routeLength; length += DEBUG_ARROW_LENGTH ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }
  } );
  ctx.globalAlpha = 1;
}

function addRouteToPath( route, path, offsetDir ) {
  if ( route.center ) {
    path.arc( 
      route.center[ 0 ], 
      route.center[ 1 ], 
      route.radius + offsetDir * ( route.counterclockwise ? 1 : -1 ) * LANE_WIDTH / 2,
      route.startAngle, 
      route.endAngle, 
      route.counterclockwise );
  }
  else {
    const v1 = vec2.subtract( [], route.end, route.start );
    vec2.normalize( v1, v1 );

    const normal = [ -v1[ 1 ], v1[ 0 ] ];

    path.lineTo( ...vec2.scaleAndAdd( [], route.start, normal, offsetDir * LANE_WIDTH / 2 ) );
    path.lineTo( ...vec2.scaleAndAdd( [], route.end,   normal, offsetDir * LANE_WIDTH / 2 ) );
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
// Route utils
//
function getLength( route ) {
  if ( route.center ) {
    // TODO: Looks like this could be replaced by Angle.sweepAngle
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
    const angleAtD = Arc.getAngleAtDistance( route, distance );

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

