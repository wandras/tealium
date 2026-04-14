/**
 * Creates a proxy for the GTM dataLayer global array to listen for its changes
 * and to add dependent functionalities via the GtmProxy:dataLayerChange() method.
 * 
 * The dataLayer is lazily redefined to avoid overwriting, but its reference is
 * then replaced with the proxy itself, removing access to the original dataLayer array.
 * 
 * The proxy is transparent and can be modified later, while preserving
 * its functionality to listen to every edit and trigger necessary actions.
 * 
 * A JavaScript singleton class is used to ensure consistency by controlling a single instance.
 * The class is then referenced in the window.wa namespace using short-circuit evaluation
 * to prevent reloading the class (and thus preserving its static properties) in subsequent runs.
 */


wa.GtmProxy = wa.GtmProxy || class GtmProxy {
    static instance;
    #logStyle;
    
    constructor() {
        // single instance:
        if (GtmProxy.instance) {
            return GtmProxy.instance;
        }
        
        GtmProxy.instance = this;
        
        this.massiveImport = false; // if true, all GTM dataLayer values will be massively imported into Tealium utag_data
        
		// reinitialize data layers
        window.utag_data = window.utag_data || {};
        window.dataLayer = window.dataLayer || [];
        
        var self = this; // local reference to the instance for scope injection purpose
        
        // create a proxy of the dataLayer array and map it over the dataLayer variable itself:
        window.dataLayer = new Proxy(window.dataLayer, {
            set(target, prop, value, receiver) {
                return self.#dataLayerChange(target, prop, value, receiver);
            }
        });
        
        this.#setLogStyle();
    }
    #dataLayerChange(target, prop, value, receiver) {
        // arrays trigger this handler twice, one for the edited prop, one for the length prop; avoid ONLY the latter:
    	if (prop !== 'length') { 
    	    // target is the original proxied data layer, set the value received:
    		target[prop] = value;
    		
    		//console.log("%cGTM_PROXY: Setting %s to %o", this.#logStyle, prop, value);
    		
    		// uniform data received within the dataLayer push:
    		var data = this.formatData(value);
    		
		    if (data !== null) {
		        // data is valid, it can be migrated:
		        this.migrateCallback(data);
		    }
    	}
    	
    	// the handler must return true if the value was written successfully, false otherwise:
    	return true;
    }
    formatData(value) {
        var data = null; // the data to be migrated, will be turned to an object literal in case of success
        
        try {
		    // manage possible formats of data pushed into GTM
    		if (typeof value === 'object') {
    		    // default format (object literal)
    		    data = value;
    		} else if (Array.isArray(value)) {
                // array handling
                data = {};
                value.forEach((pair) => {
                    if (Array.isArray(pair) && pair.length === 2) {
                        data[pair[0]] = pair[1];
                    }
                });
            } else if (Object.prototype.toString.call(value) === '[object Arguments]') {
                // argument handling
                data = {};
                if (value[0] === 'event') {
                    data.event = value[1]; // event name
                    // if present, add the data available (and possible data event object received in the third index)
                    if (typeof value[2] === 'object') {
                        data = { ...data, ...value[2] };
                    }
                }
    		} else if (typeof value === 'function') {
    		    // functions not handled
    		    //console.log("%cGTM_PROXY: ignored data pushed as function", this.#logStyle);
    		}
    		
    		return data;
        } catch(error) {
            // utag.DB not yet available at the current scope:
            console.log('%cGtmProxy.formatData() error', this.#logStyle, error);
        }
    }
    migrateCallback(entry) {
        // detect any event and send it to the gtmEventAdapter handler
        if (typeof entry?.event === 'string') {
            console.log('GTM event "' + entry.event + '" received');
            
            utag_data.gtm_event_name = entry.event;
            wa.gtmEventAdapter.trackEvent(entry.event, entry);
            
            var event = new CustomEvent(entry.event, { detail: entry });
            document.dispatchEvent(event);
		}
		
		for (let prop in entry) {
	        // as an example, prop and data are similar to the following key-value pairs, e.g. { event: 'gtm.click', target: 'CTA button' }
		   try {
				if (this.massiveImport === true) {
    				// perform a massive import from gtm dataLayer into utag_data:
				    utag_data[prop] = entry[prop];
				}
            } catch(error) {
                // utag.DB not yet available at the current scope:
                console.log('%cGtmProxy.migrateCallback() error', this.#logStyle, error);
            }
        }
    }
    #setLogStyle() {
        this.#logStyle = "color: #09a";
    }
}

