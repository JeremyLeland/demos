import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Curve from '../src/common/Curve.js';

let offset = 0;


const roads = {
  first: {
    start: [ 4, 4 ],
    end: [ 1, 0 ],
    control: [
      [ 1, 4 ],
      [ 1, 1 ],
    ],
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
    ctx.lineWidth = 0.3;// 0.8;
    ctx.lineCap = 'square';
    ctx.strokeStyle = 'gray';

    ctx.beginPath();
    ctx.moveTo( ...road.start );
    ctx.bezierCurveTo( ...road.control[ 0 ], ...road.control[ 1 ], ...road.end );
    ctx.stroke();

    const table = Curve.getCubicBezierTable( road.start, road.control[ 0 ], road.control[ 1 ], road.end, offset );

    // Direction arrows
    ctx.fillStyle = 'yellow';

    for ( let length = 0; length < 8; length += 0.5 ) {
      drawArrowOnCurveAtTime( ctx, road, Curve.getTimeFromTable( table, length ), offset );
    }
  }

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function drawArrowOnCurveAtTime( ctx, road, t, offset = 0, width = 0.05, length = 0.1 ) {
  const pos = Curve.cubicBezier( t, road.start, road.control[ 0 ], road.control[ 1 ], road.end, offset );
  
  const tangent = Curve.cubicTangent( t, road.start, road.control[ 0 ], road.control[ 1 ], road.end );
  const angle = Math.atan2( tangent[ 1 ], tangent[ 0 ] );
  
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
const offsetSlider = document.createElement( 'input' );

Object.assign( offsetSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( offsetSlider, {
  type: 'range',
  value: 0,
  min: -4,
  max: 4,
  step: 0.01,
} );

document.body.appendChild( offsetSlider );

offsetSlider.addEventListener( 'input', _ => {
  offset = +offsetSlider.value;

  canvas.redraw();
} );
