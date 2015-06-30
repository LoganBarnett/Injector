var Manager = {
	list: null,
	form: null,
	newLink: null,

	includeLabel: null,
	excludeLabel: null,
	cssLabel: null,
	jsLabel: null,

	current: null,

	hideLabel: function( label ) {
		label.classList.add( "hidden" );
	},
	showLabel: function( label ) {
		label.classList.remove( "hidden" );
	},
	clickLabel: function() {
		if( this.classList.contains( "hidden" ) ) {
			Manager.showLabel( this );
		}
		else {
			Manager.hideLabel( this );
		}
	},

	// Style storage
	createItems: function() {
		safari.self.tab.dispatchMessage( "items" );
	},

	removeItem: function( key ) {
		safari.self.tab.dispatchMessage( "removeItem", key );
	},

	getItem: function( key ) {
		safari.self.tab.dispatchMessage( "getItem", key );
	},

	setItem: function( key, values ) {
		safari.self.tab.dispatchMessage( "setItem", [ key, values ] );
	},

	// Manager application
	start: function() {
		Manager.list = document.getElementById( "list" );
		Manager.form = document.getElementById( "form" );
		Manager.newLink = document.getElementById( "new" );
		Manager.includeLabel = document.getElementById( "label-includes" );
		Manager.excludeLabel = document.getElementById( "label-excludes" );
		Manager.cssLabel = document.getElementById( "label-css" );
		Manager.jsLabel = document.getElementById( "label-js" );

		var deleteLink = document.getElementById( "delete" );

		Manager.createItems();

		Manager.newLink.addEventListener( "click", function( event ) {
			if( this !== Manager.current ) {
				Manager.markCurrent( this );
				Manager.bindNewForm();
			}
		}, false );

		deleteLink.addEventListener( "click", function( event ) {
			if( Manager.current === null || Manager.current === Manager.newLink ) {
				return;
			}

			var element = Manager.current;

			(
				element.nextElementSibling ||
				element.previousElementSibling ||
				Manager.newLink
			).click();

			Manager.removeItem( element.hash.substr( 1 ) );
			Manager.list.removeChild( element );
			Manager.reloadStyles();
		}, false );

		Manager.includeLabel.addEventListener( "click", Manager.clickLabel, false );
		Manager.excludeLabel.addEventListener( "click", Manager.clickLabel, false );
		Manager.cssLabel.addEventListener( "click", Manager.clickLabel, false );
		Manager.jsLabel.addEventListener( "click", Manager.clickLabel, false );

		deleteLink = undefined;
	},

	getItemId: function( key ) {
		return "item-" + key;
	},
	getListItem: function( key ) {
		return document.getElementById( Manager.getItemId( key ) );
	},

	reloadStyles: function() {
		safari.self.tab.dispatchMessage("reloadStyles");
	},

	setTitle: function( title ) {
		document.getElementById("title").textContent = title;
	},

	setLabelState: function( includes, excludes, styles, script ) {
		( includes ? Manager.showLabel : Manager.hideLabel )( Manager.includeLabel );
		( excludes ? Manager.showLabel : Manager.hideLabel )( Manager.excludeLabel );
		( styles ? Manager.showLabel : Manager.hideLabel )( Manager.cssLabel );
		( script ? Manager.showLabel : Manager.hideLabel )( Manager.jsLabel );
	},

	createItem: function( key, data ) {
		var item = document.createElement( "a" );

		item.id = Manager.getItemId( key );

		if( !data.enabled ) {
			item.className = "disabled";
		}
		item.href = "#" + key;
		item.textContent = data.name;
		item.addEventListener( "click", function( e ) {
			if( this !== Manager.current ) {
				var key = this.hash.substr( 1 );
				Manager.markCurrent( this );
				Manager.getItem( key );
			}
		} );

		Manager.list.appendChild( item );
		return item;
	},

	markCurrent: function( element ) {
		if( element !== Manager.current ) {
			Manager.current && Manager.current.classList.remove( "current" );
			element.classList.add( "current" );
			Manager.current = element;
		}
	},

	constructDataFromForm: function() {
		var includes = Manager.form.includes.value,
			excludes = Manager.form.excludes.value,
			data = {};
		data.name = Manager.form.name.value;
		data.enabled = Manager.form.enabled.checked;
		data.includes = includes.length ? sanitizeDomains( includes.split( "\n" ) ) : [];
		data.excludes = excludes.length ? sanitizeDomains( excludes.split( "\n" ) ) : [];
		data.styles = Manager.form.styles.value;
		data.script = Manager.form.script.value;
		data.onload = Manager.form.onload.checked;
		return data;
	},

	populateForm: function( data ) {
		Manager.form.name.value = data.name || "";
		Manager.form.includes.value = data.includes.join( "\n" );
		Manager.form.excludes.value = data.excludes.join( "\n" );
		Manager.form.styles.value = data.styles || "";
		Manager.form.script.value = data.script || "";
		Manager.form.onload.checked = data.onload;
		Manager.form.enabled.checked = data.enabled;
	},

	bindForm: function( data, callback ) {

		Manager.populateForm( data );

		Manager.form._submitCallback && Manager.form.removeEventListener( "submit", Manager.form._submitCallback, false ); // Cleanup

		Manager.form._submitCallback = function( e ) {
			var formData = Manager.constructDataFromForm();

			if( formData.name && ( formData.styles || formData.script ) && formData.includes ) {
				Manager.populateForm( formData );
				callback( formData );
			}

			// Don't refresh the page
			e.preventDefault();
			return false;
		};

		Manager.form.addEventListener( "submit", Manager.form._submitCallback, false );
	},

	bindEditForm: function( key, data ) {
		Manager.setTitle( data.name );
		Manager.setLabelState( data.includes.length, data.excludes.length, data.styles.length, data.script.length );
		Manager.bindForm( data, function( formData ) {
			Manager.setItem( key, formData );

			var item = Manager.getListItem( key );
			// Always update display
			Manager.setTitle( formData.name );
			item.childNodes[0].nodeValue = formData.name;

			if( formData.enabled ) {
				item.classList.remove( "disabled" );
			}
			else {
				item.classList.add( "disabled" );
			}

			Manager.reloadStyles();
		});
	},

	bindNewForm: function() {
		Manager.setTitle( "New Injection" );
		Manager.setLabelState( true, false, true, true );
		Manager.bindForm( { enabled: true, includes: [], excludes: [] }, function( formData ) {
			var key = Date.now();
			Manager.setItem( key, formData );

			var item = Manager.createItem( key, formData );
			item.click();

			if( !formData.enabled ) {
				item.classList.add("disabled");
			}

			Manager.reloadStyles();
		});
	}

};

function handleMessage( event ) {
	switch( event.name ) {
	case "items":
		event.message.forEach( function( item ) {
			Manager.createItem( item.key, item.data );
		} );

		var hash = window.location.hash;

		if( hash.indexOf( "new", 1 ) === 1 ) {
			Manager.newLink.click();
			if( hash.length > 4 ) {
				Manager.form.includes.value = decodeURIComponent( hash.substring( 5 ) );
			}
		}
		else if( hash.length > 0 ) {
			Manager.getListItem( hash.substring( 1 ) ).click();
		}
		else {
			Manager.newLink.click();
		}
		break;
	case "getItem":
		Manager.bindEditForm( event.message[0], event.message[1] );
		break;
	}
}

safari.self.addEventListener( "message", handleMessage, false );
window.addEventListener( "DOMContentLoaded", Manager.start, false );
