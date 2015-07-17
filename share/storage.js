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
					data.includes = sanitizeDomains( data.domains );
					data.excludes = sanitizeDomains( data.excludes );
					delete data.domains;
					styleStorage.setItem( key, data );
				} );
				break;
			case "1.6":
			case "1.7":
				styleStorage.each( function( key, data ) {
					data.includes = sanitizeDomains( data.includes );
					data.excludes = sanitizeDomains( data.excludes );
				} );
				break;
		}
		
		localStorage.setItem( VERSION_KEY, safari.extension.displayVersion );
	}
};

/**
 * Adjusts domains so that they are valid according to the Safari extension
 * API for style/script injection.
 */
function sanitizeDomains( domains ) {
	var result = [],
		i,
		url;
	
	for( i = 0; i < domains.length; i++ ) {

		if( domains[i] === "*" ) {
			result.push( domains[i] );
		}
		else {
			/* Breakdown of the capturing groups in the below regular expression:
			 1 - protocol + ://
			 2 - subdomain(s) or www. + domain + extension(s)
			 3 - path on domain
			 */
			url = /^([\w\*]+:\/\/)?([\d\w\-\.:\*]+)([^\s]*)$/.exec( domains[i] );
			
			// No match: assume invalid url and skip
			if( url === null ) {
				continue;
			}
			
			if( !url[1] ) {
				url[1] = "http://";
			}
			
			/* If the full domain includes exactly one dot, it must have an extension and
			   no subdomain, which means we need to prepend with something like *. */
			if( ( url[2].match( /\./g ) || [] ).length === 1 ) {
				url[2] = "*." + url[2];
			}
			
			// Domains need a trailing slash
			if( url[3].length === 0 ) {
				url[3] = "/";
			}
			else if( url[3][0] !== "/" ) {
				url[3] = "/" + url[3];
			}
			
			result.push( url[1] + url[2] + url[3] );
		}
	}
	
	return result;
}
