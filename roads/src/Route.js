import * as Arc from './common/Arc.js';
import { vec2 } from '../lib/gl-matrix.js';

export function getLength( route ) {
  if ( route.center ) {
    return Arc.getLength( route );
  }
  else {
    return vec2.distance( route.start, route.end );
  }
}

export function getPositionAtDistance( route, distance ) {  
  if ( route.center ) {
    return Arc.getPointAtAngle( route, Arc.getAngleAtDistance( route, distance ) );
  }
  else {
    const lineVec = vec2.subtract( [], route.end, route.start );
    vec2.normalize( lineVec, lineVec );
    return vec2.scaleAndAdd( [], route.start, lineVec, distance );
  }
}

export function getHeadingAtPoint( route, point ) {
  if ( route.center ) {
    return Arc.getHeadingAtPoint( route, point );
  }
  else {
    return Math.atan2(
      route.end[ 1 ] - route.start[ 1 ], 
      route.end[ 0 ] - route.start[ 0 ],
    );
  }
}
