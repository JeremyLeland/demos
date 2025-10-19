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

const arc = {
  center: [ 5, 5 ],
  radius: 2,
  startAngle: 0,
  endAngle: -1,
  counterclockwise: false,
};

// const arc2 = {
//   center: [ 2, 5 ],
//   radius: 2,
//   startAngle: 0,
//   endAngle: -1,
//   counterclockwise: true,
// };

const line = {
  start: [ 5, 4 ],
  end: [ 3, 8 ],
};

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );


  //
  // Intersections
  //
  
  const arcLineIntersections = Intersections.getArcLineIntersections( 
    arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
    line.start[ 0 ], line.start[ 1 ], line.end[ 0 ], line.end[ 1 ] 
  );

  ctx.fillStyle = 'red';
  arcLineIntersections.forEach( point => {
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], Constants.LaneWidth, 0, Math.PI * 2 );
    ctx.fill();
  } );

  // const arcArcIntersections = Intersections.getArcArcIntersections(
  //   arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
  //   arc2.center[ 0 ], arc2.center[ 1 ], arc2.radius, arc2.startAngle, arc2.endAngle, arc2.counterclockwise,
  // );

  // ctx.fillStyle = 'yellow';
  // arcArcIntersections.forEach( point => {
  //   ctx.beginPath();
  //   ctx.arc( point[ 0 ], point[ 1 ], 0.4, 0, Math.PI * 2 );
  //   ctx.fill()
  // } );

  //
  // Base arcs
  //
  ctx.lineWidth = Constants.LaneWidth;

  ctx.strokeStyle = 'gray';
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();

  // ctx.strokeStyle = 'darkgray';
  // ctx.beginPath();
  // ctx.arc( arc2.center[ 0 ], arc2.center[ 1 ], arc2.radius, arc2.startAngle, arc2.endAngle, arc2.counterclockwise );
  // ctx.stroke();

  ctx.strokeStyle = 'tan';
  ctx.beginPath();
  ctx.moveTo( line.start[ 0 ], line.start[ 1 ] );
  ctx.lineTo( line.end[ 0 ], line.end[ 1 ] );
  ctx.stroke();

  //
  // Split arcs
  //

  const lineVec = vec2.subtract( [], line.end, line.start );
  vec2.normalize( lineVec, lineVec );

  const firstInnerIntersections = Intersections.getArcLineIntersections( 
    arc.center[ 0 ], arc.center[ 1 ], arc.radius - Constants.LaneWidth / 2, arc.startAngle, arc.endAngle, arc.counterclockwise,
    line.start[ 0 ] + 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.start[ 1 ] + 0.5 * Constants.LaneWidth * -lineVec[ 0 ], 
    line.end[ 0 ]   + 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.end[ 1 ]   + 0.5 * Constants.LaneWidth * -lineVec[ 0 ],
  );

  const firstOuterIntersections = Intersections.getArcLineIntersections(
    arc.center[ 0 ], arc.center[ 1 ], arc.radius + Constants.LaneWidth / 2, arc.startAngle, arc.endAngle, arc.counterclockwise,
    line.start[ 0 ] + 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.start[ 1 ] + 0.5 * Constants.LaneWidth * -lineVec[ 0 ], 
    line.end[ 0 ]   + 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.end[ 1 ]   + 0.5 * Constants.LaneWidth * -lineVec[ 0 ],
  );

  const secondInnerIntersections = Intersections.getArcLineIntersections( 
    arc.center[ 0 ], arc.center[ 1 ], arc.radius - Constants.LaneWidth / 2, arc.startAngle, arc.endAngle, arc.counterclockwise,
    line.start[ 0 ] - 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.start[ 1 ] - 0.5 * Constants.LaneWidth * -lineVec[ 0 ], 
    line.end[ 0 ]   - 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.end[ 1 ]   - 0.5 * Constants.LaneWidth * -lineVec[ 0 ],
  );

  const secondOuterIntersections = Intersections.getArcLineIntersections(
    arc.center[ 0 ], arc.center[ 1 ], arc.radius + Constants.LaneWidth / 2, arc.startAngle, arc.endAngle, arc.counterclockwise,
    line.start[ 0 ] - 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.start[ 1 ] - 0.5 * Constants.LaneWidth * -lineVec[ 0 ], 
    line.end[ 0 ]   - 0.5 * Constants.LaneWidth *  lineVec[ 1 ], 
    line.end[ 1 ]   - 0.5 * Constants.LaneWidth * -lineVec[ 0 ],
  );

  ctx.fillStyle = 'yellow';
  firstInnerIntersections.forEach( point => {
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], 0.1, 0, Math.PI * 2 );
    ctx.fill();
  } );

  ctx.fillStyle = 'lime';
  firstOuterIntersections.forEach( point => {
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], 0.1, 0, Math.PI * 2 );
    ctx.fill();
  } );

  ctx.fillStyle = 'dodgerblue';
  secondInnerIntersections.forEach( point => {
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], 0.1, 0, Math.PI * 2 );
    ctx.fill();
  } );

  ctx.fillStyle = 'violet';
  secondOuterIntersections.forEach( point => {
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], 0.1, 0, Math.PI * 2 );
    ctx.fill();
  } );


  const firstInnerIntersectAngle = Math.atan2( 
    firstInnerIntersections[ 0 ][ 1 ] - arc.center[ 1 ],
    firstInnerIntersections[ 0 ][ 0 ] - arc.center[ 0 ],
  );

  const firstOuterIntersectAngle = Math.atan2( 
    firstOuterIntersections[ 0 ][ 1 ] - arc.center[ 1 ],
    firstOuterIntersections[ 0 ][ 0 ] - arc.center[ 0 ],
  );

  const secondInnerIntersectAngle = Math.atan2( 
    secondInnerIntersections[ 0 ][ 1 ] - arc.center[ 1 ],
    secondInnerIntersections[ 0 ][ 0 ] - arc.center[ 0 ],
  );

  const secondOuterIntersectAngle = Math.atan2( 
    secondOuterIntersections[ 0 ][ 1 ] - arc.center[ 1 ],
    secondOuterIntersections[ 0 ][ 0 ] - arc.center[ 0 ],
  );

  const minFirstAngle = Intersections.isBetweenAngles( 
    firstInnerIntersectAngle, arc.startAngle, firstOuterIntersectAngle, arc.counterclockwise 
  ) ? firstInnerIntersectAngle : firstOuterIntersectAngle;

  const maxSecondAngle = Intersections.isBetweenAngles( 
    secondInnerIntersectAngle, secondOuterIntersectAngle, arc.endAngle, arc.counterclockwise
  ) ? secondInnerIntersectAngle : secondOuterIntersectAngle;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1 * Constants.LaneWidth;

  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, minFirstAngle, arc.counterclockwise );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, maxSecondAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();
}

canvas.pointerMove = ( m ) => {
  if ( m.buttons == 1 ) {

    [ line.start, line.end ].forEach( p => {
      if ( Math.hypot( p[ 0 ] - m.x, p[ 1 ] - m.y ) < 1 ) {
        p[ 0 ] += m.dx;
        p[ 1 ] += m.dy;
      }
    } );

    canvas.redraw();
  }
}