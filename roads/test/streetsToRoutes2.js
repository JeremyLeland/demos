import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Arc from '../src/common/Arc.js';

import { vec2 } from '../lib/gl-matrix.js'


const streets = {
  first: {
    start: [ 22, 3 ],
    end: [ 2, 3 ],
    lanes: { left: 1, right: 1 },
  },
  second: {
    start: [ 22, 12 ],
    end: [ 2, 12 ],
    lanes: { left: 2, right: 2 },
  },
  third: {
    start: [ 22, 22 ],
    end: [ 2, 22 ],
    lanes: { left: 1, right: 1 },
  },
  A: {
    start: [ 2, 3 ],
    end: [ 2, 22 ],
    lanes: { left: 1, right: 1 },
  },
  B: {
    start: [ 13, 3 ],
    end: [ 13, 22 ],
    lanes: { left: 2, right: 2 },
  },
  C: {
    start: [ 22, 3 ],
    end: [ 22, 22 ],
    lanes: { left: 1, right: 1 },
  },
};

const LANE_WIDTH = 1;

const routes = makeRoutes( streets );

console.log( routes );

let hoverRouteName;

function makeRoutes( streets ) {

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

      // Find intersection between lines
      const [ x1, y1 ] = street1.start;
      const [ x2, y2 ] = street1.end;
      const [ x3, y3 ] = street2.start;
      const [ x4, y4 ] = street2.end;

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
          
          intersections.push( {
            streets: [ name1, name2 ],
            point: point,
          } );
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

  } );

  // console.log( 'Intersections after splits:' );
  // console.log( intersections );

  // console.log( 'Streets after splits:' );
  // console.log( streets );

  
  // 2. Create lanes
  const routes = {};

  for ( const [ name, street ] of Object.entries( streets ) ) {
    const streetDX = street.end[ 0 ] - street.start[ 0 ];
    const streetDY = street.end[ 1 ] - street.start[ 1 ];

    const angle = Math.atan2( streetDY, streetDX );
    const cos = Math.cos( angle );
    const sin = Math.sin( angle );

    const numLanes = street.lanes.left + street.lanes.right;

    street.routes = { left: [], right: [] };     // link lanes to parent street so we can find them for connecting intersections
    
    let laneOffset = 0.5 + -0.5 * LANE_WIDTH * numLanes;

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

        const dir = Math.abs( streetDX ) > Math.abs( streetDY ) ? ( routeDX < 0 ? 'WEST' : 'EAST' ) : ( routeDY < 0 ? 'NORTH' : 'SOUTH' );
        const newName = `${ name }_${ dir }_lane_${ laneDir }_${ i }`;

        // console.log( `${ newName }: ${ JSON.stringify( route ) }` );

        routes[ newName ] = route;

        street.routes[ laneDir ].push( newName );

        laneOffset += LANE_WIDTH;
      }
    } );
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

      const beforeLine = {
        start: route1.end,
        end: vec2.scaleAndAdd( [], route1.end, beforeVec, dist1 - dist2 ),
      }

      console.log( `beforeLine: ${ JSON.stringify( beforeLine ) }` );

      const beforeName = `${ joinName }_BEFORE`;
      routes[ beforeName ] = beforeLine;

      const arcName = `${ joinName }_ARC`;
      const arc = Arc.getArcBetweenLines( x1, y1, beforeLine.end[ 0 ], beforeLine.end[ 1 ], x3, y3, x4, y4 );
      routes[ arcName ] = arc;
      
      route1.next.push( beforeName );
      beforeLine.next = [ arcName ];
      arc.next = [ toName ];
    }

    // Need line after arc
    else if ( dist2 > dist1 + 1e-6 ) {
      console.log( 'Add after!' );

      const afterVec = vec2.subtract( [], route2.end, route2.start );
      vec2.normalize( afterVec, afterVec );

      console.log( 'afterVec: ' + afterVec );

      const afterLine = {
        start: vec2.scaleAndAdd( [], route2.start, afterVec, dist1 - dist2 ),
        end: route2.start,
      }

      console.log( `afterLine: ${ JSON.stringify( afterLine ) }` );

      const afterName = `${ joinName }_AFTER`;
      routes[ afterName ] = afterLine;

      const arcName = `${ joinName }_ARC`;
      const arc = Arc.getArcBetweenLines( x1, y1, x2, y2, afterLine.start[ 0 ], afterLine.start[ 1 ], x4, y4 );
      routes[ arcName ] = arc;
      
      route1.next.push( arcName );
      arc.next = [ afterName ];
      afterLine.next = [ toName ];
    }

    // Nothing before or after, just the arc
    else {
      const arcName = `${ joinName }_ARC`;
      const arc = Arc.getArcBetweenLines( x1, y1, x2, y2, x3, y3, x4, y4 );
      routes[ arcName ] = arc;
      
      route1.next.push( arcName );
      arc.next = [ toName ];
    }
    
    // Adjust roads to properly attach to arc
    // route1.end = [
    //   arc.center[ 0 ] + arc.radius * Math.cos( arc.startAngle ),
    //   arc.center[ 1 ] + arc.radius * Math.sin( arc.startAngle ),
    // ];

    // if ( Number.isNaN( route1.end[ 0 ] ) || Number.isNaN( route1.end[ 1 ] ) ) {
    //   debugger;
    // }
    
    // route2.start = [
    //   arc.center[ 0 ] + arc.radius * Math.cos( arc.endAngle ),
    //   arc.center[ 1 ] + arc.radius * Math.sin( arc.endAngle ),
    // ];

    // if ( Number.isNaN( route2.start[ 0 ] ) || Number.isNaN( route2.start[ 1 ] ) ) {
    //   debugger;
    // }
  }
}

