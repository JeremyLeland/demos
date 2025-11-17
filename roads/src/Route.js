import * as Arc from './common/Arc.js';
import * as Intersections from './common/Intersections.js';

import { vec2 } from '../lib/gl-matrix.js'


const LANE_WIDTH = 1;


export function makeRoutes( streets ) {

  // 1. Handle intersections between streets
  //    - Look for intersecting streets
  //    - Break streets into segments
  //    - Store ins and outs as intersection

  // TODO: Should we duplicate streets to avoid altering original?

  // Find intersections, then break up streets later
  const intersections = [];

  const visited = [];

  for ( const [ name1, street1 ] of Object.entries( streets ) ) {
    visited.push( name1 );

    for ( const [ name2, street2 ] of Object.entries( streets ) ) {
      if ( visited.includes( name2 ) ) {
        continue;
      }

      //
      // TODO: Account for arcs
      //

      const addIntersection = ( point ) => {
        intersections.push( {
          streets: [ name1, name2 ],
          point: point,
        } );
      }

      if ( street1.center && street2.center ) {
        Intersections.getArcArcIntersections( 
          street1.center[ 0 ], street1.center[ 1 ], street1.radius, street1.startAngle, street1.endAngle, street1.counterclockwise, 
          street2.center[ 0 ], street2.center[ 1 ], street2.radius, street2.startAngle, street2.endAngle, street2.counterclockwise,
        ).forEach( point => addIntersection( point ) );
      }
      else if ( street1.center ) {
        Intersections.getArcLineIntersections(
          street1.center[ 0 ], street1.center[ 1 ], street1.radius, street1.startAngle, street1.endAngle, street1.counterclockwise, 
          street2.start[ 0 ], street2.start[ 1 ], street2.end[ 0 ], street2.end[ 1 ],
        ).forEach( point => addIntersection( point ) );
      }
      else if ( street2.center ) {
        Intersections.getArcArcIntersections(
          street2.center[ 0 ], street2.center[ 1 ], street2.radius, street2.startAngle, street2.endAngle, street2.counterclockwise,
          street1.start[ 0 ], street1.start[ 1 ], street1.end[ 0 ], street1.end[ 1 ],
        ).forEach( point => addIntersection( point ) );
      }
      else {
        const point = getLineIntersection(
          street1.start[ 0 ], street1.start[ 1 ], street1.end[ 0 ], street1.end[ 1 ],
          street2.start[ 0 ], street2.start[ 1 ], street2.end[ 0 ], street2.end[ 1 ],
        );

        if ( point ) {
          addIntersection( point );
        }
      }
    }
  }
  
  // console.log( 'Intersections before:' );
  // console.log( intersections );

  let splitIndex = 0;

  intersections.forEach( intersection => {
    const beforeStreets = intersection.streets;
    const afterStreets = [];
    const streetNamesToDelete = [];

    for ( let i = 0; i < intersection.streets.length; i ++ ) {
      const beforeStreetName = beforeStreets[ i ];
      const otherStreetName = beforeStreets[ ( i + 1 ) % intersection.streets.length ];

      const oldStreet = streets[ beforeStreetName ];
      const otherStreet = streets[ otherStreetName ];

      // console.log( `Comparing ${ oldStreet.start } and ${ oldStreet.end } to ${ intersection.point }...` );

      //
      // TODO: Intersection with arc
      //   - Need to find start and end pos from angles and radius
      //

      // TODO: makeRoutes is way too hard to test changes to
      //   - Need to break this up into pieces that are easier to reason about and test on their own
      //   - We're going to need to experiment with what splitting and offsetting arcs should look like

      //
      // Figure out how much this street is overlapping the other street so we can shorten it (or its resulting splits)
      //
      if ( oldStreet.center ) {
        // If arc, change start/endAngle
        //  - Except that will leave us at a weird angle. 
        //  - If we're to stay perpendicular, we'd need to change center and radius
      }
      else {
        // If line, move start/end
        const streetVec = vec2.subtract( [], oldStreet.start, oldStreet.end );
        vec2.normalize( streetVec, streetVec );

        // TODO: What if it's not a right angle?
        const laneTrimOffset = 0.5 * LANE_WIDTH * ( otherStreet.lanes.left + otherStreet.lanes.right );

        // Don't split if intersection is at start or end, just trim
        if ( lineDist( oldStreet.start, intersection.point ) < 1e-6 ) {
          // console.log( `${ intersection.point } is near ${ oldStreet.start } so trimming start` );

          vec2.add( oldStreet.start, oldStreet.start, vec2.scale( [], streetVec, -laneTrimOffset ) );

          afterStreets.push( beforeStreetName );
          continue;
        }
        if ( lineDist( oldStreet.end, intersection.point ) < 1e-6 ) {
          // console.log( `${ intersection.point } is near ${ oldStreet.end } so trimming end` );

          vec2.add( oldStreet.end, oldStreet.end, vec2.scale( [], streetVec, laneTrimOffset ) );

          afterStreets.push( beforeStreetName );
          continue;
        };

        // TODO: Reference the original street name so we can modify that 
        // instead of constantly appending split numbers (e.g. first_0_4_5_6 )
        // Probably also useful later to get street info like proper name, maybe speed, etc

        const splitA = `${ beforeStreetName }_${ splitIndex ++ }`;
        const splitB = `${ beforeStreetName }_${ splitIndex ++ }`;
      
        // TODO: Account for multiple lanes (likely from reference to original street info)

        streets[ splitA ] = {
          start: oldStreet.start, 
          end: vec2.add( [], intersection.point, vec2.scale( [], streetVec, laneTrimOffset ) ),
          lanes: oldStreet.lanes,
        };

        streets[ splitB ] = {
          start: vec2.add( [], intersection.point, vec2.scale( [], streetVec, -laneTrimOffset ) ),
          end: oldStreet.end,
          lanes: oldStreet.lanes,
        };

        afterStreets.push( splitA, splitB );
        streetNamesToDelete.push( beforeStreetName );

        // Update all the other intersections
        const streetAngle = lineAngle( oldStreet.start, oldStreet.end );

        intersections.forEach( otherIntersection => {
          if ( intersection == otherIntersection ) {
            return;
          }

          for ( let i = 0; i < otherIntersection.streets.length; i ++ ) {
            if ( otherIntersection.streets[ i ] == beforeStreetName ) {

              // TODO: How would we handle this for arcs? Would need in terms of angles or distance

              const intersectionAngle = lineAngle( intersection.point, otherIntersection.point );

              if ( Math.abs( intersectionAngle - streetAngle ) < 0.1 ) {
                // console.log( `${ otherIntersection.point } is ahead of ${ intersection.point }, so setting to splitB` );
                otherIntersection.streets[ i ] = splitB;
              }
              else {
                // console.log( `${ otherIntersection.point } is behind ${ intersection.point }, so setting to splitA` );
                otherIntersection.streets[ i ] = splitA;
              }
            }
          }
        } );
      }

      intersection.streets = afterStreets;

      streetNamesToDelete.forEach( name => delete streets[ name ] );
    }
  } );

  // console.log( 'Intersections after splits:' );
  // console.log( intersections );

  // console.log( 'Streets after splits:' );
  // console.log( streets );

  
  // 2. Create lanes
  const routes = {};

  for ( const [ name, street ] of Object.entries( streets ) ) {
    const numLanes = street.lanes.left + street.lanes.right;
    street.routes = { left: [], right: [] };     // link lanes to parent street so we can find them for connecting intersections

    const laneStepDir = street.counterclockwise ? 1 : -1
    let laneOffset = laneStepDir * ( 0.5 + -0.5 * LANE_WIDTH * numLanes );

    if ( street.center ) {
      [ 'left', 'right' ].forEach( laneDir => {
        for ( let i = 0; i < street.lanes[ laneDir ]; i ++ ) {

          // Left lanes are backwards
          const route = {
            center: street.center,
            radius: street.radius + laneOffset,
            // startAngle: street.startAngle,
            // endAngle: street.endAngle,
            // counterclockwise: street.counterclockwise,
            startAngle: laneDir == 'left' ? street.endAngle   : street.startAngle,
            endAngle:   laneDir == 'left' ? street.startAngle : street.endAngle,
            counterclockwise: laneDir == 'left' ? !street.counterclockwise : !!street.counterclockwise,

            // parent: name,
          };

          const newName = `${ name }_lane_${ laneDir }_${ i }`;

          routes[ newName ] = route;

          street.routes[ laneDir ].push( newName );

          laneOffset += laneStepDir * LANE_WIDTH;
        }
      } );
    }
    else {
      const streetDX = street.end[ 0 ] - street.start[ 0 ];
      const streetDY = street.end[ 1 ] - street.start[ 1 ];

      const angle = Math.atan2( streetDY, streetDX );
      const cos = Math.cos( angle );
      const sin = Math.sin( angle );

      [ 'left', 'right' ].forEach( laneDir => {
        for ( let i = 0; i < street.lanes[ laneDir ]; i ++ ) {
          const A = [ street.start[ 0 ] + laneOffset * -sin, street.start[ 1 ] + laneOffset * cos ];
          const B = [   street.end[ 0 ] + laneOffset * -sin,   street.end[ 1 ] + laneOffset * cos ];
          
          // Left lanes are backwards
          const route = {
            start: laneDir == 'left' ? B : A,
            end:   laneDir == 'left' ? A : B,
            // parent: name,
          };

          const routeDX = route.end[ 0 ] - route.start[ 0 ];
          const routeDY = route.end[ 1 ] - route.start[ 1 ];


          // TODO: Do we really care about this here? Could just use laneDir for uniqueness
          const dir = Math.abs( streetDX ) > Math.abs( streetDY ) ? ( routeDX < 0 ? 'WEST' : 'EAST' ) : ( routeDY < 0 ? 'NORTH' : 'SOUTH' );
          const newName = `${ name }_${ dir }_lane_${ laneDir }_${ i }`;

          // console.log( `${ newName }: ${ JSON.stringify( route ) }` );

          routes[ newName ] = route;

          street.routes[ laneDir ].push( newName );

          laneOffset += LANE_WIDTH;
        }
      } );
    }
  }

  // 3. Link routes from intersections
  intersections.forEach( intersection => {
    for ( let i = 0; i < intersection.streets.length - 1; i ++ ) {
      for ( let j = i + 1; j < intersection.streets.length; j ++ ) {

        console.log( `Linking ${ intersection.streets[ i ] } to ${ intersection.streets[ j ] }` );

        const thisStreet = streets[ intersection.streets[ i ] ];
        const otherStreet = streets[ intersection.streets[ j ] ];

        // Our "ideal" orientation is from.end intersecting with to.start
        // If this isn't the case, account for the backwards line

        const thisBackwards = lineDist( thisStreet.start, intersection.point ) < lineDist( thisStreet.end, intersection.point );
        const otherBackwards = lineDist( otherStreet.end, intersection.point ) < lineDist( otherStreet.start, intersection.point );

        const cross = vec2.cross( [],
          thisBackwards ? vec2.sub( [], thisStreet.start, thisStreet.end ) : vec2.sub( [], thisStreet.end, thisStreet.start ),
          otherBackwards ? vec2.sub( [], otherStreet.start, otherStreet.end ) : vec2.sub( [], otherStreet.end, otherStreet.start ),
        );

        console.log( `thisBackwards: ${ thisBackwards }, otherBackwards: ${ otherBackwards }, cross: ${ cross }` );

        
        if ( cross[ 2 ] > 0 ) {
          // Making right turns from thisStreet's right lanes
          {
            const fromRoutes =  thisBackwards ?  thisStreet.routes.left :  thisStreet.routes.right;
            const toRoutes   = otherBackwards ? otherStreet.routes.left : otherStreet.routes.right;
            
            const numTurns = Math.min( fromRoutes.length, toRoutes.length );
            
            for ( let k = 0; k < numTurns; k ++ ) {
              const from = fromRoutes[  thisBackwards ? k : fromRoutes.length - 1 - k ];
              const to   =   toRoutes[ otherBackwards ? k :   toRoutes.length - 1 - k ];
              
              joinRoutes( routes, from, to );
            }
          }

          // Making left turns from otherStreet's left lanes (going in opposite direction of road)
          {
            const fromRoutes = otherBackwards ? otherStreet.routes.right : otherStreet.routes.left;
            const toRoutes   =  thisBackwards ?  thisStreet.routes.right :  thisStreet.routes.left;

            const numTurns = Math.min( fromRoutes.length, toRoutes.length );
            
            for ( let k = 0; k < numTurns; k ++ ) {
              const from = fromRoutes[ otherBackwards ? k : fromRoutes.length - 1 - k ];
              const to   =   toRoutes[  thisBackwards ? k :   toRoutes.length - 1 - k ];
              
              joinRoutes( routes, from, to );
            }
          }
        }
        else if ( cross[ 2 ] < 0 ) {
          // Making left turns from thisStreet's right lanes
          {
            const fromRoutes =  thisBackwards ?  thisStreet.routes.left : thisStreet.routes.right;
            const toRoutes   = otherBackwards ? otherStreet.routes.left : otherStreet.routes.right;

            const numTurns = Math.min( fromRoutes.length, toRoutes.length );

            for ( let k = 0; k < numTurns; k ++ ) {
              const from = fromRoutes[ thisBackwards ? fromRoutes.length - 1 - k : k ];
              const to   =  toRoutes[ otherBackwards ?   toRoutes.length - 1 - k : k ];

              joinRoutes( routes, from, to );
            }
          }

          // Making right turns from otherStreet's left lanes (going in opposite direction of road)
          {
            const fromRoutes = otherBackwards ? otherStreet.routes.right : otherStreet.routes.left;
            const toRoutes   =  thisBackwards ?  thisStreet.routes.right :  thisStreet.routes.left;

            const numTurns = Math.min( fromRoutes.length, toRoutes.length );

            for ( let k = 0; k < numTurns; k ++ ) {
              const from = fromRoutes[ otherBackwards ? fromRoutes.length - 1 - k : k ];
              const to   =   toRoutes[  thisBackwards ?   toRoutes.length - 1 - k : k ];

              joinRoutes( routes, from, to );
            }
          }
        }
        else {
          // Straight across
          for ( let k = 0; k < thisStreet.lanes.right; k ++ ) {
            const from =  thisBackwards ?  thisStreet.routes.left[ k ] : thisStreet.routes.right[ k ];
            const to   = otherBackwards ? otherStreet.routes.left[ k ] : otherStreet.routes.right[ k ];

            joinRoutes( routes, from, to );
          }

          for ( let k = 0; k < thisStreet.lanes.left; k ++ ) {
            const from = otherBackwards ? otherStreet.routes.right[ k ] : otherStreet.routes.left[ k ];
            const to   =  thisBackwards ?  thisStreet.routes.right[ k ] :  thisStreet.routes.left[ k ];

            joinRoutes( routes, from, to );
          }
        }
      }
    }
  } );

  return routes;
}

