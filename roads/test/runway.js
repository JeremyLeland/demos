import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';


const roads = {
  // Left road
  left_OUT: {
    start: [ 3, 4 ],
    end: [ 1, 4 ],
  },
  left_IN: {
    start: [ 1, 5 ],
    end: [ 3, 5 ],
    next: [
      'bottom_OUT',
      'top_OUT',
    ],
  },

  // Top road
  top_IN: {
    start: [ 4, 1 ],
    end: [ 4, 3 ],
    next: [
      'left_OUT',
      'bottom_OUT',
    ],
  },
  top_OUT: {
    start: [ 5, 3 ],
    end: [ 5, 1 ],
  },

  // Bottom road
  bottom_OUT: {
    start: [ 4, 6 ],
    end: [ 4, 8 ],
  },
  bottom_IN: {
    start: [ 5, 8 ],
    end: [ 5, 6 ],
    next: [
      'left_OUT',
      'top_OUT',
    ],
  },
};

const path = [ 'left_IN', 'top_OUT' ];

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 10;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 8, 8 );

canvas.draw = ( ctx ) => {

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );

  for ( const road of Object.values( roads ) ) {
    // Road itself
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'square';
    ctx.strokeStyle = 'gray';

    ctx.beginPath();
    ctx.moveTo( ...road.start );
    ctx.lineTo( ...road.end );
    ctx.stroke();

    // Direction arrows
    ctx.fillStyle = 'yellow';

    drawArrowLine( ctx, road.start, road.end );
  }

  // DEBUG: next roads
  const colors = [ 'red', 'orange', 'lime', 'cyan', 'violet' ];
  let colorIndex = 0;
  
  for ( const road of Object.values( roads ) ) {
    if ( road.next ) {
      ctx.fillStyle = colors[ colorIndex ++ ];
      
      road.next.forEach( next => {
        drawArrowLine( ctx, road.end, roads[ next ].start, 0.03, 0.1 );
      } );
    }
  }

  // Our path
  ctx.fillStyle = 'cyan';

  for ( let i = 0; i < path.length; i ++ ) {
    const road = roads[ path[ i ] ];
    const next = roads[ path[ i + 1 ] ];
  
    drawArrowLine( ctx, road.start, road.end, 0.2, 0.3 );

    if ( next ) {
      drawArrowLine( ctx, road.end, next.start, 0.2, 0.3 );
    }  
  }
}

function drawArrowLine( ctx, start, end, width = 0.05, length = 0.1 ) {

  // TODO: Calculate for curves
  const total_dist = Math.hypot( end[ 0 ] - start[ 0 ], end[ 1 ] - start[ 1 ] );

  for ( let dist = 0; dist < total_dist; dist += length * 3 ) {
    const pos = [ 0, 1 ].map( 
      i => start[ i ] + ( end[ i ] - start[ i ] ) * ( dist / total_dist )
    );
    
    // TODO: Adjust based on curve
    const angle = Math.atan2( end[ 1 ] - start[ 1 ], end[ 0 ] - start[ 0 ] );

    const cos = Math.cos( angle );
    const sin = Math.sin( angle );

    ctx.beginPath();
    ctx.moveTo( pos[ 0 ] + width * sin, pos[ 1 ] - width * cos );
    ctx.lineTo( pos[ 0 ] - width * sin, pos[ 1 ] + width * cos );
    ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
    ctx.closePath();
    ctx.fill();
  }
}