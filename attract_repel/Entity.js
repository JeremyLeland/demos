export class Entity {
  x = 0;
  y = 0;
  angle = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;

  ddx = 0;
  ddy = 0;
  ddAngle = 0;

  color = 'black';
  drawPath = new Path2D();
  type = 'entity';

  constructor( values ) {
    Object.assign( this, values );
  }

  update( dt ) {
    this.dx += this.ddx * dt;
    this.dy += this.ddy * dt;
    this.ddAngle = this.dAngle * dt;

    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.angle += this.dAngle * dt;
  }

  draw( ctx ) {
    ctx.save();

    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );
    ctx.scale( this.size, this.size );

    ctx.fillStyle = this.color;
    ctx.fill( this.drawPath );
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1 / this.size;
    ctx.stroke( this.drawPath );

    ctx.restore();
  }
}