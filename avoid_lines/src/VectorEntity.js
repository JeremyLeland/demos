export class VectorEntity {
  x = 0;
  y = 0;
  angle = 0;
  size = 0;

  #info;

  #moveVector = { x: 0, y: 0 };
  #debugVectors = [];
  #debugTotal = { x: 0, y: 0 };

  constructor( values, info ) {
    Object.assign( this, values );
    this.#info = info;
  }

  addVector( x, y ) {
    this.#moveVector.x += x;
    this.#moveVector.y += y;

    this.#debugVectors.push( { x: x, y: y } );
  }

  update( dt ) {
    if ( this.#moveVector.x != 0 || this.#moveVector.y != 0 ) {
      const totalAngle = Math.atan2( this.#moveVector.y, this.#moveVector.x );
      const totalDist = Math.hypot( this.#moveVector.x, this.#moveVector.y );

      this.#debugTotal.x = this.#moveVector.x;
      this.#debugTotal.y = this.#moveVector.y;
      this.#moveVector.x = 0;
      this.#moveVector.y = 0;

      const moveDist = Math.min( this.#info.speed * dt, totalDist );
      const moveX = Math.cos( totalAngle ) * moveDist;
      const moveY = Math.sin( totalAngle ) * moveDist;

      this.x += moveX;
      this.y += moveY;
      // this.angle = Math.atan2( moveY, moveX );
    }
  }


  draw( ctx ) {
    ctx.save();

    ctx.translate( this.x, this.y );

    ctx.save();

    ctx.rotate( this.angle );
    ctx.scale( this.size, this.size );

    this.#info.draw( ctx );

    ctx.restore();

    ctx.beginPath();
    ctx.arc( 0, 0, this.size, 0, Math.PI * 2 );
    ctx.fillStyle = '#4444';
    ctx.fill();

    ctx.fillStyle = ctx.strokeStyle = 'gray';
    this.#debugVectors.forEach( v => drawArrow( ctx, v ) );
    this.#debugVectors = [];

    ctx.fillStyle = ctx.strokeStyle = 'white';
    drawArrow( ctx, this.#debugTotal );

    ctx.restore();
  }
}

function drawArrow( ctx, vector ) {
  const x = vector.x * 2;
  const y = vector.y * 2;

  ctx.beginPath();
  ctx.moveTo( 0, 0 );
  ctx.lineTo( x, y );
  ctx.stroke();

  const HEAD_WIDTH = 0.5;
  const HEAD_LENGTH = 0.2;
  const angle = Math.atan2( -y, -x );
  ctx.beginPath();
  ctx.moveTo( x, y );
  ctx.arc( x, y, HEAD_LENGTH, angle - HEAD_WIDTH, angle + HEAD_WIDTH );
  ctx.closePath();
  ctx.fill();
}