export class Canvas {
  scale = 1;

  #reqId;

  constructor( canvas ) {
    this.canvas = canvas;
    
    if ( !this.canvas ) {
      this.canvas = document.createElement( 'canvas' );
      document.body.appendChild( this.canvas );
    }
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    
    this.canvas.oncontextmenu = () => { return false };
    
    this.ctx = this.canvas.getContext( '2d' /*, { alpha: false }*/ );

    const resizeObserver = new ResizeObserver( entries => {
      entries.forEach( entry => {
        // safari does not support devicePixelContentBoxSize, attempting to work around
        const width = entry.devicePixelContentBoxSize?.[ 0 ].inlineSize ?? ( entry.contentBoxSize[ 0 ].inlineSize * devicePixelRatio );
        const height = entry.devicePixelContentBoxSize?.[ 0 ].blockSize ?? ( entry.contentBoxSize[ 0 ].blockSize * devicePixelRatio );
        this.canvas.width = width;
        this.canvas.height = height;

        // this still needs to be based on content box
        this.scale = Math.min( entry.contentBoxSize[ 0 ].inlineSize, entry.contentBoxSize[ 0 ].blockSize );
      } );

      this.ctx.scale( devicePixelRatio, devicePixelRatio );
      this.ctx.scale( this.scale, this.scale );

      this.redraw();
    } );

    resizeObserver.observe( this.canvas );
  }

  redraw() {
    this.ctx.clearRect( 0, 0, this.ctx.canvas.width, this.ctx.canvas.height );

    this.ctx.save();
    this.draw( this.ctx );
    this.ctx.restore();
  }

  start() {
    let lastTime;
    const animate = ( now ) => {
      lastTime ??= now;  // for first call only
      this.update( now - lastTime );
      lastTime = now;
  
      this.redraw();
  
      if ( this.#reqId ) {    // make sure we didn't stop it
        this.#reqId = requestAnimationFrame( animate );
      }
    };

    this.#reqId = requestAnimationFrame( animate );
  }

  stop() {
    cancelAnimationFrame( this.#reqId );
    this.#reqId = null;   // so we can check if stopped
  }

  update( dt ) {}
  draw( ctx ) {}
}
