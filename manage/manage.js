var Manager = {
    hideLabel: function(label) {
        label.classList.remove('expanded');
        label.classList.add('hidden');
        label.nextElementSibling.style.display = 'none';
    },
    showLabel: function(label) {
        label.classList.remove('hidden');
        label.classList.add('expanded');
        label.nextElementSibling.style.removeProperty('display');
    },
    clickLabel: function() {
        if( this.classList.contains('expanded') ) {
            Manager.hideLabel(this);
        }
        else {
            Manager.showLabel(this);
        }
    },

    // Style storage
    createItems: function(){
        safari.self.tab.dispatchMessage('items');
    },

    removeItem: function(key){
        safari.self.tab.dispatchMessage('removeItem', key);
    },

    getItem: function(key){
        safari.self.tab.dispatchMessage('getItem', key);
    },

    setItem: function(key, values){
        safari.self.tab.dispatchMessage('setItem', [key, values]);
    },

    // Convert to 'global' storage.
    makeGlobal: function(){
        safari.self.tab.dispatchMessage('shouldConvert');
    },

    // Manager application
    start: function(){
        const newLink = document.getElementById('new'),
              form = document.getElementById('form');
        Manager.makeGlobal();
        Manager.createItems();

        /* Events for the "New User CSS" sidebar link. */
        newLink.addEventListener('click', function(event){
            Manager.markCurrent(this);
            Manager.bindNewForm();
        }, false);

        document.getElementById('label-includes').addEventListener( 'click', Manager.clickLabel, false );
        document.getElementById('label-excludes').addEventListener( 'click', Manager.clickLabel, false );

        /* Defaults */
        newLink.click();
    },

    $n: function(key) { return 'item-'+key; },
    $p: function(key) { return document.getElementById(Manager.$n(key)); },
    $a: function(key) { return Manager.$p(key).getElementsByTagName('a')[0]; },

    reloadStyles: function(){
        safari.self.tab.dispatchMessage('reloadStyles');
    },

    setTitle: function(title){
        document.getElementById('title').textContent = title;
    },

    setDomainsLabelState: function(includes, excludes){
        const includeLabel = document.getElementById('label-includes'),
              excludeLabel = document.getElementById('label-excludes');
        (includes ? Manager.showLabel : Manager.hideLabel)(includeLabel);
        (excludes ? Manager.showLabel : Manager.hideLabel)(excludeLabel);
    },

    createItem: function(key, data){
        const list = document.getElementById('list');
        var item = document.createElement('li'),
            link = document.createElement('a'),
            delete_link = document.createElement('a');
        
        item.id = Manager.$n(key);
        
        link.className = 'selector' + (data.enabled ? '' : ' disabled');
        link.href = '#' + key;
        link.textContent = data.name;
        link.addEventListener( 'click', function(e) {
            var key = this.hash.substr(1);
            Manager.markCurrent(this);
            Manager.getItem(key);
        } );
        
        delete_link.className = 'delete';
        delete_link.href = '#delete' + key;
        delete_link.addEventListener( 'click', function(e) {
            var key = this.hash.substr(7),
                element = Manager.$p(key);
            
            if (Manager.$a(key).hasClass('current')) {
                var prev = element.getPrevious(),
                    next = element.getNext(),
                    target = document.getElementById('new');
                if (next) {
                    target = next.getElementsByTagName('a')[0];
                } else if (prev) {
                    target = prev.getElementsByTagName('a')[0];
                }
                target.click();
            }
            element.destroy();
            Manager.removeItem(key);
            Manager.reloadStyles();
        } );
        
        item.appendChild(link);
        item.appendChild(delete_link);
        list.appendChild(item);
        return item;
    },

    markCurrent: function(element){
        var current = document.getElementsByClassName('current')[0];
        current && current.classList.remove('current');
        if (typeof element === 'string')
            element = Manager.$a(element);
        element.classList.add('current');
    },

    constructDataFromForm: function(data, form){
        data.name = form.name.value;
        data.enabled = form.enabled.checked;
        data.domains = form.domains.value.split('\n');
        data.excludes = form.excludes.value.split('\n');
        data.styles = form.styles.value;
        data.script = form.script.value;
        data.onload = form.onload.checked;
        return data;
    },

    bindForm: function(data, fn){
        const form = document.getElementById('form');
        if (data.domains === undefined)  data.domains = [];
        if (data.excludes === undefined) data.excludes = [];

        form.name.value = data.name || '';
        form.domains.value = data.domains.join('\n');
        form.excludes.value = data.excludes.join('\n');
        form.styles.value = data.styles;
        form.script.value = data.script;
        form.onload.checked = data.onload;
        form.enabled.checked = data.enabled;

        form.domains.value = data.domains.join('\n');
        form.excludes.value = data.excludes.join('\n');
        form.styles.value = data.styles === undefined ? null : data.styles;
        form.script.value = data.script === undefined ? null : data.script;

        /* Display */
        Manager.setDomainsLabelState(data.domains.length, data.excludes.length);

        form.__submitFn && form.removeEventListener('submit', form.__submitFn, false); // Cleanup
        if (fn) {
            form.__submitFn = function(event){
                var formData = Manager.constructDataFromForm(data, this);
                fn(formData);
                
                // Don't refresh the page
                event.preventDefault();
                return false;
            };
            form.addEventListener('submit', form.__submitFn, false);
        }
    },

    bindEditForm: function(key, data){
        Manager.setTitle(data.name);
        Manager.bindForm(data, function(formData){
            Manager.setItem(key, formData);
            Manager.reloadStyles();
            // Always update display
            var name = formData.name,
                element = Manager.$a(key);
            if (this.name.value)
                name = this.name.value;
            Manager.setTitle(name);
            element.textContent = name;
            element.classList.remove('disabled');
            if (!formData.enabled)
                element.classList.add('disabled');
        });
    },

    bindNewForm: function(){
        Manager.setTitle('New Injection');
        Manager.bindForm({}, function(formData){
            var key = new Date().getTime();
            if ((formData.styles || formData.script) && formData.domains) {
                Manager.setItem(key, formData);
                if (!formData.name)
                    formData.name = key;
                var item = Manager.createItem(key, formData);
                item.getElementsByTagName('a')[0].click();
                Manager.reloadStyles();
                if (!formData.enabled)
                    item.classList.add('disabled');
            }
        });
    }

};

function handleMessage(event) {
    switch (event.name) {
    case 'items':
        event.message.forEach(function(item){
            Manager.createItem(item.key, item.data);
        });
        break;
    case 'getItem':
        Manager.bindEditForm(event.message[0], event.message[1]);
        break;
    case 'shouldConvert':
        if (!localStorage.getItem('converterWasRun')) {
            styleStorage.each(function(key, data){
                Manager.setItem(key, data);
            });
            localStorage.setItem('converterWasRun', 1);
            Manager.reloadStyles();
            document.location = document.location;
        }
        break;
    }
}

safari.self.addEventListener("message", handleMessage, false);
window.addEventListener('DOMContentLoaded', function(){ Manager.start(); }, false);
