import * as Arc from './common/Arc.js';
import * as Angle from './common/Angle.js';
import * as Intersections from './common/Intersections.js';
import * as Route from './Route.js';

import { vec2 } from '../lib/gl-matrix.js';

// Put the common code to generate routes from streets in here

export const LANE_WIDTH = 0.25;

export const Constants = {
  StartRadius: 2,
};

// NOTE: This modifies streets
// TODO: Why does this need to modify streets? Can routes just keep reference to parent? Why does street need to know routes?
//       Seems like we could search all routes with parent == 'name' if we need to find them...
// Maybe this can return an overall level object including map of routes by name and map of routes by street

export function routesFromStreets( streets ) {
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

        function addPairs( streets, laneDirs ) {
          const fromLanesA = streets[ 0 ].routes[ laneDirs[ 0 ][ 0 ] ];
          const toLanesA   = streets[ 1 ].routes[ laneDirs[ 0 ][ 1 ] ];
          const numLanesA = Math.min( fromLanesA.length, toLanesA.length );

          const fromLanesB = streets[ 1 ].routes[ laneDirs[ 1 ][ 0 ] ];
          const toLanesB   = streets[ 0 ].routes[ laneDirs[ 1 ][ 1 ] ];
          const numLanesB = Math.min( fromLanesB.length, toLanesB.length );

          let radius = getBestJoinRadius( routes[ fromLanesA[ numLanesA - 1 ] ], routes[ toLanesA[ numLanesA - 1 ] ], intersection );

          // console.log( 'Got best radius of ' + radius );

          // TODO: Is this too big? Should there be a -( LANE_WIDTH / 2 ) in there somewhere?
          radius = Math.max( ( numLanesA + numLanesB ) * LANE_WIDTH, radius );

          for ( let k = 0; k < numLanesA; k ++ ) {
            joinRoutes( 
              routes, 
              fromLanesA[ numLanesA - 1 - k ], 
              toLanesA[ numLanesA - 1 - k ], 
              radius, 
              intersection,
              `#${ index }`,
              'lime'
            );
            radius -= LANE_WIDTH;
          }

          for ( let k = 0; k < numLanesB; k ++ ) {
            joinRoutes(
              routes,
              fromLanesB[ k + fromLanesB.length - numLanesB ], 
              toLanesB[ k + toLanesB.length - numLanesB ], 
              radius,
              intersection,
              `#${ index }`,
              'red'
            );
            radius -= LANE_WIDTH;
          }
        }

        // TODO: NEXT: Find distance in all directions of intersection (before/after)
        // Determine whether this should be elbow, 3-way, 4-way, etc and don't make links if a side is too short
        
        const A_before = Math.abs( Route.getDistanceAtPoint( A, intersection ) );
        const B_before = Math.abs( Route.getDistanceAtPoint( B, intersection ) );
        const A_after = Route.getLength( A ) - A_before;
        const B_after = Route.getLength( B ) - B_before;

        console.log( `A_before = ${ A_before }` );
        console.log( `A_after = ${ A_after }` );
        console.log( `B_before = ${ B_before }` );
        console.log( `B_after = ${ B_after }` );

        // TODO: NOW: Find which A/B before/after goes with each line
        
        // What should minimum length be? Should it take into account number of lanes? Arbitrary number?
        const MINIMUM = 2;

        // B before, A after
        if ( A_after > MINIMUM && B_before > MINIMUM ) {
          addPairs( [ B, A ], [ [ 'right', 'right' ], [ 'left', 'left' ] ] );
        }
        
        // B after, A before
        if ( A_before > MINIMUM && B_after > MINIMUM ) {
          addPairs( [ B, A ], [ [ 'left', 'left' ], [ 'right', 'right' ] ] );
        }

        // B after, A after
        if ( A_after > MINIMUM && B_after > MINIMUM ) {
          addPairs( [ A, B ], [ [ 'left', 'right' ], [ 'left', 'right' ] ] );
        }

        // B before, A before
        if ( A_before > MINIMUM && B_before > MINIMUM ) {
          addPairs( [ A, B ], [ [ 'right', 'left' ], [ 'right', 'left' ] ] );
        }
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
    // TODO: Way to merge these two sections? They're so similar...
    {
      const fromLanes = street.routes.right;
      const toLanes   = street.routes.left;

      // TODO: Using lane 0 breaks with 4 lane roads because the 0 lane for right may be doing something different than
      //       the 0 lane for left. Also, if we have an intersection of or 4 differet streets (e.g. to mix lines and arcs)
      //       then the streets won't match up

      // First attempt -- only add if goes out more than 2 from last link
      // TODO: Don't hardcode this, should depend on radius of the biggest link? 
      //    - That link may not be the last link, if left and right links are close...
      const firstFromRoute = routes[ fromLanes[ 0 ] ];
      const lastLink = getLastLink( firstFromRoute );

      const firstToRoute = routes[ toLanes[ 0 ] ];
      const firstLink = getNextLink( firstToRoute );

      // console.log( 'firstFrom: '+ fromLanes[ 0 ] );
      // console.log( 'firstTo: '+ toLanes[ 0 ] );

      // console.log( lastLink );
      // console.log( firstLink );

      // const fromDest = lastLink ? getNextLink( routes[ lastLink.name ] )?.name : null;
      // const toDest = firstLink ? getNextLink( routes[ firstLink.name ] )?.name : null;

      // console.log( fromDest );
      // console.log( toDest );

      if ( !lastLink || Route.getLength( firstFromRoute ) - lastLink.fromDistance > Constants.StartRadius ) {

      // if ( !lastLink || ( firstLink && fromDest == toDest ) ) {
        
        console.log( 'Making u-turn' );

        const numLanes = Math.min( fromLanes.length, toLanes.length );
        for ( let k = 0; k < numLanes; k ++ ) {
          joinRoutes(
            routes,
            fromLanes[ k ], 
            toLanes[ k ], 
            ( k + 0.5 ) * LANE_WIDTH, 
            Route.getPositionAtDistance( street, Route.getLength( street ) ),
            'uturn',
            'lime',
          );
        }
      }
      else {
        console.log( 'SKIPPING!!!' );
      }
    }

    {
      const fromLanes = street.routes.left;
      const toLanes   = street.routes.right;

      // First attempt -- only add if goes out more than 2 from last link
      const firstFromRoute = routes[ fromLanes[ 0 ] ];
      const lastLink = getLastLink( firstFromRoute );

      const firstToRoute = routes[ toLanes[ 0 ] ];
      const firstLink = getNextLink( firstToRoute );

      // console.log( 'firstFrom: '+ fromLanes[ 0 ] );
      // console.log( 'firstTo: '+ toLanes[ 0 ] );

      // console.log( lastLink );
      // console.log( firstLink );

      // const fromDest = lastLink ? getNextLink( routes[ lastLink.name ] )?.name : null;
      // const toDest = firstLink ? getNextLink( routes[ firstLink.name ] )?.name : null;

      // console.log( fromDest );
      // console.log( toDest );

      if ( !lastLink || Route.getLength( firstFromRoute ) - lastLink.fromDistance > Constants.StartRadius ) {
      // if ( !lastLink || ( firstLink && fromDest == toDest ) ) {

        console.log( 'Making u-turn' );

        const numLanes = Math.min( fromLanes.length, toLanes.length );
        for ( let k = 0; k < numLanes; k ++ ) {
          joinRoutes(
            routes,
            fromLanes[ k ], 
            toLanes[ k ], 
            ( k + 0.5 ) * LANE_WIDTH, 
            Route.getPositionAtDistance( street, 0 ),
            'uturn',
            'lime',
          );
        }
      }
      else {
        console.log( 'SKIPPING!!!' );
      }
    }
  } );


  // console.log( 'routes = ' );
  // console.log( routes );

  return routes;
}

