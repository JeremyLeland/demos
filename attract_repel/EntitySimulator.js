export class EntitySimulator {
  constructor( entities ) {
    let activeEntity = null;
    let mouseDown = false;
    let lastX = 0;
    let lastY = 0;
    
    document.addEventListener( 'mousedown', ( e ) => {
      mouseDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      activeEntity = entityAt( e.clientX, e.clientY );
    } );
  
    document.addEventListener( 'mouseup', ( e ) => {
      mouseDown = false;
      activeEntity = null;
    } );
  
    document.addEventListener( 'mousemove', ( e ) => {
      if ( activeEntity ) {
        activeEntity.x += e.clientX - lastX;
        activeEntity.y += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        
        this.onInput();
      }
    } );

    document.addEventListener( 'wheel', ( e ) => {
      const entity = entityAt( e.clientX, e.clientY );
  
      if ( entity ) {
        entity.angle -= ( e.wheelDelta / 120 ) * ( Math.PI / 32 );
        this.onInput();
      }
    } );

    function entityAt( x, y ) {
      const closest = closestEntity( x, y );
  
      if ( closest.dist < closest.entity.size ) {
        return closest.entity;
      }
    }
  
    function closestEntity( x, y ) {
      return entities.map( 
        e => ( { entity: e, dist: Math.hypot( e.x - x, e.y - y ) } )
      ).reduce( 
        ( closest, e ) => e.dist < closest.dist ? e : closest
      );
    }
  }

  onInput() {}
}