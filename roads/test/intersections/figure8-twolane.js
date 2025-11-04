// Manaully making an intersection of a two-way road

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 12, 12 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const streets = {

}

const routes = {
  loop1_left: {
    center: [ 3, 3 ],
    radius: 2,
    startAngle: Math.PI / 2,
    endAngle: 0,
    counterclockwise: false,
    next: [ 'end1_left' ],
  },
  loop1_right: {
    center: [ 3, 3 ],
    radius: 3,
    startAngle: 0,
    endAngle: Math.PI / 2,
    counterclockwise: true,
    next: [ 'end1_right' ],
  },
  start1_left: {
    start: [ 4.5, 5 ],
    end: [ 3, 5 ],
    next: [ 'loop1_left' ],
  },
  start1_right: {
    start: [ 6, 4.5 ],
    end: [ 6, 3 ],
    next: [ 'loop1_right' ],
  },
  end1_left: {
    start: [ 5, 3 ],
    end: [ 5, 4.5 ],
  },
  end1_right: {
    start: [ 3, 6 ],
    end: [ 4.5, 6 ],
  },
  loop2_left: {
    center: [ 8, 8 ],
    radius: 2,
    startAngle: -Math.PI / 2,
    endAngle: Math.PI,
    counterclockwise: false,
    next: [ 'end2_left' ],
  },
  loop2_right: {
    center: [ 8, 8 ],
    radius: 3,
    startAngle: Math.PI,
    endAngle: -Math.PI / 2,
    counterclockwise: true,
    next: [ 'end2_right' ],
  },
  start2_left: {
    start: [ 6.5, 6 ],
    end: [ 8, 6 ],
    next: [ 'loop2_left' ],
  },
  start2_right: {
    start: [ 5, 6.5 ],
    end: [ 5, 8 ],
    next: [ 'loop2_right' ],
  },
  end2_left: {
    start: [ 6, 8 ],
    end: [ 6, 6.5 ],
  },
  end2_right: {
    start: [ 8, 5 ],
    end: [ 6.5, 5 ],
  },
};


// [
//   [ 'first_above', 'A' ],
//   [ 'A', 'second_above' ],

//   // if we don't do intersections for this
//     // [ 'B', 'first_above' ],
//     // [ 'second_above', 'B' ],


//   [ 'first_below', 'C' ],
//   [ 'C', 'second_below' ],
// ].forEach( pair => {
//   joinRoutes( routes, ...pair );
// } );

const intersections = {
  middle: {
    timing: {
      duration: 4000,
    },
    paths: {

      North_West: {
        from: 'end2_left',
        to: 'start1_left',
        timing: {
          start: 0,
          stop: 1000,
        },
      },
      North: {
        from: 'end2_left',
        to: 'start1_right',
        timing: {
          start: 0,
          stop: 1000,
        },
      },
      North_East: {
        from: 'end2_left',
        to: 'start2_left',
        timing: {
          start: 0,
          stop: 1000,
        },
      },

      East_North: {
        from: 'end1_right',
        to: 'start1_right',
        timing: {
          start: 1000,
          stop: 2000,
        },
      },
      East: {
        from: 'end1_right',
        to: 'start2_left',
        timing: {
          start: 1000,
          stop: 2000,
        },
      },
      East_South: {
        from: 'end1_right',
        to: 'start2_right',
        timing: {
          start: 1000,
          stop: 2000,
        },
      },

      South_East: {
        from: 'end1_left',
        to: 'start2_left',
        timing: {
          start: 2000,
          stop: 3000,
        },
      },
      South: {
        from: 'end1_left',
        to: 'start2_right',
        timing: {
          start: 2000,
          stop: 3000,
        },
      },
      South_West: {
        from: 'end1_left',
        to: 'start1_left',
        timing: {
          start: 2000,
          stop: 3000,
        },
      },

      West_South: {
        from: 'end2_right',
        to: 'start2_right',
        timing: {
          start: 3000,
          stop: 4000,
        },
      },
      West: {
        from: 'end2_right',
        to: 'start1_left',
        timing: {
          start: 3000,
          stop: 4000,
        },
      },
      West_North: {
        from: 'end2_right',
        to: 'start1_right',
        timing: {
          start: 3000,
          stop: 4000,
        },
      },      
    },
  },
};


