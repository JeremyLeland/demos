export class Game {
  keysPressed = new Set();
  mouse = { x: 0, y: 0, down: false, move: { x: 0, y: 0 } };

  scroll = { x: 0, y: 0 };

  #lastX;
  #lastY;

  constructor() {
    const canvas = document.createElement( 'canvas' );
    window.onresize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.onresize();
    
    document.body.appendChild( canvas );
    const ctx = canvas.getContext( '2d' );

    window.onkeydown = ( e ) => this.keysPressed.add( e.key );
    window.onkeyup   = ( e ) => this.keysPressed.delete( e.key );

    const inputStart = ( e ) => {
      this.mouse.down = true;
    }
    const inputMove = ( e ) => {
      const event = e.touches ? e.touches[ 0 ] : e;

      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      this.mouse.move.x = this.#lastX ? this.mouseX - this.#lastX : 0;
      this.mouse.move.y = this.#lastY ? this.mouseY - this.#lastY : 0;
      this.#lastX = this.mouse.x;
      this.#lastY = this.mouse.y;
    }
    const inputStop = ( e ) => {
      this.mouse.down = false;
      this.#lastX = this.#lastY = undefined;
    }
    document.addEventListener( 'mousedown',  inputStart );
    document.addEventListener( 'touchstart', inputStart );
    document.addEventListener( 'mousemove', inputMove );
    document.addEventListener( 'touchmove', inputMove );
    document.addEventListener( 'mouseup',  inputStop );
    document.addEventListener( 'touchend', inputStop );
    

    let lastTime = null;
    const animate = ( now ) => {
      lastTime ??= now;  // for first call only
      this.update( now - lastTime );
      lastTime = now;
  
      ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

      ctx.save();
      ctx.translate( this.scroll.x, this.scroll.y );
      this.draw( ctx );
      ctx.restore();
  
      requestAnimationFrame( animate );
    };

    requestAnimationFrame( animate );
  }

  update( dt ) {}
  draw( ctx ) {}

}
