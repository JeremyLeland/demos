import * as Util from './Util.js';

export class AvoidCones {
  cones = [];

  addCone( cone ) {
    const newCone = { ...cone };
    const combinedCones = [ newCone ];

    this.cones.forEach( other => {
      let merge = false;

      if ( Util.betweenAngles( newCone.left, other.left, other.right ) ) {
        newCone.left = other.left;
        merge = true;
      }

      if ( Util.betweenAngles( newCone.right, other.left, other.right ) ) {
        newCone.right = other.right;
        merge = true;
      }

      if ( Util.betweenAngles( other.left, newCone.left, newCone.right ) && 
           Util.betweenAngles( other.right, newCone.left, newCone.right ) ) {
        merge = true;
      }

      if ( !merge ) {
        combinedCones.push( other );
      }
    } );

    this.cones = combinedCones;
  }

  getCone( angle ) {
    return this.cones.find( c => Util.betweenAngles( angle, c.left, c.right ) );
  }

  draw( ctx ) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    this.cones.forEach( cone => {
      ctx.beginPath();
      ctx.moveTo( 0, 0 );
      ctx.arc( 0, 0, 100, cone.left, cone.right );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } );
    ctx.restore();
  }
}