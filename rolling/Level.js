export class Level {
  static ResizeType = {
    NW: 0, N: 1, NE: 2,
     W: 7,       E:  3,
    SW: 6, S: 5, SE: 4,
  };

  // static EditType = {
  //   AddPoint: 'AddPoint',
  //   MovePoint: 'MovePoint',
  //   DeletePoint: 'DeletePoint',
  //   AddLoop: 'AddLoop',
  //   MoveLoop: 'MoveLoop',
  //   ResizeLoop: 'ResizeLoop',
  //   RotateLoop: 'RotateLoop',
  //   DeleteLoop: 'DeleteLoop',
  // };
  
  // static Commands = {
  //   'AddPoint': addPoint,
  //   'MovePoint': movePoint,
  //   'DeletePoint': deletePoint,
  //   'AddLoop': addLoop,
  //   'MoveLoop': moveLoop,
  //   'ResizeLoop': resizeLoop,
  //   'RotateLoop': rotateLoop,
  //   'DeleteLoop': deleteLoop,
  // };

  loops = [];

  addLoop( cmd ) {
    this.loops.splice( cmd.loopIndex, 0, cmd.points );
  }

  moveLoop( cmd ) {
    this.loops[ cmd.loopIndex ].forEach( p => {
      p[ 0 ] += cmd.dx;
      p[ 1 ] += cmd.dy;
    } );
  }

  resizeLoop( cmd ) {
    const oldBounds = getBounds( this.loops[ cmd.loopIndex ] );
    const newBounds = Object.assign( {}, oldBounds );

    if ( cmd.resizeType == Level.ResizeType.NW ) {
      newBounds.left += cmd.dx;
      newBounds.top  += cmd.dy;
    }
    else if ( cmd.resizeType == Level.ResizeType.NE ) {
      newBounds.right += cmd.dx;
      newBounds.top   += cmd.dy;
    }
    else if ( cmd.resizeType == Level.ResizeType.SE ) {
      newBounds.right  += cmd.dx;
      newBounds.bottom += cmd.dy;
    }
    else if ( cmd.resizeType == Level.ResizeType.SW ) {
      newBounds.left   += cmd.dx;
      newBounds.bottom += cmd.dy;
    }

    this.loops[ cmd.loopIndex ].forEach( p => {
      const u = ( p[ 0 ] - oldBounds.left ) / ( oldBounds.right - oldBounds.left );
      const v = ( p[ 1 ] - oldBounds.top )  / ( oldBounds.bottom - oldBounds.top );
      
      p[ 0 ] = newBounds.left + u * ( newBounds.right - newBounds.left );
      p[ 1 ] = newBounds.top  + v * ( newBounds.bottom - newBounds.top );
    } );
  }

  rotateLoop( cmd ) {
    this.loops[ cmd.loopIndex ].forEach( p => {
      const cx = p[ 0 ] - cmd.x;
      const cy = p[ 1 ] - cmd.y;
      const oldAng = Math.atan2( cy, cx );
      const dist = Math.hypot( cx, cy );

      const newAng = oldAng + cmd.angle;

      p[ 0 ] = cmd.x + dist * Math.cos( newAng );
      p[ 1 ] = cmd.y + dist * Math.sin( newAng );
    } );
  }

  deleteLoop( cmd ) {
    this.loops.splice( cmd.loopIndex, 1 );
  }

  addPoint( cmd ) {
    this.loops[ cmd.loopIndex ].splice( cmd.pointIndex, 0, cmd.point );
  }

  movePoint( cmd ) {
    const p = this.loops[ cmd.loopIndex ][ cmd.pointIndex ];
    p[ 0 ] += cmd.dx;
    p[ 1 ] += cmd.dy;
  }

  deletePoint( cmd ) {
    this.loops[ cmd.loopIndex ].splice( cmd.pointIndex, 1 );
  }
}

function getBounds( loop ) {
  const bounds = {};

  loop.forEach( p => {
    bounds.left   = Math.min( p[ 0 ], bounds.left   ?? p[ 0 ] );
    bounds.right  = Math.max( p[ 0 ], bounds.right  ?? p[ 0 ] );
    bounds.top    = Math.min( p[ 1 ], bounds.top    ?? p[ 1 ] );
    bounds.bottom = Math.max( p[ 1 ], bounds.bottom ?? p[ 1 ] );
  } );

  return bounds;
}