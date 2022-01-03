import * as THREE from '../lib/three.module.js';

export class ThreeGame {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
  renderer = new THREE.WebGLRenderer();

  keysPressed = new Set();
  
  constructor() {
    document.body.appendChild( this.renderer.domElement );

    window.onresize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.onresize();

    window.onkeydown = ( e ) => this.keysPressed.add( e.key );
    window.onkeyup   = ( e ) => this.keysPressed.delete( e.key );
  }

  start( updateFunc ) {
    let lastTime = null;
    const animate = ( now ) => {
      lastTime ??= now;  // for first call only
      updateFunc( now - lastTime );
      lastTime = now;
  
      this.renderer.render( this.scene, this.camera );
  
      requestAnimationFrame( animate );
    };

    requestAnimationFrame( animate );
  }
}
