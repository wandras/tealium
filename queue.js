/**
 * At Utag Sync scope, a temporary queue window.wa.queue is created to store callbacks while utag library is not loaded yet;
 * The controller must start the queue manager, to allow flushing when utag library is laoded.
 * 
 * In a mixed synchronous and SPA context, all manually invoked callbacks (utag.view(), utag.link(), utag.track())
 * Must receive a data layer with IS_SUBREQUEST property set to true, to avoid unwanted loops.
 * 
 * Tealium suggests to create and manage this queue: https://docs.tealium.com/platforms/javascript/single-page-applications/
*/

// Global object used as Web Analytics Namespace, defined later:
window.wa = window.wa || {};

wa.Queue = wa.Queue || class Queue {
    constructor() {
        this._queue = [];
        this.pollingFrequency = 100; // polling frequency in milliseconds
        this.maxPolls = 200; // max number of attempts to check for utag
        this.currentPoll = 0; // incremented at any attempt
        this.timer = null; // reference to the setTimeout timer
        
        window.wa = window.wa || {};
        window.wa.style = window.wa.style || {};
        
        window.wa.style = {
            ...window.wa.style,
            tracking: 'color: #d07',
            error: 'color: #ed2',
            highlight: 'color: #2b2',
            correct: 'color: #0b5'
        };
    }
    push(item) {
        // Receive arguments to push into the queue
        this._queue.push(item);
    }
    checkUtag() {
        // Check if Utag library is loaded and its methods available:
        if (!window.utag || typeof window.utag.view !== "function" || typeof window.utag.link !== "function") {
            return false;
        }
        return true;
    }
    runWhenReady() {
        // Enable the queue flush, which starts when the Utag library is loaded
        if (this.timer !== null) {
            return;
        }
        
        this.timer = window.setTimeout(() => {
            this.currentPoll++;
            this.timer = null;
            
            if (this.currentPoll === this.maxPolls) {
                console.warn('Queue: utag not available after max polls, giving up.');
                return;
            }
            
            if (this.checkUtag()) {
                let callbackNum = this._queue.length;
                
                if (callbackNum > 0) {
                    console.log('Queue: flushing on schedule #' + this.currentPoll + ' for ' + callbackNum + ' callbacks');
                    this.flush();
                }
                
                // Stop polling:
                return;
                
            } else {
                this.runWhenReady();
            }
        }, this.pollingFrequency);
    }
    flush() {
        while (Array.isArray(this._queue) && this._queue.length > 0) {
            
            // Flush the queued callbacks:
            const callbackItem = this._queue.shift();
            
            if (!Array.isArray(callbackItem)) continue;
            
            const [method, ...args] = callbackItem;
            const callback = window.utag?.[method];
            
            if (typeof callback === 'function') {
                try {
                    if (method === 'view' || method === 'link') {
                        
                        const originalDataLayer = args[0] || {};
                        
                        // Make a shallow copy of the data layer and mark the callback as subthread:
                        const dataLayer = { ...originalDataLayer, IS_SUBREQUEST: true };
                        
                        // Simplified logging:
                        wa.utils.logCleanDataLayer(dataLayer);
                        
                        // Track view or link:
                        callback.apply(window.utag, [dataLayer, ...args.slice(1)]);
                        
                    } else {
                        // Other utag methods:
                        callback.apply(window.utag, args);
                    }
                } catch(error) {
                    console.warn('Queue: callback execution error:\n', error, '\nData layer:\n' + window?.utag_data);
                }
            }
        }
    }
    createWrappers() {
        // Create utag_view() and utag_link() wrappers of utag.view() and utag.link()
        var self = this;
        
        window.utag_view = function(...args) {
            if (typeof window?.utag?.view === 'function') {
                console.log('%cTracking "view"', window.wa.style.tracking, ...args);
                utag.view.call(utag, ...args);
            } else {
                self.push(['view', ...args]);
                console.log('%cQueue: pushed callback "view"', window.wa.style.correct, ...args);
            }
        }
        
        window.utag_link = function(...args) {
            if (typeof window?.utag?.link === 'function') {
                console.log('%cTracking "link"', window.wa.style.tracking, ...args);
                utag.link.call(utag, ...args);
            } else {
                self.push(['link', ...args]);
                console.log('%cQueue: pushed callback "link"', window.wa.style.correct, ...args);
            }
        }
        
        console.log('Queue: global callback wrappers created');
    }
}


