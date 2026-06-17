import { GameCanvas } from './GameCanvas.js';

const Constants = {
  Spinner: {
    Radius: 0.5,
    Length: 5,
    AngleAccel: -0.000005,
  },
}

const spinnerPath = new Path2D();
spinnerPath.moveTo( Constants.Spinner.Length, 0 );
spinnerPath.lineTo( 0, Constants.Spinner.Radius );
spinnerPath.arc( 0, 0, Constants.Spinner.Radius, Math.PI / 2, -Math.PI / 2 );
spinnerPath.closePath();

const spinner = {
  angle: 0,
  dAngle: 0,
}

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = 'white';

gameCanvas.update = ( dt ) => {
  spinner.angle += spinner.dAngle * dt + Constants.Spinner.AngleAccel * dt * dt / 2;
  spinner.dAngle += Constants.Spinner.AngleAccel * dt;

  if ( spinner.dAngle < 0 ) {
    spinner.dAngle = 0;
    gameCanvas.stop();
  }
}

gameCanvas.draw = ( ctx ) => {

  ctx.rotate( spinner.angle );

  ctx.fillStyle = 'black';
  ctx.fill( spinnerPath );
}

gameCanvas.start();

//
// Input
//

gameCanvas.pointerDown = ( m ) => {
  spinner.dAngle = 0.01 + Math.random() * 0.015;
  gameCanvas.start();
}