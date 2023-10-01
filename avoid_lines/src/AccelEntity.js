export class AccelEntity {
  x = 0;
  y = 0;
  angle = 0;
  size = 1;

  dx = 0;
  dy = 0;

  #info;

  #moveVector = { x: 0, y: 0 };
  #debugVectors = [];
  #debugTotal = { x: 0, y: 0 };

  constructor( values, info ) {
    Object.assign( this, values );
    this.#info = info;

    this.target ??= { x: this.x, y: this.y };
  }

  addVector( x, y ) {
    this.#moveVector.x += x;
    this.#moveVector.y += y;

    this.#debugVectors.push( { x: x, y: y } );
  }

  update( dt ) {
    // TODO: Can we detect/avoid jitter somehow? We get alternating large totalDists, so we can't just check that
    //       Need to find the point we want to be and go for that spot exactly, 
    //       so we aren't constantly over and undershooting it

    // The essential pull-push here seems to be between the avoid and the target (no issues if just avoiding?)
    // Does that simplify finding the happy medium?

    if ( this.target ) {
      const tx = this.target.x - this.x;
      const ty = this.target.y - this.y;
      const targetAngle = Math.atan2( ty, tx );
      const targetDist = Math.hypot( tx, ty );

      // if ( targetDist > 0.05 ) {
        // Bias more towards targets that are farther away? 
        // So someone with a ways to go can bump someone who's basically home, at least a little bit
        const targetForce = 0.25 * targetDist;

        // TODO: This is the place to apply breaking if we are getting close to target
        // d = v^2 / 2a

        const speed = Math.hypot( this.dx, this.dy );

        // TODO: Don't slow down so much we become negative. How to determine this in face of other dodge forces?
        //    Use approach-like function to take us toward 0 if we're at less than brakeDist?
        // Also TODO -- put this back to how it was (with velocity and jittering), make another one for acceleration
        //    so I don't lose the thing that sort-of-mostly-worked from before
        // Instead of trying to reverse-thrust, can we slow down with "friction"?

        if ( targetDist > 0.5 ) { // TODO: figure out break speed + Math.pow( speed, 2 ) / ( 2 * this.#info.accel ) ) {
          this.addVector( 
            Math.cos( targetAngle ) * targetForce,
            Math.sin( targetAngle ) * targetForce,
          );
        }
      // }
    }

    const totalAngle = Math.atan2( this.#moveVector.y, this.#moveVector.x );
    const totalDist = Math.hypot( this.#moveVector.x, this.#moveVector.y );

    this.#debugTotal.x = this.#moveVector.x;
    this.#debugTotal.y = this.#moveVector.y;
    this.#moveVector.x = 0;
    this.#moveVector.y = 0;

    // const moveDist = Math.min( this.#info.maxSpeed * dt, totalDist );
    // const moveX = Math.cos( totalAngle ) * moveDist;
    // const moveY = Math.sin( totalAngle ) * moveDist;
    
    // // Trying to smooth out the jitters here without the ice skating of accerlation...
    // // this.#moveVector.x = moveX;
    // // this.#moveVector.y = moveY;

    // this.x += moveX;
    // this.y += moveY;
    // this.angle = Math.atan2( moveY, moveX );


    const accelVal = Math.min( this.#info.accel, totalDist );
    const accelX = Math.cos( totalAngle ) * accelVal;
    const accelY = Math.sin( totalAngle ) * accelVal;
    
    this.dx += accelX * dt;
    this.dy += accelY * dt;

    const velSpeed = Math.hypot( this.dx, this.dy );
    if ( velSpeed > this.#info.maxSpeed ) {
      const slowAmount = this.#info.maxSpeed / velSpeed;
      this.dx *= slowAmount;
      this.dy *= slowAmount;
    }
    
    this.x += this.dx * dt;
    this.y += this.dy * dt;

    const FRICTION = 0.9;
    this.dx *= FRICTION //* dt;
    this.dy *= FRICTION //* dt;
    
    this.angle = Math.atan2( accelY, accelX );
    
  }


  draw( ctx ) {
    ctx.save(); {
      ctx.translate( this.x, this.y );

      ctx.save(); {
        ctx.rotate( this.angle );
        ctx.scale( this.size, this.size );

        this.#info.draw( ctx );
      }
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
    }
    ctx.restore();

    if ( this.target ) {
      ctx.beginPath();
      ctx.moveTo( this.target.x, this.target.y );
      ctx.lineTo( this.x, this.y );
      
      ctx.strokeStyle = 'tan';
      ctx.setLineDash( [ 0.1, 0.1 ] );
      ctx.stroke();
      ctx.setLineDash( [] );
    }
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