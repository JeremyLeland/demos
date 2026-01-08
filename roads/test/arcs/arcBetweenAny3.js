// Validate the functions moved to Arc.js

const streets = {
  // line1: {
  //   start: [ -4, -3 ],
  //   end: [ -1, 2 ],
  // },
  line2: {
    start: [ -2, -1 ],
    end: [ -3, 1 ],
  },
  line3: {
    start: [ -4, 0 ], 
    end: [ 4, 0 ],
  },
  arc1: {
    center: [ 2, 0 ],
    radius: 3,
    startAngle: -1,
    endAngle: 1,
    counterclockwise: true,
  },
  arc2: {
    center: [ -2, 0 ],
    radius: 3,
    startAngle: -2,
    endAngle: 2,
    counterclockwise: false,
  },
};

const controlPoints = {};

for ( const [ name, street ] of Object.entries( streets ) ) {
  if ( street.center ) {
    controlPoints[ name ] = {
      center: street.center,
      startAngle: Arc.getPointAtAngle( street, street.startAngle ),
      endAngle: Arc.getPointAtAngle( street, street.endAngle ),
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
import * as Angle from '../../src/common/Angle.js';
import * as Arc from '../../src/common/Arc.js';
import * as Intersections from '../../src/common/Intersections.js'
import { vec2 } from '../../lib/gl-matrix.js';

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  const streetList = Object.values( streets );

  streetList.forEach( street => {
    drawStreet( ctx, street );

    // ctx.lineWidth = 0.01;
    // ctx.strokeStyle = 'yellow';
    // ctx.beginPath();
    // ctx.arc( street.center[ 0 ], street.center[ 1 ], street.radius + r3, street.startAngle, street.endAngle, street.counterclockwise );
    // ctx.stroke();

    // ctx.strokeStyle = 'orange';
    // ctx.beginPath();
    // ctx.arc( street.center[ 0 ], street.center[ 1 ], street.radius - r3, street.startAngle, street.endAngle, street.counterclockwise );
    // ctx.stroke();
  } );

  drawControlPoints( ctx );
  
  // const A = streets.line3;
  // const B = streets.arc1;

  streetList.forEach( A => {
    streetList.forEach( B => {
      if ( A != B ) {
        const intersections = Intersections.getIntersections( A, B );

        const colors = [ 'orange', 'pink' ];

        intersections.forEach( ( intersection, index ) => {
          ctx.fillStyle = colors[ index ];
          drawPoint( ctx, intersection );

          const arc = Arc.getArcBetween( A, B, r3, intersection );

          if ( arc ) {
            drawStreet( ctx, arc );
          }
        } );
      }
    } );
  } );
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

      const dist = Angle.sweepAngle( street.endAngle, street.startAngle ) / TWO_PI;
      gradient.addColorStop( dist, 'green' );
      ctx.strokeStyle = gradient;
    }
    else {
      const gradient = ctx.createConicGradient( street.startAngle, street.center[ 0 ], street.center[ 1 ] );
      gradient.addColorStop( 0, 'green' );

      const dist = Angle.sweepAngle( street.startAngle, street.endAngle ) / TWO_PI;
      gradient.addColorStop( dist, 'darkred' );
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
        streetPoints.endAngle = Arc.getPointAtAngle( street, street.endAngle );
      }
      else if ( selected.type == 'endAngle' ) {
        streetPoints.startAngle = Arc.getPointAtAngle( street, street.startAngle );
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
