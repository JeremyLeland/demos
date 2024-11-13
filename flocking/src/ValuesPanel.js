export class ValuesPanel {

  // TODO: Optional parameter with min/max/step for values?
  constructor( values ) {
    const panelUI = document.createElement( 'div' );
    Object.assign( panelUI.style, {
      position: 'absolute',
      left: 0,
      top: 0,
      display: 'grid',
      background: '#000a',
    } );

    let valueLength = 0;

    for ( const val in values ) {
      if ( typeof values[ val ] != 'function' ) {
        valueLength = Math.max( valueLength, values[ val ].toString().length );
        
        const labelUI = document.createElement( 'label' );
        labelUI.setAttribute( 'for', val );
        labelUI.innerText = val;
        panelUI.appendChild( labelUI );
        
        const numInputUI = document.createElement( 'input' );
        
        numInputUI.type = 'number';
        // numInputUI.min = 0;
        // numInputUI.max = values[ val ] * 2;
        numInputUI.step = Math.pow( 10, Math.floor( Math.log10( values[ val ] ) ) - 1 );
        
        numInputUI.id = val;
        numInputUI.value = values[ val ];
        numInputUI.oninput = e => {
          values[ val ] = parseFloat( numInputUI.value );
          this.valueChanged();
        };
        
        panelUI.appendChild( numInputUI );
      }
    }
      
    // TODO: Do we need to hardcode this? Can it just get it from element size?
    panelUI.style.gridTemplateColumns = `1fr ${ valueLength * 10 + 20 }px`;

    document.body.appendChild( panelUI );
  }

  valueChanged() {}
}

