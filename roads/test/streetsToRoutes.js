import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Arc from '../src/common/Arc.js';

import { vec2 } from '../lib/gl-matrix.js'

// TODO NEXT: 2 lanes for everything, make sure it all still links up correctly

const streets = {
  // first: {
  //   start: [ 1, 2 ],
  //   end: [ 11, 2 ],
  //   lanes: 1,
  // },
  second: {
    start: [ 1, 6 ],
    end: [ 11, 6 ],
    lanes: 2,
  },
  // third: {
  //   start: [ 1, 10 ],
  //   end: [ 11, 10 ],
  //   lanes: 1,
  // },
  // A: {
  //   start: [ 1, 2 ],
  //   end: [ 1, 10 ],
  //   lanes: 1,
  // },
  B: {
    start: [ 6, 2 ],
    end: [ 6, 10 ],
    lanes: 2,
  },
  // C: {
  //   start: [ 11, 2 ],
  //   end: [ 11, 10 ],
  //   lanes: 1,
  // },
};

const LANE_WIDTH = 1;

const routes = makeRoutes( streets );

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
  
  console.log( 'Intersections before:' );
  console.log( intersections );

  let splitIndex = 0;

  intersections.forEach( intersection => {
    const beforeStreets = intersection.streets;
    const afterStreets = [];

    beforeStreets.forEach( beforeStreet => {
      const oldStreet = streets[ beforeStreet ];

      const streetVec = vec2.subtract( [], oldStreet.start, oldStreet.end );
      vec2.normalize( streetVec, streetVec );

      // TODO: Back off by number of lanes in other street
      const numLanes = 2;

      // Don't split if intersection is at start or end, just trim
      if ( lineDist( oldStreet.start, intersection.point ) < 1e-6 ) {
        console.log( `${ intersection.point } is near ${ oldStreet.start } so trimming start` );

        vec2.add( oldStreet.start, oldStreet.start, vec2.scale( [], streetVec, -numLanes * LANE_WIDTH ) );

        afterStreets.push( beforeStreet );
        return;
      }
      if ( lineDist( oldStreet.end, intersection.point ) < 1e-6 ) {
        console.log( `${ intersection.point } is near ${ oldStreet.end } so trimming end` );

        vec2.add( oldStreet.end, oldStreet.end, vec2.scale( [], streetVec, numLanes * LANE_WIDTH ) );

        afterStreets.push( beforeStreet );
        return;
      };

      // TODO: Reference the original street name so we can modify that 
      // instead of constantly appending split numbers (e.g. first_0_4_5_6 )
      // Probably also useful later to get street info like proper name, maybe speed, etc

      const splitA = `${ beforeStreet }_${ splitIndex ++ }`;
      const splitB = `${ beforeStreet }_${ splitIndex ++ }`;

      delete streets[ beforeStreet ];
    
      // TODO: Account for multiple lanes (likely from reference to original street info)

      streets[ splitA ] = {
        start: oldStreet.start, 
        end: vec2.add( [], intersection.point, vec2.scale( [], streetVec, numLanes * LANE_WIDTH ) ),
        lanes: oldStreet.lanes,
      };

      streets[ splitB ] = {
        start: vec2.add( [], intersection.point, vec2.scale( [], streetVec, -numLanes * LANE_WIDTH ) ),
        end: oldStreet.end,
        lanes: oldStreet.lanes,
      };

      afterStreets.push( splitA, splitB );

      // Update all the other intersections
      const streetAngle = lineAngle( oldStreet.start, oldStreet.end );

      intersections.forEach( otherIntersection => {
        if ( intersection == otherIntersection ) {
          return;
        }

        for ( let i = 0; i < otherIntersection.streets.length; i ++ ) {
          if ( otherIntersection.streets[ i ] == beforeStreet ) {
            // TODO: check if intersection point is on splitA or splitB
            //       need to add function to check if point is within line
            //    actually, should just need to project intersection onto street to see if it's positive or negative
            //      (for which side of split it gets)

            // TODO: How would we handle this for arcs? Would need in terms of angles or distance

            const intersectionAngle = lineAngle( intersection.point, otherIntersection.point );

            if ( Math.abs( intersectionAngle - streetAngle ) < 0.1 ) {
              console.log( `${ otherIntersection.point } is ahead of ${ intersection.point }, so setting to splitB` );
              otherIntersection.streets[ i ] = splitB;
            }
            else {
              console.log( `${ otherIntersection.point } is behind ${ intersection.point }, so setting to splitA` );
              otherIntersection.streets[ i ] = splitA;
            }
          }
        }
      } );
    } );

    intersection.streets = afterStreets;
  } );

  console.log( 'Intersections after splits:' );
  console.log( intersections );

  console.log( 'Streets after splits:' );
  console.log( streets );

  
  // 2. Create lanes
  const routes = {};

  for ( const [ name, street ] of Object.entries( streets ) ) {
    const streetDX = street.end[ 0 ] - street.start[ 0 ];
    const streetDY = street.end[ 1 ] - street.start[ 1 ];

    const angle = Math.atan2( streetDY, streetDX );
    const cos = Math.cos( angle );
    const sin = Math.sin( angle );

    // Generate lanes pattern (this might get more complicated later with extra lanes on one direction, turning lanes, etc)
    const lanes = [];
    for ( let i = -street.lanes; i < 0; i ++ ) {
      lanes.push( i );
    }

    for ( let i = 1; i <= street.lanes; i ++ ) {
      lanes.push( i );
    }

    street.routes = [];     // link lanes to parent street so we can find them for connecting intersections
    
    lanes.forEach( laneIndex => {

      const offset = ( Math.sign( laneIndex ) * -0.5 + laneIndex ) * LANE_WIDTH;

      const A = [ street.start[ 0 ] + offset * -sin, street.start[ 1 ] + offset * cos ];
      const B = [   street.end[ 0 ] + offset * -sin,   street.end[ 1 ] + offset * cos ];
      
      const route = {
        start: laneIndex < 0 ? B : A,
        end:   laneIndex < 0 ? A : B,
      };

      const routeDX = route.end[ 0 ] - route.start[ 0 ];
      const routeDY = route.end[ 1 ] - route.start[ 1 ];

      const dir = Math.abs( streetDX ) > Math.abs( streetDY ) ? ( routeDX < 0 ? 'WEST' : 'EAST' ) : ( routeDY < 0 ? 'NORTH' : 'SOUTH' );
      const newName = `${ name }_${ dir }_lane${ Math.abs( laneIndex ) }`;

      // console.log( `${ newName }: ${ JSON.stringify( route ) }` );

      routes[ newName ] = route;

      street.routes.push( newName );
    } );
  }

  // 3. Link routes from intersections
  intersections.forEach( intersection => {
    for ( let i = 0; i < intersection.streets.length - 1; i ++ ) {
      for ( let j = i + 1; j < intersection.streets.length; j ++ ) {
        const thisStreet = streets[ intersection.streets[ i ] ];
        const otherStreet = streets[ intersection.streets[ j ] ];

        // Our "ideal" orientation is from.end intersecting with to.start
        // If this isn't the case, account for the backwards line

        const thisBackwards = lineDist( thisStreet.start, intersection.point ) < lineDist( thisStreet.end, intersection.point );
        const otherBackwards = lineDist( otherStreet.end, intersection.point ) < lineDist( otherStreet.start, intersection.point );

        console.log( 'fromBackwards: ' + thisBackwards + ', toBackwards: ' + otherBackwards );

        const thisRoutes = thisStreet.routes;
        const otherRoutes = otherStreet.routes;

        // TODO: Account for number of lanes (instead of assuming 1)
        const numLanes = 2;

        for ( let k = 0; k < numLanes * 2; k ++ ) {
          const thisIndex  = thisBackwards  ? numLanes * 2 - 1 - k : k;
          const otherIndex = otherBackwards ? numLanes * 2 - 1 - k : k;

          const from = k < numLanes ? otherRoutes[ otherIndex ] : thisRoutes[ thisIndex ];
          const to   = k < numLanes ? thisRoutes[ thisIndex ]   : otherRoutes[ otherIndex ];

          joinRoutes( routes, from, to );
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

  const newName = `${ fromName }_to_${ toName }`;
  route1.next ??= [];
  route1.next.push( newName );
  
  // Check if roads are on same line
  const [ x1, y1 ] = route1.start;
  const [ x2, y2 ] = route1.end;
  const [ x3, y3 ] = route2.start;
  const [ x4, y4 ] = route2.end;

  if ( ( y3 - y1 ) * ( x2 - x1 ) == ( y2 - y1 ) * ( x3 - x1 ) ) {
    const line = {
      start: route1.end,
      end: route2.start,
    };
    routes[ newName ] = line;
    line.next = [ toName ];
  }
  else {
    const arc = Arc.getArcBetweenLines( x1, y1, x2, y2, x3, y3, x4, y4 );
    routes[ newName ] = arc;
    arc.next = [ toName ];
    
    // Adjust roads to properly attach to arc
    route1.end = [
      arc.center[ 0 ] + arc.radius * Math.cos( arc.startAngle ),
      arc.center[ 1 ] + arc.radius * Math.sin( arc.startAngle ),
    ];
    
    route2.start = [
      arc.center[ 0 ] + arc.radius * Math.cos( arc.endAngle ),
      arc.center[ 1 ] + arc.radius * Math.sin( arc.endAngle ),
    ];
  }
}

console.log( 'Routes:' );
console.log( routes );

console.log( 'Streets with routes:' );
console.log( streets );

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
canvas.bounds = [ -0.5, -0.5, 12.5, 12.5 ];

const grid = new Grid( 0, 0, 12, 12 );

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
      ctx.fillStyle = ctx.strokeStyle = '#ff08';
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