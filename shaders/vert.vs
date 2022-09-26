out vec2 v_uv;
out vec3 v_pos;

void main() {
  v_uv = uv;
  v_pos = position;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}