export const Constants = {
  TargetWeight: 0.01,
  AvoidWeight: 0.05,
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

      const val = -Math.min( 0, dist ) * Constants.AvoidWeight;
        
      entity.dx -= Math.cos( angle ) * val;
      entity.dy -= Math.sin( angle ) * val;        
    } );

    // const tx = target.x - entity.x;
    // const ty = target.y - entity.y;
    // const tAngle = Math.atan2( ty, tx );
    // const tDist = Math.hypot( tx, ty );

    // const tWeight = Constants.TargetWeight * sigma_1( tDist );

    // entity.dx += tx * tWeight;
    // entity.dy += ty * tWeight;

    entity.x += entity.dx * dt;
    entity.y += entity.dy * dt;
  } );
}