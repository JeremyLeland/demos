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

export function levelFromStreets( streets ) {
  const level = {
    routes: {},
    intersections: {},
    streetToRoutes: {},
  };

  Object.entries( streets ).forEach( ( [ streetName, street ] ) => {
    const numLanes = street.lanes.left + street.lanes.right;

    // TODO: don't assume here, generate as needed? (in case there's middle, turning, etc)
    level.streetToRoutes[ streetName ] = { left: [], right: [] };


    // Create lanes from the center out so that the left-most lane in direction of travel is at index 0
    const ccDir = street.counterclockwise ? 1 : -1;

    Object.keys( street.lanes ).forEach( laneDir => {

      const laneDirDir = laneDir == 'right' ? 1 : -1;    // needs a better name...

      for ( let i = 0; i < street.lanes[ laneDir ]; i ++ ) {

        const laneOffset = ccDir * laneDirDir * LANE_WIDTH * ( 0.5 + i );

        const route = {

          // TODO: Do I still need streetInfo if I'm making u-turns per street (instead of per route)?
          streetInfo: {
            name: streetName,
            laneDir: laneDir,
            laneIndex: i,
          },

          // debug
          arrowColor: laneDir == 'left' ? 'green' : 'darkred',
        }

        if ( street.center ) {
          // Left lanes are backwards
          Object.assign( route, {
            center: street.center,
            radius: street.radius + laneOffset,
            startAngle: laneDir == 'left' ? street.endAngle   : street.startAngle,
            endAngle:   laneDir == 'left' ? street.startAngle : street.endAngle,
            counterclockwise: laneDir == 'left' ? !street.counterclockwise : !!street.counterclockwise,            
          } );
        }
        else {
          // TODO: Don't recalculate this every loop?
          const v1 = vec2.subtract( [], street.end, street.start );
          vec2.normalize( v1, v1 );
          const normal = [ v1[ 1 ], -v1[ 0 ] ];

          // Left lanes are backwards
          const A = vec2.scaleAndAdd( [], street.start, normal, laneOffset );
          const B = vec2.scaleAndAdd( [], street.end,   normal, laneOffset );

          Object.assign( route, {
            start: laneDir == 'left' ? B : A,
            end:   laneDir == 'left' ? A : B,
          } );
        }

        const routeName = `${ streetName }_lane_${ laneDir }_${ i }`;
        level.routes[ routeName ] = route;

        // TODO: Save this in a different intermediate structure (so we aren't altering streets)
        level.streetToRoutes[ streetName ][ laneDir ].push( routeName );
      }
    } );
  } );

  // Turns at intersections
  const allIntersections = {};

  const streetNameList = Object.keys( streets );

  for ( let i = 0; i < streetNameList.length - 1; i ++ ) {
    for ( let j = i + 1; j < streetNameList.length; j ++ ) {
      const nameOne = streetNameList[ i ];
      const nameTwo = streetNameList[ j ];

      const one = streets[ nameOne ];
      const two = streets[ nameTwo ];

      Intersections.getIntersections( one, two ).forEach( ( intersection, index ) => {

        console.log( `Intersection ${ nameOne } vs ${ nameTwo } #${ index } at ${ intersection }` );

        const fromDistances = new Map();
        const toDistances = new Map();

        const angles = [ one, two ].map( route => Route.getHeadingAtPoint( route, intersection ) );
        const turn = Angle.deltaAngle( ...angles );

        // console.log( `Turn ${ Object.keys( streets )[ i ] } vs ${ Object.keys( streets )[ j ] } = ${ turn }` );

        const A = turn < 0 ? nameTwo : nameOne;
        const B = turn < 0 ? nameOne : nameTwo;

        const intersectionPaths = [];

        function addPairs( streetNames, laneDirs ) {
          const fromLanesA = level.streetToRoutes[ streetNames[ 0 ] ][ laneDirs[ 0 ][ 0 ] ];
          const toLanesA   = level.streetToRoutes[ streetNames[ 1 ] ][ laneDirs[ 0 ][ 1 ] ];
          const numLanesA = Math.min( fromLanesA.length, toLanesA.length );

          const fromLanesB = level.streetToRoutes[ streetNames[ 1 ] ][ laneDirs[ 1 ][ 0 ] ];
          const toLanesB   = level.streetToRoutes[ streetNames[ 0 ] ][ laneDirs[ 1 ][ 1 ] ];
          const numLanesB = Math.min( fromLanesB.length, toLanesB.length );

          // TODO: Is this too big? Should there be a -( LANE_WIDTH / 2 ) in there somewhere?
          const minRadius = ( numLanesA + numLanesB ) * LANE_WIDTH;

          // console.log( 'Minimum radius is: ' + minRadius );

          // NOTE: Order is important here because radius is decreased after each join

          // TODO: How to detect that no join is required?
          let radius = getBestJoinRadius(
            level.routes[ fromLanesA[ numLanesA - 1 ] ], 
            level.routes[ toLanesA[ numLanesA - 1 ] ], 
            intersection,
            minRadius,
            10    // TODO: better value for max?
          );

          // console.log( 'Got best radius of ' + radius );

          if ( radius == null ) {
            // console.log( 'skipping pair, no acceptable radius found' );
            return false;
          }

          for ( let k = 0; k < numLanesA; k ++ ) {
            joinRoutes( 
              level.routes, 
              fromLanesA[ numLanesA - 1 - k ], 
              toLanesA[ numLanesA - 1 - k ], 
              radius, 
              intersection,
              `#${ index }`,
              'lime',
              intersectionPaths,
              fromDistances,
              toDistances,
            );
            radius -= LANE_WIDTH;
          }

          for ( let k = 0; k < numLanesB; k ++ ) {
            joinRoutes(
              level.routes,
              fromLanesB[ k + fromLanesB.length - numLanesB ], 
              toLanesB[ k + toLanesB.length - numLanesB ], 
              radius,
              intersection,
              `#${ index }`,
              'red',
              intersectionPaths,
              fromDistances,
              toDistances,
            );
            radius -= LANE_WIDTH;
          }

          return true;  // acceptable radius found and routes created
        }


        let numPairs = 0;

        if ( addPairs( [ B, A ], [ [ 'right', 'right' ], [ 'left', 'left' ] ] ) ) {
          numPairs ++;
        }

        if ( addPairs( [ B, A ], [ [ 'left', 'left' ], [ 'right', 'right' ] ] ) ) {
          numPairs ++;
        }
        
        if ( addPairs( [ A, B ], [ [ 'left', 'right' ], [ 'left', 'right' ] ] ) ) {
          numPairs ++;
        }
        
        if ( addPairs( [ A, B ], [ [ 'right', 'left' ], [ 'right', 'left' ] ] ) ) {
          numPairs ++;
        }

        // console.log( `numPairs = ${ numPairs }` );

        console.log( 'intersectionPaths: ' );
        console.log( intersectionPaths );


        // This is prematurely filtering out intersections that should be combined
        // Could potentially save this to use later, but going to try calculating another way for now
        // if ( numPairs > 1 ) {
          const distances = {};

          const defaultEntry = ( key ) => ( { fromDistance: 0, toDistance: Route.getLength( level.routes[ key ] ) } );

          fromDistances.forEach( ( fromDistance, key ) => {
            distances[ key ] ??= defaultEntry( key );
            distances[ key ].fromDistance = fromDistance;
          } );

          toDistances.forEach( ( toDistance, key ) => {
            distances[ key ] ??= defaultEntry( key );
            distances[ key ].toDistance = toDistance;
          } );

          const intersectionName = `${ nameOne }_vs_${ nameTwo }_#${ index }`;
          
          allIntersections[ intersectionName ] = {
            streets: [ nameOne, nameTwo ],
            position: intersection,
            distances: distances,
            paths: intersectionPaths.map( path =>
              path.map( name => ( {
                name: name,
                fromDistance: distances[ name ].fromDistance,
                toDistance: distances[ name ].toDistance,
              } ) )
            ),
          };
      } );
    }
  }

  console.log( 'allIntersections:' );
  console.log( allIntersections );

  const positionMap = new Map();

  Object.entries( allIntersections ).forEach( ( [ name, intersection ] ) => {
    const key = intersection.position.toString();

    if ( !positionMap.has( key ) ) {
      positionMap.set( key, {} );
    }

    positionMap.get( key )[ name ] = intersection;
  } );

  console.log( 'positionMap:' );
  console.log( positionMap );

  positionMap.values().forEach( group => {
    const intersectionNames = [];
    const streetNames = new Set();
    let position;
    const paths = [];

    Object.entries( group ).forEach( ( [ name, intersection ] ) => {
      intersectionNames.push( name );
      intersection.streets.forEach( streetName => streetNames.add( streetName ) );
      position = intersection.position;
      intersection.paths.forEach( path => paths.push( path ) );
    } );

    // Only include intersection if there's a route that starts more than 1 path
    const startCount = {};
    let bestCount = 0;

    paths.forEach( path => {
      const name = path[ 0 ].name;
      startCount[ name ] ??= 0;
      startCount[ name ] ++;

      if ( startCount[ name ] > bestCount ) {
        bestCount = startCount[ name ];
      }
    } );

    if ( bestCount > 1 ) { 
      const intersectionName = intersectionNames.join( '+' );
      
      level.intersections[ intersectionName ] = {
        streets: new Array( streetNames ),
        position: position,
        paths: paths,
      };
    }
  } );

  console.log( 'level.intersections:' );
  console.log( level.intersections );


  // TODO: Make this based on distance remaining after last link again?

  // // NEXT: We're hitting the same issue as before where we can link one way
  // //  but not both, and so end up with an invalid u-turn
  // // Should we only traverse right turns for this? (We'd never traverse a uturn then...)


  // // Traverse all the routes, adding u-turns if we reach a dead end
  // const unvisitedRoutes = new Set( Object.keys( routes ) );
  // const visitedLinks = new Set();

  // let thisRouteName, nextRouteName;
  // let lastLink, nextLink;
  
  // for ( let tries = 0; tries < 100; tries ++ ) {
  //   thisRouteName = nextRouteName ?? unvisitedRoutes.values().next().value;

  //   if ( thisRouteName == null ) {
  //     // console.log( 'no more routes' );
  //     break;
  //   }

  //   // console.log( thisRouteName );

  //   unvisitedRoutes.delete( thisRouteName );
  //   visitedLinks.add( lastLink );

  //   const thisRoute = routes[ thisRouteName ];

  //   lastLink = nextLink;

  //   // console.log( `  checking for next link from ${ thisRouteName } at ${ lastLink?.toDistance ?? 0 }` );

  //   nextLink = getNextLink( thisRoute, lastLink?.toDistance ?? 0 );

  //   // console.log( `  ...found: ${ JSON.stringify( nextLink ) }` );

  //   if ( nextLink == null ) {
  //     // console.log( '    Making u-turn...' );

  //     const streetInfo = thisRoute.streetInfo;
  //     const street = streets[ streetInfo.name ];

  //     const fromRouteName = street.routes[ streetInfo.laneDir ][ streetInfo.laneIndex ];
  //     const toRouteName = street.routes[ streetInfo.laneDir == 'right' ? 'left' : 'right' ][ streetInfo.laneIndex ];

  //     // console.log( `    ...from ${ fromRouteName } to ${ toRouteName }` );

  //     const fromRoute = routes[ fromRouteName ];
  //     const toRoute = routes[ toRouteName ];

  //     const fromPos = Route.getPositionAtDistance( fromRoute, Route.getLength( fromRoute ) );
  //     const toPos = Route.getPositionAtDistance( toRoute, 0 );

  //     joinRoutes(
  //       routes,
  //       fromRouteName,
  //       toRouteName,
  //       ( streetInfo.laneIndex + 0.5 ) * LANE_WIDTH, 
  //       [ ( fromPos[ 0 ] + toPos[ 0 ] ) / 2, ( fromPos[ 1 ] + toPos[ 1 ] ) / 2 ],
  //       'u-turn',
  //       'lime',
  //     );

  //     nextRouteName = toRouteName;
  //   }
  //   else {
  //     nextRouteName = nextLink.name;
  //   }

  //   if ( visitedLinks.has( nextLink ) ) {
  //     // break out of a loop
  //     nextRouteName = null;  // pull a new route from unvisited
  //     nextLink = null;

  //     if ( unvisitedRoutes.size == 0 ) {
  //       // seems like we shouldn't need this if we have thisRouteName == null check above...
  //       break;
  //     }
  //   }
  // }

  // console.log( 'routes = ' );
  // console.log( routes );

  return level;
}

