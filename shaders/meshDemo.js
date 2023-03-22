import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js';

export function meshDemo( mesh ) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x111111 );

  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.position.set( 0, 0, 5 );

  const uniforms = {
  };

  scene.add( mesh );

  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );

  const render = () => {
    camera.updateMatrixWorld();
    uniforms.camera = { value: { matrix: camera.matrixWorld.clone().transpose() }, };

    renderer.render( scene, camera );
  }

  document.body.appendChild( renderer.domElement );
  window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
  }
  window.onresize();

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 0, 0 );
  controls.update();
  controls.addEventListener( 'change', render );

  return render;
}