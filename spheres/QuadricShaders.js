export const QuadricSurfaceHit = /* glsl */ `
  struct Quadric {
    mat4 Q;
    vec3 minBounds;
    vec3 maxBounds;
  };

  // https://mathworld.wolfram.com/QuadraticEquation.html
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

  vec4 quadricSurfaceHit( Quadric q, vec4 C, vec4 D ) {
    float a = dot( D, q.Q * D );
    float b = dot( C, q.Q * D ) + dot( D, q.Q * C );
    float c = dot( C, q.Q * C );

    vec2 times = solveQuadratic( a, b, c );

    vec4 fPos = C + D * times.x;
    vec4 bPos = C + D * times.y;

    if ( any( lessThan( fPos.xyz, q.minBounds ) ) || any( greaterThan( fPos.xyz, q.maxBounds ) ) ) {
      times.x = -1.0;
    }

    if ( any( lessThan( bPos.xyz, q.minBounds ) ) || any( greaterThan( bPos.xyz, q.maxBounds ) ) ) {
      times.y = -1.0;
    }

    return times.x < 0.01 ? vec4( bPos.xyz, times.y ) : vec4( fPos.xyz, times.x );
  }
`;

// See: https://www.shadertoy.com/view/7tlBW8
export const QuadricSurfaceNormal = /* glsl */ `
  vec4 quadricSurfaceNormal( Quadric q, vec4 P ) {
    float a = q.Q[ 0 ][ 0 ], b = q.Q[ 0 ][ 1 ], c = q.Q[ 0 ][ 2 ], d = q.Q[ 0 ][ 3 ],
          e = q.Q[ 1 ][ 0 ], f = q.Q[ 1 ][ 1 ], g = q.Q[ 1 ][ 2 ], h = q.Q[ 1 ][ 3 ],
          i = q.Q[ 2 ][ 0 ], j = q.Q[ 2 ][ 1 ], k = q.Q[ 2 ][ 2 ], l = q.Q[ 2 ][ 3 ],
          m = q.Q[ 3 ][ 0 ], n = q.Q[ 3 ][ 1 ], o = q.Q[ 3 ][ 2 ];
    
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
  ${ QuadricSurfaceHit }
  ${ QuadricSurfaceNormal }

  // TODO: Does it really make any sense to separate these?

  vec4 quadricHit( Quadric q, mat4 inverseMatrix, vec4 rayPos, vec4 rayDir ) {
    vec4 C = rayPos * inverseMatrix;
    vec4 D = rayDir * inverseMatrix;

    return quadricSurfaceHit( q, C, D );
  }

  vec4 quadricNormal( Quadric q, vec3 objPos, mat4 normalMatrix, vec4 rayDir ) {
    vec4 objNorm = quadricSurfaceNormal( q, vec4( objPos, 1.0 ) );
    vec4 normal = normalize( objNorm * normalMatrix );

    // if backside, flip normal
    if ( dot( rayDir, normal ) > 0.0 ) {
      normal *= -1.0;
    }

    return normal;
  }
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
