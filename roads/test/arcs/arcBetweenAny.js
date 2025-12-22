const streets = {
  line1: {
    start: [ -4, -3 ],
    end: [ -3, 0 ],
  },
  line2: {
    start: [ -1, -4 ],
    end: [ -4, -2 ],
  },
  arc1: {
    center: [ 0, 0 ],
    radius: 3,
    startAngle: 1,
    endAngle: -1,
    counterclockwise: false,
  },
  arc2: {
    center: [ 2, 0 ],
    radius: 2,
    startAngle: 1,
    endAngle: 2,
    counterclockwise: true,
  },
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


  Object.values( streets ).forEach( street => drawStreet( ctx, street ) );

  drawControlPoints( ctx );
  

  // const intersections = Intersections.getArcLineIntersections(
  //   ...arc.center, arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
  //   ...line,
  // );

  // const colors = [ 'orange', 'pink' ];

  // intersections.forEach( ( intersection, index ) => {

  //   // const between = Arc.getArcBetweenLineArc( line, arc, r3, intersection );
  //   const between = Arc.getArcBetweenArcLine( arc, line, r3, intersection );

  //   // console.log( between );

  //   ctx.strokeStyle = colors[ index ];

  //   drawArc( ctx, ...between.center, between.radius, between.startAngle, between.endAngle, between.counterclockwise );
  //   ctx.fillStyle = 'lime';
  //   drawPoint( ctx, 
  //     between.center[ 0 ] + Math.cos( between.startAngle ) * between.radius, 
  //     between.center[ 1 ] + Math.sin( between.startAngle ) * between.radius 
  //   );

  //   ctx.fillStyle = 'red';
  //   drawPoint( ctx, 
  //     between.center[ 0 ] + Math.cos( between.endAngle ) * between.radius, 
  //     between.center[ 1 ] + Math.sin( between.endAngle ) * between.radius 
  //   );
  // } );
}

//
// Draw helpers
//

function drawStreet( ctx, street ) {
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = 'white';

  const StartColor = 'lime';
  const EndColor = 'red';

  if ( street.center ) {
    drawArc( ctx, street );

    // ctx.fillStyle = StartColor;
    // drawPoint( ctx, getStartPoint( street ) );

    // ctx.fillStyle = EndColor;
    // drawPoint( ctx, getEndPoint( street ) );
  }
  else {
    drawLine( ctx, street );

    // ctx.fillStyle = StartColor;
    // drawPoint( ctx, street.start );

    // ctx.fillStyle = EndColor;
    // drawPoint( ctx, street.end );
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

function deltaAngle( a, b ) {
  return fixAngle( b - a );
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

    switch( selected.type ) {
      case 'center': {
        streetPoints.startAngle[ 0 ] += m.dx;
        streetPoints.startAngle[ 1 ] += m.dy;
        streetPoints.endAngle[ 0 ] += m.dx;
        streetPoints.endAngle[ 1 ] += m.dy;
        
        break;
      }
      
      case 'startAngle': {
        const street = streets[ selected.name ];

        const cx = point[ 0 ] - street.center[ 0 ];
        const cy = point[ 1 ] - street.center[ 1 ];

        street.radius = Math.hypot( cx, cy );
        street.startAngle = Math.atan2( cy, cx );

        streetPoints.endAngle = getEndPoint( street );
        
        break;
      }
      
      case 'endAngle': {
        const street = streets[ selected.name ];

        const cx = point[ 0 ] - street.center[ 0 ];
        const cy = point[ 1 ] - street.center[ 1 ];

        street.radius = Math.hypot( cx, cy );
        street.endAngle = Math.atan2( cy, cx );

        streetPoints.startAngle = getStartPoint( street );
        
        break;
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