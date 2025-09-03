import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Curve from '../src/common/Curve.js';

let distance = 0;


const roads = {
  first: {
    start: [ 4, 6 ],
    end: [ 2, 4 ],
    control: [
      [ 4, 4 ],
    ],
  },
  second: {
    start: [ 2, 4 ],
    end: [ 0, 2 ],
    control: [
      [ 0, 4 ],
    ],
  },
  third: {
    start: [ 0, 2 ],
    end: [ 2, 0 ],
    control: [
      [ 0, 0 ],
    ],
  },
  fourth: {
    start: [ 2, 0 ],
    end: [ 6, 0 ],
    control: [
      [ 4.5, 0 ],
    ],
  },
  fifth: {
    start: [ 6, 0 ],
    end: [ 8, 2 ],
    control: [
      [ 8, 0 ],
    ],
  },
  sixth: {
    start: [ 8, 2 ],
    end: [ 8, 6 ],
    control: [
      [ 8, 4 ],
    ],
  },
  seventh: {
    start: [ 8, 6 ],
    end: [ 6, 8 ],
    control: [
      [ 8, 8 ],
    ],
  },
  eighth: {
    start: [ 6, 8 ],
    end: [ 4, 6 ],
    control: [
      [ 4, 8 ],
    ],
  },
};

const path = [ roads.first, roads.second, roads.third, roads.fourth, roads.fifth, roads.sixth, roads.seventh, roads.eighth ];


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
    if ( road.control ) {
      if ( road.control.length == 1 ) {
        ctx.quadraticCurveTo( ...road.control[ 0 ], ...road.end );
      }
      else if ( road.control.length == 2 ) {
        ctx.bezierCurveTo( ...road.control[ 0 ], ...road.control[ 1 ], ...road.end );
      }
    }
    else {
      ctx.lineTo( ...road.end );
    }
    ctx.stroke();


    const table = Curve.getQuadraticBezierTable( road.start, road.control[ 0 ], road.end );

    // console.log( table );

    // Direction arrows
    ctx.fillStyle = 'yellow';

    for ( let length = 0; length < 4; length += 0.5 ) {
      drawArrowOnCurveAtTime( ctx, road, Curve.getTimeFromTable( table, length ) );
    }
  }

  ctx.fillStyle = 'cyan';

  let partialDistance = distance;

  for ( let i = 0; i < path.length; i ++ ) { 
    const table = Curve.getQuadraticBezierTable( path[ i ].start, path[ i ].control[ 0 ], path[ i ].end );
    const time = Curve.getTimeFromTable( table, partialDistance );
    
    if ( time == undefined ) {
      partialDistance -= table.at( -1 ).length;
    }
    else {
      drawArrowOnCurveAtTime( ctx, path[ i ], Curve.getTimeFromTable( table, partialDistance ) );
      break;
    }
  }

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function drawArrowOnCurveAtTime( ctx, road, t, width = 0.05, length = 0.1 ) {
  const pos = Curve.quadraticBezier( t, road.start, road.control[ 0 ], road.end );
  
  const tangent = Curve.quadraticTangent( t, road.start, road.control[ 0 ], road.end );
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
  max: path.length * 3.5,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
