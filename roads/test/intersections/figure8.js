// Trying a controlled intersection (e.g. stop sign or traffic lights)
// Manually specify routes for now

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const streets = {

}

const routes = {
  loop1: {
    center: [ 3, 3 ],
    radius: 2,
    startAngle: 0,
    endAngle: Math.PI / 2,
    counterclockwise: true,
  },
  start1: {
    start: [ 5, 4.5 ],
    end: [ 5, 3 ],
  },
  end1: {
    start: [ 3, 5 ],
    end: [ 4.5, 5 ],
  },
  loop2: {
    center: [ 7, 7 ],
    radius: 2,
    startAngle: -Math.PI / 2,
    endAngle: Math.PI,
    counterclockwise: false,
  },
  start2: {
    start: [ 5.5, 5 ],
    end: [ 7, 5 ],
  },
  end2: {
    start: [ 5, 7 ],
    end: [ 5, 5.5 ],
  },

  // loop1_TO_loop1_ARC: {
  //   center: [ 4.5, 4.5 ],
  //   radius: 0.5,
  //   startAngle: Math.PI / 2,
  //   endAngle: 0,
  //   counterclockwise: true,
  // },
  // loop1_TO_loop2_LINE1: {
  //   start: [ 4.5, 5 ],
  //   end: [ 5.5, 5 ],
  // },

  // loop2_TO_loop1_LINE1: {
  //   start: [ 5, 5.5 ],
  //   end: [ 5, 4.5 ],
  // },
  // loop2_TO_loop2_ARC: {
  //   center: [ 5.5, 5.5 ],
  //   radius: 0.5,
  //   startAngle: Math.PI,
  //   endAngle: -Math.PI / 2,
  //   counterclockwise: false,
  // }
};

const intersections = {
  middle: {
    timing: {
      duration: 5000,
    },
    paths: {
      end1_TO_start1: {
        from: 'end1',
        to: 'start1',
        timing: {
          start: 1000,
          stop: 2000,
        },
      },
      end1_TO_start2: {
        from: 'end1',
        to: 'start2',
        timing: {
          start: 2000,
          stop: 3000,
        },
      },
      end2_TO_start1: {
        from: 'end2',
        to: 'start1',
        timing: {
          start: 3000,
          stop: 4000,
        },
      },
      end2_TO_start2: {
        from: 'end2',
        to: 'start2',
        timing: {
          start: 4000,
          stop: 5000,
        },
      },
    },
  },
};

// Routes: keep track of the routes making up a connection (e.g. might have line + arc + line)
// Yield: We cannot go if these connections are active (either with a light or with a car in them)
//          - can we figure these out automatially? any routes not ending in our desired end?
//          - also need to avoid routes that cross our path, that's tougher...


// const intersections = {
//   middle: {
//     timing: {
//       total: 5000,
//     },
//     paths: {
//       loop1_TO_loop1: {
//         routes: [ 'loop1_TO_loop1_ARC' ],
//         yield: [ 'loop2_TO_loop1' ],
//         timing: {
//           start: 1000,
//           stop: 2000,
//         },
//       },
//       loop1_TO_loop2: {
//         routes: [ 'loop1_TO_loop2_LINE1' ],
//         yield: [ 'loop2_TO_loop1', 'loop2_TO_loop2' ],
//         timing: {
//           start: 2000,
//           stop: 3000,
//         },
//       },
//       loop2_TO_loop1: {
//         routes: [ 'loop2_TO_loop1_LINE1' ],
//         yield: [ 'loop1_TO_loop1', 'loop1_TO_loop2' ],
//         timing: {
//           start: 3000,
//           stop: 4000,
//         },
//       },
//       loop2_TO_loop2: {
//         routes: [ 'loop2_TO_loop2_ARC' ],
//         yield: [ 'loop1_TO_loop2' ],
//         timing: {
//           start: 4000,
//           stop: 5000,
//         },
//       },
//     },
//   },
// };

// Process simplified intersection definition
Object.entries( intersections ).forEach( ( [ intersectionName, intersection ] ) => {
  
  Object.entries( intersection.paths ).forEach( ( [ pathName, pathInfo ] ) => {
    const from = routes[ pathInfo.from ];
    const to = routes[ pathInfo.to ];

    // const pathName = `${ pathInfo.from }_TO_${ pathInfo.to }`;

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

        intersections[ intersectionName ].paths[ pathName ].routes = [ lineName ];
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

      console.log( arc );

      const arcName = `${ pathName }_ARC`;
      routes[ arcName ] = arc;

      

      intersections[ intersectionName ].paths[ pathName ].routes = [ arcName ];
    }
  } );

  console.log( intersections );
} );

//
// UI to hover intersections for more info
//

let hoverIntersectionName;

const nameDiv = document.createElement( 'div' );
for ( const name of Object.keys( intersections.middle.paths ) ) {
  // const label = document.createTextNode( name );
  // nameDiv.appendChild( label );

  const div = document.createElement( 'div' );
  div.innerText = name;

  div.addEventListener( 'mouseover', _ => {
    hoverIntersectionName = name;
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
  fontSize: '12px'
} );


//
// Drawing
//

let worldTime = 0;

canvas.update = ( dt ) => {
  worldTime += dt;
}

canvas.draw = ( ctx ) => {
  // Routes
  ctx.strokeStyle = '#555a';
  ctx.lineWidth = 0.4;

  ctx.fillStyle = '#ff0a';

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

  const middleTime = worldTime % intersections.middle.timing.duration;

  Object.entries( intersections.middle.paths ).forEach( ( [ name, path ] ) => {

    if ( path.timing.start <= middleTime && middleTime < path.timing.stop ) {
      ctx.strokeStyle = '#0f0a';
    }
    else {
      ctx.strokeStyle = '#f00a';
    }

    path.routes.forEach( routeName => {
      drawRoute( ctx, routes[ routeName ] );
    } );
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
arrowPath.lineTo( 0, 0.125 );
arrowPath.lineTo( 0, -0.125 );
arrowPath.closePath();

function drawArrow( ctx ) {
  ctx.fill( arrowPath );
  // ctx.draw( arrowPath );
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
} );