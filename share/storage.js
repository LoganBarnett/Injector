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
            if( key ) {
                var data = styleStorage.getItem( key );
                if( fn( key, data ) ) {
                    break;
                }
            }
        }
    }
};
