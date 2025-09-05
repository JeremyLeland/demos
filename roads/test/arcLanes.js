import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

let distance = 0;

// TODO: Making these run paralell first, eventually test them in opposite directions

// TODO: Draw cars, arrows, etc with drawOnRoute( ctx, route, dist, drawFunc )

const roads = {
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

const path = [ roads.first_NORTH, roads.first_to_A, roads.A_EAST, roads.A_to_second, roads.second_NORTH ];

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 14;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 12, 12 );

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
    ctx.fillStyle = 'yellow';
    
    for ( let length = 0; length < 8; length += 0.5 ) {
      drawOnRoadAtDistance( ctx, road, length, drawArrow );
    }
  }

  // TODO: Draw at distance along path
  ctx.fillStyle = 'cyan';
  
  let partialDistance = distance;

  for ( let i = 0; i < path.length; i ++ ) { 
    const length = getLength( path[ i ] );

    if ( partialDistance > length ) {
      partialDistance -= length;
    }
    else {
      drawOnRoadAtDistance( ctx, path[ i ], partialDistance, drawArrow );
      break;
    }
  }

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function normalize( v ) {
  const len = Math.hypot( ...v );
  return v.map( e => e / len );
}

function drawOnRoadAtDistance( ctx, road, distance, drawFunc ) {

  if ( road.control ) {
    const v0 = normalize( [ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );
    const v1 = normalize( [ 0, 1 ].map( i => road.end[ i ] - road.control[ i ] ) );

    const radius = Math.hypot( ...[ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );

    const dot = v0[ 0 ] * v1[ 0 ] + v0[ 1 ] * v1[ 1 ];
    const angleBetween = Math.acos( dot )

    // Ensure angle is not 0 or PI (no arc possible)
    if ( angleBetween <= 0.0001 || Math.abs( Math.PI - angleBetween ) <= 0.0001 ) {
      debugger;   // No arc, straight corner
    }


    // I think this part is if the radius is shorter than vector?
    const tangentLen = radius / Math.tan( angleBetween / 2 );

    const start = [ 0, 1 ].map( i => road.control[ i ] + v0[ i ] * tangentLen );
    const end = [ 0, 1 ].map( i => road.control[ i ] + v1[ i ] * tangentLen );

    const bisector = normalize( [ v0[ 0 ] + v1[ 0 ], v0[ 1 ] + v1[ 1 ] ] );


    // FIXME: What is orientation supposed to do here? It's causing problems so far
    //        Seems to be the opposite of whether it is clockwise, but that doesn't
    //        seem to effect where the center is
    // Rotate bisector 90 degrees to find center direction
    const cross = v0[ 0 ] * v1[ 1 ] - v0[ 1 ] * v1[ 0 ];
    // const orientation = cross < 0 ? -1 : 1;


    const centerDistance = radius / Math.sin( angleBetween / 2 );


    const center = [
      road.control[ 0 ] + bisector[ 0 ] * centerDistance,// * orientation,
      road.control[ 1 ] + bisector[ 1 ] * centerDistance,// * orientation,
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

    // Don't draw if outside arc length
    if ( 0 <= distance && distance <= arcLength ) {
      const angleOffset = ( distance / radius ) * (clockwise ? 1 : -1);
      const angleAtD = startAngle + angleOffset;

      // Final point
      const pos = [
        center[ 0 ] + radius * Math.cos(angleAtD),
        center[ 1 ] + radius * Math.sin(angleAtD),
      ];

      drawFunc( ctx, pos, angleAtD + (clockwise ? 1 : -1) * Math.PI / 2 );
    }
  }
  else {
    const total_dist = Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );

    if ( 0 <= distance && distance <= total_dist ) {
      const pos = [ 0, 1 ].map( 
        i => road.start[ i ] + ( road.end[ i ] - road.start[ i ] ) * ( distance / total_dist )
      );
      
      const angle = Math.atan2( road.end[ 1 ] - road.start[ 1 ], road.end[ 0 ] - road.start[ 0 ] );
      
      drawFunc( ctx, pos, angle );
    }
  }
}

function getLength( road ) {
  if ( road.control ) {
    const v0 = normalize( [ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );
    const v1 = normalize( [ 0, 1 ].map( i => road.end[ i ] - road.control[ i ] ) );

    const radius = Math.hypot( ...[ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );

    const dot = v0[ 0 ] * v1[ 0 ] + v0[ 1 ] * v1[ 1 ];
    const angleBetween = Math.acos( dot )

    // Ensure angle is not 0 or PI (no arc possible)
    if ( angleBetween <= 0.0001 || Math.abs( Math.PI - angleBetween ) <= 0.0001 ) {
      debugger;   // No arc, straight corner
    }


    // I think this part is if the radius is shorter than vector?
    const tangentLen = radius / Math.tan( angleBetween / 2 );

    const start = [ 0, 1 ].map( i => road.control[ i ] + v0[ i ] * tangentLen );
    const end = [ 0, 1 ].map( i => road.control[ i ] + v1[ i ] * tangentLen );

    const bisector = normalize( [ v0[ 0 ] + v1[ 0 ], v0[ 1 ] + v1[ 1 ] ] );


    // FIXME: What is orientation supposed to do here? It's causing problems so far
    //        Seems to be the opposite of whether it is clockwise, but that doesn't
    //        seem to effect where the center is
    // Rotate bisector 90 degrees to find center direction
    const cross = v0[ 0 ] * v1[ 1 ] - v0[ 1 ] * v1[ 0 ];
    // const orientation = cross < 0 ? -1 : 1;


    const centerDistance = radius / Math.sin( angleBetween / 2 );


    const center = [
      road.control[ 0 ] + bisector[ 0 ] * centerDistance,// * orientation,
      road.control[ 1 ] + bisector[ 1 ] * centerDistance,// * orientation,
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


    return Math.abs( sweepAngle * radius );
  }
  else {
    return Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );
  }
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
  value: 0,
  min: 0,
  max: 10,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
