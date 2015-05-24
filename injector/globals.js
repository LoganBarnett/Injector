function reloadStyles() {
	safari.extension.removeContentStyleSheets();
	safari.extension.removeContentScripts();
	
	styleStorage.each( function( key, data ) {
		if( data.enabled ) {
			var styles = data.styles,
				script = data.script,
				includes = data.includes,
				excludes = data.excludes;
			styles.length && safari.extension.addContentStyleSheet( styles, includes, excludes );
			script.length && safari.extension.addContentScript( script, includes, excludes, data.onload );
		}
	} );
}

function handleCommand( event ) {
	switch( event.command ) {
	case "launch-injector":
		var manageURL = safari.extension.baseURI + "manage/manage.html",
			currentWindow = safari.application.activeBrowserWindow,
			currentTab = currentWindow.activeTab,
			url = currentTab.url;
		
		if( url === "" ) {
			currentTab.url = manageURL;
		}
		else {
			var includes,
				styleKey = "";
			styleStorage.each( function( key, data ) {				
				for( var i = 0; i < data.includes.length; i++ ) {
					if( new RegExp( data.includes[i] ).test( url ) ) {
						styleKey = key;
						return true; // break all
					}
				}
			} );
			
			if( styleKey === "" ) {
				styleKey = "new," + encodeURIComponent( url );
			}
			
			currentWindow.openTab( "foreground" ).url = manageURL + "#" + styleKey;
		}
		break;
	default:
		break;
	}
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
			items.push( { "key": key, "data": data } );
		} );
		event.target.page.dispatchMessage( "items", items );
		break;
	case "shouldConvert":
		if( localStorage.length === 0 ) {
			event.target.page.dispatchMessage( "shouldConvert", true );
			break;
		}
	default:
		break;
	}
}

function handleValidate( event ) {
	switch( event.target.identifier ) {
	case "LaunchInjector":
		event.target.disabled = !safari.extension.settings.enableContextMenu;
		break;
	default:
		break;
	}
}

safari.application.addEventListener( "command", handleCommand, false );
safari.application.addEventListener( "message", handleMessage, false );
safari.application.addEventListener( "validate", handleValidate, false );
reloadStyles();
styleStorage.update();
