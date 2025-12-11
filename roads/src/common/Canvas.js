const MAX_UPDATE = 100;

export class Canvas {
  bounds = [ -5, -4, 5, 4 ];

  backgroundColor = 'black';
  lineWidth = 0.1;

  #inlineSize;
  #blockSize;

  #scale = 1;
  #offsetX = 0;
  #offsetY = 0;

  #reqId;

  #mouse = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    buttons: 0,
    wheel: 0,
    ctrlKey: false,
    shiftKey: false,
  };

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

    //
    // Resize with parent element
    //

    const resizeObserver = new ResizeObserver( entries => {
      entries.forEach( entry => {
        // safari does not support devicePixelContentBoxSize, attempting to work around
        const width = entry.devicePixelContentBoxSize?.[ 0 ].inlineSize ?? ( entry.contentBoxSize[ 0 ].inlineSize * devicePixelRatio );
        const height = entry.devicePixelContentBoxSize?.[ 0 ].blockSize ?? ( entry.contentBoxSize[ 0 ].blockSize * devicePixelRatio );
        this.canvas.width = width;
        this.canvas.height = height;

        // this still needs to be based on content box
        this.#inlineSize = entry.contentBoxSize[ 0 ].inlineSize;
        this.#blockSize = entry.contentBoxSize[ 0 ].blockSize;

        this.#updateScaleAndOffset();
      } );
      
      this.redraw();
    } );

    resizeObserver.observe( this.canvas );

    //
    // Pointer input
    //

    this.canvas.addEventListener( 'pointerdown', e => {
      this.#mouse.x = this.getPointerX( e );
      this.#mouse.y = this.getPointerY( e );
      this.#mouse.buttons = e.buttons;
      this.#mouse.ctrlKey = e.ctrlKey;
      this.#mouse.shiftKey = e.shiftKey;

      this.pointerDown( this.#mouse );
    } );

    this.canvas.addEventListener( 'pointermove', e => {
      const lastX = this.#mouse.x;
      const lastY = this.#mouse.y;
      this.#mouse.x = this.getPointerX( e );
      this.#mouse.y = this.getPointerY( e );
      this.#mouse.dx = this.#mouse.x - lastX;
      this.#mouse.dy = this.#mouse.y - lastY;
      this.#mouse.ctrlKey = e.ctrlKey;
      this.#mouse.shiftKey = e.shiftKey;
      
      this.pointerMove( this.#mouse );

      this.#mouse.dx = 0;
      this.#mouse.dy = 0;
    } );

    this.canvas.addEventListener( 'pointerup', e => {
      this.#mouse.buttons = e.buttons;

      this.pointerUp( this.#mouse );
    } );

    this.canvas.addEventListener( 'wheel', e => {
      this.#mouse.x = this.getPointerX( e );
      this.#mouse.y = this.getPointerY( e );
      this.#mouse.wheel = e.wheelDelta;
      this.#mouse.ctrlKey = e.ctrlKey;
      this.#mouse.shiftKey = e.shiftKey;
      
      this.wheelInput( this.#mouse );

      this.#mouse.wheel = 0;

      e.preventDefault();
    } );
  }

  // This needs to get called anytime inlineSize/blockSize or bounds change
  #updateScaleAndOffset() {
    const goalWidth = this.bounds[ 2 ] - this.bounds[ 0 ];
    const goalHeight = this.bounds[ 3 ] - this.bounds[ 1 ];

    // console.log( 'goalWidth = ' + goalWidth + ', goalHeight = ' + goalHeight );

    const widthRatio = this.#inlineSize / goalWidth;
    const heightRatio = this.#blockSize / goalHeight;

    // console.log( 'widthRatio = ' + widthRatio + ', heightRatio = ' + heightRatio );

    this.#scale = Math.min( widthRatio, heightRatio );

    // this might get messed up if writing mode is vertical
    this.#offsetX = 0.5 * this.#scale * ( ( this.#inlineSize / this.#scale ) - goalWidth );
    this.#offsetY = 0.5 * this.#scale * ( ( this.#blockSize / this.#scale ) - goalHeight );
  }


  #doDraw() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect( 0, 0, this.ctx.canvas.width, this.ctx.canvas.height );

    this.ctx.save(); {
      this.ctx.scale( devicePixelRatio, devicePixelRatio );

      this.ctx.translate( this.#offsetX, this.#offsetY );
      this.ctx.scale( this.#scale, this.#scale );

      // this.ctx.scale( this.zoom, this.zoom );
      this.ctx.translate( -this.bounds[ 0 ], -this.bounds[ 1 ] );

      this.ctx.lineWidth = this.lineWidth;// / ( this.#scale * this.zoom );

      try {
        this.draw( this.ctx );
      }
      catch ( e ) {
        console.error( e );
      }
    }
    this.ctx.restore();
  }

  start() {
    if ( !this.#reqId ) {     // don't try to start again if already started
      let lastTime;
      const animate = ( now ) => {
        lastTime ??= now;  // for first call only
        this.update( Math.min( now - lastTime, MAX_UPDATE ) );
        lastTime = now;

        this.#doDraw();

        if ( this.#reqId ) {    // make sure we didn't stop it
          this.#reqId = requestAnimationFrame( animate );
        }
      };

      this.#reqId = requestAnimationFrame( animate );
    }
  }

  stop() {
    cancelAnimationFrame( this.#reqId );
    this.#reqId = null;   // so we can check if stopped
  }

  toggle() {
    if ( this.#reqId ) {
      this.stop();
    }
    else {
      this.start();
    }
  }

  redraw() {
    if ( !this.#reqId ) {   // don't draw if we are animated
      this.#doDraw();
    }
  }


  update( dt ) {}
  draw( ctx ) {}

  pointerDown( pointerInfo ) {}
  pointerMove( pointerInfo ) {}
  pointerUp( pointerInfo ) {}
  wheelInput( pointerInfo ) {}

  getPointerX( e ) {
    return ( ( e.clientX - this.#offsetX ) / this.#scale ) + this.bounds[ 0 ];
  }

  getPointerY( e ) {
    return ( ( e.clientY - this.#offsetY ) / this.#scale ) + this.bounds[ 1 ];
  }

  translate( dx, dy ) {
    this.bounds[ 0 ] += dx;
    this.bounds[ 1 ] += dy;
    this.bounds[ 2 ] += dx;
    this.bounds[ 3 ] += dy;

    this.#mouse.x += dx;
    this.#mouse.y += dy;

    // Doesn't seem to need this, since bounds width and height do not change
    // this.#updateScaleAndOffset();
  }

  zoom( x, y, dScale ) {
    const newScale = 1 - dScale;    // this makes positive numbers zoom in and negative numbers zoom out

    const beforeX = ( x - this.bounds[ 0 ] ) * newScale;
    const beforeY = ( y - this.bounds[ 1 ] ) * newScale;
    const afterX  = ( this.bounds[ 2 ] - x ) * newScale;
    const afterY  = ( this.bounds[ 3 ] - y ) * newScale;

    this.bounds[ 0 ] = x - beforeX;
    this.bounds[ 1 ] = y - beforeY;
    this.bounds[ 2 ] = x + afterX;
    this.bounds[ 3 ] = y + afterY;

    this.#updateScaleAndOffset();
  }
}

//
// Persisting state to localStorage
// - Not really a canvas thing, but putting here for now because I use it a lot
//

export class GameState {
  #stateKey;

  constructor( stateKey ) {
    this.#stateKey = stateKey;

    try {
      const state = localStorage.getItem( this.#stateKey );
      const jsonState = JSON.parse( state );
      Object.assign( this, jsonState );
    }
    catch( e ) {
      console.log( `Error parsing existing state JSON: ${ e } ` );
    }

    window.addEventListener( 'beforeunload', _ => {
      this.save();
    } );
  }
  
  save() {
    localStorage.setItem( this.#stateKey, JSON.stringify( this ) );
  }

  remove() {
    localStorage.removeItem( this.#stateKey );
  }
}
