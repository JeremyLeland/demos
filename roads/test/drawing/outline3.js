// Goal: Draw outline of simple street layouts

// Need to handle setups like this:
// +--+--+
// |  |  |
// +--+--+
// |  |  |
// +--+--+


// TODO: Need to handle streets without connections at ends
//  - Can either link them to themselves and stick with my 
//    "everything needs links", or try to just draw across the end
//  - Don't really want roads to nowhere, probably everything should have a link for u-turns

import * as Angle from '../../src/common/Angle.js';
import * as Arc from '../../src/common/Arc.js';
import * as Route from '../../src/Route.js';

const LANE_WIDTH = 0.25;

const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

let drawSteps = 40;

const streets = {
  line: {
    start: [ -5, 0 ],
    end: [ 5, 0 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  // arc: {
  //   center: [ -2, 0 ],
  //   radius: 4,
  //   startAngle: -Math.PI / 2,
  //   endAngle: Math.PI / 2,
  //   counterclockwise: false,
  //   lanes: {
  //     left: 2,
  //     right: 2,
  //   },
  // },
  line2: {
    start: [ 0, -5 ],
    end: [ 0, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  // arc: {
  //   center: [ 3, 3 ],
  //   radius: 3,
  //   startAngle: -Math.PI / 2,
  //   endAngle: Math.PI,
  //   counterclockwise: false,
  //   lanes: {
  //     left: 2,
  //     right: 2,
  //   },
  // },
  // arc2: {
  //   center: [ -3, -3 ],
  //   radius: 3,
  //   startAngle: Math.PI / 2,
  //   endAngle: 0,
  //   counterclockwise: false,
  //   lanes: {
  //     left: 2,
  //     right: 2,
  //   },
  // },
  line3: {
    start: [ -5, -5 ],
    end: [ 5, -5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  line4: {
    start: [ -5, 5 ],
    end: [ 5, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  line5: {
    start: [ -5, -5 ],
    end: [ -5, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  line6: {
    start: [ 5, -5 ],
    end: [ 5, 5 ],
    lanes: {
      left: 2,
      right: 2,
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

      // TODO: Can we make getIntersections return the ends of the line/arc if its the same one?
      const intersections = Intersections.getIntersections( one, two );

      intersections.forEach( ( intersection, index ) => {
        const angles = [ one, two ].map( route => Route.getHeadingAtPoint( route, intersection ) );
        const turn = Angle.deltaAngle( ...angles );

        // console.log( `Turn ${ Object.keys( streets )[ i ] } vs ${ Object.keys( streets )[ j ] } = ${ turn }` );

        // If no turn, then no arc needed -- link them directly
        function connectStreets( streets, laneDirs ) {
          {
            const fromLanes = streets[ 0 ].routes[ laneDirs[ 0 ][ 0 ] ];
            const toLanes   = streets[ 1 ].routes[ laneDirs[ 0 ][ 1 ] ];

            const numLanes = fromLanes.length;

            for ( let k = 0; k < numLanes; k ++ ) {
              const fromRoute = routes[ fromLanes[ k ] ];

              fromRoute.links ??= [];
              fromRoute.links.push( {
                name: toLanes[ k ],
                fromDistance: Route.getLength( fromRoute ),
                toDistance: 0,
              } );

              // console.log( `Connecting ${ fromLanes[ k ] } to ${ toLanes[ k ] } from ${ Route.getLength( fromRoute ) } to 0` );
            }
          }

          {
            const fromLanes = streets[ 1 ].routes[ laneDirs[ 1 ][ 0 ] ];
            const toLanes   = streets[ 0 ].routes[ laneDirs[ 1 ][ 1 ] ];

            const numLanes = fromLanes.length;

            for ( let k = 0; k < numLanes; k ++ ) {
              const fromRoute = routes[ fromLanes[ k ] ];

              fromRoute.links ??= [];
              fromRoute.links.push( {
                name: toLanes[ k ],
                fromDistance: Route.getLength( fromRoute ),
                toDistance: 0,
              } );

              // console.log( `Connecting ${ fromLanes[ k ] } to ${ toLanes[ k ] } from ${ Route.getLength( fromRoute ) } to 0` );
            }
          }
        }

        const atBeginning = vec2.distance( intersection, Route.getPositionAtDistance( one, 0 ) ) < 1e-6;

        if ( turn == 0 ) {
          if ( atBeginning ) {
            connectStreets( [ one, two ], [ [ 'left', 'left' ], [ 'right', 'right' ] ] );
          }
          else {
            connectStreets( [ one, two ], [ [ 'right', 'right' ], [ 'left', 'left' ] ] );
          }
          return;
        }
        else if ( turn == -Math.PI /*|| turn == Math.PI*/ /* seems like it's never +PI... */ ) {
          if ( atBeginning ) {
            connectStreets( [ one, two ], [ [ 'left', 'right' ], [ 'left', 'right' ] ] );
          }
          else {
            connectStreets( [ one, two ], [ [ 'right', 'left' ], [ 'right', 'left' ] ] );
          }
          return;
        }

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
          joinRoutes( routes, pair.from, pair.to, pair.radius, intersection, `#${ index }`, pair.arrowColor );
        } );
      } );
    }
  }

  // TODO: NEXT: Unless there's an intersection (how to detect??)
  // How are we defining this? If the street goes well past the intersection, it should have a uturn
  // Guess we just define this. See how far the last link is from the end. If it's more than X (maybe LANE_RADIUS?),
  // then add the uturn
  // Actually, won't it get screwed up if it doesn't have a right turn to get it onto the next bit of road?
  // Maybe the deciding factor should be if it has a right turn on the opposite site
  // ...how do I figure that out, though? And what if there are no turns because it's just one street?

  streetList.forEach( street => {
    const pairs = [];

    // TODO: Find way to use common function with above?
    {
      const fromLanes = street.routes.right;
      const toLanes   = street.routes.left;

      // First attempt -- only add if goes out more than 2 from last link
      // TODO: Don't hardcode this, should depend on radius of the biggest link? 
      //    - That link may not be the last link, if left and right links are close...
      const firstFromRoute = routes[ fromLanes[ 0 ] ];
      const lastLink = getLastLink( firstFromRoute );

      console.log( lastLink );

      if ( lastLink && Route.getLength( firstFromRoute ) - lastLink.fromDistance < 2 ) {
        return;
      }

      const numLanes = Math.min( fromLanes.length, toLanes.length );
      for ( let k = 0; k < numLanes; k ++ ) {
        pairs.push( { 
          from: fromLanes[ k ], 
          to: toLanes[ k ], 
          radius: ( k + 0.5 ) * LANE_WIDTH, 
          intersection: Route.getPositionAtDistance( street, Route.getLength( street ) ),
          arrowColor: 'lime',
        } );
      }
    }

    {
      const fromLanes = street.routes.left;
      const toLanes   = street.routes.right;

      // First attempt -- only add if goes out more than 2 from last link
      const firstFromRoute = routes[ fromLanes[ 0 ] ];
      const lastLink = getLastLink( firstFromRoute );

      console.log( lastLink );

      if ( lastLink && Route.getLength( firstFromRoute ) - lastLink.fromDistance < 2 ) {
        return;
      }

      const numLanes = Math.min( fromLanes.length, toLanes.length );
      for ( let k = 0; k < numLanes; k ++ ) {
        pairs.push( { 
          from: fromLanes[ k ], 
          to: toLanes[ k ], 
          radius: ( k + 0.5 ) * LANE_WIDTH, 
          intersection: Route.getPositionAtDistance( street, 0 ),
          arrowColor: 'lime',
        } );
      }
    }

    pairs.forEach( pair => {
      joinRoutes( routes, pair.from, pair.to, pair.radius, pair.intersection, 'uturn', pair.arrowColor );
    } );
  } );


  console.log( 'routes = ' );
  console.log( routes );

  return routes;
}


function joinRoutes( routes, fromName, toName, radius, intersection, intersectionName, debugColor ) {
  const arc = Route.getArcBetween( routes[ fromName ], routes[ toName ], radius, intersection );

  if ( arc ) {
    const arcName = `${ fromName }_TO_${ toName }_${ intersectionName }_ARC`;
    routes[ arcName ] = arc;

    // Keep track of our connections, and where they connect distance-wise
    const fromRoute = routes[ fromName ];
    const toRoute = routes[ toName ];

    const startPos = Arc.getPointAtAngle( arc, arc.startAngle );
    const endPos = Arc.getPointAtAngle( arc, arc.endAngle );

    const fromDistance = fromRoute.center ? Arc.getDistanceAtAngle( fromRoute,
      Math.atan2( startPos[ 1 ] - fromRoute.center[ 1 ], startPos[ 0 ] - fromRoute.center[ 0 ] )
    ) : vec2.distance( fromRoute.start, startPos );

    const toDistance = toRoute.center ? Arc.getDistanceAtAngle( toRoute,
      Math.atan2( endPos[ 1 ] - toRoute.center[ 1 ], endPos[ 0 ] - toRoute.center[ 0 ] )
    ) : vec2.distance( toRoute.start, endPos );
    
    fromRoute.links ??= [];
    fromRoute.links.push( {
      name: arcName,
      fromDistance: fromDistance,
      toDistance: 0,
    } );
    
    arc.links ??= [];
    arc.links.push( {
      name: toName,
      fromDistance: Arc.getLength( arc ),
      toDistance: toDistance,
    } );

    arc.arrowColor = debugColor;
  }
}


import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';

import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( -6, -6, 6, 6 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  routes = routesFromStreets( streets );


  ctx.lineWidth = 0.02;
  grid.draw( ctx );


  function getNextLink( route, distance ) {
    let closest, closestDist = Infinity;
    let furthest, furthestDist = 0;

    route.links?.forEach( link => {
      const dist = link.fromDistance - distance;
      
      if ( routes[ link.name ].counterclockwise != true && 0 <= dist && dist < closestDist ) {
        closest = link;
        closestDist = dist;
      }
      
      if ( dist > furthestDist ) {
        furthest = link;
        furthestDist = dist;
      }
    } );

    // console.log( 'closest: ' );
    // console.log( closest );

    // console.log( 'furthest: ' );
    // console.log( furthest );

    return closest ?? furthest;
  }


  // The links created from when we made intersections should be enough starting points
  // to seed all the paths we need for the street outline. (We only care about the 
  // outer-most ones)
  const unvisited = new Set();

  const outerLanes = [];

  Object.values( streets ).forEach( street => {
    outerLanes.push(
      street.routes.left[ street.routes.left.length - 1 ],
      street.routes.right[ street.routes.right.length - 1 ],
    );
  } );

  console.log( 'outerLanes = ' );
  console.log( outerLanes );

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    if ( outerLanes.includes( name ) ) {
      let furthest, furthestDist = 0;

      let addedAny = false;

      route.links?.forEach( link => {
        if ( link.fromDistance > furthestDist ) {
          furthest = link;
          furthestDist = link.fromDistance;
        }

        if ( routes[ link.name ].counterclockwise == false ) {
          unvisited.add( link );
          addedAny = true;
        }
      } );

      // Avoid adding left turns at end of route if we already added right turns
      if ( !addedAny ) {
        unvisited.add( furthest );
      }
    }
    else {
      route.links?.forEach( link => {
        if ( outerLanes.includes( link.name ) && route.counterclockwise == false ) {
          unvisited.add( link );
        }
      } );
    }
  } );

  console.log( 'unvisited = ' );
  console.log( unvisited );


  const outline = new Path2D();
  let subpath = new Path2D();

  const visited = new Set();

  let thisLink, nextLink;

  for ( let tries = 0; tries < drawSteps; tries ++ ) {
    thisLink = nextLink ?? unvisited.values().next().value;
    nextLink = getNextLink( routes[ thisLink.name ], thisLink.toDistance );

    unvisited.delete( thisLink );
    visited.add( thisLink );

    // console.log( `addRouteToPath( subpath, routes[ ${ thisLink.name } ], ${ thisLink?.toDistance }, ${ nextLink?.fromDistance }, 1 )` );

    Route.addRouteToPath( subpath, routes[ thisLink.name ], thisLink?.toDistance, nextLink?.fromDistance, 1 * LANE_WIDTH / 2 );

    if ( visited.has( nextLink ) ) {
      console.log( 'making new path' );
      outline.addPath( subpath );
      subpath = new Path2D();

      nextLink = null;  // pull a new link from unvisited

      if ( unvisited.size == 0 ) {
        break;
      }
    }
  }

  outline.addPath( subpath ); // TEMP: add partial path for debugging

  console.log( 'visited =' );
  console.log( visited );

  
  ctx.fillStyle = '#555';
  ctx.fill( outline );

  ctx.strokeStyle = 'cyan';
  ctx.stroke( outline );





  // Maybe:
  //  - Pick pair of intersections
  //  - Find path between them
  //  - Draw dotted lines with all offsets along this path 
  //    (for both lane directions, but start from same intersection and end at same intersection for all of them)

  drawLinks( ctx, routes );
}

function drawLinks( ctx, routes ) {
  ctx.globalAlpha = 0.25;
  Object.values( routes ).forEach( route => {
    const routeLength = Route.getLength( route );
    
    ctx.fillStyle = route.arrowColor;

    for ( let length = 0; length < routeLength; length += DEBUG_ARROW_LENGTH ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }

    // Linked routes
    ctx.setLineDash( [] );
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = 'cyan';
  
    route.links?.forEach( link => {
      const toRoute = routes[ link.name ];
  
      // Draw last piece of our route, then first piece of next route
      ctx.beginPath();
      if ( route.center ) {
        ctx.arc( 
          ...route.center, 
          route.radius, 
          Arc.getAngleAtDistance( route, link.fromDistance - 0.5 ),
          Arc.getAngleAtDistance( route, link.fromDistance ),
          route.counterclockwise,
        );
      }
      else {
        ctx.lineTo( ...Route.getPositionAtDistance( route, link.fromDistance - 0.5 ) );
        ctx.lineTo( ...Route.getPositionAtDistance( route, link.fromDistance ) );
      }

      if ( toRoute.center ) {
        ctx.arc(
          ...toRoute.center,
          toRoute.radius,
          Arc.getAngleAtDistance( toRoute, link.toDistance ),
          Arc.getAngleAtDistance( toRoute, link.toDistance + 0.5 ),
          toRoute.counterclockwise,
        );
      }
      else {
        ctx.lineTo( ...Route.getPositionAtDistance( toRoute, link.toDistance ) );
        ctx.lineTo( ...Route.getPositionAtDistance( toRoute, link.toDistance + 0.5 ) );
      }
      ctx.stroke();
    } )

  } );
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

function getLastLink( route ) {
  let furthest, furthestDist = 0;

  route.links?.forEach( link => {
    const dist = link.fromDistance;
      
    if ( dist > furthestDist ) {
      furthest = link;
      furthestDist = dist;
    }
  } );

  return furthest;
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
// Slider
//
const drawStepsSlider = document.createElement( 'input' );

Object.assign( drawStepsSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( drawStepsSlider, {
  type: 'range',
  min: 0,
  max: 100,
  step: 0.01,
  value: drawSteps,
} );

document.body.appendChild( drawStepsSlider );

drawStepsSlider.addEventListener( 'input', _ => {
  drawSteps = +drawStepsSlider.value;

  canvas.redraw();
} );