function getBestJoinRadius( fromRoute, toRoute, intersection ) {
  let left = 0, right = 10;   // TODO: How to determine appropriate max?

  for ( let i = 0; i < 10; i ++ ) {
    const mid = ( left + right ) / 2;

    // console.log( 'trying radius ' + mid );

    const arc = Route.getArcBetween( fromRoute, toRoute, mid, intersection );
    
    if ( !arc ) {
      right = mid;
      continue;
    }

    const dist = vec2.distance( arc.center, intersection );

    if ( dist < arc.radius + LANE_WIDTH ) {
      left = mid;
    }
    else {
      right = mid;
    }
  }

  return ( left + right ) / 2;
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


// TODO: Should this go to Route.js intead?
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

function getNextLink( route, distance = 0 ) {
  let closest, closestDist = Infinity;
  // let furthest, furthestDist = 0;

  route.links?.forEach( link => {
    const dist = link.fromDistance - distance;
    
    // TODO: Do we care about counterclockwise here? 
    // For now, this is only being used to tell if we should have a u-turn or not
    if ( /*routes[ link.name ].counterclockwise != true && */ 0 <= dist && dist < closestDist ) {
      closest = link;
      closestDist = dist;
    }
    
    // if ( dist > furthestDist ) {
    //   furthest = link;
    //   furthestDist = dist;
    // }
  } );

  // console.log( 'closest: ' );
  // console.log( closest );

  // console.log( 'furthest: ' );
  // console.log( furthest );

  return closest;// ?? furthest;
}
