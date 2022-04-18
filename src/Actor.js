import { Entity } from './Entity.js';

export class Actor extends Entity {
  speed;
  turnSpeed;

  goalAngle;

  update( dt ) {
    this.angle = approach( 
      fixAngleTo( this.angle, this.goalAngle ), 
      this.goalAngle, 
      this.turnSpeed, 
      dt 
    );
    
    this.dx = this.speed * Math.cos( this.angle );
    this.dy = this.speed * Math.sin( this.angle );

    super.update( dt );
  }
}

function approach( current, goal, speed, dt ) {
  if ( goal < current ) {
    return Math.max( goal, current - speed * dt );
  }
  else if ( current < goal ) {
    return Math.min( goal, current + speed * dt );
  }
  else {
    return current;
  }
}

function fixAngleTo( angle, otherAngle ) {
  if ( otherAngle - angle > Math.PI ) {
    return angle + Math.PI * 2;
  }
  else if ( angle - otherAngle > Math.PI ) {
    return angle - Math.PI * 2;
  }

  return angle;
}