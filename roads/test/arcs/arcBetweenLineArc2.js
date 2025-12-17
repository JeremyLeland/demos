const line = [ 0, 0, 0, 4 ];
const arc = {
  center: [ 0, 0 ],
  radius: 3,
  startAngle: -1,
  endAngle: 1,
  counterclockwise: true,
};


let r3 = 0.5;

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';
import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  ctx.lineWidth = 0.05;
  ctx.strokeStyle = 'white';

  drawLine( ctx, ...line );
  drawArc( ctx, ...arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );

  const lineStart = line.slice( 0, 2 );
  const lineEnd = line.slice( 2, 4 );

  const v1 = vec2.subtract( [], lineEnd, lineStart );
  vec2.normalize( v1, v1 );

  // console.log( `v1 = ${ v1 }` );


  ctx.fillStyle = 'lime';
  drawPoint( ctx, ...lineStart );

  ctx.fillStyle = 'red';
  drawPoint( ctx, ...lineEnd );

  ctx.fillStyle = 'lime';
  drawPoint( ctx, 
    arc.center[ 0 ] + Math.cos( arc.startAngle ) * arc.radius, 
    arc.center[ 1 ] + Math.sin( arc.startAngle ) * arc.radius 
  );

  ctx.fillStyle = 'red';
  drawPoint( ctx, 
    arc.center[ 0 ] + Math.cos( arc.endAngle ) * arc.radius, 
    arc.center[ 1 ] + Math.sin( arc.endAngle ) * arc.radius 
  );
  

  const intersections = Intersections.getArcLineIntersections(
    ...arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
    ...line,
  );

  const colors = [ 'orange', 'pink' ];

  intersections.forEach( ( intersection, index ) => {

    console.log();

    // if ( index != 0 ) {
    //   return;
    // }

    const lineAngle = Math.atan2( v1[ 1 ], v1[ 0 ] );
  
    const arcAngle = fixAngle( 
      Math.atan2( 
        intersection[ 1 ] - arc.center[ 1 ], 
        intersection[ 0 ] - arc.center[ 0 ],
      ) + ( arc.counterclockwise ? -1 : 1 ) * Math.PI / 2 
    );

    const turn = deltaAngle( lineAngle, arcAngle );
    const dot = vec2.dot( v1, vec2.subtract( [], arc.center, intersection ) );

    // If we are closer to the intersection than the desired radius, we want the opposite signs

    // Doesn't work if there's no collision between offsets. 
    // Maybe we should be finding both and using whichever is closest to line start


    const s0 = turn < 0 ? 1 : -1;   // left turn uses positive normal
    const s1 =  dot > 0 ? 1 : -1;   // see if we are moving toward or away from center

    let closestPoint, closestSign, closestIntersectionDist = Infinity, closestLineStartDist = Infinity;

    // TODO: Instead of closest to line, could I prefer sign?

    const lineStart = line.slice( 0, 2 );

    const closestToLine = {
      point: null,
      sign: null,
      dist: Infinity,
    };

    [ -1, 1 ].forEach( sign => {
      const offsetLine = [
        line[ 0 ] + v1[ 1 ] * sign * s0 * r3,
        line[ 1 ] - v1[ 0 ] * sign * s0 * r3,
        line[ 2 ] + v1[ 1 ] * sign * s0 * r3,
        line[ 3 ] - v1[ 0 ] * sign * s0 * r3,
      ];

      ctx.lineWidth = 0.02;
      ctx.strokeStyle = 'tan';
      drawLine( ctx, ...offsetLine );

      ctx.strokeStyle = 'brown';
      drawArc( ctx, ...arc.center, arc.radius + sign * s1 * r3, arc.startAngle, arc.endAngle, arc.counterclockwise );

      const offsetIntersections = Intersections.getArcLineIntersections(
        ...arc.center, arc.radius + sign * s1 * r3, arc.startAngle, arc.endAngle, arc.counterclockwise,
        ...offsetLine,
      );

      console.log( `lineStart = ${ lineStart }` );

      const closestToIntersection = {
        point: null,
        sign: null,
        dist: Infinity,
      };

      offsetIntersections.forEach( testIntersection => {
        const intersectionDist = vec2.distance( testIntersection, intersection );

        // console.log( `intersectionDist = ${ intersectionDist }` );

        if ( intersectionDist < closestToIntersection.dist ) {
          closestToIntersection.point = testIntersection;
          closestToIntersection.sign = sign;
          closestToIntersection.dist = intersectionDist;
        }
      } );

      if ( closestToIntersection.point ) {
        const lineStartDist = vec2.distance( closestToIntersection.point, lineStart );
        
        // console.log( `lineStartDist = ${ lineStartDist }` );
        
        if ( lineStartDist < closestToLine.dist ) {
          closestToLine.point = closestToIntersection.point;
          closestToLine.sign = closestToIntersection.sign;
          closestToLine.dist = lineStartDist;
        }
      }
    } );

    ctx.fillStyle = ctx.strokeStyle = colors[ index ];

    if ( closestToLine.point ) {

      drawPoint( ctx, ...closestToLine.point );
      drawCircle( ctx, ...closestToLine.point, r3 );
      
      const lineTangent = [
        closestToLine.point[ 0 ] - v1[ 1 ] * closestToLine.sign * s0 * r3,
        closestToLine.point[ 1 ] + v1[ 0 ] * closestToLine.sign * s0 * r3,
      ];
      
      const arcTangent = vec2.scaleAndAdd( [], 
        arc.center, 
        vec2.subtract( [], closestToLine.point, arc.center ), 
        arc.radius / ( arc.radius + closestToLine.sign * s1 * r3 )
      );
      
      ctx.fillStyle = 'lime';
      drawPoint( ctx, ...lineTangent );
      ctx.fillStyle = 'red';
      drawPoint( ctx, ...arcTangent );
    }
  } );
}

