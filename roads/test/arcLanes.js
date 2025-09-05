import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Curve from '../src/common/Curve.js';

let distance = 0;

// TODO: Making these run paralell first, eventually test them in opposite directions

const roads = {
  A_EAST: {
    start: [ 4, 4 ],
    end: [ 6, 4 ],
  },
  A_WEST: {
    // start: [ 6, 3 ],
    // end: [ 4, 3 ],
    start: [ 4, 3 ],
    end: [ 6, 3 ],
  },
  first_NORTH: {
    start: [ 3, 7 ],
    end: [ 3, 5 ],
  },
  first_SOUTH: {
    // start: [ 2, 5 ],
    // end: [ 2, 7 ],
    start: [ 2, 7 ],
    end: [ 2, 5 ],
  },
  first_to_A: {
    start: [ 3, 5 ],
    end: [ 4, 4 ],
    control: [ 3, 4 ],
  },
  first_to_A_2: {
    // start: [ 4, 3 ],
    // end: [ 2, 5 ],
    start: [ 2, 5 ],
    end: [ 4, 3 ], 
    control: [ 2, 3 ],
  },
};

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 10;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 8, 8 );

canvas.draw = ( ctx ) => {

  for ( const road of Object.values( roads ) ) {
    // Road itself
    ctx.lineWidth = 0.9;// 0.8;
    // ctx.lineCap = 'square';
    ctx.strokeStyle = 'gray';

    ctx.beginPath();
    ctx.moveTo( ...road.start );
    if ( road.control ) {

      const radius = Math.hypot( ...[ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );

      ctx.arcTo( ...road.control, ...road.end, radius );
    }
    else {
      ctx.lineTo( ...road.end );
    }
    ctx.stroke();

    // Direction arrows
    // ctx.fillStyle = 'yellow';

    // for ( let length = 0; length < 8; length += 0.5 ) {
    //   drawArrowOnCurveAtTime( ctx, road, Curve.getTimeFromTable( table, length ), offset );
    // }

    if ( road.control ) {
      drawArrowAtDistance( ctx, road );
    }
  }

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function normalize( v ) {
  const len = Math.hypot( ...v );
  return v.map( e => e / len );
}

function drawArrowAtDistance( ctx, road ) {
  const v0 = normalize( [ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );
  const v1 = normalize( [ 0, 1 ].map( i => road.end[ i ] - road.control[ i ] ) );

  const radius = Math.hypot( ...[ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );

  const dot = v0[ 0 ] * v1[ 0 ] + v0[ 1 ] * v1[ 1 ];
  const angleBetween = Math.acos( dot )

  // Ensure angle is not 0 or PI (no arc possible)
  if ( angleBetween <= 0.0001 || Math.abs( Math .PI - angleBetween ) <= 0.0001 ) {
    debugger;   // No arc, straight corner
  }

  // console.log( 'angleBetween: ' + angleBetween );

  // I think this part is if the radius is shorter than vector?
  const tangentLen = radius / Math.tan( angleBetween / 2 );
  // console.log( 'tangentLen: ' + tangentLen );

  const start = [ 0, 1 ].map( i => road.control[ i ] + v0[ i ] * tangentLen );
  const end = [ 0, 1 ].map( i => road.control[ i ] + v1[ i ] * tangentLen );

  const bisector = normalize( [ v0[ 0 ] + v1[ 0 ], v0[ 1 ] + v1[ 1 ] ] );

  // console.log( 'bisector: ' + bisector );

  // FIXME: What is orientation supposed to do here? It's causing problems so far
  //        Seems to be the opposite of whether it is clockwise, but that doesn't
  //        seem to effect where the center is
  // Rotate bisector 90 degrees to find center direction
  const cross = v0[ 0 ] * v1[ 1 ] - v0[ 1 ] * v1[ 0 ];
  // const orientation = cross < 0 ? -1 : 1;

  // console.log( 'orientation: ' + orientation );

  const centerDistance = radius / Math.sin( angleBetween / 2 );

  // console.log( 'centerDistance: ' + centerDistance );

  const center = [
    road.control[ 0 ] + bisector[ 0 ] * centerDistance,// * orientation,
    road.control[ 1 ] + bisector[ 1 ] * centerDistance,// * orientation,
  ];

  // Compute start and end angles
  // These seem off when bigger radius
  const startAngle = Math.atan2( start[ 1 ] - center[ 1 ], start[ 0 ] - center[ 0 ] );
  const endAngle = Math.atan2( end[ 1 ] - center[ 1 ], end[ 0 ] - center[ 0 ] );

  // console.log( center );
  // console.log( startAngle );
  // console.log( endAngle );

  // Determine sweep direction
  const clockwise = cross < 0;

  // Compute angle at distance
  let sweepAngle = endAngle - startAngle;
  if (clockwise && sweepAngle < 0) sweepAngle += 2 * Math.PI;
  if (!clockwise && sweepAngle > 0) sweepAngle -= 2 * Math.PI;


  // TODO: Why is the bigger one stopping half-way?

  const arcLength = Math.abs(sweepAngle * radius);
  if (distance > arcLength) distance = arcLength; // clamp

  const angleOffset = (distance / radius) * (clockwise ? 1 : -1);
  const angleAtD = startAngle + angleOffset;

  // Final point
  const point = [
    center[ 0 ] + radius * Math.cos(angleAtD),
    center[ 1 ] + radius * Math.sin(angleAtD),
  ];

  // console.log( point );

  ctx.fillStyle = 'yellow';
  drawArrow( ctx, point, angleAtD + Math.PI / 2 );
}

function drawArrow( ctx, pos, angle, width = 0.25, length = 0.5 ) {
  const cos = Math.cos( angle );
  const sin = Math.sin( angle );
  
  ctx.beginPath();
  ctx.moveTo( pos[ 0 ] + width * sin, pos[ 1 ] - width * cos );
  ctx.lineTo( pos[ 0 ] - width * sin, pos[ 1 ] + width * cos );
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.closePath();
  ctx.fill();
}


//
// Slider
//
const distSlider = document.createElement( 'input' );

Object.assign( distSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( distSlider, {
  type: 'range',
  value: 0,
  min: 0,
  max: 4,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
