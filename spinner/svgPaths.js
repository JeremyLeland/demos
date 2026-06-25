import * as Angle from './Angle.js';
import { GameCanvas } from './GameCanvas.js';


const path = [
  [ 'M', [ 0, 0 ] ],
  [ 'L', [ 2, 0 ] ],
  [ 'L', [ 1, 1 ] ],
  [ 'Q', [ 0, 2 ], [ 2, 2 ] ],
  [ 'C', [ 4, 2.5 ], [ 1, 3 ], [ 2, 4 ] ],
];

const TWO_PI = Math.PI * 2;
const PI_2 = Math.PI / 2;

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = '#123';

let hover = null;
let selected = null;

gameCanvas.draw = ( ctx ) => {

  const pathStr = path.map( e => e.join( ' ' ) ).join( ' ' );

  console.log( pathStr );

  // Actual path
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 0.05;
  ctx.stroke( new Path2D( pathStr ) );

  // Points and control points
  path.forEach( part => {
    // Point
    if ( part.length > 1 ) {
      ctx.fillStyle = 'yellow';
      drawPoint( ctx, part[ part.length - 1 ] );
    }

    // Control points
    if ( part.length > 2 ) {
      ctx.fillStyle = 'lightblue';
      drawPoint( ctx, part[ 1 ] );
    }
    if ( part.length > 3 ) {
      ctx.fillStyle = 'aqua';
      drawPoint( ctx, part[ 2 ] );
    }
  } );

  if ( hover ) {
    const point = hover.point ?? path[ hover.partIndex ][ hover.pointIndex ];

    ctx.fillStyle = hover.point ? 'purple' : '#fff8';
    drawPoint( ctx, point );
  }

  if ( selected ) {
    ctx.fillStyle = '#fff8';
    drawPoint( ctx, path[ selected.partIndex ][ selected.pointIndex ] );
  }
}

// gameCanvas.start();


//
// Draw utils
//

function drawArc( ctx, arc ) {
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();
}

function drawLine( ctx, start, end ) {
  ctx.beginPath();
  ctx.moveTo( ...start );
  ctx.lineTo( ...end );
  ctx.stroke();
}

function drawPoint( ctx, p, radius = 0.05 ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], radius, 0, Math.PI * 2 );
  ctx.fill();
}


//
// Input
//

gameCanvas.pointerDown = ( m ) => {

  /*
  // Find closest point
  const closest = {
    partIndex: null,
    pointIndex: null,
    dist: Infinity,
  };

  path.forEach( ( part, partIndex ) => {
    part.forEach( ( point, pointIndex ) => {
      if ( pointIndex > 0 ) {
        const dist = Math.hypot( m.x - point[ 0 ], m.y - point[ 1 ] );

        if ( dist < closest.dist ) {
          closest.partIndex = partIndex;
          closest.pointIndex = pointIndex;
          closest.dist = dist;
        }
      }
    } );
  } );

  selected = closest.dist < 0.1 ? closest : null;
  */

  // For now, just test creating and moving control points
  // Add endpoints back in (hover should differentiate between existing and potential points)

  if ( hover ) {

    // If we're hovering over a potential new control point, add it to part and select it
    if ( hover.point ) {
      const part = path[ hover.partIndex ];
      const controlPointIndex = part.length - 1;

      // Upgrade from line -> quadratic bezier -> cubic bezier
      if ( part[ 0 ] === 'L' ) {
        part[ 0 ] = 'Q';
      }
      else if ( part[ 0 ] === 'Q' ) {
        part[ 0 ] = 'C';
      }

      part.splice( controlPointIndex, 0, hover.point );

      selected = {
        partIndex: hover.partIndex,
        pointIndex: controlPointIndex,
        // dist not needed
      };
    }
    else {
      selected = hover;
    }

    hover = null;
  }

  gameCanvas.redraw();
}

const SelectDist = 0.2;

