if( window.safari === undefined ) {
    window.safari = {
        self: {
            addEventListener: function() {},
            tab: {
                dispatchMessage: function( name, message ) {
                    console.log( name + ": " + message );
                }
            }
        }
    }
}

var Manager = {
    list: null,
    form: null,
    newLink: null,
    includeLabel: null,
    excludeLabel: null,
    
    current: null,
    
    hideLabel: function( label ) {
        label.classList.add( 'hidden' );
    },
    showLabel: function( label ) {
        label.classList.remove( 'hidden' );
    },
    clickLabel: function() {
        if( this.classList.contains( 'hidden' ) ) {
            Manager.showLabel( this );
        }
        else {
            Manager.hideLabel( this );
        }
    },

    // Style storage
    createItems: function() {
        safari.self.tab.dispatchMessage( 'items' );
    },

    removeItem: function( key ) {
        safari.self.tab.dispatchMessage( 'removeItem', key );
    },

    getItem: function( key ) {
        safari.self.tab.dispatchMessage( 'getItem', key );
    },

    setItem: function( key, values ) {
        safari.self.tab.dispatchMessage( 'setItem', [ key, values ] );
    },

    // Manager application
    start: function() {
        Manager.list = document.getElementById( 'list' );
        Manager.form = document.getElementById( 'form' );
        Manager.newLink = document.getElementById( 'new' );
        Manager.includeLabel = document.getElementById( 'label-includes' );
        Manager.excludeLabel = document.getElementById( 'label-excludes' );
        
        Manager.createItems();

        /* Events for the "New User CSS" sidebar link. */
        Manager.newLink.addEventListener( 'click', function( event ) {
            if( this !== Manager.current ) {
                Manager.markCurrent( this );
                Manager.bindNewForm();
            }
        }, false );

        document.getElementById( 'label-includes' )
            .addEventListener( 'click', Manager.clickLabel, false );
        document.getElementById( 'label-excludes' )
            .addEventListener( 'click', Manager.clickLabel, false );

        /* Defaults */
        Manager.newLink.click();
    },

    getItemId: function( key ) {
        return 'item-' + key;
    },
    getListItem: function( key ) {
        return document.getElementById( Manager.getItemId( key ) );
    },

    reloadStyles: function(){
        safari.self.tab.dispatchMessage('reloadStyles');
    },

    setTitle: function(title){
        document.getElementById('title').textContent = title;
    },

    setDomainsLabelState: function( includes, excludes ) {
        Manager.showLabel( Manager.includeLabel );
        ( excludes ? Manager.showLabel : Manager.hideLabel )( Manager.excludeLabel );
    },

    createItem: function( key, data ) {
        var item = document.createElement( 'a' ),
            delete_link = document.createElement( 'span' );
        
        item.id = Manager.getItemId( key );
        
        item.className = 'selector' + ( data.enabled ? '' : ' disabled' );
        item.href = '#' + key;
        item.textContent = data.name;
        item.addEventListener( 'click', function( e ) {
            if( this !== Manager.current ) {
                var key = this.hash.substr( 1 );
                Manager.markCurrent( this );
                Manager.getItem( key );
            }
        } );
        
        delete_link.className = 'delete';
        delete_link.addEventListener( 'click', function( e ) {
            var element = this.parentNode,
                key = element.hash.substr( 1 );
            
            if( element === Manager.current ) {
                (
                    element.nextElementSibling ||
                    element.previousElementSibling ||
                    Manager.newLink
                ).click();
            }
            
            Manager.list.removeChild( element );
            Manager.removeItem( key );
            Manager.reloadStyles();
            e.stopPropagation();
        } );
        
        item.appendChild( delete_link );
        Manager.list.appendChild( item );
        return item;
    },

    markCurrent: function( element ) {
        if( element !== Manager.current ) {
            Manager.current && Manager.current.classList.remove( 'current' );
            element.classList.add( 'current' );
            Manager.current = element;
        }
    },

    constructDataFromForm: function( data ) {
        var includes = Manager.form.domains.value,
            excludes = Manager.form.excludes.value;
        data.name = Manager.form.name.value;
        data.enabled = Manager.form.enabled.checked;
        data.domains = includes.length ? includes.split( '\n' ) : [];
        data.excludes = excludes.length ? excludes.split( '\n' ) : [];
        data.styles = Manager.form.styles.value;
        data.script = Manager.form.script.value;
        data.onload = Manager.form.onload.checked;
        return data;
    },

    bindForm: function( data, callback ) {
        if( data.domains === undefined )  data.domains = [];
        if( data.excludes === undefined ) data.excludes = [];

        Manager.form.name.value = data.name || '';
        Manager.form.domains.value = data.domains.join( '\n' );
        Manager.form.excludes.value = data.excludes.join( '\n' );
        Manager.form.styles.value = data.styles || '';
        Manager.form.script.value = data.script || '';
        Manager.form.onload.checked = data.onload;
        Manager.form.enabled.checked = data.enabled;

        /* Display */
        Manager.setDomainsLabelState( data.domains.length, data.excludes.length );

        Manager.form._submitCallback && Manager.form.removeEventListener( 'submit', Manager.form._submitCallback, false ); // Cleanup
        
        Manager.form._submitCallback = function( e ) {
            callback( Manager.constructDataFromForm( data ) );
            
            // Don't refresh the page
            event.preventDefault();
            return false;
        };
        
        Manager.form.addEventListener( 'submit', Manager.form._submitCallback, false );
    },

    bindEditForm: function(key, data){
        Manager.setTitle( data.name );
        Manager.bindForm( data, function( formData ) {
            if( formData.name && ( formData.styles || formData.script ) && formData.domains ) {
                Manager.setItem( key, formData );
            
                var item = Manager.getListItem( key );
                // Always update display
                Manager.setTitle( formData.name );
                item.textContent = formData.name;
                
                if( formData.enabled ) {
                    item.classList.remove( 'disabled' );
                }
                else {
                    item.classList.add( 'disabled' );
                }
                
                Manager.reloadStyles();
            }
        });
    },

    bindNewForm: function() {
        Manager.setTitle( 'New Injection' );
        Manager.bindForm( { domains: [], excludes: [] }, function( formData ) {
            var key = Date.now();
            if( formData.name && ( formData.styles || formData.script ) && formData.domains ) {
                Manager.setItem( key, formData );

                var item = Manager.createItem( key, formData );
                item.click();
                
                if( !formData.enabled ) {
                    item.classList.add('disabled');
                }
                
                Manager.reloadStyles();
            }
        });
    }

};

function handleMessage( event ) {
    switch( event.name ) {
    case 'items':
        event.message.forEach( function( item ) {
            Manager.createItem( item.key, item.data );
        } );
        break;
    case 'getItem':
        Manager.bindEditForm( event.message[0], event.message[1] );
        break;
    }
}

safari.self.addEventListener( 'message', handleMessage, false );
window.addEventListener( 'DOMContentLoaded', Manager.start, false );
