import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import * as Intersections from '../../src/common/Intersections.js';

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

const arc2 = {
  center: [ 2, 5 ],
  radius: 2,
  startAngle: 0,
  endAngle: -1,
  counterclockwise: true,
};

const line = {
  start: [ 8, 2 ],
  end: [ 1, 8 ],
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
    ctx.arc( point[ 0 ], point[ 1 ], 0.4, 0, Math.PI * 2 );
    ctx.fill();
  } );

  const arcArcIntersections = Intersections.getArcArcIntersections(
    arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
    arc2.center[ 0 ], arc2.center[ 1 ], arc2.radius, arc2.startAngle, arc2.endAngle, arc2.counterclockwise,
  );

  ctx.fillStyle = 'yellow';
  arcArcIntersections.forEach( point => {
    ctx.beginPath();
    ctx.arc( point[ 0 ], point[ 1 ], 0.4, 0, Math.PI * 2 );
    ctx.fill()
  } );

  //
  // Base arcs
  //
  ctx.lineWidth = Constants.LaneWidth;

  ctx.strokeStyle = 'gray';
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();

  ctx.strokeStyle = 'darkgray';
  ctx.beginPath();
  ctx.arc( arc2.center[ 0 ], arc2.center[ 1 ], arc2.radius, arc2.startAngle, arc2.endAngle, arc2.counterclockwise );
  ctx.stroke();

  ctx.strokeStyle = 'tan';
  ctx.beginPath();
  ctx.moveTo( line.start[ 0 ], line.start[ 1 ] );
  ctx.lineTo( line.end[ 0 ], line.end[ 1 ] );
  ctx.stroke();

  //
  // Split arcs
  //

  const lineIntersectAngle = Math.atan2( 
    arcLineIntersections[ 0 ][ 1 ] - arc.center[ 1 ],
    arcLineIntersections[ 0 ][ 0 ] - arc.center[ 0 ],
  );

  const circum = arc.radius * Math.PI * 2;
  const backoffDistance = Constants.LaneWidth / 2;

  const backoffAngle = backoffDistance / ( arc.radius );

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1 * Constants.LaneWidth;

  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, lineIntersectAngle - backoffAngle, arc.counterclockwise );
  ctx.stroke();

}