import * as Angle from './Angle.js';
import { GameCanvas } from './GameCanvas.js';
import { GameState } from './GameState.js';

const gameState = new GameState( 'spinner_svgPaths_main' );

gameState.path ??= [
  [ 'M', [ 0, 0 ] ],
  [ 'L', [ 2, 0 ] ],
  [ 'L', [ 1, 1 ] ],
  [ 'Q', [ 0, 2 ], [ 2, 2 ] ],
  [ 'C', [ 4, 2.5 ], [ 1, 3 ], [ 2, 4 ] ],
];
gameState.image ??= {
  src: 'https://sorryrobot.com/twister/img5.jpg',
  offsetX: -1,
  offsetY: -1,
  width: 2,
  height: 2,
};

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = '#123';
gameCanvas.setBounds( -1, -1, 1, 1 );

// Reference image
const image = new Image();
image.src = gameState.image.src;
await image.decode();

let hover = null;
let selected = null;
let pointerPos = [ 0, 0 ];

const PointSize = 0.025;
const LineWidth = 0.005;

gameCanvas.draw = ( ctx ) => {

  ctx.drawImage( image,
    gameState.image.offsetX,
    gameState.image.offsetY,
    gameState.image.width,
    gameState.image.height,
  );

  const pathStr = gameState.path.map( e => e.join( ' ' ) ).join( '\n' /*' '*/ );

  console.log( pathStr );

  // Actual path
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = PointSize;
  ctx.stroke( new Path2D( pathStr ) );

  // Points and control points
  ctx.lineWidth = LineWidth;
  ctx.setLineDash( [ PointSize, PointSize ] );

  for ( let i = 0; i < gameState.path.length; i ++ ) {
    const part = gameState.path[ i ];

    // Point
    if ( part.length > 1 ) {
      ctx.fillStyle = 'yellow';
      drawPoint( ctx, part[ part.length - 1 ] );
    }

    // Control points
    if ( part.length > 2 ) {
      ctx.strokeStyle = 'lightblue';
      drawLine( ctx, gameState.path[ i - 1 ].at( -1 ), part[ 1 ] );

      ctx.fillStyle = 'lightblue';
      drawPoint( ctx, part[ 1 ] );

      ctx.strokeStyle = 'yellow';
      drawLine( ctx, part[ 1 ], part[ 2 ] );
    }
    if ( part.length > 3 ) {
      ctx.strokeStyle = 'aqua';
      drawLine( ctx, part[ 1 ], part[ 2 ] );

      ctx.fillStyle = 'aqua';
      drawPoint( ctx, part[ 2 ] );

      ctx.strokeStyle = 'yellow';
      drawLine( ctx, part[ 2 ], part[ 3 ] );
    }
  }

  if ( hover ) {
    const point = hover.point ?? gameState.path[ hover.partIndex ][ hover.pointIndex ];

    ctx.fillStyle = hover.point ? 'purple' : '#fff8';
    drawPoint( ctx, point );
  }

  if ( selected ) {

    const selectedPoint = gameState.path[ selected.partIndex ][ selected.pointIndex ];

    ctx.fillStyle = '#fff8';
    drawPoint( ctx, selectedPoint, PointSize * 2 );

    ctx.strokeStyle = 'orange';
    drawLine( ctx, selectedPoint, hover?.point ?? pointerPos );
  }

  // Center guide
  ctx.beginPath();
  ctx.moveTo( 0, -1 );
  ctx.lineTo( 0,  1 );
  ctx.moveTo( -1, 0 );
  ctx.lineTo(  1, 0 );
  ctx.strokeStyle = '#aaa8';
  ctx.stroke();
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

function drawPoint( ctx, p, radius = PointSize ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], radius, 0, Math.PI * 2 );
  ctx.fill();
}


//
// Input
//

gameCanvas.pointerDown = ( m ) => {

  // Left click
  if ( m.buttons === 1 ) {

    // TODO: Can't assume hover if on touch device, would need to redo work
    if ( hover && hover.pointIndex !== null ) {
      selected = hover;
    }
    else {

      // TODO: Only add L if selected is end of a sequence?
      // TODO: Definitely not if selected is a control point!

      gameState.path.push( [
        selected ? 'L' : 'M',
        hover ? structuredClone( hover.point ) : [ m.x, m.y ],
      ] );

      selected = {
        partIndex: gameState.path.length - 1,
        pointIndex: 1,
        // dist not needed
      };
    }
  }

  // Middle click
  else if ( m.buttons === 4 ) {
    // TODO: Can't assume hover if on touch device, would need to redo work
    if ( hover ) {
      // If we're hovering over a potential new control point, add it to part and select it
      if ( hover.point ) {
        const part = gameState.path[ hover.partIndex ];

        // Upgrade from line -> quadratic bezier -> cubic bezier
        if ( part[ 0 ] === 'L' ) {
          part[ 0 ] = 'Q';

          part.splice( 1, 0, hover.point );

          selected = {
            partIndex: hover.partIndex,
            pointIndex: 1,
          };
        }
        else if ( part[ 0 ] === 'Q' ) {
          part[ 0 ] = 'C';

          part.splice( 2, 0, hover.point );

          selected = {
            partIndex: hover.partIndex,
            pointIndex: 2,
          };
        }
      }
      else {
        selected = hover;
      }
    }
  }

  // Right click
  else if ( m.buttons === 2 ) {

    // TODO: Can't assume hover if on touch device, would need to redo work
    if ( hover ) {
      const part = gameState.path[ hover.partIndex ];

      // Hovering on line/curve, not existing point/control point
      if ( hover.pointIndex === null ) {
        // Deleting a line/curve breaks the sequence
        // This segment becomes starting (M) point for the rest of the sequence
        part[ 0 ] = 'M';

        // Set position for M
        part[ 1 ] = part.at( -1 );

        // Remove any control points
        part.splice( 2 );
      }

      // End point
      else if ( hover.pointIndex === part.length - 1 ) {
        // Remove this segment, which will automatically link to next segment
        gameState.path.splice( hover.partIndex, 1 );

        hover = null;
      }

      // Control point
      else {
        part.splice( hover.pointIndex, 1 );

        // Downgrade from cubic bezier -> quadratic bezier -> line
        if ( part[ 0 ] === 'C' ) {
          part[ 0 ] = 'Q';
        }
        else if ( part[ 0 ] === 'Q' ) {
          part[ 0 ] = 'L';
        }
      }
    }

    // Clear selection
    selected = null;
  }

  gameCanvas.redraw();
}