const NUM_PLAYERS = 10;
const CAR_SIZE = 0.25;

const PLAYER_SPEED = 0.005;

const players = Array.from( Array( NUM_PLAYERS ), ( _, index ) => { 
  const routeName = randomFrom( Object.keys( routes ) );

  return {
    color: randomColor(),
    speed: 0,
    routeName: routeName,
    routeDistance: Math.random() * getRouteLength( routes[ routeName ] ),
    
    index: index, // for debug

    path: null,//path,
    goalRouteName: null,//path[ path.length - 1 ],
    goalRouteDistance: null,//0.5 /*Math.random()*/ * getRouteLength( routes[ path[ path.length - 1 ] ] ),
  };
} );


// Join the two named routes from the given list
// Return list of created path names

function joinRoutes( routes, fromName, toName ) {
  const from = routes[ fromName ];
  const to = routes[ toName ];

  const pathName = `${ fromName }_TO_${ toName }`;

  // TODO: Find arc between, if applicable

  // Center of arc will be on bisector of angle formed by two lines

  // const v0 = vec2.subtract( [], from.start, from.end );
  const A = vec2.subtract( [], from.end, from.start );
  const B = vec2.subtract( [], to.end, to.start );
  const C = vec2.subtract( [], to.start, from.start );

  const A_cross_B = A[ 0 ] * B[ 1 ] - A[ 1 ] * B[ 0 ];
  const C_cross_A = C[ 0 ] * A[ 1 ] - C[ 1 ] * A[ 0 ];

  if ( A_cross_B == 0 ) {
    if ( C_cross_A == 0 ) {
      const line = {
        start: from.end,
        end: to.start,
      };

      const lineName = `${ pathName }_LINE`;
      routes[ lineName ] = line;

      routes[ fromName ].next ??= [];
      routes[ fromName ].next.push( lineName );
      routes[ lineName ].next = [ toName ];

      // intersections[ intersectionName ].paths[ pathName ].routes = [ lineName ];
      return [ lineName ];
    }
    else {
      // Parallel
    }
  }
  else {
    const u = ( C[ 0 ] * B[ 1 ] - C[ 1 ] * B[ 0 ] ) / A_cross_B;

    const intersection = vec2.scaleAndAdd( [], from.start, A, u );

    vec2.normalize( A, A );
    vec2.normalize( B, B );
    
    const angleBetween = vec2.angle( A, B );

    const dist = vec2.distance( from.end, intersection );
    const radius = dist / ( Math.tan( angleBetween / 2 ) );
    const centerDistance = radius / Math.sin( angleBetween / 2 );
    
    // Reverse A to give us the proper bisector between vectors
    const bisector = vec2.scaleAndAdd( [], B, A, -1 );
    vec2.normalize( bisector, bisector );

    const center = vec2.scaleAndAdd( [], intersection, bisector, centerDistance );

    // Compute start and end angles
    const tangentDist = radius / ( Math.tan( angleBetween / 2 ) );
    const start = vec2.scaleAndAdd( [], intersection, A, -tangentDist );  // reversing A again
    const end   = vec2.scaleAndAdd( [], intersection, B,  tangentDist );

    const startAngle = Math.atan2( start[ 1 ] - center[ 1 ], start[ 0 ] - center[ 0 ] );
    const endAngle = Math.atan2( end[ 1 ] - center[ 1 ], end[ 0 ] - center[ 0 ] );
    
    const arc = {
      center: center,
      radius: radius,
      startAngle: startAngle,
      endAngle: endAngle,
      counterclockwise: A_cross_B < 0,
    };

    // console.log( arc );

    const arcName = `${ pathName }_ARC`;
    routes[ arcName ] = arc;

    routes[ fromName ].next ??= [];
    routes[ fromName ].next.push( arcName );

    routes[ arcName ].next = [ toName ];

    // intersections[ intersectionName ].paths[ pathName ].routes = [ arcName ];

    return [ arcName ];
  }
}

