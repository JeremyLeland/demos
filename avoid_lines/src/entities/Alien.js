const body = new Path2D();
body.moveTo( -1, 0 );
body.arc( 0, 0, 1, -1, 1 );
body.closePath();

export const AlienInfo = {
  // type: 'alien',
  
  maxSpeed: 0.002,

  accel: 4e-6,

  // maxMoveSpeed: 0.0005,
  // maxTurnSpeed: 0.005,
  // moveAccel: 0.000002,
  // turnAccel: 0.00002,

  // minSize: 0.8,
  // maxSize: 1.2,
  boundingPoints: [
    [ -1,  0 ],
    [  1, -1 ],
    [  1,  1 ],
  ],

  draw: ( ctx ) => {
    ctx.fillStyle = 'green';
    ctx.fill( body );
  }
};