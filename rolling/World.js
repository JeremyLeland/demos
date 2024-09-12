import { Line } from './Line.js';

const EPSILON = 1e-6;
const GRAVITY = 0.00001;

const ROLL_ANGLE = 0.5;
const ROLL_FRICTION = 0.2; //0.5;
const BOUNCE_DAMPING = 0.7;
const BOUNCE_FRICTION = 0.05;


export class World {
  
  player;

  #loops;
  #lines;


  #debugCurrentLine;

  constructor( loops ) {
    this.#loops = loops;

    this.#lines = [];
    loops.forEach( loop => {
      for ( let i = 0; i < loop.length; i ++ ) {
        this.#lines.push( 
          new Line( ...loop[ i ], ...loop[ ( i + 1 ) % loop.length ] )
        );
      }
    } );

    this.player = { x: -2, y: -6, dx: 0, dy: 0, radius: 0.5 };
  }

  update( dt ) {
    let currentLine = null, currentDist = EPSILON;  // currentDist start value is "snap" distance
    this.#lines.forEach( line => {
      const dist = line.distanceFrom( this.player );
      
      if ( -this.player.radius < dist && dist < currentDist ) {
        currentLine = line;
        currentDist = dist;
      }
    } );

    this.#debugCurrentLine = currentLine;

    if ( currentLine ) {
      const normalAngle = currentLine.normalAngle;
      const slopeAngle = currentLine.slopeAngle;

      this.player.x -= Math.cos( normalAngle ) * currentDist;
      this.player.y -= Math.sin( normalAngle ) * currentDist;

      const playerAngle = Math.atan2( this.player.dy, this.player.dx );

      if ( Math.abs( deltaAngle( slopeAngle, playerAngle ) ) < ROLL_ANGLE ||
           Math.abs( deltaAngle( playerAngle, slopeAngle + Math.PI ) ) < ROLL_ANGLE ) {
        // roll
      }
      else {
        const normX = Math.cos( normalAngle );
        const normY = Math.sin( normalAngle );
        const vDotN = this.player.dx * normX + this.player.dy * normY;

        const lineSlopeX = Math.cos( slopeAngle );
        const lineSlopeY = Math.sin( slopeAngle );
        const vDotF = this.player.dx * lineSlopeX + this.player.dy * lineSlopeY;

        this.player.dx -= 2 * vDotN * normX * BOUNCE_DAMPING + vDotF * lineSlopeX * BOUNCE_FRICTION;
        this.player.dy -= 2 * vDotN * normY * BOUNCE_DAMPING + vDotF * lineSlopeY * BOUNCE_FRICTION;

        currentLine = null;
      }
    }

    let nextTime = dt;

    for ( let step = 0; step < 5; step ++ ) {

      let ax, ay;

      if ( currentLine ) {
        const normalAngle = currentLine.normalAngle;
        const slopeAngle = currentLine.slopeAngle;

        const lineSlopeX = Math.cos( slopeAngle );
        const lineSlopeY = Math.sin( slopeAngle );

        const proj = this.player.dx * lineSlopeX + this.player.dy * lineSlopeY;

        const playerSlopeX = proj < 0 ? -lineSlopeX : lineSlopeX;
        const playerSlopeY = proj < 0 ? -lineSlopeY : lineSlopeY;

        const speed = Math.hypot( this.player.dx, this.player.dy );
        this.player.dx = playerSlopeX * speed;
        this.player.dy = playerSlopeY * speed;

        // https://stickmanphysics.com/stickman-physics-home/forces/incline-planes/
        const a = GRAVITY * ( lineSlopeY - ROLL_FRICTION * playerSlopeX );    // TODO: base friction on line slope or player slope?
        ax = a * lineSlopeX;
        ay = a * lineSlopeY;

        // Find stop time, see if that is before next line
        // Do we need to account for difference between static friction and kinetic friction?
        // Difference between slowing to a stop on a downhill and slowing to change direction on uphill
        const brakeDistance = Math.pow( speed, 2 ) / ( 2 * ROLL_FRICTION * GRAVITY );
        const brakeTime = speed == 0 ? Infinity : ( 2 * brakeDistance ) / ( 0 + speed );

        nextTime = Math.min( dt, brakeTime );

        // NOTE: This is only valid when moving on a linear slope. Need to do something different below
        let nextLine = null;
        this.#lines.forEach( line => {
          if ( currentLine != line ) {
            const dist = line.getSlopeDist( this.player, playerSlopeX, playerSlopeY );

            const time = getTime( speed, a, dist );

            if ( EPSILON < time && time < nextTime ) {
              nextLine = line;
              nextTime = time;
            }
          }
        } );

        if ( nextLine ) {
          currentLine = nextLine;
        } 
      }
      else {
        ax = 0;
        ay = GRAVITY;

        // TODO: Check for next line, adjust nextTime appropriately
        //       Can't use the linear distance above, since we'll be doing parabolic motion
      }

      this.player.x += this.player.dx * nextTime + 0.5 * ax * nextTime * nextTime;
      this.player.y += this.player.dy * nextTime + 0.5 * ay * nextTime * nextTime;
      
      this.player.dx += ax * nextTime;
      this.player.dy += ay * nextTime;
      
      dt -= nextTime;

      if ( dt <= 0 ) {
        break;
      }
    }
  }

  draw( ctx ) {
    ctx.fillStyle = 'green';
    this.#loops.forEach( loop => {
      ctx.beginPath();
      loop.forEach( p => ctx.lineTo( p[ 0 ], p[ 1 ] ) );
      ctx.fill();
    } );

    ctx.strokeStyle = 'white';
    this.#lines.forEach( line => line.draw( ctx ) );

    ctx.beginPath();
    ctx.arc( this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2 );
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();

    if ( this.#debugCurrentLine ) {
      ctx.strokeStyle = 'yellow';
      this.#debugCurrentLine.draw( ctx );
    }
  }
}

function getSlope( line ) {
  return Math.atan2( line.y2 - line.y1, line.x2 - line.x1 );
}

function getTime( speed, accel, dist ) {
  // https://physics.info/motion-equations/
  // t = ( -v0 +- Math.sqrt( v0*v0 + 2 * a * dist ) ) / a
  const disc = Math.pow( speed, 2 ) + 2 * accel * dist;

  if ( disc < 0 ) {
    return Infinity;
  }
  else {
    const dt1 = ( -speed - Math.sqrt( disc ) ) / accel;
    const dt2 = ( -speed + Math.sqrt( disc ) ) / accel;

    return dt1 < dt2 && EPSILON <= dt1 ? dt1 : dt2;
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}