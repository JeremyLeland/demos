// "Flocking for multi-agent dynamic systems: Algorithms and theory" by Olfati-Saber, Reza.

// Confusing: https://github.com/amirhosseinh77/Flocking-Multi-Agent 
// Clearer code: https://docs.ros.org/en/kinetic/api/olfati_saber_flocking/html/olfati__saber__flocking_8cpp_source.html 
// Better documentation: https://github.com/zhubiii/mj-SaberFlocking/blob/main/src/algo1.py 

// Alpha: Movement relative to neighbors?
// Gamma: movement toward target?
export const Constants = {
  FlockDistance: 3.5,
  WallDistance: 0.5,
  A: 5,
  B: 5,   // 0<A<=B 
  H: 0.2,
  EPSILON: 1, //0.1,   // how smooth the sigmoid functions are -- closer to one makes them settle in better when stopped
  TargetWeight: 0.01,
  FlockWeight: 1,   // lowering this cuts down on jittering when dt is closer to normal
  WallWeight: 0.04,
  C1_alpha: 4,
  C2_alpha: 2,
  C1_gamma: 4,
  C2_gamma: 0.2,
  WTF: 200,
};

function sigma_1( z ) {
  return z / Math.sqrt( 1 + z * z );
}

// function sigma_norm( x, y ) {
//   return ( Math.sqrt( 1 + Constants.EPSILON * ( x * x + y * y ) ) - 1 ) / Constants.EPSILON;
// }

function sigma_norm( lengthSquared ) {
  return ( Math.sqrt( 1 + Constants.EPSILON * lengthSquared ) - 1 ) / Constants.EPSILON;
}

function phi( z ) {
  const A = Constants.A;
  const B = Constants.B;
  const C = Math.abs( A - B ) / Math.sqrt( 4 * A * B );
  return 0.5 * ( ( A + B ) * sigma_1( z + C ) + A - B );
}

function rho( z ) {
  const H = Constants.H;
  if ( z < H )  return 1;
  if ( z > 1 )  return 0;
  return 0.5 * ( 1 + Math.cos( Math.PI * ( z - H ) / ( 1 - H ) ) );
}

export function Flock( entities, target, dt ) {

  entities.forEach( entity => {
    entity.dx ??= 0;
    entity.dy ??= 0;
    entity.ax = entity.ay = 0;

    // const targetAngle = Math.atan2( target.y - entity.y, target.x - entity.x );
    // const targetDist = Math.hypot( target.x - entity.x, target.y - entity.y );

    // const goalAngle = targetAngle;

    // const weight = Constants.TargetWeight * sigma_1( targetDist );

    // entity.ax += weight * Math.cos( goalAngle );
    // entity.ay += weight * Math.sin( goalAngle );
    

    let sumX = 0, sumY = 0;

    // Flocking
    entities.forEach( other => {
      if ( other != entity ) {
        const cx = other.x - entity.x;
        const cy = other.y - entity.y;
        
        const lengthSquared = cx * cx + cy * cy;

        if ( Math.sqrt( lengthSquared ) < 1.25 * Constants.FlockDistance + entity.radius + other.radius ) { 
          const r_alpha = sigma_norm( Math.pow( 1.25 * Constants.FlockDistance + entity.radius + other.radius, 2 ) );   // neighbor.size + agent.size
          const d_alpha = sigma_norm( Math.pow( Constants.FlockDistance + entity.radius + other.radius, 2 ) );

          const sigNormDiff = sigma_norm( lengthSquared );
          const bump = Constants.FlockWeight * rho( sigNormDiff / r_alpha );
          const phiVal = phi( sigNormDiff - d_alpha );
          
          const phi_sigma_grad = phiVal / Math.sqrt( 1 + Constants.EPSILON * lengthSquared );
          
          sumX += bump * ( phi_sigma_grad * cx + other.dx - entity.dx );
          sumY += bump * ( phi_sigma_grad * cy + other.dy - entity.dy );
        }
      }

    } );

    entity.ax = Constants.C2_alpha * sumX - Constants.C1_gamma * sigma_1( entity.x - target.x ) - Constants.C2_gamma * entity.dx;
    entity.ay = Constants.C2_alpha * sumY - Constants.C1_gamma * sigma_1( entity.y - target.y ) - Constants.C2_gamma * entity.dy;

    // // Should this push back harder somehow, to make up for fact that wall won't move?
    // // Agents are still ending up outside the walls somehow
    // walls.forEach( wall => {
    //   const point = wall.getClosestPoint( entity.x, entity.y );

    //   const cx = point.x - entity.x;
    //   const cy = point.y - entity.y;
      
    //   const r_alpha = sigma_norm( Math.pow( 1.25 * Constants.WallDistance + Agent.size, 2 ) );
    //   const d_alpha = sigma_norm( Math.pow( Constants.WallDistance + Agent.size, 2 ) );
      
    //   const lengthSquared = Math.pow( point.distance, 2 );

    //   const sigNormDiff = sigma_norm( lengthSquared );
    //   const bump = Constants.WallWeight * rho( sigNormDiff / r_alpha );
    //   const phiVal = phi( sigNormDiff - d_alpha );

    //   const phi_sigma_grad = phiVal / Math.sqrt( 1 + Constants.EPSILON * lengthSquared );

    //   entity.ax += bump * ( phi_sigma_grad * cx - entity.dx );
    //   entity.ay += bump * ( phi_sigma_grad * cy - entity.dy );
    // } );

    // Smooth it out somehow? (Not totaly sure what this does)
    // entity.ax -= Constants.C2_gamma * entity.dx;
    // entity.ay -= Constants.C2_gamma * entity.dy;


    // Attempting to limit accel makes us springy
    // const fixAccel = Math.min( 1, Agent.accel / Math.hypot( agent.ax, agent.ay ) );
    // agent.ax *= fixAccel;
    // agent.ay *= fixAccel;

    // WTF factor stabilizes the system. 
    // Seems like slowing the acceleration changes is the important part, but just dividing accel isn't enough?
    // If I divide everything by 1000 to put in terms of seconds, then it's way too slow
    //  - need to scale up accel as well at that point? -- then it gets all springy again
    const time = dt / Constants.WTF;

    entity.x += entity.dx * time + 0.5 * entity.ax * time ** 2;
    entity.y += entity.dy * time + 0.5 * entity.ax * time ** 2;

    entity.dx += entity.ax * time;
    entity.dy += entity.ay * time;
  } );
};