// Process simplified intersection definition
Object.entries( intersections ).forEach( ( [ intersectionName, intersection ] ) => {
  Object.entries( intersection.paths ).forEach( ( [ pathName, pathInfo ] ) => {
    // Some routes are manually specified for testing and don't have from/to
    if ( pathInfo.from && pathInfo.to ) {
      const pathNames = joinRoutes( routes, pathInfo.from, pathInfo.to );
      intersections[ intersectionName ].paths[ pathName ].routes = pathNames;
    }
  } );

  // console.log( routes );
  // console.log( intersections );
} );

//
// UI to hover intersections for more info
//

let hoverIntersectionName;

// const nameDiv = document.createElement( 'div' );
// for ( const name of Object.keys( intersections.middle.paths ) ) {
//   // const label = document.createTextNode( name );
//   // nameDiv.appendChild( label );

//   const div = document.createElement( 'div' );
//   div.innerText = name;

//   div.addEventListener( 'mouseover', _ => {
//     hoverIntersectionName = name;
//     canvas.redraw();
//   } );

//   nameDiv.appendChild( div );
// }

// document.body.appendChild( nameDiv );

// Object.assign( nameDiv.style, {
//   position: 'absolute',
//   left: 0,
//   top: 0,
//   height: '100%',
//   overflow: 'scroll',
//   fontSize: '12px'
// } );


//
// Update
//

let worldTime = 0;

const FOLLOW_DISTANCE = 0.5;
const CHECK_DISTANCE = 1;

canvas.update = ( dt ) => {
  worldTime += dt;

  // Make sure every player has a route first
  players.forEach( player => {
    // TEMP: routing -- pick (and save) a random next route for now
    if ( !player.path || player.path.length < 2 ) {
      player.path = getRandomPath( routes, player.routeName, 3 );
      player.goalRouteName = player.path[ player.path.length - 1 ];
      player.goalRouteDistance = Math.random() * getRouteLength( routes[ player.goalRouteName ] );
    }
  } );
  
  // Find player speeds for next update based on how far they are from other players, intersections, etc
  players.forEach( player => {
    
    // We need to check ahead for players, or we'll quiver when we're near a road boundry
    // Maybe just check all the forks with depth of 1 for now? 
    // Doesn't work if FOLLOW_DISTANCE is longer than route length...

    const routeDist = closestDistanceRoutes( player );
    const carDist = closestDistanceCars( player, 0, player.routeName );
    
    // if ( player.index == 0 ) {
    //   console.log( `route dist = ${ routeDist }` );
    //   console.log( `car dist = ${ carDist }` );
    // }

    const closestDist = Math.min( routeDist, carDist );

    player.speed = Math.tanh( 3 * closestDist ) * PLAYER_SPEED;
  } );

  players.forEach( player => {
    let desiredDistance = player.routeDistance + player.speed * dt;
    let desiredRouteName = player.routeName;

    // player.routeDistance += player.speed * dt;
    
    for ( let i = 0; i < 10; i ++ ) {
      const route = routes[ desiredRouteName ];
      const length = getRouteLength( route );

      if ( desiredDistance > length ) {
        desiredDistance -= length;

        player.path.shift();

        // TODO: How to handle this when we've reached end of desired path?
        if ( player.path.length == 0 ) {
          console.log( `path is empty?!? shouldn't happen` );
          debugger;
        }

        desiredRouteName = player.path[ 0 ];
      }
      else {
        player.routeDistance = desiredDistance;
        player.routeName = desiredRouteName;
        break;
      }
    }
  } );
}

