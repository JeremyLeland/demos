import { Line } from '../../src/Line.js';

export class Level {
  loops = [];
  nodes = [];

  static fromJson( json ) {
    const level = new Level();

    level.loops = Array.from( json.loops, points => Line.getLoopThroughPoints( points ) );
    
    level.nodes = Array.from( json.nodes );
    level.nodes.forEach( node => 
      node.links = node.links.map( index => level.nodes[ index ] ) 
    );

    return level;
  }

  toJson() {
    const loopInfo = Array.from( this.loops, loop => loop.map( line => [ line.x1, line.y1 ] ) );

    const nodesMap = new Map();
    let nodeIndex = 0;
    this.nodes.forEach( node => nodesMap.set( node, nodeIndex ++ ) );

    const nodeInfo = Array.from( this.nodes, node => ( 
      { x: node.x, y: node.y, links: node.links.map( link => nodesMap.get( link ) ) }
    ) );

    return {
      loops: loopInfo,
      nodes: nodeInfo,
    };
  }

  draw( ctx ) {
    ctx.strokeStyle = 'gray';
    this.loops.forEach( loop => 
      loop.forEach( line => line.draw( ctx ) )
    );

    this.nodes.forEach( node => {
      ctx.beginPath();
      ctx.arc( node.x, node.y, 3, 0, Math.PI * 2 );
      ctx.fillStyle = 'red';
      ctx.fill();
      
      node.links.forEach( link => {
        if ( link ) {
          ctx.beginPath();
          ctx.moveTo( node.x, node.y );
          ctx.lineTo( link.x, link.y );
          ctx.strokeStyle = 'green';
          ctx.stroke();
        }
      } );
    } );
  }
}

/*

level = {
  loops: [
    [ x1, y1 ], [ x2, y2 ], [ x3, y3 ], [ x4, y4 ], ... ],
    [ x1, y1 ], [ x2, y2 ], [ x3, y3 ],
  ],
  nodes: [
    { x: x1, y: y1, links: [ 2 ] },
    { x: x2, y: y2, links: [ 2 ] },
    { x: x3, y: y3, links: [ 0, 1 ] }
  ]
}

*/