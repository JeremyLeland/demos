import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

let distance = 0;

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
      'left_to_bottom',
      'left_to_top',
    ],
  },
  left_to_top: {
    start: [ 3, 5 ],
    end: [ 5, 3 ],
    control: [
      [ 5, 5 ],
    ],
    next: [ 'top_OUT' ],
  },
  left_to_bottom: {
    start: [ 3, 5 ],
    end: [ 4, 6 ],
    control: [
      [ 4, 5 ],
    ],
    next: [ 'bottom_OUT' ],
  },

  // Top road
  top_IN: {
    start: [ 4, 1 ],
    end: [ 4, 3 ],
    next: [
      'top_to_left',
      'top_to_bottom',
    ],
  },
  top_OUT: {
    start: [ 5, 3 ],
    end: [ 5, 1 ],
  },
  top_to_left: {
    start: [ 4, 3 ],
    end: [ 3, 4 ],
    control: [
      [ 4, 4 ],
    ],
    next: [ 'left_OUT' ],
  },
  top_to_bottom: {
    start: [ 4, 3 ],
    end: [ 4, 6 ],
    next: [ 'bottom_OUT' ],
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
      'bottom_to_left',
      'bottom_to_top',
    ],
  },
  bottom_to_left: {
    start: [ 5, 6 ],
    end: [ 3, 4 ],
    control: [
      [ 5, 4 ],
    ],
    next: [ 'left_OUT' ],
  },
  bottom_to_top: {
    start: [ 5, 6 ],
    end: [ 5, 3 ],
    next: [ 'top_OUT' ],
  },
};

let path;// = [ 'left_IN', 'top_OUT' ];

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
    // ctx.stroke();

    // Direction arrows
    ctx.fillStyle = 'yellow';

    if ( road.control ) {
      drawArrowCurve( ctx, road );
    }
    else {
      drawArrowLine( ctx, road.start, road.end );
    }
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
  if ( path ) {
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

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
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

function drawArrowCurve( ctx, road, width = 0.05, length = 0.1 ) {

  for ( let t = 0; t <= 1; t += length ) {
    const pos = quadraticBezier( t, road.start, road.control[ 0 ], road.end );
    
    const tangent = quadraticTangent( t, road.start, road.control[ 0 ], road.end );
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
}

function quadraticBezier( t, P0, P1, P2 ) {
  return [ 0, 1 ].map( i => 
    P0[ i ] *     ( 1 - t ) ** 2          +
    P1[ i ] * 2 * ( 1 - t ) ** 1 * t ** 1 +
    P2[ i ]                      * t ** 2
  );
}

function cubicBezier( t, P0, P1, P2, P3 ) {
  return [ 0, 1 ].map( i => 
    P0[ i ] *     ( 1 - t ) ** 3          +
    P1[ i ] * 3 * ( 1 - t ) ** 2 * t ** 1 +
    P2[ i ] * 3 * ( 1 - t ) ** 1 * t ** 2 +
    P3[ i ]                      * t ** 3
  );
}

function quadraticTangent( t, P0, P1, P2 ) {
  return [ 0, 1 ].map( i => 
    ( P1[ i ] - P0[ i ] ) * 2 * ( 1 - t ) + 
    ( P2[ i ] - P1[ i ] ) * 2 * t
  );
}

function cubicTangent( t, P0, P1, P2, P3 ) {
  return [ 0, 1 ].map( i => 
    ( P1[ i ] - P0[ i ] ) * 3 * ( 1 - t ) ** 2          + 
    ( P2[ i ] - P1[ i ] ) * 3 * ( 1 - t ) ** 1 * t ** 1 + 
    ( P3[ i ] - P2[ i ] ) * 3                  * t ** 2
  );
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
  max: 18,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
