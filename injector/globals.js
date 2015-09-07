const managerURL = safari.extension.baseURI + "manage/manage.html";
const contextMenuDisabled = !safari.extension.settings.enableContextMenu;

function reloadStyles() {
	safari.extension.removeContentStyleSheets();
	safari.extension.removeContentScripts();

	styleStorage.each( function( key, data ) {
		if( data.enabled ) {
			data.styles.length && safari.extension.addContentStyleSheet( data.styles, data.includes, data.excludes );
			data.script.length && safari.extension.addContentScript( data.script, data.includes, data.excludes, data.onload );
		}
	} );
}

function handleCommand( event ) {
	if( safari.extension.popovers[0].visible ) {
		return;
	}
	
	var activeTab = safari.application.activeBrowserWindow.activeTab,
		url = activeTab.url;
	
	if( url === undefined ) {
		launchManager( "" );
	}
	else if( url === "" ) {
		activeTab.url = managerURL;
	}
	else {
		var injections = [],
			i;
		
		styleStorage.each( function( key, data ) {				
			for( i = 0; i < data.includes.length; i++ ) {
				if( matchesSimplePattern( data.includes[i], url ) ) {
					injections.push( { key: key, data: data } );
				}
			}
		} );
	
		switch( event.command ) {
		case "toolbar-item":
			if( injections.length ) {
				event.target.popover.contentWindow.createItems( injections );
				event.target.showPopover();
				break;
			}
		case "launch-injector":
			if( injections.length ) {
				launchManagerEdit( injections[0].key );
			}
			else {
				launchManagerNew();
			}
			break;
		default:
			break;
		}
	}
}

function matchesSimplePattern( pattern, string ) {
	var specialChars = "\\^$*+?.()|{}[]";
	var regexChars = "^";
	for( var i = 0; i < pattern.length; i++ ) {
		var c = pattern.charAt( i );
		switch( c ) {
			case '*':
				regexChars += ".*";
				break;
			default:
				if( specialChars.indexOf( c ) >= 0 ) {
					regexChars += "\\";
				}
				regexChars += c;
		}
	}
	regexChars += "$";
	return new RegExp( regexChars ).test( string );
}

function launchManager( hash ) {
	safari.application.activeBrowserWindow.openTab().url = managerURL + hash;
}

function launchManagerNew() {
	launchManager( "#new," + encodeURIComponent( safari.application.activeBrowserWindow.activeTab.url ) );
}

function launchManagerEdit( key ) {
	launchManager( "#" + key );
}

function getItem( key ) {
	return styleStorage.getItem( key );
}

function setItem( key, data ) {
	return styleStorage.setItem( key );
}

function setItemEnabled( key, enabled ) {
	var item = styleStorage.getItem( key );
	item.enabled = enabled;
	styleStorage.setItem( key, item );
}

function handleMessage( event ) {
	switch( event.name ) {
	case "reloadStyles":
		reloadStyles();
		break;
	case "getItem":
		var item = styleStorage.getItem( event.message );
		event.target.page.dispatchMessage( "getItem", [ event.message, item ] );
		break;
	case "removeItem":
		styleStorage.removeItem( event.message );
		break;
	case "setItem":
		styleStorage.setItem( event.message[0], event.message[1] );
		break;
	case "items":
		var items = [];
		styleStorage.each( function( key, data ) {
			items.push( { key: key, data: data } );
		} );
		event.target.page.dispatchMessage( "items", items );
		break;
	default:
		break;
	}
}

function handleValidate( event ) {
	switch( event.target.identifier ) {
	case "LaunchInjector":
		event.target.disabled = contextMenuDisabled;
		break;
	default:
		break;
	}
}

safari.application.addEventListener( "command", handleCommand, false );
safari.application.addEventListener( "message", handleMessage, false );
safari.application.addEventListener( "validate", handleValidate, false );
styleStorage.update();
reloadStyles();
