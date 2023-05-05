import * as Util from './Util.js';

export class AvoidCones {
  cones = [];

  // TODO: Add these once in the constructor, and finalize once there?
  // Use filter to remove cones that collide (while updating newCone), then add newCone?

  constructor( closedCones ) {
    if ( closedCones.length == 0 ) {
      this.cones.push( {
        left: -Math.PI,
        right: Math.PI,
        open: true,
      } );
    }
    else { 
      closedCones.forEach( newCone => {
        this.cones = this.cones.filter( other => {
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

          return !merge;
        } );

        this.cones.push( newCone );
      } );

      this.cones.sort( ( a, b ) => a.left - b.left );

      const combined = [];

      for ( let i = 0; i < this.cones.length; i ++ ) {
        combined.push( this.cones[ i ] );
        combined.push( {
          left: this.cones[ i ].right,
          right: this.cones[ ( i + 1 ) % this.cones.length ].left,
          open: true,
        } );
      }

      this.cones = combined;
    }
  }

  getCone( angle ) {
    const matches = this.cones.filter( c => Util.betweenAngles( angle, c.left, c.right ) );

    // If we are on edge of two cones, consider us part of the open one
    if ( matches.length > 1 ) {
      return matches.find( c => c.open );
    }
    else {
      return matches[ 0 ];
    }
  }

  draw( ctx, scale = 100 ) {
    ctx.save();
    
    this.cones.forEach( cone => {
      ctx.beginPath();
      ctx.moveTo( 0, 0 );
      ctx.arc( 0, 0, scale, cone.left, cone.right );
      ctx.closePath();
      ctx.globalAlpha = cone.open ? 0.1 : 0.2;
      ctx.fill();

      if ( !cone.open ) {
        ctx.stroke();
      }
    } );
    ctx.restore();
  }
}