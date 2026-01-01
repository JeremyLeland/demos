// TODO: Trying to better handle cases with <4 valid fillets
// Instead of relying on distance from intersection, maybe 
// look at the direction of intersection in regards to circle?

const streets = {
  // line1: {
  //   start: [ -4, -3 ],
  //   end: [ -1, 2 ],
  // },
  // line2: {
  //   start: [ -1, -4 ],
  //   end: [ -4, -2 ],
  // },
  line3: {
    start: [ 0, 4 ], 
    end: [ 0, -3.4 ],
  },
  arc1: {
    center: [ 0, 0 ],
    radius: 3,
    startAngle: -1,
    endAngle: 1,
    counterclockwise: true,
  },
  // arc2: {
  //   center: [ -2, 2 ],
  //   radius: 2,
  //   startAngle: 2,
  //   endAngle: 0,
  //   counterclockwise: false,
  // },
};

const controlPoints = {};

for ( const [ name, street ] of Object.entries( streets ) ) {
  if ( street.center ) {
    controlPoints[ name ] = {
      center: street.center,
      startAngle: getStartPoint( street ),
      endAngle: getEndPoint( street ),
    };
  }
  else {
    controlPoints[ name ] = {
      start: street.start,
      end: street.end,
    };
  }
}


let r3 = 0.5;

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';
import * as Arc from '../../src/common/Arc.js';
import { vec2 } from '../../lib/gl-matrix.js';

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  const streetList = Object.values( streets );

  streetList.forEach( street => drawStreet( ctx, street ) );

  drawControlPoints( ctx );
  
  const A = streets.line3;
  const B = streets.arc1;

  // streetList.forEach( A => {
  //   streetList.forEach( B => {
  //     if ( A != B ) {
        const intersections = getIntersections( A, B );

        const colors = [ 'orange', 'pink' ];

        intersections.forEach( ( intersection, index ) => {
          ctx.fillStyle = colors[ index ];
          drawPoint( ctx, intersection );

          const arc = getArcBetween( A, B, r3, intersection, ctx );

          if ( arc ) {
            drawStreet( ctx, arc );
          }
        } );
  //     }
  //   } );
  // } );
}

function getArcBetween( A, B, radius, intersection, ctx ) {
  const angleA = getAngle( A, intersection );
  const angleB = getAngle( B, intersection );
  
  // TODO: Should we pass some combination of A/B.counterclockwise into deltaAngle to simplify this?
  const turn = deltaAngle( angleA, angleB );

  const s0 = ( turn < 0 ? 1 : -1 ) * ( A.counterclockwise ? -1 : 1 );

  // If turn is left and we're counter clockwise, then must be coming from inside
  // If turn is left and we're clockwise, then must be coming from outside
  // If turn is right and we're counter clockwise, then must be coming from outside
  // If turn is right and we're clockwise, then must be coming from inside

  const s1 = ( turn > 0 ? 1 : -1 ) * ( B.counterclockwise ? 1 : -1 );
  
  const closestToLine = {
    point: null,
    sign: null,
    dist: Infinity,
  };

  [ -1, 1 ].forEach( sign => {

    const offsetA = getOffset( A, sign * s0 * radius );
    const offsetB = getOffset( B, sign * s1 * radius );

    const offsetIntersections = getIntersections( offsetA, offsetB );

    offsetIntersections.forEach( testIntersection => {
      const angleOffsetA = getAngle( offsetA, testIntersection );
      const angleOffsetB = getAngle( offsetB, testIntersection );
      const turnOffset = deltaAngle( angleOffsetA, angleOffsetB );

      if ( Math.sign( turn ) == Math.sign( turnOffset ) ) {
        const startDist = A.center ?
          deltaAngle( 
            A.startAngle,
            Math.atan2( 
              testIntersection[ 1 ] - A.center[ 1 ],
              testIntersection[ 0 ] - A.center[ 0 ], 
            ),
            A.counterclockwise,
          ) :
          vec2.distance( testIntersection, A.start );
                
        if ( startDist < closestToLine.dist ) {
          closestToLine.point = testIntersection;
          closestToLine.sign = sign;
          closestToLine.dist = startDist;
        }
      }
    } );
  } );

  if ( closestToLine.point ) {
    const tangentA = getTangent( A, closestToLine.point, closestToLine.sign * s0 * radius );
    const tangentB = getTangent( B, closestToLine.point, closestToLine.sign * s1 * radius );

    const tangentVectorA = vec2.subtract( [], tangentA, closestToLine.point );
    const tangentVectorB = vec2.subtract( [], tangentB, closestToLine.point );

    return {
      center: closestToLine.point,
      radius: radius,
      startAngle: Math.atan2( tangentVectorA[ 1 ], tangentVectorA[ 0 ] ),
      endAngle: Math.atan2( tangentVectorB[ 1 ], tangentVectorB[ 0 ] ),
      counterclockwise: closestToLine.sign * turn < 0,
    }
  }
}

