/**
 * 
 */ 
var WMNSAPI = {
    /**
     * Global callback function
     * @ignore
     */
    hook_callback: null,
    /**
     * Extract domain name from Url
     * @ignore
     * @param {String} Url 
     * @return {String} domain name
     */
    __domain: function(Url) {return Url.replace(/^https?:\/\/(www\.|)([^\/]+)\/?.*$/mg, "$2").toLowerCase();},
    /**
     * Is known social network?
     * @ignore
     * @param {String} str 
     * @return {Bool}
     */
    __is_social: function(str) {
	return /:\/\/[^\/]*(twitter|facebook|linkedin|vk\.com|odnoklassniki)/ig.exec(str);
    },
    /**
     * Is search engine?
     * @ignore
     * @param {String} str 
     * @return {Bool}
     */
    __is_organic: function(str) {
	return /:\/\/(?:www\.)?(google|yandex|mail\.ru|search\.tut\.by|rambler|bing|yahoo)(?:\.(\w+))?/ig.exec(str);
    },
    /**
     * Write cookie JSON
     * @ignore
     * @param {String} name 
     * @param {Object} value
     */
    __writeCookieJSON: function(name,value){
        document.cookie=name+ "=" +encodeURIComponent(JSON.stringify(value))+';path=/;';
    },
    /**
     * Read cookie JSON
     * @ignore
     * @param {String} name 
     * @return {Object}|null
     */
    __readCookieJSON: function(name) {
        if (document.cookie.length>0) {
            c_start=document.cookie.indexOf(name + "=");
            if (c_start!=-1) { 
                c_start=c_start + name.length+1; 
                c_end=document.cookie.indexOf(";",c_start);
                if (c_end==-1) c_end=document.cookie.length;
                return JSON.parse(decodeURIComponent(document.cookie.substring(c_start,c_end)));
            }
        }
        return null;
    },
    /**
     * Detect the visitor's referring source, medium etc.
     * @ignore
     */
    __detect: function() {
	if((args = this.__readCookieJSON('WMNSAPI')) !== null) return args;
	if((args = this.__utmz()) === null) {
	    var Location = document.URL;
	    var Referrer = document.referrer;
	    var args = {
		source: null,
		medium: null,
		term: null,
		content: null,
		campaign: null,
		gclid: null
	    };
	    if(Referrer === "" || this.__domain(Location) === this.__domain(Referrer)) {
		args.source = "(direct)";
		args.medium = "(none)";
		if((tag = Location.match(/utm_source=([^&]*)/i)) && tag !== null){
		    args.source = decodeURIComponent(tag[1]).toLowerCase();
		    tag = Location.match(/utm_medium=([^&]+)/i); args.medium = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		    tag = Location.match(/utm_campaign=([^&]+)/i); args.campaign = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		    tag = Location.match(/utm_term=([^&]+)/i); args.term = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		    tag = Location.match(/utm_content=([^&]+)/i); args.content = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		}
	    }
	    else if(Referrer !== ""){
		if ((match = this.__is_organic(Referrer)) && match !== null) {  
		    args.source = match[1].toLowerCase().replace(/\./g, "");
		    args.medium = "organic";
		    if(args.medium === 'google') {
			if ((match = Location.match(/gclid=(.*?)(?:&|$)/i)) !== null) {
			    args.gclid = match[1]; args.source = 'google'; args.medium = 'cpc';
			}
		    }
		}
		else if ((match = this.__is_social(Referrer)) && match != null) {  
		    args.medium = "social";
		    args.source = match[1].toLowerCase();
		}
		if((tag = Location.match(/utm_source=([^&]*)/i)) && tag != null){
		    args.source = decodeURIComponent(tag[1]).toLowerCase();
		    tag = Location.match(/utm_medium=([^&]+)/i); args.medium = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		    tag = Location.match(/utm_campaign=([^&]+)/i); args.campaign = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		    tag = Location.match(/utm_term=([^&]+)/i); args.term = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		    tag = Location.match(/utm_content=([^&]+)/i); args.content = (tag !== null?decodeURIComponent(tag[1]).toLowerCase():'');
		}
		else if(args.source === "") {
		    args.medium = "referrer";
		    args.source = Referrer.replace(/.*?:\/\/(?:www\.)?([^\/]+)(?:\/([^?&;]*))?.*/ig, "$1").toLowerCase();
		}
	    }
	}
	this.__writeCookieJSON('WMNSAPI',args);
        return args;
    },
    /**
     * Extract source, medium etc, from Google Analytics cookies.
     * @ignore
     */
    __utmz: function() {
	var utmz = {
	    source: null,
	    medium: null,
	    term: null,
	    content: null,
	    campaign: null,
	    gclid: null
	};
	var match = this.cookie().match(/__utmz\s*=\s*(.+?)(?:;|$)/);
	if (match !== null) {
	    var utmz_re = /(utm\w+)=(.*?)(?:\||$)/g;
	    var part = utmz_re.exec(match[1]);
	    while (part !== null) {
		if(part[1]==='utmcsr') {utmz.source = part[2].toLowerCase();} else
		if(part[1]==='utmcmd') {utmz.medium = part[2].toLowerCase();} else
		if(part[1]==='utmctr') {utmz.term = part[2];} else
		if(part[1]==='utmcct') {utmz.content = part[2];} else
		if(part[1]==='utmccn') {utmz.campaign = part[2];} else
		if(part[1]==='utmgclid') {
		    utmz.gclid = part[2]; utmz.source = 'google'; utmz.medium = 'cpc';
		}
		part = utmz_re.exec(match[1]);
	    }
	    return utmz;
	}
	return null;
    },
    cookie: function(){
	return document.cookie;
    },
    /**
     * Track visitor's source and replace phone numbers
     * @param {Array} trackers Array oj objects in follow format 
     * [
     *  {medium: 'organic',source:'yandex',phone1: '<insert phone number 1 here>',phone2: '<insert phone number 2 here>'},
     *  {medium: 'organic',source:'google',phone1: '<insert phone number 3 here>',phone2: '<insert phone number 4 here>'}
     * ]
     * @param {Function} callback function called if found  tracker in trackers array. 
     */
    track: function(trackers,callback) {
	var utmz = this.__detect();
        var customTracker = null;
	for(i=0;i < trackers.length;i++) {
	    var tracker = trackers[i];
	    if(tracker.medium !== undefined && tracker.medium.toLowerCase() === utmz.medium) {
		if(tracker.source === undefined || tracker.source.toLowerCase() === utmz.source) {
		    if(typeof this.hook_callback === 'function') {
			this.hook_callback.call(this,tracker,utmz); 
		    }
		    else if(typeof callback === 'function') {
			callback.call(this,tracker,utmz); 
		    }
		    return;
		}
	    }
            if(tracker.medium === 'custom') {
                customTracker = tracker;
            }
	}
        if(customTracker !== null) {
            if(typeof customTracker.do === 'function') {
                this.customTracker.do.call(this,customTracker,utmz); 
            }
            else if(typeof this.hook_callback === 'function') {
                this.hook_callback.call(this,customTracker,utmz); 
            }
            else if(typeof callback === 'function') {
                callback.call(this,customTracker,utmz); 
            }
        }
    },
    /**
     * Helper function, format phone number with specific format
     * @param {String} tpl
     * @param {String} phone
     * @returns {String}
     */
    format: function(tpl,phone) {
	var rePattern = /\{\{(\d+):(\d+)\}\}/;
	var result = tpl;
	while (match = rePattern.exec(result)) {
	    result = result.replace(match[0], phone.substring(parseInt(match[1]),parseInt(match[1])+parseInt(match[2])));
	}
	return result;
    },
    element: function(selector) {
	if(selector[0]==='#') {
	    el = document.getElementById(selector.substring(1));
	}
	else if(selector[0]==='.') {
	    el = document.getElementsByClassName(selector.substring(1));
	    el.length && (el = el[0]);
	}
	else {
	    el = document.querySelector(selector);
	}
	return el;
    },
    html: function(selector,code) {
	var el = this.element(selector);
	(el !== null) && (el.innerHTML = code);
    },
    display: function(selector,show) {
	var el = this.element(selector);
	(el !== null) && (el.style.display = (show ? '' : 'none'));
    },
    visible: function(selector,show) {
	var el = this.element(selector);
	(el !== null) && (el.style.visibility = (show ? 'visible' : 'hidden'));
    },
    hook: function (callback) {
	this.hook_callback = callback;
    }
};