// console.log( 'Routes:' );
// console.log( routes );

// console.log( 'Streets with routes:' );
// console.log( streets );

const nameDiv = document.createElement( 'div' );
for ( const name of Object.keys( routes ) ) {
  // const label = document.createTextNode( name );
  // nameDiv.appendChild( label );

  const div = document.createElement( 'div' );
  div.innerText = name;

  div.addEventListener( 'mouseover', _ => {
    hoverRouteName = name;
    canvas.redraw();
  } );

  nameDiv.appendChild( div );
}

document.body.appendChild( nameDiv );

Object.assign( nameDiv.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  overflow: 'scroll',
  fontSize: '10px'
} );


const players = Array.from( Array( 10 ), _ => { 
  const routeName = randomFrom( Object.keys( routes ) );

  return {
    color: randomColor(),
    speed: 0.005,
    routeName: routeName,
    routeDistance: Math.random() * getLength( routes[ routeName ] ),
  };
} );


const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ -0.5, -0.5, 25.5, 25.5 ];

const grid = new Grid( 0, 0, 25, 25 );

canvas.update = ( dt ) => {
  // Draw at distance along path
  players.forEach( player => {
    player.routeDistance += player.speed * dt;
    
    for ( let i = 0; i < 10; i ++ ) {
      const route = routes[ player.routeName ];

      const length = getLength( route );

      if ( player.routeDistance > length ) {
        player.routeDistance -= length;
        player.routeName = randomFrom( route.next );   // TODO: random? based on path?
      }
      else {
        break;
      }
    }
  } );
}

const DRAW_ROADS = true;
const DRAW_DIRECTION_ARROWS = true;
const DRAW_PLAYERS = true;

canvas.draw = ( ctx ) => {

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    
    if ( DRAW_ROADS ) {
      ctx.lineWidth = LANE_WIDTH - 0.1;
      // ctx.lineCap = 'square';
      ctx.strokeStyle = name == hoverRouteName ? '#777' : '#5555';
      
      // TODO: Hover (brighter stroke if matches name)
      
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
      ctx.fillStyle = ctx.strokeStyle = name == hoverRouteName ? '#ff0' : '#ff05';
      ctx.lineWidth = 0.05;
      
      const roadLength = getLength( route );
      
      for ( let length = 0; length < roadLength; length += 0.5 ) {
        drawOnRoadAtDistance( ctx, route, length, drawArrow );
      }
    }
  } );

  if ( DRAW_PLAYERS ) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.02;
    
    players.forEach( player => {
      ctx.fillStyle = player.color;
      drawOnRoadAtDistance( ctx, routes[ player.routeName ], player.routeDistance, drawArrow );
    } );
    
    ctx.lineWidth = 0.01;
    grid.draw( ctx, '#fffa' );
  }

  // ctx.font = '0.4px Arial';
  // ctx.textBaseline = 'center';
  // ctx.fillText( hoverRouteName, 0, 0 );
}

