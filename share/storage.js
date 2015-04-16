var styleStorage = {

    getItem: function( key ) {
        var jsonString = localStorage.getItem(key);
        return jsonString ? JSON.parse( jsonString ) : null;
    },

    setItem: function( key, data ) {
        localStorage.setItem( key, JSON.stringify( data ) );
        return;
    },

    removeItem: function( key ) {
        localStorage.removeItem(key);
        return;
    },

    each: function( fn ) {
        for (var i = localStorage.length - 1; i >= 0; i--){
            var key = localStorage.key( i );
            if( key ) {
                var data = styleStorage.getItem( key );
                fn( key, data );
            }
        }
    }
};
