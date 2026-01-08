// Goal: Click and drag to create streets. 
// Make routes, then make appropriate turning lanes between intersecting streets.

// TODO:
// - Need to be able to create arcs > Math.PI -- why does it keep flipping?
// - Don't alter streets -- these are what we will load, routes will be result. 
//   - Routes can reference street name to get that static info
// - Drawing
//   - outline of streets by following right-most routes!
//   - lanes between routes!

import * as Angle from '../../src/common/Angle.js';
import * as Arc from '../../src/common/Arc.js';

const LANE_WIDTH = 0.25;

const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

// TODO: We might not need to persist this. 
// Since we are already detecting when we are hovering over streets,
// we can see when we are near u = 0 or u = 1 and treat drags as moving end points
// If not near end points, treat drag as moving a control point (or the whole street, depending on modifer keys?)
// May just call circleFromThreePoints as part of these drags, rather than saving this?
const streets = {
  // A: Object.assign( {
  //   lanes: {
  //     left: 1,
  //     right: 1,
  //   },
  // }, Arc.arcFromThreePoints( [ -4, 1 ], [ 0, 0 ], [ 4, 1 ] ) ),
  // B: Object.assign( {
  //   lanes: {
  //     left: 1,
  //     right: 1,
  //   },
  // }, Arc.arcFromThreePoints( [ 1, -4 ], [ 0, 0 ], [ 1, 4 ] ) ),
  C: {
    start: [ -3, -3 ],
    end: [ 3, 3 ],
    lanes: {
      left: 1,
      right: 2,
    },
  },
  D: {
    start: [ 3, -3 ],
    end: [ -3, 3 ],
    lanes: {
      left: 3,
      right: 4,
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

  // TODO: Turns at intersections
  const streetList = Object.values( streets );

  const one = streets.C;
  const two = streets.D;

  // streetList.forEach( A => {
  //   streetList.forEach( B => {
      if ( one != two ) {
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
              const toLanes = streets[ 1 ].routes[ laneDirs[ 0 ][ 1 ] ];

              const numLanes = Math.min( fromLanes.length, toLanes.length );

              for ( let i = 0; i < numLanes; i ++ ) {
                pairs.push( { from: fromLanes[ numLanes - 1 - i ], to: toLanes[ numLanes - 1 - i ], radius: radius, arrowColor: 'lime' } );
                radius -= LANE_WIDTH;
              }
            }

            {
              const fromLanes = streets[ 1 ].routes[ laneDirs[ 1 ][ 0 ] ];
              const toLanes = streets[ 0 ].routes[ laneDirs[ 1 ][ 1 ] ];

              const numLanes = Math.min( fromLanes.length, toLanes.length );

              for ( let i = 0; i < numLanes; i ++ ) {
                pairs.push( { from: fromLanes[ i + fromLanes.length - numLanes ], to: toLanes[ i + toLanes.length - numLanes ], radius: radius, arrowColor: 'red' } );
                radius -= LANE_WIDTH;
              }
            }
          }

          addPairs( [ B, A ], [ [ 'right', 'right' ], [ 'left', 'left' ] ] );
          addPairs( [ B, A ], [ [ 'left', 'left' ], [ 'right', 'right' ] ] );
          addPairs( [ A, B ], [ [ 'left', 'right' ], [ 'left', 'right' ] ] );
          addPairs( [ A, B ], [ [ 'right', 'left' ], [ 'right', 'left' ] ] );


          pairs.forEach( pair => {
            const arc = Arc.getArcBetween( routes[ pair.from ], routes[ pair.to ], pair.radius, intersection );

            if ( arc ) {
              arc.arrowColor = pair.arrowColor;
              
              const arcName = `${ pair.from }_TO_${ pair.to }_#${ index }_ARC`;
              routes[ arcName ] = arc;
            }
          } );
          

          // const pairs = [];
          
          // const angles = [ A, B ].map( a => Angle.getAngle( a, intersection ) );
      
          // const turn = Angle.sweepAngle( angles[ 0 ], angles[ 1 ], false );
          // // console.log( 'turn = ' + turn );
      
      
          // const Same = [
          //   { from: 'left', to: 'left' },
          //   { from: 'right', to: 'right' },
          // ];
      
          // const Opposite = [
          //   { from: 'left', to: 'right' },
          //   { from: 'right', to: 'left' },
          // ];
      
          // [
          //   { from: A, to: B, lanePairs: turn < 0 ? Same : Opposite },
          //   { from: B, to: A, lanePairs: turn > 0 ? Same : Opposite },
          // ].forEach( e => {
          //   const outerLeft = [];
          //   const localPairs = [];
      
          //   const baseRadius = 0;
      
          //   // Can create all the radii without radius, then add this at the end
            
          //   e.lanePairs.forEach( lanes => {
          //     // Left
          //     const leftFromLanes = e.from.lanes[ lanes.from ];
          //     const leftToLanes = e.to.lanes[ lanes.to ];
      
          //     const leftLanes = Math.min( leftFromLanes, leftToLanes );
      
          //     // Left-most lane should always be able to turn left, so work left-to-right
          //     // For simplicity, each from-lane can only go to one to-lane
      
          //     for ( let i = 0; i < leftLanes; i ++ ) {
          //       const pair = {
          //         from: e.from.routes[ lanes.from ][ i ],
          //         to:     e.to.routes[ lanes.to   ][ i ],
          //         radius: baseRadius - LANE_WIDTH * ( leftLanes - i - 1 ),
      
          //         // debug
          //         arrowColor: 'lime',
          //       };
      
          //       if ( i == leftLanes - 1 ) {
          //         outerLeft.push( pair );
          //       }
      
          //       localPairs.push( pair );
          //     }
      
          //     // Right
          //     // This needs to be the opposite values of above, not just switched order
          //     const rightFromLanes = e.to.lanes[ lanes.to == 'right' ? 'left' : 'right' ];
          //     const rightToLanes = e.from.lanes[ lanes.from == 'right' ? 'left' : 'right' ];
      
          //     const rightLanes = Math.min( rightFromLanes, rightToLanes );
      
          //     // Right-most lane should always be able to turn right, so work right-to-left
      
          //     for ( let i = 0; i < rightLanes; i ++ ) {
          //       localPairs.push( {
          //         from:   e.to.routes[ lanes.to == 'right' ? 'left' : 'right' ][ rightFromLanes - i - 1 ],
          //         to:   e.from.routes[ lanes.from == 'right' ? 'left' : 'right' ][ rightToLanes - i - 1 ],
          //         radius: baseRadius - LANE_WIDTH * ( leftLanes + rightLanes - i - 1 + Math.abs( rightFromLanes - rightToLanes ) ),
          //         // radius: baseRadius - LANE_WIDTH * ( rightLanes - i ),
          //         // TODO: Is there a way to modify this radius to be better in asymetrical cases? e.g. left 1, right 2
          //         // This helps somewhat. At least its symmetrical now.
      
          //         // debug
          //         arrowColor: 'red',
          //       } );
          //     }
          //   } );
      
          //   let minRadius = Infinity;
          //   localPairs.forEach( pair => minRadius = Math.min( minRadius, pair.radius ) );
      
          //   // console.log( `minRadius = ${ minRadius }` );
      
          //   // const radius = getRadiusForPairs( ...outerLeft, intersection );
          //   const radius = Math.max( -minRadius + 1, getRadiusForPairs( ...outerLeft, intersection, routes ) );
          //   // const radius = 1;

          //   // console.log( 'Radius for pairs: ' + radius );

          //   localPairs.forEach( pair => pair.radius += radius );
      
          //   pairs.push( ...localPairs );
          // } );
      
      
          // // TODO: Eventually use this for figuring out intersection bounds
          // // TODO: This should be saved as distances, not angles, so it can work with lines too
          // //       Arcs can convert distance to angles later as needed
          // // const fromEndAngles = new Map(), toStartAngles = new Map();
          
          // pairs.forEach( pair => {
          //   const fromRoute = routes[ pair.from ];
          //   const toRoute = routes[ pair.to ];
      
          //   const arc = getArcBetween( fromRoute, toRoute, pair.radius ?? 1, intersection );

          //   if ( arc ) {
          //     // Find min and max start and end angles for each route as we process pairs
          //     const startPos = [
          //       arc.center[ 0 ] + Math.cos( arc.startAngle ) * arc.radius,
          //       arc.center[ 1 ] + Math.sin( arc.startAngle ) * arc.radius,
          //     ];
        
          //     const endPos = [
          //       arc.center[ 0 ] + Math.cos( arc.endAngle ) * arc.radius,
          //       arc.center[ 1 ] + Math.sin( arc.endAngle ) * arc.radius,
          //     ];
              
          //     const fromDistance = fromRoute.center ? getDistanceAtAngle(
          //       Math.atan2( startPos[ 1 ] - fromRoute.center[ 1 ], startPos[ 0 ] - fromRoute.center[ 0 ] )
          //     ) : vec2.distance( fromRoute.start, startPos );

          //     const toDistance = toRoute.center ? getDistanceAtAngle(
          //       Math.atan2( endPos[ 1 ] - toRoute.center[ 1 ], endPos[ 0 ] - toRoute.center[ 0 ] )
          //     ) : vec2.distance( toRoute.start, endPos );

        
          //     // if ( !fromEndAngles.has( pair.from ) ||
          //     //       isBetweenAngles( fromEndAngle, fromRoute.startAngle, fromEndAngles.get( pair.from ), fromRoute.counterclockwise ) ) {
          //     //   fromEndAngles.set( pair.from, fromEndAngle );
          //     // }
        
          //     // if ( !toStartAngles.has( pair.to ) ||
          //     //       isBetweenAngles( toStartAngle, toStartAngles.get( pair.to ), toRoute.endAngle, toRoute.counterclockwise ) ) {
          //     //   toStartAngles.set( pair.to, toStartAngle );
          //     // }
        
          //     // Create route
          //     arc.arrowColor = pair.arrowColor;
        
          //     const arcName = `${ pair.from }_TO_${ pair.to }_#${ index }_ARC`;
          //     routes[ arcName ] = arc;
        
          //     // Keep track of our connections, and where they connect distance-wise
          //     fromRoute.links ??= [];
          //     fromRoute.links.push( {
          //       name: arcName,
          //       fromDistance: fromDistance,
          //       toDistance: 0,
          //     } );
        
          //     routes[ arcName ].links ??= [];
          //     routes[ arcName ].links.push( {
          //       name: pair.to,
          //       fromDistance: getLength( routes[ arcName ] ),
          //       toDistance: toDistance,
          //     } );
          //   }
          // } );
        } );
      }
  //   } );
  // } );

  // console.log( 'Routes:' );
  // console.log( routes );

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
          start:  hover.action == 'start'  ? hover.point : Arc.getPointAtAngle( street, street.startAngle ),
          middle: hover.action == 'middle' ? hover.point : Arc.getPointAtAngle( street, street.startAngle + Angle.sweepAngle( street.startAngle, street.endAngle, street.counterclockwise ) / 2 ),
          end:    hover.action == 'end'    ? hover.point : Arc.getPointAtAngle( street, street.endAngle ),
        };

        // NOTE: Via side effect, this is also moving the hover point
        vec2.add( points[ hover.action ], points[ hover.action ], moveVector );

        Object.assign( street, Arc.arcFromThreePoints( points.start, points.middle, points.end ) );
      }
      else {
        vec2.add( hover.point, hover.point, moveVector );

        // If dragging a middle point, turn street into arc
        if ( hover.action == 'middle' ) {
          Object.assign( street, Arc.arcFromThreePoints( street.start, hover.point, street.end ) );
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

      if ( ( Math.abs( dist - street.radius ) < HOVER_DIST ) && Angle.isBetweenAngles( angle, street.startAngle, street.endAngle, street.counterclockwise ) ) {
        const nearStart = Math.abs( Angle.deltaAngle( angle, street.startAngle ) * street.radius ) < ENDPOINT_DIST;
        const nearEnd   = Math.abs( Angle.deltaAngle( angle, street.endAngle   ) * street.radius ) < ENDPOINT_DIST;

        closestHover = {
          name: name,
          action: nearStart ? 'start' : nearEnd ? 'end' : 'middle',
          point: Arc.getPointAtAngle( street, angle ),
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