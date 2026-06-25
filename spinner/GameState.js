export class GameState {
  #stateKey;

  constructor( stateKey ) {
    this.#stateKey = stateKey;

    this.load();

    window.addEventListener( 'beforeunload', _ => {
      this.save();
    } );
  }

  load() {
    Object.assign( this, JSON.parse( localStorage.getItem( this.#stateKey ) ) );
  }
  
  save() {
    localStorage.setItem( this.#stateKey, JSON.stringify( this ) );
  }

  remove() {
    localStorage.removeItem( this.#stateKey );
  }
}