gameCanvas.pointerMove = ( m ) => {
  if ( selected ) {
    const point = path[ selected.partIndex ][ selected.pointIndex ];

    point[ 0 ] += m.dx;
    point[ 1 ] += m.dy;
  }
  else {
    const closest = {
      partIndex: null,
      pointIndex: null,
      point: null,
      dist: SelectDist,
    }

    // Find closest existing point
    path.forEach( ( part, partIndex ) => {
      part.forEach( ( point, pointIndex ) => {
        if ( pointIndex > 0 ) {
          const dist = Math.hypot( m.x - point[ 0 ], m.y - point[ 1 ] );

          if ( dist < closest.dist ) {
            closest.partIndex = partIndex;
            closest.pointIndex = pointIndex;
            closest.dist = dist;
          }
        }
      } );
    } );

    // If no existing points close enough, look for closest potential control point (on lines/curves)
    if ( closest.dist >= SelectDist ) {
      for ( let i = 0; i < path.length - 1; i ++ ) {
        const A = path[ i ].at( -1 );

        // TODO: Handle Z loop (use path[ 0 ] point)
        // TODO: Also, if it's a Z and we're adding control points, it'll need to be changed to actual point
        // TODO: If next part is M, we should skip
        const B = path[ i + 1 ].at( -1 );

        if ( path[ i + 1 ].length == 2 ) {
          const ABx = B[ 0 ] - A[ 0 ];
          const ABy = B[ 1 ] - A[ 1 ];

          const APx = m.x - A[ 0 ];
          const APy = m.y - A[ 1 ];

          const u = ( ABx * APx + ABy * APy ) / ( ABx ** 2 + ABy ** 2 );
          const t = Math.max( 0, Math.min( 1, u ) );

          const closestX = A[ 0 ] + ABx * t;
          const closestY = A[ 1 ] + ABy * t;

          const dist = Math.hypot( m.x - closestX, m.y - closestY );

          if ( dist < closest.dist ) {
            closest.partIndex = i + 1;
            closest.point = [ closestX, closestY ];
            closest.dist = dist;
          }
        }
        else if ( path[ i + 1 ].length == 3 ) {
          for ( let t = 0; t <= 1; t += 0.01 ) {
            const p = quadraticBezier( A, path[ i + 1 ][ 1 ], B, t );
            const dist = Math.hypot( m.x - p[ 0 ], m.y - p[ 1 ] );

            if ( dist < closest.dist ) {
              closest.partIndex = i + 1;
              closest.point = p;
              closest.dist = dist;
            }
          }
        }
        // Actually, we shouldn't ever need this, because we already have two control points
        // else if ( path[ i + 1 ].length == 4 ) {
        //   for ( let j = 0; j < 10; j ++ ) {
        //     const t = j / 10;
        //     const p = cubicBezier( A, path[ i + 1 ][ 1 ], path[ i + 1 ][ 2 ], B, t );
        //     const dist = Math.hypot( m.x - p[ 0 ], m.y - p[ 1 ] );

        //     if ( dist < closest.dist ) {
        //       closest.partIndex = i + 1;
        //       closest.point = p;
        //       closest.dist = dist;
        //     }
        //   }
        // }
      }
    }

    hover = closest.dist < SelectDist ? closest : null;
  }

  gameCanvas.redraw();
}

gameCanvas.pointerUp = ( m ) => {
  selected = null;

  gameCanvas.redraw();
}

function quadraticBezier( P0, P1, P2, t ) {
  const mt = 1 - t;
  return [
    mt ** 2 * P0[ 0 ] + 2 * mt * t * P1[ 0 ] + t ** 2 * P2[ 0 ],
    mt ** 2 * P0[ 1 ] + 2 * mt * t * P1[ 1 ] + t ** 2 * P2[ 1 ],
  ];
}

function cubicBezier( P0, P1, P2, P3, t ) {
  const mt = 1 - t;
  return [
    mt ** 3 * P0[ 0 ] + 3 * mt ** 2 * t * P1[ 0 ] + 3 * mt * t ** 2 * P2[ 0 ] + t ** 3 * P3[ 0 ],
    mt ** 3 * P0[ 1 ] + 3 * mt ** 2 * t * P1[ 1 ] + 3 * mt * t ** 2 * P2[ 1 ] + t ** 3 * P3[ 1 ],
  ];
}