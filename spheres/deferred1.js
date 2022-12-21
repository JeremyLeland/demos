export const VertScreenPos = /*glsl*/ ` #version 300 es
  #pragma vscode_glsllint_stage: vert

  in vec3 position;

  out vec4 v_screenPos;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    v_screenPos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = v_screenPos;
  }
`;

export const FragPosNorm = /*glsl*/` #version 300 es
  #pragma vscode_glsllint_stage: frag

  precision highp float;
  precision highp int;

  in vec4 v_screenPos;

  uniform vec3 rayPos;
  uniform mat4 sphereInverseTransform;

  layout(location = 0) out vec4 gPosition;
  layout(location = 1) out vec4 gNormal;

  // https://mathworld.wolfram.com/QuadraticEquation.html
  float solveQuadratic( float a, float b, float c ) {
    float discr = b * b - 4.0 * a * c; 

    if ( discr < 0.0 ) {
      return -1.0;
    } 
    else {
      float q = -0.5 * ( b + sign( b ) * sqrt( discr ) );
      float x0 = q / a;
      float x1 = c / q;
      return x0 < 0.0 ? x1 : min( x0, x1 );
    } 
  }

  struct Ray {
    vec3 pos;
    vec3 dir;
  };

  struct Light {
    vec3 pos;
    vec3 color;
  };

  struct Hit {
    float time;
    vec3 pos;
    vec3 norm;
  };

  Hit getSphereHit( Ray ray ) {
    vec3 objectRayPos = ( vec4( ray.pos, 1.0 ) * sphereInverseTransform ).xyz;

    // Don't normalize? See https://graphicscompendium.com/raytracing/12-transformations
    vec3 objectRayDir = ( vec4( ray.dir, 0.0 ) * sphereInverseTransform ).xyz;

    vec3 v = objectRayPos;

    float a = dot( objectRayDir, objectRayDir );
    float b = 2.0 * dot( objectRayDir, v );
    float c = dot( v, v ) - 1.0; //sphere.radius * sphere.radius;
    
    Hit hit = Hit( solveQuadratic( a, b, c ), vec3( 0.0, 0.0, 0.0 ), vec3( 0.0, 0.0, 0.0 ) );

    if ( hit.time > 0.0 ) {
      // hit.sphere = sphere;
      hit.pos = ray.pos + ray.dir * hit.time;
      // hit.norm = normalize( hit.pos );

      // TODO: Way to get normal without finding the hitPos twice?
      mat4 normalMatrix = transpose( sphereInverseTransform );
      vec3 objectHitPos = objectRayPos + objectRayDir * hit.time;
      hit.norm = normalize( vec4( objectHitPos, 0.0 ) * normalMatrix ).xyz;
    }

    return hit;
  }
  
  void main() {

    vec3 rayDir = normalize( vec3( v_screenPos.xy, -1.0 ) );

    Ray ray = Ray( rayPos, rayDir );
    Hit hit = getSphereHit( ray );

    if ( hit.time > 0.0 ) {
      gPosition = vec4( hit.pos, 1.0 );
      gNormal = vec4( hit.norm, 0.0 );
    }
  }
`;

export const VertUV = /*glsl*/`# version 300 es
  #pragma vscode_glsllint_stage: vert

  in vec3 position;
  in vec2 uv;

  out vec2 vUv;
  out vec4 v_screenPos;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    vUv = uv;
    v_screenPos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = v_screenPos;
  }
`;

export const FragLight = /*glsl*/`#version 300 es
  #pragma vscode_glsllint_stage: frag

  precision highp float;
  precision highp int;

  layout(location = 0) out vec4 pc_FragColor;

  in vec2 vUv;

  uniform sampler2D tPosition;
  uniform sampler2D tNormal;

  uniform vec3 rayPos;
  uniform vec3 lightPos;
  uniform vec3 lightColor;

  struct Ray {
    vec3 pos;
    vec3 dir;
  };

  void main() {

    vec3 position = texture( tPosition, vUv ).rgb;
    vec3 normal = texture( tNormal, vUv ).rgb;
 
    vec3 N = normal;
    vec3 L = normalize( lightPos - position );
    float NdotL = dot( N, L );

    if ( NdotL > 0.0 ) {
      vec3 V = normalize( rayPos - position );
      vec3 H = normalize( L + V );
      
      float NdotH = dot( N, H );
      float shininess = 2000.0;
      
      float diffuse = max( 0.0, NdotL );
      float specular = ( NdotL > 0.0 ) ? pow( max( 0.0, NdotH ), shininess ) : 0.0;
    
      pc_FragColor.rgb = lightColor * ( diffuse + specular );
      pc_FragColor.a = 1.0;
    }
  }
`;