//
// Draw helpers
//

function drawLine( ctx, x1, y1, x2, y2 ) {
  ctx.beginPath();
  ctx.moveTo( x1, y1 );
  ctx.lineTo( x2, y2 );
  ctx.stroke();
}

function drawCircle( ctx, x, y, r ) {
  drawArc( ctx, x, y, r, 0, Math.PI * 2, false );
}

function drawArc( ctx, x, y, r, startAngle, endAngle, counterclockwise ) {
  ctx.beginPath();
  ctx.arc( x, y, r, startAngle, endAngle, counterclockwise );
  ctx.stroke();
}

function drawPoint( ctx, x, y ) {
  ctx.beginPath();
  ctx.arc( x, y, 0.05, 0, Math.PI * 2 );
  ctx.fill();
}

//
// Angle utils
//
function fixAngle( a ) {
  const TWO_PI = Math.PI * 2;
  
  if ( a > Math.PI ) {
    return a % TWO_PI - TWO_PI;
  }
  else if ( a < -Math.PI ) {
    return a % TWO_PI + TWO_PI;
  }
  else {
    return a;
  }
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

//
// Input
//

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {
    const lineStartDist = vec2.distance( line.slice( 0, 2 ), [ m.x, m.y ] );
    const lineEndDist   = vec2.distance( line.slice( 2, 4 ), [ m.x, m.y ] );

    const DIST = 0.5;

    if ( lineStartDist < DIST ) {
      line[ 0 ] += m.dx;
      line[ 1 ] += m.dy;
    }
    else if ( lineEndDist < DIST ) {
      line[ 2 ] += m.dx;
      line[ 3 ] += m.dy;
    }

    canvas.redraw();
  }
}

// canvas.wheelInput = ( m ) => {
//   const closest = closestCircle( m );

//   if ( closest ) {
//     closest.radius = Math.max( r3, closest.radius + 0.1 * Math.sign( m.wheel ) );
//     canvas.redraw();
//   }
// }

// function closestCircle( m ) {
//   let closest, closestDist = Infinity;

//   circles.forEach( circle => {
//     const dist = Math.hypot( m.x - circle.pos[ 0 ], m.y - circle.pos[ 1 ] );

//     if ( dist < circle.radius && dist < closestDist ) {
//       closest = circle;
//       closestDist = dist;
//     }
//   } );

//   return closest;
// }

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