function closestDistanceRoutes( player ) {
  let previousDistance = 0;

  let closestDist = Infinity;

  player.path.find( routeName => {
    Object.values( intersections ).forEach( intersection => {

      
      const intersectionPath = Object.values( intersection.paths ).find( p => p.routes.includes( routeName ) );
      if ( intersectionPath ) {
        
        // Open based on yield
        intersectionPath.yield?.forEach( yieldPathName => {
          if ( players.find( p => intersection.paths[ yieldPathName ].routes.includes( p.routeName ) ) ) {

            // TODO: Don't duplicate this chunk of code from below
            const dist = previousDistance - player.routeDistance - CAR_SIZE;

            // Ignore negative dists so we don't try to back out of an intersection
            if ( 0 <= dist && dist < closestDist ) {
              closestDist = dist;
            }
          }
        } );
  
        
        // Open based on timing
        if ( intersection.timing && intersectionPath.timing ) {
          const time = worldTime % intersection.timing.duration;
          
          if ( time < intersectionPath.timing.start || intersectionPath.timing.stop <= time ) {
            const dist = previousDistance - player.routeDistance - CAR_SIZE;
            
            // Ignore negative dists so we don't try to back out of an intersection
            if ( 0 <= dist && dist < closestDist ) {
              closestDist = dist;
            }
          }
        }
      }
    } );

    // Check against end of path
    if ( routeName == player.goalRouteName ) {
      const dist = previousDistance + player.goalRouteDistance - player.routeDistance;

      if ( dist < closestDist ) {
        closestDist = dist;
      }
    }

    if ( closestDist < Infinity ) {
      return true;
    }
    else { 
      const route = routes[ routeName ];
      const length = getRouteLength( route );
      
      previousDistance += length;
    }
  } );

  return closestDist;
}

function closestDistanceCars( player, previousDistance, routeName ) {

  let closestDist = Infinity;

  // Find players (not us) in this route, check distances
  players.forEach( other => {
    if ( player != other && routeName == other.routeName ) {

      const otherDist = previousDistance + other.routeDistance;

      if ( player.routeDistance < otherDist ) {
        const dist = otherDist - player.routeDistance - CAR_SIZE * 2 - FOLLOW_DISTANCE

        if ( dist < closestDist ) {
          closestDist = dist;
        }
      }
    }
  } );

  if ( closestDist == Infinity ) {
    const route = routes[ routeName ];
    const length = getRouteLength( route );
  
    if ( player.routeDistance + CHECK_DISTANCE > previousDistance + length ) {
      route.next.forEach( nextRouteName => {
        const dist = closestDistanceCars( player, previousDistance + length, nextRouteName );

        if ( dist < closestDist ) {
          closestDist = dist;
        }
      } );
    } 
  }

  return closestDist;
}

function getRandomPath( routes, start, steps ) {
  const path = [ start ];

  for ( let i = 0; i < steps; i ++ ) {
    const route = routes[ path[ i ] ];
    const next = randomFrom( route.next );

    path.push( next );
  }

  return path;
}

//
// Drawing
//

