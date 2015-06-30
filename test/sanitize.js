"use strict";

const suite = module.exports;

function sanitizeDomain( domain ) {
	var url;

	/* Breakdown of the capturing groups in the below regular expression:
	 1 - protocol + ://
	 2 - subdomain(s) or www. + domain + extension(s)
	 3 - path on domain
	 */
	url = /^([\w\*]+:\/\/)?([\d\w\-\.:\*]+)([^\s]*)$/.exec( domain );
	
	// No match: assume invalid url and skip
	if( url === null ) {
		return "";
	}
	
	if( !url[1] ) {
		url[1] = "http://";
	}
	
	/* If the full domain includes exactly one dot, it must have an extension and
	   no subdomain, which means we need to prepend with www. */
	if( ( url[2].match( /\./g ) || [] ).length === 1 ) {
		url[2] = "www." + url[2];
	}
	
	// Domains need a trailing slash
	if( url[3].length === 0 ) {
		url[3] = "/";
	}
	else if( url[3][0] !== "/" ) {
		url[3] = "/" + url[3];
	}
	
	domain = url[1] + url[2] + url[3];
	
	return domain;
}

suite.invalidURL = function( test ) {
	test.strictEqual( sanitizeDomain( "%" ), "" );
	test.done();
};

suite.fullURL = function( test ) {
	test.strictEqual( sanitizeDomain( "http://www.example.com/test.html" ), "http://www.example.com/test.html" );
	test.done();
};

suite.noExtension = function( test ) {
	test.strictEqual( sanitizeDomain( "http://localhost/test.html" ), "http://localhost/test.html" );
	test.done();
};

suite.subDomain = function( test ) {
	test.strictEqual( sanitizeDomain( "http://mail.example.com/" ), "http://mail.example.com/" );
	test.done();
};

suite.noSlash = function( test ) {
	test.strictEqual( sanitizeDomain( "http://www.example.com" ), "http://www.example.com/" );
	test.done();
};

suite.noProtocol = function( test ) {
	test.strictEqual( sanitizeDomain( "www.example.com/" ), "http://www.example.com/" );
	test.done();
};

suite.noWWW = function( test ) {
	test.strictEqual( sanitizeDomain( "http://example.com/" ), "http://www.example.com/" );
	test.done();
};

suite.noNothing = function( test ) {
	test.strictEqual( sanitizeDomain( "example.com" ), "http://www.example.com/" );
	test.done();
};

suite.starAfterSlash = function( test ) {
	test.strictEqual( sanitizeDomain( "http://www.example.com/*" ), "http://www.example.com/*" );
	test.done();
};

suite.starInPath = function( test ) {
	test.strictEqual( sanitizeDomain( "example.com/search*" ), "http://www.example.com/search*" );
	test.done();
};
