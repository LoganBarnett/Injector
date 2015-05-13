var styleStorage = {

    getItem: function( key ) {
        var jsonString = localStorage.getItem(key);
        return jsonString ? JSON.parse( jsonString ) : null;
    },

    setItem: function( key, data ) {
        localStorage.setItem( key, JSON.stringify( data ) );
    },

    removeItem: function( key ) {
        localStorage.removeItem(key);
    },

    each: function( fn ) {
        for (var i = localStorage.length - 1; i >= 0; i--){
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