// canvas.pointerMove = m => {
//   hoverRouteName = Object.keys( routes ).find( name => {
//     const route = routes[ name ];
//     if ( route.center ) {

//     }
//     else {
//       const [ x1, y1 ] = route.start;
//       const [ x2, y2 ] = route.end;

//       const px = x2 - x1;
//       const py = y2 - y1;

//       const u = ( ( m.x - x1 ) * px + ( m.y - y1 ) * py ) / ( ( px * px ) + ( py * py ) );

//       if ( 0 <= u && u <= 1 ) {
//         const hitX = x1 + u * px;
//         const hitY = y1 + u * py;

//         const dist = Math.hypot( hitX - m.x, hitY - m.y );

//         return dist < 0.2;
//       }
//     }
//   } );

//   canvas.redraw();
// };

document.addEventListener( 'keydown', e => {
  if ( e.key == ' ' ) {
    canvas.toggle();
  }
} );

// canvas.start();

function drawOnRoadAtDistance( ctx, road, distance, drawFunc ) {
  if ( road.center ) {
    // Compute angle at distance
    // const sweepAngle = deltaAngle( road.startAngle, road.endAngle );
    // const arcLength = Math.abs( sweepAngle * road.radius );

    // console.log( road );
    // console.log( 'sweepAngle: ' + sweepAngle );

    // We're already calling getLength() before this, just make caller responsible for keeping in bounds

    // // Don't draw if outside arc length
    // if ( 0 <= distance && distance <= arcLength ) {
      const angleOffset = ( distance / road.radius ) * ( road.counterclockwise ? -1 : 1 );
      const angleAtD = road.startAngle + angleOffset;

      // Final point
      const pos = [
        road.center[ 0 ] + road.radius * Math.cos( angleAtD ),
        road.center[ 1 ] + road.radius * Math.sin( angleAtD ),
      ];

      drawFunc( ctx, pos, angleAtD + ( road.counterclockwise ? -1 : 1 ) * Math.PI / 2 );
    // }
  }
  else {
    const total_dist = Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );

    // if ( 0 <= distance && distance <= total_dist ) {
      const pos = [ 0, 1 ].map( 
        i => road.start[ i ] + ( road.end[ i ] - road.start[ i ] ) * ( distance / total_dist )
      );
      
      const angle = Math.atan2( road.end[ 1 ] - road.start[ 1 ], road.end[ 0 ] - road.start[ 0 ] );
      
      drawFunc( ctx, pos, angle );
    // }
  }
}

function getLength( road ) {
  if ( road.center ) {
    let sweepAngle = road.endAngle - road.startAngle;

    if ( !road.counterclockwise && sweepAngle < 0 ) {
      sweepAngle += 2 * Math.PI;
    }
    else if ( road.counterclockwise && sweepAngle > 0 ) {
      sweepAngle -= 2 * Math.PI;
    }

    return Math.abs( sweepAngle * road.radius );
  }
  else {
    return Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );
  }
}

function drawArrow( ctx, pos, angle, width = 0.15, length = 0.3 ) {
  const cos = Math.cos( angle );
  const sin = Math.sin( angle );
  
  ctx.beginPath();
  ctx.moveTo( pos[ 0 ] + width * sin, pos[ 1 ] - width * cos );
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.lineTo( pos[ 0 ] - width * sin, pos[ 1 ] + width * cos );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function randomFrom( array ) {
  return array[ Math.floor( Math.random() * array.length ) ];
}

function randomColor() {
  return `hsl( ${ Math.random() * 360 }deg, ${ Math.random() * 75 + 25 }%, ${ Math.random() * 40 + 40 }% )`;
}

function lineDist( P0, P1 ) {
  return Math.hypot( P1[ 0 ] - P0[ 0 ], P1[ 1 ] - P0[ 1 ] );
}

function lineAngle( P0, P1 ) {
  return Math.atan2( P1[ 1 ] - P0[ 1 ], P1[ 0 ] - P0[ 0 ] );
}