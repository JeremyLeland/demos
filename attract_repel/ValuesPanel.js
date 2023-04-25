export class ValuesPanel {
  constructor( values ) {
    const panelUI = document.createElement( 'div' );
    panelUI.style.position = 'absolute';
    panelUI.style.width = '300px';
    panelUI.style.display = 'grid';
    panelUI.style.gridTemplateColumns = '120px 50px';
    // TODO: Resize these based on strings?

    for ( const val in values ) {
  
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

    document.body.appendChild( panelUI );
  }

  valueChanged() {}
}