function getAngle( A, intersection ) {
  if ( A.center ) {
    return fixAngle( 
      Math.atan2( 
        intersection[ 1 ] - A.center[ 1 ], 
        intersection[ 0 ] - A.center[ 0 ],
      ) + ( A.counterclockwise ? -1 : 1 ) * Math.PI / 2 
    );
  }
  else {
    return Math.atan2( 
      A.end[ 1 ] - A.start[ 1 ], 
      A.end[ 0 ] - A.start[ 0 ],
    );
  }
}

function getOffset( A, offsetDist ) {
  if ( A.center ) {
    const offset = structuredClone( A );
    offset.radius += offsetDist;
    return offset;
  }
  else {
    const v1 = vec2.subtract( [], A.end, A.start );
    vec2.normalize( v1, v1 );
    
    return {
      start: [
        A.start[ 0 ] + v1[ 1 ] * offsetDist,
        A.start[ 1 ] - v1[ 0 ] * offsetDist,
      ],
      end: [
        A.end[ 0 ] + v1[ 1 ] * offsetDist,
        A.end[ 1 ] - v1[ 0 ] * offsetDist,
      ],
    };
  }
}

function getTangent( A, point, radius ) {
  if ( A.center ) {
    return vec2.scaleAndAdd( [],
      A.center, 
      vec2.subtract( [], point, A.center ),
      A.radius / ( A.radius + radius )
    );
  }
  else {
    const v1 = vec2.subtract( [], A.end, A.start );
    vec2.normalize( v1, v1 );

    return [
      point[ 0 ] - v1[ 1 ] * radius,
      point[ 1 ] + v1[ 0 ] * radius,
    ];
  }    
}

function getIntersections( A, B ) {
  if ( A.center && B.center ) {
    return Intersections.getArcArcIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
    );
  }
  else if ( A.center ) {
    return Intersections.getArcLineIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
  else if ( B.center ) {
    return Intersections.getArcLineIntersections(
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
    );
  }
  else {
    return Intersections.getLineLineIntersections(
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
}

//
// Draw helpers
//

function drawStreet( ctx, street ) {
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = 'white';

  if ( street.center ) {
    
    const TWO_PI = Math.PI * 2;
    // clamp angle to [ 0, 2*PI ]
    // const fixAngle = ( angle ) => ( ( angle % TWO_PI ) + TWO_PI ) % TWO_PI;

    // Conic gradients are always clockwise from 0 to 1, so need to map our start/endAngles to this 
    if ( street.counterclockwise ) {
      const gradient = ctx.createConicGradient( street.endAngle, street.center[ 0 ], street.center[ 1 ] );
      gradient.addColorStop( 0, 'darkred' );

      const dist = deltaAngle( street.endAngle, street.startAngle ) / TWO_PI;
      gradient.addColorStop( dist < 0 ? 1 + dist : dist, 'green' );
      ctx.strokeStyle = gradient;
    }
    else {
      const gradient = ctx.createConicGradient( street.startAngle, street.center[ 0 ], street.center[ 1 ] );
      gradient.addColorStop( 0, 'green' );

      const dist = deltaAngle( street.startAngle, street.endAngle ) / TWO_PI;
      gradient.addColorStop( dist < 0 ? 1 + dist : dist, 'darkred' );
      ctx.strokeStyle = gradient;
    }

    drawArc( ctx, street );
  }
  else {
    const gradient = ctx.createLinearGradient( ...street.start, ...street.end );
    gradient.addColorStop( 0, 'green' );
    gradient.addColorStop( 1, 'darkred' );
    ctx.strokeStyle = gradient;

    drawLine( ctx, street );
  }
}

function drawLine( ctx, { start, end } ) {
  ctx.beginPath();
  ctx.moveTo( ...start );
  ctx.lineTo( ...end );
  ctx.stroke();
}

function drawArc( ctx, { center, radius, startAngle, endAngle, counterclockwise } ) {
  ctx.beginPath();
  ctx.arc( center[ 0 ], center[ 1 ], radius, startAngle, endAngle, counterclockwise );
  ctx.stroke();
}

function drawPoint( ctx, p ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], 0.05, 0, Math.PI * 2 );
  ctx.fill();
}


