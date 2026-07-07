export class GameCanvas {
  backgroundColor = '#000';

  centerHorizontally = true;
  centerVertically = true;

  letterbox = true;

  #lastTime;
  #isAnimated = false;

  #bounds = [ -5, -5, 5, 5 ];

  #scale = 1;
  #offsetX = 0;
  #offsetY = 0;

  #mouse = {};

  constructor( canvas ) {
    if ( canvas ) {
      this.canvas = canvas;
    }
    else {
      this.canvas = document.createElement( 'canvas' );
      document.body.appendChild( this.canvas );

      Object.assign( this.canvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        touchAction: 'none',
        userSelect: 'none',
      } );
    }

    this.ctx = this.canvas.getContext( '2d' );

    this.canvas.oncontextmenu = () => { return false };

    //
    // Resize canvas
    //

    new ResizeObserver( _ => {
      const cssWidth = this.canvas.clientWidth;
      const cssHeight = this.canvas.clientHeight;

      this.canvas.width = cssWidth * devicePixelRatio;
      this.canvas.height = cssHeight * devicePixelRatio;

      this.#updateScaleAndOffsets();

      this.redraw();
    } ).observe( this.canvas );

    //
    // Pointer input
    //

    this.canvas.addEventListener( 'pointerdown', e => {
      this.#updatePointerInfo( e );
      this.pointerDown( this.#mouse );
    } );

    this.canvas.addEventListener( 'pointermove', e => {
      this.#updatePointerInfo( e );
      this.pointerMove( this.#mouse );

      // TODO: Do we need this? Why did we do this?
      this.#mouse.dx = 0;
      this.#mouse.dy = 0;
    } );

    this.canvas.addEventListener( 'pointerup', e => {
      this.#updatePointerInfo( e );
      this.pointerUp( this.#mouse );
    } );

    this.canvas.addEventListener( 'pointerout', e => {
      this.#updatePointerInfo( e );
      this.pointerUp( this.#mouse );
    } );

    this.canvas.addEventListener( 'wheel', e => {
      this.#updatePointerInfo( e );
      this.wheelInput( this.#mouse );

      // TODO: Do we still need this?
      this.#mouse.wheel = 0;

      e.preventDefault();
    } );
  }

  setBounds( x1, y1, x2, y2 ) {
    this.#bounds[ 0 ] = x1;
    this.#bounds[ 1 ] = y1;
    this.#bounds[ 2 ] = x2;
    this.#bounds[ 3 ] = y2;

    this.#updateScaleAndOffsets();

    // TODO: Mouse X/Y should also update when we scroll
    //       (not an issue at the moment, but could come up in games that scroll without mouse moving)
  }

  #updateScaleAndOffsets() {
    const cssWidth = this.canvas.clientWidth;
    const cssHeight = this.canvas.clientHeight;

    const minWidth = this.#bounds[ 2 ] - this.#bounds[ 0 ];
    const minHeight = this.#bounds[ 3 ] - this.#bounds[ 1 ];

    const xScale = cssWidth / minWidth;
    const yScale = cssHeight / minHeight;

    this.#scale = Math.min( xScale, yScale );

    this.#offsetX = this.#bounds[ 0 ] + ( this.centerHorizontally ? ( minWidth - cssWidth / this.#scale ) / 2 : 0 );
    this.#offsetY = this.#bounds[ 1 ] + ( this.centerVertically ? ( minHeight - cssHeight / this.#scale ) / 2 : 0 );
  }

  // TODO: Instead of doing all this, could we just have helper functions to getX() and getY()?

  // Is this vulnerable to accidently being changed by handlers?
  // Should these values be better protected somehow?

  #updatePointerInfo( e ) {
    // Do we need to invalidate existing mouse values anytime the scale and offsets change?
    const lastX = this.#mouse.x ?? undefined;
    const lastY = this.#mouse.y ?? undefined;

    this.#mouse.x = e.pageX / this.#scale + this.#offsetX;
    this.#mouse.y = e.pageY / this.#scale + this.#offsetY;

    // Was there a reason we couldn't just use movementX/movementY here?
    this.#mouse.dx = lastX ? this.#mouse.x - lastX : 0;
    this.#mouse.dy = lastY ? this.#mouse.y - lastY : 0;

    // Do we really need to save all this, or can caller handle their own events and just call getX/getY() for scale/offset?
    this.#mouse.buttons = e.buttons;
    this.#mouse.wheel = e.wheelDelta;
    this.#mouse.shiftKey = e.shiftKey;
    this.#mouse.ctrlKey = e.ctrlKey;
    this.#mouse.altKey = e.altKey;
  }

  //
  // Animation (update loop)
  //
  #animate = ( now ) => {
    this.#lastTime ??= now;
    this.update( Math.min( now - this.#lastTime, 100 ) );   // prevent large updates from delays
    this.#lastTime = now;

    this.redraw();

    if ( this.#isAnimated ) {
      requestAnimationFrame( this.#animate );
    }
  }

  start() {
    if ( !this.#isAnimated ) {
      this.#isAnimated = true;
      requestAnimationFrame( this.#animate );
    }
  }

  stop() {
    this.#isAnimated = false;
  }

  toggle() {
    if ( this.#isAnimated ) {
      this.stop();
    }
    else {
      this.start();
    }
  }

  //
  // Drawing
  //
  redraw() {
    // scaleX, skewY, skewX, scaleY, translateX, translateY
    this.ctx.setTransform( devicePixelRatio, 0, 0, devicePixelRatio, 0, 0 );

    this.ctx.scale( this.#scale, this.#scale );
    this.ctx.translate( -this.#offsetX, -this.#offsetY );

    const canvasWidth = this.canvas.clientWidth / this.#scale;
    const canvasHeight = this.canvas.clientHeight / this.#scale;

    if ( this.backgroundColor ) {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect( this.#offsetX, this.#offsetY, canvasWidth, canvasHeight );
    }
    else {
      this.ctx.clearRect( this.#offsetX, this.#offsetY, canvasWidth, canvasHeight );
    }

    this.ctx.save(); {
      this.draw( this.ctx, this.#bounds );
    }
    this.ctx.restore();

    if ( this.letterbox ) {
      this.ctx.fillStyle = 'black';

      this.ctx.fillRect( this.#bounds[ 0 ], this.#offsetY, this.#offsetX - this.#bounds[ 0 ], canvasHeight );
      this.ctx.fillRect( this.#bounds[ 2 ], this.#offsetY, this.#bounds[ 2 ] - this.#offsetX, canvasHeight );

      this.ctx.fillRect( this.#offsetX, this.#bounds[ 1 ], canvasWidth, this.#offsetY - this.#bounds[ 1 ] );
      this.ctx.fillRect( this.#offsetX, this.#bounds[ 3 ], canvasWidth, this.#bounds[ 3 ] - this.#offsetY );
    }
  }

  //
  // Users override these functions
  //
  update( dt ) {}
  draw( ctx ) {}

  pointerDown( pointerInfo ) {}
  pointerMove( pointerInfo ) {}
  pointerUp( pointerInfo ) {}
  wheelInput( pointerInfo ) {}
}
