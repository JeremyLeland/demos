import { GameCanvas } from './GameCanvas.js';

const Constants = {
  Spinner: {
    Radius: 0.5,
    Length: 5,
  },
}

const spinnerPath = new Path2D();
spinnerPath.moveTo( Constants.Spinner.Length, 0 );
spinnerPath.lineTo( 0, Constants.Spinner.Radius );
spinnerPath.arc( 0, 0, Constants.Spinner.Radius, Math.PI / 2, -Math.PI / 2 );
spinnerPath.closePath();

const spinner = {
  angle: 0,
  angleVel: 0.025,
  angleAccel: -0.000005,
}

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = 'white';

gameCanvas.update = ( dt ) => {
  spinner.angleVel = Math.max( 0, spinner.angleVel + spinner.angleAccel * dt );
  spinner.angle += spinner.angleVel * dt;
}

gameCanvas.draw = ( ctx ) => {

  ctx.rotate( spinner.angle );

  ctx.fillStyle = 'black';
  ctx.fill( spinnerPath );
}

gameCanvas.start();