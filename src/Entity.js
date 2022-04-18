export class Entity {
  x = 0;
  y = 0;
  angle = 0;
  size = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;
  dSize = 0;
  
  constructor( info ) {
    Object.assign( this, info );
  }

  update( dt ) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.angle += this.dAngle * dt;
    this.size += this.dSize * dt;
  }

  draw( ctx ) {
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );

    this.drawEntity( ctx );

    ctx.restore();
  }

  drawEntity( ctx ) {

  }
}