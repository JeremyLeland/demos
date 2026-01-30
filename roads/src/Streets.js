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

            streetInfo: {
              name: name,
              laneDir: laneDir,
              laneIndex: i,
            },

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

            streetInfo: {
              name: name,
              laneDir: laneDir,
              laneIndex: i,
            },
            
            arrowColor: laneDir == 'left' ? 'green' : 'darkred',
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

          // TODO: Set initial radius once here, then call joinRoutes each time instead of making pairs
          let radius = getBestJoinRadius( routes[ fromLanesA[ numLanesA - 1 ] ], routes[ toLanesA[ numLanesA - 1 ] ], intersection );

          console.log( 'Got best radius of ' + radius );

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
        
        // TODO: NEXT: I'm having intersections that can't decide if they are 3-way or 4-way
        // A short stub of road might be able to turn right onto a street but not left onto it
        // These cases shouldn't exist (unless the road is one-way, that's a whole other set of problems for later...)
        // Can we see if adding pairs was successful, and not add the other pair if it wasn't?

        addPairs( [ B, A ], [ [ 'right', 'right' ], [ 'left', 'left' ] ] );
        addPairs( [ B, A ], [ [ 'left', 'left' ], [ 'right', 'right' ] ] );

        addPairs( [ A, B ], [ [ 'left', 'right' ], [ 'left', 'right' ] ] );
        addPairs( [ A, B ], [ [ 'right', 'left' ], [ 'right', 'left' ] ] );
      } );
    }
  }


  // NEXT: We're hitting the same issue as before where we can link one way
  //  but not both, and so end up with an invalid u-turn
  // Should we only traverse right turns for this? (We'd never traverse a uturn then...)


  // Traverse all the routes, adding u-turns if we reach a dead end
  const unvisitedRoutes = new Set( Object.keys( routes ) );
  const visitedLinks = new Set();

  let thisRouteName, nextRouteName;
  let lastLink, nextLink;
  
  for ( let tries = 0; tries < 100; tries ++ ) {
    thisRouteName = nextRouteName ?? unvisitedRoutes.values().next().value;

    if ( thisRouteName == null ) {
      console.log( 'no more routes' );
      break;
    }

    console.log( thisRouteName );

    unvisitedRoutes.delete( thisRouteName );
    visitedLinks.add( lastLink );

    const thisRoute = routes[ thisRouteName ];

    lastLink = nextLink;

    console.log( `  checking for next link from ${ thisRouteName } at ${ lastLink?.toDistance ?? 0 }` );

    nextLink = getNextLink( routes, thisRoute, lastLink?.toDistance ?? 0 );

    console.log( `  ...found: ${ JSON.stringify( nextLink ) }` );

    if ( nextLink == null ) {
      console.log( '    Making u-turn...' );

      const streetInfo = thisRoute.streetInfo;
      const street = streets[ streetInfo.name ];

      const fromRouteName = street.routes[ streetInfo.laneDir ][ streetInfo.laneIndex ];
      const toRouteName = street.routes[ streetInfo.laneDir == 'right' ? 'left' : 'right' ][ streetInfo.laneIndex ];

      console.log( `    ...from ${ fromRouteName } to ${ toRouteName }` );

      const fromRoute = routes[ fromRouteName ];
      const toRoute = routes[ toRouteName ];

      const fromPos = Route.getPositionAtDistance( fromRoute, Route.getLength( fromRoute ) );
      const toPos = Route.getPositionAtDistance( toRoute, 0 );

      joinRoutes(
        routes,
        fromRouteName,
        toRouteName,
        ( streetInfo.laneIndex + 0.5 ) * LANE_WIDTH, 
        [ ( fromPos[ 0 ] + toPos[ 0 ] ) / 2, ( fromPos[ 1 ] + toPos[ 1 ] ) / 2 ],
        'u-turn',
        'lime',
      );

      nextRouteName = toRouteName;
    }
    else {
      nextRouteName = nextLink.name;
    }

    if ( visitedLinks.has( nextLink ) ) {
      // break out of a loop
      nextRouteName = null;  // pull a new route from unvisited
      nextLink = null;

      if ( unvisitedRoutes.size == 0 ) {
        // seems like we shouldn't need this if we have thisRouteName == null check above...
        break;
      }
    }
  }

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

function getNextLink( routes, route, distance = 0 ) {
  let closest, closestDist = Infinity;
  let furthest, furthestDist = 0;

  route.links?.forEach( link => {
    const dist = link.fromDistance - distance;
    
    // TODO: Do we care about counterclockwise here?
    // Not sure it actually makes a difference. Only using right-hand turns for traversing
    // doesn't solve my problem.
    // For now, this is only being used to tell if we should have a u-turn or not
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