function getArcIntersection( A, B ) {

}

function getArcLineIntersection( arc, line ) {

}

function getLineIntersection( A, B ) {
  const [ x1, y1 ] = A.start;
  const [ x2, y2 ] = A.end;
  const [ x3, y3 ] = B.start;
  const [ x4, y4 ] = B.end;

  const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );
  
  // Is there a meaningful parallel/collinear case to account for here?
  // TODO: You could have two collinear segments that touch each other.
  //       It might happen while editing, maybe when removing lines from a grid
  //       Should handle it at some point
  if ( D != 0 ) {
    const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
    const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;
    
    if ( 0 <= uA && uA <= 1 && 0 <= uB && uB <= 1 ) {
      const point = [
        x1 + uA * ( x2 - x1 ),
        y1 + uA * ( y2 - y1 ),
      ];
      
      return point;
    }
  }
}

function joinRoutes( routes, fromName, toName ) {
  console.log( `Joining from ${ fromName } to ${ toName }` )

  const route1 = routes[ fromName ];
  const route2 = routes[ toName ];

  const joinName = `${ fromName }_to_${ toName }`;
  
  route1.next ??= [];
  
  // Check if roads are on same line
  const [ x1, y1 ] = route1.start;
  const [ x2, y2 ] = route1.end;
  const [ x3, y3 ] = route2.start;
  const [ x4, y4 ] = route2.end;

  if ( Math.abs( ( y3 - y1 ) * ( x2 - x1 ) - ( y2 - y1 ) * ( x3 - x1 ) ) < 1e-6 ) {
    const lineName = `${ joinName }_LINE`;

    const line = {
      start: route1.end,
      end: route2.start,
    };
    routes[ lineName ] = line;

    route1.next.push( lineName );
    line.next = [ toName ];
  }
  else {
    let beforeLine, arc, afterLine;

    const beforeName = `${ joinName }_BEFORE`;
    const arcName = `${ joinName }_ARC`;
    const afterName = `${ joinName }_AFTER`;


    // Find distance to intersection. If it's not equal, make a small straight section so we can make it equal
    const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

    const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
    // const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

    const intersection = [
      x1 + ( x2 - x1 ) * uA,
      y1 + ( y2 - y1 ) * uA,
    ];

    const dist1 = Math.hypot( intersection[ 0 ] - x2, intersection[ 1 ] - y2 );
    const dist2 = Math.hypot( x3 - intersection[ 0 ], y3 - intersection[ 1 ] );

    console.log( `dist1 = ${ dist1 }, dist2 = ${ dist2 }` );

    // Need line before arc
    if ( dist1 > dist2 + 1e-6 ) {
      console.log( 'Add before!' );

      const beforeVec = vec2.subtract( [], route1.end, route1.start );
      vec2.normalize( beforeVec, beforeVec );

      console.log( 'beforeVec: ' + beforeVec );

      beforeLine = {
        start: route1.end,
        end: vec2.scaleAndAdd( [], route1.end, beforeVec, dist1 - dist2 ),
      }

      console.log( `beforeLine: ${ JSON.stringify( beforeLine ) }` );
      
      routes[ beforeName ] = beforeLine;

      arc = Arc.getArcBetweenLines( x1, y1, beforeLine.end[ 0 ], beforeLine.end[ 1 ], x3, y3, x4, y4 );
      routes[ arcName ] = arc;
    }

    // Need line after arc
    else if ( dist2 > dist1 + 1e-6 ) {
      console.log( 'Add after!' );

      const afterVec = vec2.subtract( [], route2.end, route2.start );
      vec2.normalize( afterVec, afterVec );

      console.log( 'afterVec: ' + afterVec );

      afterLine = {
        start: vec2.scaleAndAdd( [], route2.start, afterVec, dist1 - dist2 ),
        end: route2.start,
      }

      console.log( `afterLine: ${ JSON.stringify( afterLine ) }` );

      routes[ afterName ] = afterLine;

      arc = Arc.getArcBetweenLines( x1, y1, x2, y2, afterLine.start[ 0 ], afterLine.start[ 1 ], x4, y4 );
      routes[ arcName ] = arc;
    }

    // Nothing before or after, just the arc
    else {
      arc = Arc.getArcBetweenLines( x1, y1, x2, y2, x3, y3, x4, y4 );
      routes[ arcName ] = arc;
    }
    
    //
    // Adjust (or add) before and after roads to properly attach to arc
    //

    const arcStart = [
      arc.center[ 0 ] + arc.radius * Math.cos( arc.startAngle ),
      arc.center[ 1 ] + arc.radius * Math.sin( arc.startAngle ),
    ];
    
    const arcEnd = [
      arc.center[ 0 ] + arc.radius * Math.cos( arc.endAngle ),
      arc.center[ 1 ] + arc.radius * Math.sin( arc.endAngle ),
    ];

    if ( beforeLine ) {
      beforeLine.end = arcStart;
    }
    else {
      if ( Math.hypot( arcStart[ 0 ] - x2, arcStart[ 1 ] - y2 ) > 1e-6 ) {
        beforeLine = {
          start: route1.end,
          end: arcStart,
        };
        routes[ beforeName ] = beforeLine;
      }
    }

    if ( afterLine ) {
      afterLine.start = arcEnd;
    }
    else {
      if ( Math.hypot( x3 - arcEnd[ 0 ], y3 - arcEnd[ 1 ] ) > 1e-6 ) {
        afterLine = {
          start: arcEnd,
          end: route2.start,
        };
        routes[ afterName ] = afterLine;
      }
    }

    //
    // Link sections of the route
    //

    if ( beforeLine ) {
      route1.next.push( beforeName );
      beforeLine.next = [ arcName ];
    }
    else {
      route1.next.push( arcName );
    }

    if ( afterLine ) {
      arc.next = [ afterName ];
      afterLine.next = [ toName ];
    }
    else {
      arc.next = [ toName ];
    }
  }
}

