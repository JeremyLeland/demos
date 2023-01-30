// https://mathworld.wolfram.com/QuadraticEquation.html
const SolveQuadratic = /* glsl */ `
  vec2 solveQuadratic( float a, float b, float c ) {
    float discr = b * b - 4.0 * a * c; 

    if ( discr < 0.0 ) {
      return vec2( -1.0, -1.0 );
    } 
    else {
      float q = -0.5 * ( b + sign( b ) * sqrt( discr ) );
      float x0 = q / a;
      float x1 = c / q;
      return vec2( min( x0, x1 ), max( x0, x1 ) );
    }
  }
`;

export const QuadricSurfaceHit = /* glsl */ `
  vec4 quadricSurfaceHit( mat4 Q, vec3 minBounds, vec3 maxBounds, vec4 C, vec4 D ) {
    float a = dot( D, Q * D );
    float b = dot( C, Q * D ) + dot( D, Q * C );
    float c = dot( C, Q * C );

    vec2 times = solveQuadratic( a, b, c );

    vec4 fPos = C + D * times.x;
    vec4 bPos = C + D * times.y;

    if ( any( lessThan( fPos.xyz, minBounds ) ) || any( greaterThan( fPos.xyz, maxBounds ) ) ) {
      times.x = -1.0;
    }

    if ( any( lessThan( bPos.xyz, minBounds ) ) || any( greaterThan( bPos.xyz, maxBounds ) ) ) {
      times.y = -1.0;
    }

    return times.x < 0.01 ? vec4( bPos.xyz, times.y ) : vec4( fPos.xyz, times.x );
  }
`;

// See: https://www.shadertoy.com/view/7tlBW8
export const QuadricSurfaceNormal = /* glsl */ `
  vec4 quadricSurfaceNormal( mat4 Q, vec4 P ) {
    float a = Q[ 0 ][ 0 ], b = Q[ 0 ][ 1 ], c = Q[ 0 ][ 2 ], d = Q[ 0 ][ 3 ],
          e = Q[ 1 ][ 0 ], f = Q[ 1 ][ 1 ], g = Q[ 1 ][ 2 ], h = Q[ 1 ][ 3 ],
          i = Q[ 2 ][ 0 ], j = Q[ 2 ][ 1 ], k = Q[ 2 ][ 2 ], l = Q[ 2 ][ 3 ],
          m = Q[ 3 ][ 0 ], n = Q[ 3 ][ 1 ], o = Q[ 3 ][ 2 ];
    
    float x = P.x, y = P.y, z = P.z;

    vec4 normal = vec4(
      ( a + a ) * x + ( b + e ) * y + ( c + i ) * z + d + m,
      ( b + e ) * x + ( f + f ) * y + ( g + j ) * z + h + n,
      ( c + i ) * x + ( g + j ) * y + ( k + k ) * z + l + o,
      0.0
    );

    return normal;
  }
`;

export const QuadricHit = /* glsl */ `
  ${ SolveQuadratic }
  ${ QuadricSurfaceHit }
  ${ QuadricSurfaceNormal }

  // TODO: Take the inverse matrix, etc out of this. We don't need a full object for this function, just the Q and bounds
  //       Matrial will join the Shape definition somewhere further up the heirarchy 

  // vec4 quadricHit( Shape shape, vec4 rayPos, vec4 rayDir ) {
  //   vec4 C = rayPos * shape.inverseMatrix;
  //   vec4 D = rayDir * shape.inverseMatrix;

  //   return quadricSurfaceHit( shape.Q, shape.minBounds, shape.maxBounds, C, D );
  // }

  // vec4 quadricNormal( Shape shape, vec3 objPos, vec4 rayDir ) {
  //   vec4 objNorm = quadricSurfaceNormal( shape.Q, vec4( objPos, 1.0 ) );
  //   vec4 normal = normalize( objNorm * shape.normalMatrix );

  //   // if backside, flip normal
  //   if ( dot( rayDir, normal ) > 0.0 ) {
  //     normal *= -1.0;
  //   }

  //   return normal;
  // }
`;

export const VertScreenPos = /* glsl */ `
  in vec3 position;
  out vec4 screenPos;

  void main() {
    screenPos = vec4( position, 1.0 );
    gl_Position = screenPos;
  }
`;

export const Lighting = /* glsl */ `
  struct Light {
    vec4 position;
    vec4 color;
  };

  struct Material {
    vec4 color;
    // TODO: specular color?
    float shininess;
  };

  vec4 getLighting( vec4 L, vec4 V, vec4 N, Light light, Material material ) {
    // vec4 N = normal;
    // vec4 L = normalize( lightPos - position );
    float NdotL = dot( N, L );

    if ( NdotL > 0.0 ) {
      // vec4 V = normalize( rayPos - position );
      vec4 H = normalize( L + V );
      
      float NdotH = dot( N, H );
      
      float diffuse = max( 0.0, NdotL );
      float specular = ( NdotL > 0.0 ) ? pow( max( 0.0, NdotH ), material.shininess ) : 0.0;

      // TODO: Colored light
      return vec4( light.color * material.color * ( diffuse + specular ) );
    }
  }
`;