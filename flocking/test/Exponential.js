export const Constants = {
  TargetWeight: 0.01,
  AvoidWeight: 0.02,
}

export function Flock( entities, target, dt ) {
  entities.forEach( entity => {
    entity.dx = 0;
    entity.dy = 0;

    entities.filter( other => entity != other ).forEach( other => {
      const cx = other.x - entity.x;
      const cy = other.y - entity.y;
      const angle = Math.atan2( cy, cx );
      const dist = Math.hypot( cx, cy ) - entity.radius - other.radius;

      // const val = Math.min( 0, dist ) * 0.01;
      // const val = Math.min( 0, sigma_1( dist ) ) * 0.1;

      const val = Math.exp( -1 * dist ) * Constants.AvoidWeight;
      
      entity.dx -= Math.cos( angle ) * val;
      entity.dy -= Math.sin( angle ) * val;
        
    } );

    // entity.dx /= entities.length;
    // entity.dy /= entities.length;

    const tx = target.x - entity.x;
    const ty = target.y - entity.y;
    const tAngle = Math.atan2( ty, tx );

    entity.dx += tx * Constants.TargetWeight; //Math.cos( tAngle ) * 0.01;
    entity.dy += ty * Constants.TargetWeight; //Math.sin( tAngle ) * 0.01;

    entity.x += entity.dx * dt;
    entity.y += entity.dy * dt;
  } );
}