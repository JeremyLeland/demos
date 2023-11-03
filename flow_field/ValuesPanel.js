export class ValuesPanel {
  constructor( values ) {
    const panelUI = document.createElement( 'div' );
    panelUI.style.position = 'absolute';
    panelUI.style.left = 0;
    panelUI.style.top = 0;
    panelUI.style.display = 'grid';

    let labelLength = 0, valueLength = 0;

    for ( const val in values ) {
      labelLength = Math.max( labelLength, val.length );
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

    // TODO: Do we need to hardcode this? Can it just get it from element size?
    panelUI.style.gridTemplateColumns = `${ labelLength * 8 }px ${ valueLength * 10 + 20 }px`;

    document.body.appendChild( panelUI );
  }

  valueChanged() {}
}

