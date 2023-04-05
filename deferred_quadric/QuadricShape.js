import * as THREE from '../lib/three.module.js';

const Sphere = [
  1,  0,  0,  0,
  0,  1,  0,  0,
  0,  0,  1,  0,
  0,  0,  0, -1,
];

export class QuadricShape {
  object;

  quadric;
  // material;

  uniform = {
    inverseMatrix: new THREE.Matrix4(),
    normalMatrix: new THREE.Matrix4(),
  };
      
  constructor( json ) {
    this.object = new THREE.Object3D();

    if ( json.position )  this.object.position.set( json.position.x, json.position.y, json.position.z );
    if ( json.rotation )  this.object.rotation.set( json.rotation.x, json.rotation.y, json.rotation.z );
    if ( json.scale )     this.object.scale.set( json.scale.x, json.scale.y, json.scale.z );

    this.updateUniform();

    this.quadric = {
      Q: new THREE.Matrix4().fromArray( json.quadric?.Q ?? Sphere ),
      minBounds: new THREE.Vector3( json.quadric?.minBounds?.x ?? -1, json.quadric?.minBounds?.y ?? -1, json.quadric?.minBounds?.z ?? -1 ),
      maxBounds: new THREE.Vector3( json.quadric?.maxBounds?.x ?? 1, json.quadric?.maxBounds?.y ?? 1, json.quadric?.maxBounds?.z ?? 1 ),
    }

    this.uniform.quadric = this.quadric;

    // this.material = {
    //   color: new THREE.Vector4( json.material?.color?.r ?? 1, json.material?.color?.g ?? 1, json.material?.color?.b ?? 1, 1 ),
    //   shininess: json.material?.shininess ?? 2000,
    // };
  }

  updateUniform() {
    this.object.updateMatrixWorld();

    const inverseMatrix = this.object.matrixWorld.clone().invert();
    const normalMatrix = inverseMatrix.clone().transpose();

    this.uniform.inverseMatrix.copy( inverseMatrix );
    this.uniform.normalMatrix.copy( normalMatrix )
    
    // NOTE: Matrices need to be transposed to be used in GLSL
    this.uniform.inverseMatrix.transpose();
    this.uniform.normalMatrix.transpose();
  }
}