function lineDist( P0, P1 ) {
  return Math.hypot( P1[ 0 ] - P0[ 0 ], P1[ 1 ] - P0[ 1 ] );
}

function lineAngle( P0, P1 ) {
  return Math.atan2( P1[ 1 ] - P0[ 1 ], P1[ 0 ] - P0[ 0 ] );
}



export function drawRoute( ctx, route, debugDrawSolid = true ) {
  if ( DRAW_ROADS ) {
    ctx.lineWidth = LANE_WIDTH - 0.1;
    // ctx.lineCap = 'square';
    ctx.strokeStyle = debugDrawSolid ? '#777' : '#5555';
    
    ctx.beginPath();
    if ( route.center ) {
      ctx.arc( ...route.center, route.radius, route.startAngle, route.endAngle, route.counterclockwise );
    }
    else {
      ctx.lineTo( ...route.start );
      ctx.lineTo( ...route.end );
    }
    ctx.stroke();
  }

  if ( DRAW_DIRECTION_ARROWS ) {
    ctx.fillStyle = ctx.strokeStyle = debugDrawSolid ? '#ff0' : '#ff05';
    ctx.lineWidth = 0.05;
    
    const roadLength = getLength( route );
    
    for ( let length = 0; length < roadLength; length += 0.5 ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }
  }
}

export function getLength( route ) {
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

export function drawAtDistance( ctx, route, distance, drawFunc ) {
  let pos, angle;
 
  if ( route.center ) {
    const angleOffset = ( distance / route.radius ) * ( route.counterclockwise ? -1 : 1 );
    const angleAtD = route.startAngle + angleOffset;

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