function getStartPoint( arc ) {
  return [
    arc.center[ 0 ] + Math.cos( arc.startAngle ) * arc.radius, 
    arc.center[ 1 ] + Math.sin( arc.startAngle ) * arc.radius 
  ];
}

function getEndPoint( arc ) {
  return [
    arc.center[ 0 ] + Math.cos( arc.endAngle ) * arc.radius, 
    arc.center[ 1 ] + Math.sin( arc.endAngle ) * arc.radius 
  ];
}

//
// Control Points
//

function drawControlPoints( ctx ) {
  const StartColor = 'lime';
  const EndColor = 'red';
  const CenterColor = 'yellow';

  const ControlColors = {
    'center': CenterColor,
    'start': StartColor,
    'startAngle': StartColor,
    'end': EndColor,
    'endAngle': EndColor,
  };

  Object.entries( controlPoints ).forEach( ( [ streetName, points ] ) => {
    Object.entries( points ).forEach( ( [ pointType, point ] ) => {
      ctx.fillStyle = ControlColors[ pointType ];
      drawPoint( ctx, point );
    } );
  } );
}

function closestControlPoint( x, y ) {
  const closest = {
    name: null, 
    type: null,
    dist: Infinity,
  };

  Object.entries( controlPoints ).forEach( ( [ streetName, points ] ) => {
    Object.entries( points ).forEach( ( [ pointType, point ] ) => {
      const dist = Math.hypot( x - point[ 0 ], y - point[ 1 ] );

      if ( dist < closest.dist ) {
        closest.name = streetName;
        closest.type = pointType;
        closest.dist = dist;
      }
    } );
  } );

  return closest;
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

function deltaAngle( a, b, counterclockwise = false ) {
  return counterclockwise ? fixAngle( a - b ) : fixAngle( b - a );
}

//
// Input
//

let selected;

canvas.pointerDown = ( m ) => {
  selected = closestControlPoint( m.x, m.y );
}

canvas.pointerUp = ( m ) => {
  selected = null;
}

canvas.pointerMove = ( m ) => {
  if ( selected ) {
    const streetPoints = controlPoints[ selected.name ];

    const point = streetPoints[ selected.type ];
    point[ 0 ] += m.dx;
    point[ 1 ] += m.dy;

    if ( selected.type == 'center' ) {
      streetPoints.startAngle[ 0 ] += m.dx;
      streetPoints.startAngle[ 1 ] += m.dy;
      streetPoints.endAngle[ 0 ] += m.dx;
      streetPoints.endAngle[ 1 ] += m.dy;
    }
    else if ( selected.type.endsWith( 'Angle' ) ) {
      const street = streets[ selected.name ];

      const cx = point[ 0 ] - street.center[ 0 ];
      const cy = point[ 1 ] - street.center[ 1 ];

      street.radius = Math.hypot( cx, cy );
      street[ selected.type ] = Math.atan2( cy, cx );

      if ( selected.type == 'startAngle' ) {
        streetPoints.endAngle = getEndPoint( street );
      }
      else if ( selected.type == 'endAngle' ) {
        streetPoints.startAngle = getStartPoint( street );
      }
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

function closestPoint( m ) {
  let closest, closestDist = Infinity;

  controlPoints.forEach( p => {
    const dist = Math.hypot( m.x - p[ 0 ], m.y - p[ 1 ] );

    if ( dist < 1 && dist < closestDist ) {
      closest = p;
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