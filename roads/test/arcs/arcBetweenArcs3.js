// Find the correct arc to join two other arcs

const pairs = [
  // 1
  [
    { 
      center: [ 2, 3 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 1,
      counterclockwise: false,
    },
    { 
      center: [ 4, 2 ], 
      radius: 2,
      startAngle: 1,
      endAngle: -2,
      counterclockwise: false,
    },
  ],
  [
    { 
      center: [ 7, 3 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: false,
    },
    { 
      center: [ 5, 2 ], 
      radius: 2,
      startAngle: 1,
      endAngle: -1,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 12, 3 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: false,
    },
    { 
      center: [ 14, 2 ], 
      radius: 2,
      startAngle: -2,
      endAngle: 2,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 17, 3 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: false,
    },
    { 
      center: [ 15, 2 ], 
      radius: 2,
      startAngle: -1,
      endAngle: 1,
      counterclockwise: false,
    },
  ],

  // 2
  [
    { 
      center: [ 2, 7 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: true,
    },
    { 
      center: [ 4, 6 ], 
      radius: 2,
      startAngle: 2,
      endAngle: -2,
      counterclockwise: false,
    },
  ],
  [
    { 
      center: [ 7, 7 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: true,
    },
    { 
      center: [ 5, 6 ], 
      radius: 2,
      startAngle: 1,
      endAngle: -1,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 12, 7 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: true,
    },
    { 
      center: [ 14, 6 ], 
      radius: 2,
      startAngle: -2,
      endAngle: 2,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 17, 7 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: true,
    },
    { 
      center: [ 15, 6 ], 
      radius: 2,
      startAngle: -1,
      endAngle: 1,
      counterclockwise: false,
    },
  ],

  // 3
  [
    { 
      center: [ 2, 10 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: true,
    },
    { 
      center: [ 4, 11 ], 
      radius: 2,
      startAngle: 2,
      endAngle: -2,
      counterclockwise: false,
    },
  ],
  [
    { 
      center: [ 7, 10 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: true,
    },
    { 
      center: [ 5, 11 ], 
      radius: 2,
      startAngle: 1,
      endAngle: -1,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 12, 10 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: true,
    },
    { 
      center: [ 14, 11 ], 
      radius: 2,
      startAngle: -2,
      endAngle: 2,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 17, 10 ], 
      radius: 2,
      startAngle: -3,
      endAngle: 0,
      counterclockwise: true,
    },
    { 
      center: [ 15, 11 ], 
      radius: 2,
      startAngle: -1,
      endAngle: 1,
      counterclockwise: false,
    },
  ],

  // 4
  [
    { 
      center: [ 2, 15 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: false,
    },
    { 
      center: [ 4, 16 ], 
      radius: 2,
      startAngle: 2,
      endAngle: -2,
      counterclockwise: false,
    },
  ],
  [
    { 
      center: [ 7, 15 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: false,
    },
    { 
      center: [ 5, 16 ], 
      radius: 2,
      startAngle: 1,
      endAngle: -1,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 12, 15 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: false,
    },
    { 
      center: [ 14, 16 ], 
      radius: 2,
      startAngle: -2,
      endAngle: 2,
      counterclockwise: true,
    },
  ],
  [
    { 
      center: [ 17, 15 ], 
      radius: 2,
      startAngle: 0,
      endAngle: -3,
      counterclockwise: false,
    },
    { 
      center: [ 15, 16 ], 
      radius: 2,
      startAngle: -1,
      endAngle: 1,
      counterclockwise: false,
    },
  ],
];

let r3 = 0.5;

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 20, 20 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  // grid.draw( ctx );

  ctx.lineWidth = 0.05;
  ctx.strokeStyle = 'white';

  pairs.forEach( pair => {
    pair.forEach( ( arc, index ) => {
      ctx.strokeStyle = index == 0 ? 'white' : 'gray';

      drawArc( ctx, ...arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );

      const roadLength = getRouteLength( arc );

      ctx.fillStyle = '#ff08';
      for ( let length = 0; length < roadLength; length += 0.25 ) {
        drawOnRouteAtDistance( ctx, arc, length, drawArrow );
      }
    } );

    // TODO: What's a good radius to use? Should it be based on size of circles? Or size of road?
    // Previous one was using the size of the overlap region
    // Also, should it be the same for all quadrents? Or does it look better if bigger for some, smaller for others?
    // Maybe we should try to make it so all the tangent points line up?
    //  - It'll be different streets trying to connect, though, so maybe it doesn't matter? Or will it?
    // const r3 = 0.5;

    const arcs = getArcsBetweenArcs( ...pair );

    arcs.forEach( arc => {
      drawArc( ctx, ...arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );

      const roadLength = getRouteLength( arc );

      ctx.fillStyle = '#ff08';
      for ( let length = 0; length < roadLength; length += 0.25 ) {
        drawOnRouteAtDistance( ctx, arc, length, drawArrow );
      }
    } );
  } );
}

function getArcsBetweenArcs( arc1, arc2 ) {
  const intersections = Intersections.getArcArcIntersections(
    ...arc1.center, arc1.radius, arc1.startAngle, arc1.endAngle, arc1.counterclockwise,
    ...arc2.center, arc2.radius, arc2.startAngle, arc2.endAngle, arc2.counterclockwise,
  );

  return intersections.map( intersection => {
    const angles = [ arc1, arc2 ].map( a =>
      Math.atan2( intersection[ 1 ] - a.center[ 1 ], intersection[ 0 ] - a.center[ 0 ] ) + ( a.counterclockwise ? -1 : 1 ) * Math.PI / 2
    );

    const turn = deltaAngle( ...angles );

    const signs = [ arc1, arc2 ].map( a => turn < 0 == !a.counterclockwise ? 1 : -1 ); 

    const offsetIntersections = Intersections.getArcArcIntersections(
      ...arc1.center, arc1.radius + signs[ 0 ] * r3, arc1.startAngle, arc1.endAngle, arc1.counterclockwise,
      ...arc2.center, arc2.radius + signs[ 1 ] * r3, arc2.startAngle, arc2.endAngle, arc2.counterclockwise,
    );

    // Handle multiple intersections here (take the closest)
    let closest, closestDist = Infinity;

    offsetIntersections.forEach( offInt => {
      const dist = Math.hypot( offInt[ 0 ] - intersection[ 0 ], offInt[ 1 ] - intersection[ 1 ] );
      if ( dist < closestDist ) {
        closest = offInt;
        closestDist = dist;
      }
    } );

    const tangents = [ arc1, arc2 ].map( ( arc, index ) =>
      vec2.scaleAndAdd( [],
        arc.center,
        vec2.subtract( [], closest, arc.center ), 
        arc.radius / ( arc.radius + signs[ index ] * r3 )
      )
    );

    const tangles = tangents.map( t => Math.atan2( t[ 1 ] - closest[ 1 ], t[ 0 ] - closest[ 0 ] ) );

    return {
      center: closest,
      radius: r3,
      startAngle: tangles[ 0 ],
      endAngle: tangles[ 1 ],
      counterclockwise: turn < 0,
    }
  } );
}


const TWO_PI = Math.PI * 2;

function fixAngle( a ) {
  if ( a > Math.PI ) {
    return a % TWO_PI - TWO_PI;
  }
  else if ( a < -Math.PI ) {
    return a % TWO_PI + TWO_PI;
  }
  else {
    return a;
  }
  // return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

function drawArc( ctx, x, y, r, start, end, counterclockwise ) {
  ctx.beginPath();
  ctx.arc( x, y, r, start, end, counterclockwise );
  ctx.stroke();
}

function drawCircle( ctx, x, y, r ) {
  ctx.beginPath();
  ctx.arc( x, y, r, 0, Math.PI * 2 );
  ctx.stroke();
}

function drawPoint( ctx, x, y ) {
  ctx.beginPath();
  ctx.arc( x, y, 0.05, 0, Math.PI * 2 );
  ctx.fill();
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

//
// Input
//

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {
    const closest = closestCircle( m );

    if ( closest ) {
      closest.pos[ 0 ] += m.dx;
      closest.pos[ 1 ] += m.dy;

      canvas.redraw();
    }
  }
}

canvas.wheelInput = ( m ) => {
  const closest = closestCircle( m );

  if ( closest ) {
    closest.radius = Math.max( r3, closest.radius + 0.1 * Math.sign( m.wheel ) );
    canvas.redraw();
  }
}

function closestCircle( m ) {
  let closest, closestDist = Infinity;

  pairs.forEach( circle => {
    const dist = Math.hypot( m.x - circle.pos[ 0 ], m.y - circle.pos[ 1 ] );

    if ( dist < circle.radius && dist < closestDist ) {
      closest = circle;
      closestDist = dist;
    }
  } );

  return closest;
}

//
// Slider
//
const r3Slider = document.createElement( 'input' );

Object.assign( r3Slider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( r3Slider, {
  type: 'range',
  min: 0,
  max: 1,
  step: 0.01,
  value: r3,
} );

document.body.appendChild( r3Slider );

r3Slider.addEventListener( 'input', _ => {
  r3 = +r3Slider.value;

  canvas.redraw();
} );
