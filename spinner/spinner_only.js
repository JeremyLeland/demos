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
gameCanvas.backgroundColor = null;

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


const ColorOffset = 3.5;
const ColorRadius = ColorOffset * ColorAngleWidth / 2;
const OutlineWidth = 0.15;

gameCanvas.draw = ( ctx ) => {

  // Selected limb color outlines
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