canvas.draw = ( ctx ) => {
  // Routes
  ctx.strokeStyle = '#555a';
  ctx.lineWidth = 0.8;

  ctx.fillStyle = '#ff08';

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    drawRoute( ctx, route );

    const roadLength = getRouteLength( route );
      
    for ( let length = 0; length < roadLength; length += 0.5 ) {
      drawOnRouteAtDistance( ctx, route, length, drawArrow );
    }
  } );

  // // Intersection debug
  // if ( hoverIntersectionName ) {
  //   const intersection = intersections.middle[ hoverIntersectionName ];

  //   ctx.strokeStyle = '#f00a';
  //   intersection.yield.forEach( yieldName => {
  //     intersections.middle[ yieldName ].routes.forEach( routeName => {
  //       drawRoute( ctx, routes[ routeName ] );
  //     } );
  //   } );

  //   ctx.strokeStyle = '#0f0a';
  //   intersection.routes.forEach( routeName => {
  //     drawRoute( ctx, routes[ routeName ] );
  //   } );
  // }

  // Debug intersection timing
  Object.entries( intersections ).forEach( ( [ intersectionName, intersection ] ) => {
    const time = worldTime % intersection.timing.duration;

    Object.entries( intersection.paths ).forEach( ( [ name, path ] ) => {
      if ( path.timing ) {

        if ( path.timing.start <= time && time < path.timing.stop ) {
          ctx.strokeStyle = '#0f04';
        }
        else {
          ctx.strokeStyle = '#f000';
        }
        
        path.routes.forEach( routeName => {
          drawRoute( ctx, routes[ routeName ] );
        } );
      }
    } );
  } );

  players.forEach( player => {
    ctx.fillStyle = player.color;
    drawOnRouteAtDistance( ctx, routes[ player.routeName ], player.routeDistance, drawCar );

    ctx.beginPath();

    player.path?.forEach( routeName => {
      const route = routes[ routeName ];

      if ( route.center ) {
        const startAngle = routeName == player.routeName ?
          route.startAngle + ( player.routeDistance / route.radius ) * ( route.counterclockwise ? -1 : 1 ) :
          route.startAngle;

        const endAngle = routeName == player.goalRouteName ?
          route.startAngle + ( player.goalRouteDistance / route.radius ) * ( route.counterclockwise ? -1 : 1 ) :
          route.endAngle;

        ctx.arc( route.center[ 0 ], route.center[ 1 ], route.radius, startAngle, endAngle, route.counterclockwise );
      }
      else {
        const lineVec = vec2.subtract( [], route.end, route.start );
        vec2.normalize( lineVec, lineVec );
        
        if ( routeName == player.routeName ) {
          const pos = vec2.scaleAndAdd( [], route.start, lineVec, player.routeDistance );
          ctx.lineTo( ...pos );
        }
        else {
          ctx.lineTo( ...route.start );
        }

        if ( routeName == player.goalRouteName ) {
          const pos = vec2.scaleAndAdd( [], route.start, lineVec, player.goalRouteDistance );
          ctx.lineTo( ...pos );
        }
        else {
          ctx.lineTo( ...route.end );
        }
      }
    } );
      
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 0.05;
    // ctx.setLineDash( [ 0.1, 0.1 ] );
    ctx.stroke();
    

  } );
  

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.02;
  grid.draw( ctx );
}

function drawRoute( ctx, route ) {
  ctx.beginPath();

  if ( route.center ) {
    ctx.arc( route.center[ 0 ], route.center[ 1 ], route.radius, route.startAngle, route.endAngle, route.counterclockwise );
  }
  else {
    ctx.moveTo( ...route.start );
    ctx.lineTo( ...route.end );
  }

  ctx.stroke();
}

const arrowPath = new Path2D();
arrowPath.moveTo( 0.25, 0 );
arrowPath.lineTo( 0, 0.1 );
arrowPath.lineTo( 0, -0.1 );
arrowPath.closePath();

function drawArrow( ctx ) {
  ctx.fill( arrowPath );
  // ctx.draw( arrowPath );
}

const carPath = new Path2D();
carPath.moveTo( 0.25, -0.15 );
carPath.lineTo( 0.25, 0.15 );
carPath.lineTo( -0.25, 0.2 );
carPath.lineTo( -0.25, -0.2 );
carPath.closePath();

function drawCar( ctx ) {
  ctx.fill( carPath );

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.02;
  ctx.stroke( carPath );
}

function getRouteLength( route ) {
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

function drawOnRouteAtDistance( ctx, route, distance, drawFunc ) {

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

  ctx.save();

  ctx.translate( ...pos );
  ctx.rotate( angle );

  drawFunc( ctx );

  ctx.restore();
}

document.addEventListener( 'keydown', e => {
  if ( e.key == ' ' ) {
    canvas.toggle();
  }
  else {
    canvas.update( 100 );
    canvas.redraw();
  }
} );

function randomFrom( array ) {
  return array[ Math.floor( Math.random() * array.length ) ];
}

function randomColor() {
  return `hsl( ${ Math.random() * 360 }deg, ${ Math.random() * 75 + 25 }%, ${ Math.random() * 40 + 40 }% )`;
}

//
// Slider
//
const timeSlider = document.createElement( 'input' );

Object.assign( timeSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( timeSlider, {
  type: 'range',
  value: 0,
  min: 0,
  max: intersections.middle.timing.duration,
  step: 0.01,
} );

document.body.appendChild( timeSlider );

timeSlider.addEventListener( 'input', _ => {
  worldTime = +timeSlider.value;

  canvas.redraw();
} );