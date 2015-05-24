// This key pairs with the version number of the database
const VERSION_KEY = "StyleStorageVersion";

var styleStorage = {
	getItem: function( key ) {
		var jsonString = localStorage.getItem( key );
		return jsonString === null ? null : JSON.parse( jsonString );
	},

	setItem: function( key, data ) {
		localStorage.setItem( key, JSON.stringify( data ) );
	},

	removeItem: function( key ) {
		localStorage.removeItem( key );
	},

	each: function( fn ) {
		var length = localStorage.length,
			i;
		for( i = 0; i < length; i++ ){
			var key = localStorage.key( i );
			if( key && key !== VERSION_KEY ) {
				var data = styleStorage.getItem( key );
				if( fn( key, data ) ) {
					break;
				}
			}
		}
	},
	
	/**
	 * Updates the database if necessary
	 */
	update: function() {
		switch( localStorage.getItem( VERSION_KEY ) ) {
			case safari.extension.displayVersion:
				return;
			case null:
				styleStorage.each( function( key, data ) {
					data.includes = sanitizeRules( data.domains );
					data.excludes = sanitizeRules( data.excludes );
					delete data.domains;
					styleStorage.setItem( key, data );
				} );
				break;
		}
		
		localStorage.setItem( VERSION_KEY, safari.extension.displayVersion );
	}
};

function sanitizeRules( domains ) {
	/* Process domains */
	var result = [],
		i,
		domain;
	for( i = 0; i < domains.length; i++ ){
		domain = domains[i];
		if( domain !== "" ) {
			/* Make sure user input always has trailing slash.
			 * Workaround of Safari 5's URL parsing bug. */
			if( domain.search(/\w+:\/\/(.*)\//) === -1 ) {
				if( domain[ domain.length - 1 ] === "*" ) {
					domain = domain.substr( 0, domain.length - 1 ) + "/*";
				}
				else {
					domain = domain + "/";
				}
			}
			result.push(domain);
		}
	}
	return result;
}
