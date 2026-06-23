import * as Angle from './Angle.js';
import { GameCanvas } from './GameCanvas.js';

const Constants = {
  Spinner: {
    TipRadius: 0.1,
    BaseRadius: 0.5,
    TipLength: 4,
    BaseLength: 2.5,
    AngleAccel: -0.000005,
  },
  Limbs: [
    'right foot',
    'left hand',
    'left foot',
    'right hand',
  ],
  Colors: [
    'red',
    'green',
    'yellow',
    'blue',
  ],
};

const NumLimbs = Constants.Limbs.length;
const NumColors = Constants.Colors.length;

const TWO_PI = Math.PI * 2;
const PI_2 = Math.PI / 2;

const ColorAngleWidth = TWO_PI / NumLimbs / NumColors;

const spinnerPath = new Path2D();
spinnerPath.arc( Constants.Spinner.TipLength, 0, Constants.Spinner.TipRadius, -PI_2, PI_2 );
spinnerPath.arc( -Constants.Spinner.BaseLength, 0, Constants.Spinner.BaseRadius, PI_2, -PI_2 );

const spinner = {
  angle: 0,
  dAngle: 0,
};

const limbColors = Array( NumLimbs );

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = 'white';

gameCanvas.update = ( dt ) => {
  spinner.angle += spinner.dAngle * dt + Constants.Spinner.AngleAccel * dt * dt / 2;
  spinner.dAngle += Constants.Spinner.AngleAccel * dt;

  if ( spinner.dAngle < 0 ) {
    spinner.dAngle = 0;
    gameCanvas.stop();

    // Save resulting limb color
    const index = Math.floor( ( spinner.angle % TWO_PI ) / ColorAngleWidth );

    const limb = Math.floor( index / NumColors );
    const color = index % NumColors;

    limbColors[ limb ] = color;
  }
}

gameCanvas.draw = ( ctx ) => {

  ctx.font = '0.5px Arial';
  ctx.fillStyle = 'black';

  const TextOffset = 4.75;
  ctx.textBaseline = 'hanging';   // 'top' to low in FF
  ctx.textAlign = 'left';
  ctx.fillText( 'Left Foot',  -TextOffset, -TextOffset );
  ctx.textAlign = 'right';
  ctx.fillText( 'Right Hand',  TextOffset, -TextOffset );

  ctx.textBaseline = 'alphabetic';  // 'bottom' too high in FF
  ctx.textAlign = 'left';
  ctx.fillText( 'Left Hand', -TextOffset,  TextOffset );
  ctx.textAlign = 'right';
  ctx.fillText( 'Right Foot',   TextOffset,  TextOffset );


  ctx.font = '1.5px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const IconOffset = 3.5;

  // Left foot
  ctx.save(); {
    ctx.translate( -IconOffset, -IconOffset );
    ctx.rotate( -Math.PI / 4 );
    ctx.scale( -1, 1 );
    ctx.fillText( '🦶', 0, 0 );
  }
  ctx.restore();

  // Right hand
  ctx.save(); {
    ctx.translate( IconOffset, -IconOffset );
    ctx.rotate( Math.PI / 4 );
    ctx.fillText( '🖐️', 0, 0 );
  }
  ctx.restore();

  // Left hand
  ctx.save(); {
    ctx.translate( -IconOffset, IconOffset );
    ctx.rotate( -Math.PI / 4 );
    ctx.scale( -1, 1 );
    ctx.fillText( '🖐️', 0, 0 );
  }
  ctx.restore();

  // Right foot
  ctx.save(); {
    ctx.translate( IconOffset, IconOffset );
    ctx.rotate( -Math.PI * 0.09 );
    ctx.fillText( '🦶', 0, 0 );
  }
  ctx.restore();

  const ColorOffset = 3.5;

  // Quadrants
  ctx.beginPath();
  ctx.moveTo( ColorOffset, 0 );
  ctx.lineTo( 5, 0 );
  ctx.moveTo( 0, ColorOffset );
  ctx.lineTo( 0, 5 );
  ctx.moveTo( -ColorOffset, 0 );
  ctx.lineTo( -5, 0 );
  ctx.moveTo( 0, -ColorOffset );
  ctx.lineTo( 0, -5 );
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.05;
  ctx.stroke();

  // Colors
  const ColorRadius = ColorOffset * ColorAngleWidth / 2;

  for ( let i = 0; i < NumLimbs * NumColors; i ++ ) {
    const angle = getAngleForIndex( i );

    ctx.beginPath();
    ctx.arc( Math.cos( angle ) * ColorOffset, Math.sin( angle ) * ColorOffset, ColorRadius, 0, TWO_PI );
    ctx.fillStyle = Constants.Colors[ i % NumColors ];
    ctx.fill();
  }

  // Selected limb color outlines
  const OutlineWidth = 0.15;

  limbColors.forEach( ( colorIndex, limbIndex ) => {
    if ( limbColors[ limbIndex ] === colorIndex ) {
      const angle = getAngleForIndex( limbIndex * NumColors + colorIndex );

      ctx.beginPath();
      ctx.arc( Math.cos( angle ) * ColorOffset, Math.sin( angle ) * ColorOffset, ColorRadius - OutlineWidth / 2, 0, TWO_PI );
      ctx.strokeStyle = 'black';
      ctx.lineWidth = OutlineWidth;
      ctx.stroke();
    }
  } );

  // Spinner
  ctx.rotate( spinner.angle );
  ctx.fillStyle = 'black';
  ctx.fill( spinnerPath );
}

gameCanvas.start();

//
// Input
//

const MinSpins = 1;
const MaxSpins = 3;

gameCanvas.pointerDown = ( m ) => {

  // const goalAngle = Math.atan2( m.y, m.x );
  const goalAngle = getAngleForIndex( roll() );

  const numSpins = Math.round( MinSpins + Math.random() * ( MaxSpins - MinSpins ) );

  const sweepAngle = Angle.sweepAngle( spinner.angle, goalAngle ) + numSpins * TWO_PI;

  // Find initial velocity to reach desired sweepAngle using equations of motion
  spinner.dAngle = Math.sqrt( -2 * Constants.Spinner.AngleAccel * sweepAngle );

  gameCanvas.start();
}

function roll() {
  for ( let retries = 0; retries < 100; retries ++ ) {
    const roll = Math.floor( Math.random() * NumLimbs * NumColors );

    const limb = Math.floor( roll / NumColors );
    const color = roll % NumColors;

    if ( limbColors[ limb ] === color ) {
      console.log( `${ Constants.Limbs[ limb ] } is already ${ Constants.Colors[ color ] }, re-rolling (attempt ${ retries + 1 })` );
    }
    else {
      return roll;
    }
  }

  console.warn( 'Failed to get unique roll after 100 attempts!' );
}

function getAngleForIndex( i ) {
  return ( i + 0.5 ) * TWO_PI / NumLimbs / NumColors;
}