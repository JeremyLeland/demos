export class Line {
  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }
  
  get length() {
    return Math.hypot( this.x2 - this.x1, this.y2 - this.y1 );
  }

  get slopeAngle() {
    return Math.atan2( this.y2 - this.y1, this.x2 - this.x1 );
  }

  get normalAngle() {
    return Math.atan2( this.x1 - this.x2, this.y2 - this.y1 );
  }

  draw( ctx ) {
    ctx.beginPath();
    ctx.moveTo( this.x1, this.y1 );
    ctx.lineTo( this.x2, this.y2 );
    // ctx.lineWidth = 1;
    ctx.stroke();

    const midX = ( this.x1 + this.x2 ) / 2;
    const midY = ( this.y1 + this.y2 ) / 2;
    const normalAngle = this.normalAngle;
    const NORM_LEN = 0.5;

    ctx.beginPath();
    ctx.moveTo( midX, midY );
    ctx.lineTo( 
      midX + Math.cos( normalAngle ) * NORM_LEN, 
      midY + Math.sin( normalAngle ) * NORM_LEN,
    );
    ctx.lineWidth /= 2;
    ctx.stroke();
    ctx.lineWidth *= 2;
  }

  distanceFrom( x, y, radius ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;
    const D = ( px * px ) + ( py * py );

    const len = Math.sqrt( D );
    const normX = py / len;
    const normY = -px / len;
    
    const u = ( ( x - this.x1 ) * px + ( y - this.y1 ) * py ) / D;
    const offset = radius / len;

    if ( u + offset <= 0 ) {
      return Math.hypot( x - this.x1, y - this.y1 ) - radius;
    }
    else if ( 1 <= u - offset ) {
      return Math.hypot( x - this.x2, y - this.y2 ) - radius;
    }
    else {
      return ( x - this.x1 ) * normX + ( y - this.y1 ) * normY - radius;
    }
  }

  timeToHit( entity ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;
    const D = ( px * px ) + ( py * py );

    const len = Math.sqrt( D );
    const normX = py / len;
    const normY = -px / len;
    
    const distFromLine = ( this.x1 - entity.x ) * normX + ( this.y1 - entity.y ) * normY;
    const vDotN = entity.dx * normX + entity.dy * normY;

    const hitTime = ( distFromLine + entity.radius ) / vDotN;

    const hitX = entity.x + entity.dx * hitTime;
    const hitY = entity.y + entity.dy * hitTime;

    const closestOnLine = ( ( hitX - this.x1 ) * px + ( hitY - this.y1 ) * py ) / D;

    if ( closestOnLine <= 0 ) {
      return timeToHitPoint( entity, this.x1, this.y1 );
    }
    else if ( 1 <= closestOnLine ) {
      return timeToHitPoint( entity, this.x2, this.y2 );
    }
    else {
      return hitTime;
    }
  }
}

function timeToHitPoint( entity, cx, cy ) {
  const dX = entity.dx;
  const dY = entity.dy;
  const fX = entity.x - cx;
  const fY = entity.y - cy;

  const a = dX * dX + dY * dY;
  const b = 2 * ( fX * dX + fY * dY ); 
  const c = ( fX * fX + fY * fY ) - Math.pow( entity.radius, 2 );

  return solveQuadratic( a, b, c );
}

const EPSILON = 1e-6;

function solveQuadratic( A, B, C ) {
  if ( Math.abs( A ) < EPSILON ) {
    return -C / B;
  }
  else {
    const disc = B * B - 4 * A * C;

    if ( disc < 0 ) {
      return Infinity;
    }
    else {
      const t0 = ( -B - Math.sqrt( disc ) ) / ( 2 * A );
      const t1 = ( -B + Math.sqrt( disc ) ) / ( 2 * A );
      
      return t0 < 0 ? t1 : t0;
    }
  }
}