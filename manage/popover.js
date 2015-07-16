(function() {
	var global = safari.extension.globalPage.contentWindow,
		
		// DOM elements
		list,
		newLink,
		editLink,
		
		// The currently selected list item
		selection = null;
	
	function addLinkHandler( event ) {
		global.launchManager( "new" );
		safari.self.hide();
	}
	
	function editLinkHandler( event ) {
		if( selection !== null ) {
			global.launchManager( event.srcElement.id );
			safari.self.hide();
		}
	}
	
	function listItemHandler( event ) {
		if( this !== selection ) {
			markSelection( this );
		}
	}
	
	function checkboxHandler( event ) {
		var listItem = event.target.parentNode,
			enabled = event.target.checked,
			key = listItem.id,
			item = global.styleStorage.getItem( key );
		
		if( enabled ) {
			listItem.classList.remove( "disabled" );
		}
		else {
			listItem.classList.add( "disabled" );
		}
		
		item.enabled = enabled;
		global.styleStorage.setItem( key, item );
		
		global.reloadStyles();
		
		event.stopPropagation();
	}
	
	function start() {
		list = document.getElementById( "list" );
		newLink = document.getElementById( "new" );
		editLink = document.getElementById( "edit" );
	
		newLink.addEventListener( "click", addLinkHandler, false );
		editLink.addEventListener( "click", editLinkHandler, false );
		
		clearSelection();
	}
	
	window.createItems = function( injections ) {
		safari.self.height = Math.min( injections.length, 10 ) * 36 + 20;
		
		var fragment = document.createDocumentFragment(),
			i;
		
		for( i = 0; i < injections.length; i++ ) {
			var item = document.createElement( "a" ),
				checkbox = document.createElement( "input" );
			
			item.id = injections[i].key;
			
			if( !injections[i].data.enabled ) {
				item.className = "disabled";
			}
			item.addEventListener( "click", listItemHandler );
			
			checkbox.type = "checkbox";
			checkbox.checked = injections[i].data.enabled;
			checkbox.addEventListener( "click", checkboxHandler, false );
			
			item.appendChild( checkbox );
			item.appendChild( document.createTextNode( injections[i].data.name ) );
			
			fragment.appendChild( item );
		}
		
		list.appendChild( fragment );
	};
	
	function clearItems() {
		clearSelection();
		
		var element;
		while( element = list.firstChild ) {
			list.removeChild( element );
		}
	}
	
	function markSelection( element ) {
		if( element !== selection ) {
			if( selection === null ) {
				editLink.classList.remove( "disabled" );
			}
			else {
				selection.classList.remove( "selection" );
			}
			
			element.classList.add( "selection" );
			selection = element;
		}
	}
	
	function clearSelection() {
		if( selection !== null ) {
			selection.classList.remove( "selection" );
			selection = null;
		}
		editLink.classList.add( "disabled" );
	}
	
	window.addEventListener( "DOMContentLoaded", start, false );
	window.addEventListener( "blur", clearItems, false );
})();