function getBestJoinRadius( fromRoute, toRoute, intersection, min, max ) {
  let left = min, right = max;

  // TODO: Check if min is valid and accept immediately
  // TODO: Exponential check to find max? Is that valid? Are we monotonic function?

  for ( let i = 0; i < 10; i ++ ) {
    const mid = ( left + right ) / 2;

    // console.log( 'trying radius ' + mid );

    const arc = Route.getRouteBetween( fromRoute, toRoute, mid, intersection );
    
    if ( !arc ) {
      right = mid;
      continue;
    }

    if ( !arc.center ) {
      return 0;   // Need a special value of some sort of distinguish from not finding a valid route below
    }

    const dist = vec2.distance( arc.center, intersection );

    if ( dist < arc.radius + LANE_WIDTH ) {
      left = mid;
    }
    else {
      right = mid;
    }
  }

  const mid = ( left + right ) / 2;

  // Make sure 
  if ( Route.getRouteBetween( fromRoute, toRoute, mid, intersection ) ) {
    return mid;
  }
}

// TODO: Rename "interseciton" to "closeTo" or "nearPoint" or something 
// to avoid confusion with actual intersection object

function joinRoutes( routes, fromName, toName, radius, intersection, intersectionName, debugColor, intersectionPaths, fromDistances, toDistances ) {

  // console.log( `\njoining route ${fromName} to ${ toName } at ${ intersection }` );

  
  const fromRoute = routes[ fromName ];
  const toRoute = routes[ toName ];
  const joinRoute = Route.getRouteBetween( fromRoute, toRoute, radius, intersection );

  if ( !joinRoute ) {
    return;   // no valid join found
  }

  // If not an arc, then already joined, just need to link them up
  if ( joinRoute.center == null ) {
    const fromDistance = Route.getLength( fromRoute );
    const toDistance = 0;

    fromRoute.links ??= [];
    fromRoute.links.push( {
      name: toName,
      fromDistance: fromDistance,
      toDistance: toDistance,
    } );

    // Update intersection distances
    // TODO: Just do this in one place in function?
    if ( !fromDistances.has( fromName ) || fromDistance < fromDistances.get( fromName ) ) {
      fromDistances.set( fromName, fromDistance );
    }
    
    if ( !toDistances.has( toName ) || toDistances.get( toName ) < toDistance ) {
      toDistances.set( toName, toDistance );
    }


    intersectionPaths.push( [ fromName, toName ] );

    return;
  }

  const arcName = `${ fromName }_TO_${ toName }_${ intersectionName }_ARC`;
  routes[ arcName ] = joinRoute;
  
  // Keep track of our connections, and where they connect distance-wise
  const startPos = Arc.getPointAtAngle( joinRoute, joinRoute.startAngle );
  const endPos = Arc.getPointAtAngle( joinRoute, joinRoute.endAngle );
  
  const fromDistance = Route.getDistanceAtPoint( fromRoute, startPos );
  const toDistance = Route.getDistanceAtPoint( toRoute, endPos );
  
  // Update intersection distances
  if ( !fromDistances.has( fromName ) || fromDistance < fromDistances.get( fromName ) ) {
    fromDistances.set( fromName, fromDistance );
  }
  
  if ( !toDistances.has( toName ) || toDistances.get( toName ) < toDistance ) {
    toDistances.set( toName, toDistance );
  }
  
  const joinLength = Arc.getLength( joinRoute );
  fromDistances.set( arcName, 0 );
  toDistances.set( arcName, joinLength );
  
  // Update links
  fromRoute.links ??= [];
  fromRoute.links.push( {
    name: arcName,
    fromDistance: fromDistance,
    toDistance: 0,
  } );
  
  joinRoute.links ??= [];
  joinRoute.links.push( {
    name: toName,
    fromDistance: joinLength,
    toDistance: toDistance,
  } );

  intersectionPaths.push( [ fromName, arcName, toName ] );

  joinRoute.arrowColor = debugColor;
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