const SelectDist = PointSize * 2;

gameCanvas.pointerMove = ( m ) => {

  pointerPos[ 0 ] = m.x;
  pointerPos[ 1 ] = m.y;

  // If point is selected, move it ()
  if ( selected && m.buttons === 4 ) {
    const point = gameState.path[ selected.partIndex ][ selected.pointIndex ];

    point[ 0 ] += m.dx;
    point[ 1 ] += m.dy;
  }

  // Middle click and drag in empty area to move background
  else if ( m.buttons === 4 ) {
    gameState.image.offsetX += m.dx;
    gameState.image.offsetY += m.dy;
  }

  // If no buttons pressed, show hover point
  else {
    const closest = {
      partIndex: null,
      pointIndex: null,
      point: null,
      dist: SelectDist,
    }

    // Find closest existing point
    gameState.path.forEach( ( part, partIndex ) => {
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
      for ( let i = 0; i < gameState.path.length - 1; i ++ ) {
        // TODO: If next part is M, we should skip
        if ( gameState.path[ i + 1 ][ 0 ] === 'M' ) {
          continue;
        }


        const A = gameState.path[ i ].at( -1 );

        // TODO: Handle Z loop (use path[ 0 ] point)
        // TODO: Also, if it's a Z and we're adding control points, it'll need to be changed to actual point

        const B = gameState.path[ i + 1 ].at( -1 );

        if ( gameState.path[ i + 1 ].length == 2 ) {
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
        else if ( gameState.path[ i + 1 ].length == 3 ) {
          for ( let t = 0; t <= 1; t += 0.01 ) {
            const p = quadraticBezier( A, gameState.path[ i + 1 ][ 1 ], B, t );
            const dist = Math.hypot( m.x - p[ 0 ], m.y - p[ 1 ] );

            if ( dist < closest.dist ) {
              closest.partIndex = i + 1;
              closest.point = p;
              closest.dist = dist;
            }
          }
        }
        // Putting this back in so we can recognize hovers for cubic beziers
        else if ( gameState.path[ i + 1 ].length == 4 ) {
          for ( let t = 0; t <= 1; t += 0.01 ) {
            const p = cubicBezier( A, gameState.path[ i + 1 ][ 1 ], gameState.path[ i + 1 ][ 2 ], B, t );
            const dist = Math.hypot( m.x - p[ 0 ], m.y - p[ 1 ] );

            if ( dist < closest.dist ) {
              closest.partIndex = i + 1;
              closest.point = p;
              closest.dist = dist;
            }
          }
        }
      }
    }

    hover = closest.dist < SelectDist ? closest : null;
  }

  gameCanvas.redraw();
}

gameCanvas.pointerUp = ( m ) => {
  // selected = null;

  gameCanvas.redraw();
}

const ZoomSpeed = 0.1;

gameCanvas.wheelInput = ( m ) => {
  const xPerc = ( m.x - gameState.image.offsetX ) / gameState.image.width;
  const yPerc = ( m.y - gameState.image.offsetY ) / gameState.image.height;

  // Shift = bigger move, Control = smaller move
  const resize = 1 + Math.sign( m.wheel ) * ZoomSpeed * ( m.shiftKey ? 2 : 1 ) * ( m.ctrlKey ? 0.25 : 1 );
  gameState.image.width *= resize;
  gameState.image.height *= resize;

  gameState.image.offsetX = m.x - gameState.image.width * xPerc;
  gameState.image.offsetY = m.y - gameState.image.height * yPerc;

  gameCanvas.redraw();
}

document.addEventListener( 'keydown', e => {

  // Deselect
  if ( e.key === 'Escape' ) {
    selected = null;
    hover = null;
  }

  // Clear everything
  if ( e.key === 'Backspace' ) {
    gameState.path = [];

    selected = null;
    hover = null;
  }

  gameCanvas.redraw();
} );

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