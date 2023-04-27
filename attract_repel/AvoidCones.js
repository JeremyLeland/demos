export class AvoidCones {
  cones = [];

  addCone( cone ) {
    const newCone = { ...cone };
    const combinedCones = [ newCone ];

    this.cones.forEach( other => {
      let merge = false;

      if ( betweenAngles( newCone.left, other.left, other.right ) ) {
        newCone.left = other.left;
        merge = true;
      }

      if ( betweenAngles( newCone.right, other.left, other.right ) ) {
        newCone.right = other.right;
        merge = true;
      }

      if ( betweenAngles( other.left, newCone.left, newCone.right ) && 
           betweenAngles( other.right, newCone.left, newCone.right ) ) {
        merge = true;
      }

      if ( !merge ) {
        combinedCones.push( other );
      }
    } );

    this.cones = combinedCones;
  }

  draw( ctx ) {
    ctx.fillStyle = 'rgba( 200, 0, 0, 0.1 )';
    this.cones.forEach( cone => {
      ctx.beginPath();
      ctx.moveTo( 0, 0 );
      ctx.arc( 0, 0, 100, cone.left, cone.right );
      ctx.fill();
    } );
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

// TODO: Will we need all the EPSILON and inclusive crap below?
function betweenAngles( angle, left, right ) {
  return deltaAngle( left, angle ) >= 0 && deltaAngle( angle, right ) >= 0;
}

// function betweenAngles( angle, left, right, inclusive = true ) {
//   // return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
//   // return left < right ? left < angle && angle < right : left < angle || angle < right;

//   const EPSILON = ( inclusive ? 1 : -1 ) * -0.1;
//   return left < right ? 
//     EPSILON < angle - left && EPSILON < right - angle : 
//     EPSILON < angle - left || EPSILON < right - angle;
// }