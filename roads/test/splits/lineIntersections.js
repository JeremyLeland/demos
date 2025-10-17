import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';

import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( 0, 0, 10, 10 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

const Constants = {
  LaneWidth: 0.7,
};

const line1 = {
  start: [ 8, 2 ],
  end: [ 1, 8 ],
};

const line2 = {
  start: [ 2, 3 ],
  end: [ 8, 6 ],
};


canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );


  //
  // Intersections
  //
  
  const lineIntersections = Intersections.getLineLineIntersections( 
    line1.start[ 0 ], line1.start[ 1 ], line1.end[ 0 ], line1.end[ 1 ],
    line2.start[ 0 ], line2.start[ 1 ], line2.end[ 0 ], line2.end[ 1 ],
  );

  lineIntersections.forEach( point => {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], Constants.LaneWidth, 0, Math.PI * 2 );
    ctx.fill();
  } );
  
  //
  // Base lines
  //
  ctx.lineWidth = Constants.LaneWidth;

  ctx.strokeStyle = 'gray';
  ctx.beginPath();
  ctx.moveTo( line1.start[ 0 ], line1.start[ 1 ] );
  ctx.lineTo( line1.end[ 0 ], line1.end[ 1 ] );
  ctx.stroke();

  ctx.strokeStyle = 'tan';
  ctx.beginPath();
  ctx.moveTo( line2.start[ 0 ], line2.start[ 1 ] );
  ctx.lineTo( line2.end[ 0 ], line2.end[ 1 ] );
  ctx.stroke();

  //
  // Split lines
  //

  // const streetAngle = Math.atan2( line1.end[ 1 ] - line1.start[ 1 ], line1.end[ 0 ] - line1.start[ 0 ] );



  
  const line1Vec = vec2.subtract( [], line1.end, line1.start );
  vec2.normalize( line1Vec, line1Vec );
  
  const line2Vec = vec2.subtract( [], line2.end, line2.start );
  vec2.normalize( line2Vec, line2Vec );
  
  const intersectAngle = vec2.angle( line1Vec, line2Vec );
  const smallestAngle = Math.min( intersectAngle, Math.PI - intersectAngle );

  console.log( smallestAngle );
  
  if ( lineIntersections.length > 0 ) {
    const backoffDistance = 0.5 * Constants.LaneWidth / Math.tan( smallestAngle / 2 );

    const newLine1End =   vec2.scaleAndAdd( [], lineIntersections[ 0 ], line1Vec, -backoffDistance );
    const newLine1Start = vec2.scaleAndAdd( [], lineIntersections[ 0 ], line1Vec,  backoffDistance );

    const newLine2End =   vec2.scaleAndAdd( [], lineIntersections[ 0 ], line2Vec, -backoffDistance );
    const newLine2Start = vec2.scaleAndAdd( [], lineIntersections[ 0 ], line2Vec,  backoffDistance );
    
    // ctx.lineWidth = 1 * Constants.LaneWidth;
    
    ctx.strokeStyle = 'teal';
    ctx.beginPath();
    ctx.moveTo( ...line1.start );
    ctx.lineTo( ...newLine1End );
    ctx.stroke();
    
    ctx.strokeStyle = 'salmon';
    ctx.beginPath();
    ctx.moveTo( ...newLine1Start );
    ctx.lineTo( ...line1.end );
    ctx.stroke();

    ctx.strokeStyle = 'coral';
    ctx.beginPath();
    ctx.moveTo( ...line2.start );
    ctx.lineTo( ...newLine2End );
    ctx.stroke();
    
    ctx.strokeStyle = 'khaki';
    ctx.beginPath();
    ctx.moveTo( ...newLine2Start );
    ctx.lineTo( ...line2.end );
    ctx.stroke();
  }
}

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {

    [ line1.start, line1.end, line2.start, line2.end ].forEach( p => {
      if ( Math.hypot( p[ 0 ] - m.x, p[ 1 ] - m.y ) < 1 ) {
        p[ 0 ] += m.dx;
        p[ 1 ] += m.dy;
      }
    } );

    canvas.redraw();
  }
}