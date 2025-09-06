import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

let stepLength = 0.1;

// There's a difference between what we need to know to draw the roads 
// and what we need to know to navigate them.
// For instance, the _to_ routes don't need to be drawn -- these are going through intersections 
// (which won't reflect the curves at all, unless there are lane markers someday...)


const routes = {
  A_EAST: {
    start: [ 4, 4 ],
    end: [ 6, 4 ],
  },
  A_WEST: {
    start: [ 6, 3 ],
    end: [ 4, 3 ],
  },
  first_NORTH: {
    start: [ 3, 7 ],
    end: [ 3, 5 ],
  },
  first_SOUTH: {
    start: [ 2, 5 ],
    end: [ 2, 7 ],
  },
  first_to_A: {
    start: [ 3, 5 ],
    end: [ 4, 4 ],
    control: [ 3, 4 ],
  },
  A_to_first: {
    start: [ 4, 3 ],
    end: [ 2, 5 ],
    control: [ 2, 3 ],
  },
  second_NORTH: {
    start: [ 8, 2 ],
    end: [ 8, 0 ],
  },
  second_SOUTH: {
    start: [ 7, 0 ],
    end: [ 7, 2 ],
  },
  A_to_second: {
    start: [ 6, 4 ],
    end: [ 8, 2 ],
    control: [ 8, 4 ],
  },
  second_to_A: {
    start: [ 7, 2 ],
    end: [ 6, 3 ],
    control: [ 7, 3 ],
  },
};

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 14;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 12, 12 );

canvas.draw = ( ctx ) => {

  for ( const road of Object.values( routes ) ) {

    const points = road.control ? getArcPoints( road.start, road.control, road.end, stepLength ) : [ road.start, road.end ];

    //
    // Stroke to debug
    //
    ctx.lineWidth = 0.9;
    // ctx.lineCap = 'square';
    ctx.strokeStyle = 'gray';

    ctx.beginPath();
    points.forEach( p => ctx.lineTo( ...p ) );
    ctx.stroke();

    //
    // Arrows to show direction
    //
    ctx.fillStyle = 'yellow';

    const SPACING = 0.5;
    let dist_until_next = 0;

    for ( let i = 1; i < points.length; i ++ ) {
      const A = points[ i - 1 ];
      const B = points[ i ];

      const length = Math.hypot( B[ 0 ] - A[ 0 ], B[ 1 ] - A[ 1 ] );

      const stepsWithin = Math.ceil( length / SPACING );

      let partial_dist = 0;
      for ( let j = 0; j < stepsWithin; j ++ ) {

        if ( partial_dist + dist_until_next < length ) {
          const normalized_dist = ( partial_dist + dist_until_next ) / length;
          const point = [
            A[ 0 ] + normalized_dist * ( B[ 0 ] - A[ 0 ] ),
            A[ 1 ] + normalized_dist * ( B[ 1 ] - A[ 1 ] ),
          ];

          const angle = Math.atan2( B[ 1 ] - A[ 1 ], B[ 0 ] - A[ 0 ] );

          drawArrow( ctx, point, angle );

          partial_dist += dist_until_next;
          dist_until_next = SPACING;
        }
        else {
          dist_until_next -= length - partial_dist;
        }
      }
    }
  }

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function normalize( v ) {
  const len = Math.hypot( ...v );
  return v.map( e => e / len );
}

function getArcPoints( P0, P1, P2, stepLength = 0.1 ) {
  const points = [];

  const v0 = normalize( [ 0, 1 ].map( i => P0[ i ] - P1[ i ] ) );
  const v1 = normalize( [ 0, 1 ].map( i => P2[ i ] - P1[ i ] ) );

  const radius = Math.hypot( ...[ 0, 1 ].map( i => P0[ i ] - P1[ i ] ) );

  const dot = v0[ 0 ] * v1[ 0 ] + v0[ 1 ] * v1[ 1 ];
  const angleBetween = Math.acos( dot )

  // Ensure angle is not 0 or PI (no arc possible)
  if ( angleBetween <= 0.0001 || Math.abs( Math.PI - angleBetween ) <= 0.0001 ) {
    debugger;   // No arc, straight corner
  }


  // I think this part is if the radius is shorter than vector?
  const tangentLen = radius / Math.tan( angleBetween / 2 );

  const start = [ 0, 1 ].map( i => P1[ i ] + v0[ i ] * tangentLen );
  const end = [ 0, 1 ].map( i => P1[ i ] + v1[ i ] * tangentLen );

  const bisector = normalize( [ v0[ 0 ] + v1[ 0 ], v0[ 1 ] + v1[ 1 ] ] );


  // FIXME: What is orientation supposed to do here? It's causing problems so far
  //        Seems to be the opposite of whether it is clockwise, but that doesn't
  //        seem to effect where the center is
  // Rotate bisector 90 degrees to find center direction
  const cross = v0[ 0 ] * v1[ 1 ] - v0[ 1 ] * v1[ 0 ];
  // const orientation = cross < 0 ? -1 : 1;


  const centerDistance = radius / Math.sin( angleBetween / 2 );


  const center = [
    P1[ 0 ] + bisector[ 0 ] * centerDistance,// * orientation,
    P1[ 1 ] + bisector[ 1 ] * centerDistance,// * orientation,
  ];

  // Compute start and end angles
  // These seem off when bigger radius
  const startAngle = Math.atan2( start[ 1 ] - center[ 1 ], start[ 0 ] - center[ 0 ] );
  const endAngle = Math.atan2( end[ 1 ] - center[ 1 ], end[ 0 ] - center[ 0 ] );

  // Determine sweep direction
  const clockwise = cross < 0;

  // Compute angle at distance
  let sweepAngle = endAngle - startAngle;
  if (clockwise && sweepAngle < 0) sweepAngle += 2 * Math.PI;
  if (!clockwise && sweepAngle > 0) sweepAngle -= 2 * Math.PI;


  const arcLength = Math.abs( sweepAngle * radius );

  const steps = Math.floor( arcLength / stepLength );

  points.push( start );

  for ( let i = 1; i < steps; i ++ ) {
    const angle = startAngle + ( i / steps ) * sweepAngle;

    points.push( [
      center[ 0 ] + radius * Math.cos( angle ),
      center[ 1 ] + radius * Math.sin( angle ),
    ] );
  }

  points.push( end );

  return points;
}


function drawArrow( ctx, pos, angle, width = 0.15, length = 0.3 ) {
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
  value: stepLength,
  min: 0.1,
  max: 1,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  stepLength = +distSlider.value;

  canvas.redraw();
} );
