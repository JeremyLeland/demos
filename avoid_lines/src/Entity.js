export class Entity {
  x = 0;
  y = 0;
  angle = 0;
  size = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;
  dSize = 0;

  ddx = 0;
  ddy = 0;
  ddAngle = 0;
  ddSize = 0;

  life = 1;
  lifeSpan = Infinity;
  isAlive = true;
  
  #debug = {};

  constructor( values, info ) {
    Object.assign( this, values );
    this.info = info;
  }

  update( dt ) {
    this.dAngle += this.ddAngle * dt;
    this.angle += this.dAngle * dt;
    this.dx += this.ddx * dt;
    this.dy += this.ddy * dt;
    this.x += this.dx * dt;
    this.y += this.dy * dt;

    this.dSize += this.ddSize * dt;
    this.size += this.dSize * dt;

    this.lifeSpan -= dt;
    this.isAlive = this.life > 0 && this.lifeSpan > 0;
  }


  draw( ctx ) {
    ctx.save();

    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );
    ctx.scale( this.size, this.size );

    // Fade out at end of lifespan
    if ( this.lifeSpan < 1000 ) {
      ctx.globalAlpha = this.lifeSpan / 1000;
    }

    this.info.draw( ctx );

    ctx.beginPath();
    ctx.arc( 0, 0, this.size, 0, Math.PI * 2 );
    ctx.fillStyle = '#4444';
    ctx.fill();

    ctx.restore();

    // if ( Entity.DebugBounds ) {
    //   ctx.strokeStyle = 'red';
    //   this.boundingLines?.draw( ctx );
    // }

    // if ( Entity.DebugNavigation ) {
    //   if ( this.goal ) {
    //     ctx.strokeStyle = 'gray';
    //     ctx.beginPath();
    //     ctx.moveTo( this.goal.x, this.goal.y );
    //     ctx.lineTo( this.x, this.y );
    //     ctx.setLineDash( [ 0.2, 0.2 ] );
    //     ctx.stroke();
    //     ctx.setLineDash( [] );
    //   }

    //   ctx.save();
    //   ctx.translate( this.x, this.y );

    //   // ctx.fillStyle = 'rgba( 0, 100, 0, 0.5 )';
    //   // ctx.beginPath();
    //   // ctx.moveTo( 0, 0 );
    //   // ctx.arc( 0, 0, this.size, 0, Math.PI * 2 );
    //   // ctx.fill();

    //   ctx.fillStyle = 'rgba( 100, 100, 100, 0.1 )';
    //   ctx.beginPath();
    //   ctx.moveTo( 0, 0 );
    //   ctx.arc( 0, 0, this.size + Constants.AvoidDistance / 2, 0, Math.PI * 2 );
    //   ctx.fill();

    //   ctx.strokeStyle = this.info.color;
    //   ctx.beginPath();
    //   ctx.moveTo( 0, 0 );
    //   ctx.lineTo( Math.cos( this.goalAngle ) * Constants.UIScale, Math.sin( this.goalAngle ) * Constants.UIScale );
    //   ctx.stroke();

    //   if ( this.#debug.align ) {
    //     drawVector( this.#debug.align.totalVector, ctx, 'white' );
    //     this.#debug.align.vectors?.forEach( v => drawVector( v, ctx, v.color ) );
    //   }

    //   ctx.restore();
    // }
  }

  getClosestPoints( other ) {
    const lineComps = [];

    this.boundingLines.forEach( thisLine => {
      other.boundingLines.forEach( otherLine => {
        lineComps.push( Line.compare( thisLine, otherLine ) )
      } );
    } );

    // If there is a collision, give us the one with smallest overlap
    // Otherwise, give us the closest distance 
    return lineComps.reduce(
      ( closest, pos ) => {
        if ( pos.distance < 0 && closest.distance < 0 ) {
          return pos.distance > closest.distance ? pos : closest;
        }
        else {
          return pos.distance < closest.distance ? pos : closest;
        }
      }
    );
  }
}