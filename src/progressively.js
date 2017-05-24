/*!
* progressively 1.1.3
* https://github.com/thinker3197/progressively
* @license MIT licensed
*
* Copyright (C) 2016-17 Ashish
*/

;
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return factory(root);
		});
	} else if (typeof exports === 'object') {
		module.exports = factory;
	} else {
		root.progressively = factory(root);
	}
})(this, function(root) {
	'use strict'

	var progressively = {};

	var defaults, poll, onLoad, inodes, sminodes;

	onLoad = function () {};

	function extend(primaryObject, secondaryObject) {
		var o = {};
		for (var prop in primaryObject) {
			o[prop] = secondaryObject.hasOwnProperty(prop) ? secondaryObject[prop] : primaryObject[prop];
		}
		return o;
	}

	function isHidden(el) {
		return (el.offsetParent === null);
	}

	function inView(el) {
		if (isHidden(el)) {
			return false;
		}

		var box = el.getBoundingClientRect();
		var top = box.top;
		var height = box.height;

		el = el.parentNode;

		do {
			box = el.getBoundingClientRect();

			if (top <= box.bottom === false) {
				return false;
			}
			if ((top + height) <= box.top) {
				return false;
			}

			el = el.parentNode;
		} while (el !== document.body);

		return top <= document.documentElement.clientHeight;
	}

	function loadImage(el, defaults) {
		setTimeout(function () {
			var img = new Image();

			img.onload = function () {
				el.classList.remove('progressive--not-loaded');
				el.classList.add('progressive--is-loaded');
				el.src = this.src;

				onLoad(el);
			};

			// Load minified version, if viewport-width is smaller than defaults.smBreakpoint:
			if(getClientWidth() < defaults.smBreakpoint && el.getAttribute('data-progressive-sm')){
				el.classList.add('progressive--loaded-sm');
				img.src = el.getAttribute('data-progressive-sm');
				return false;
			}

			el.classList.remove('progressive--loaded-sm');
			img.src = el.getAttribute('data-progressive');
			return true;

		}, defaults.delay);
	}

	function getClientWidth(){
		return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	}

	function listen () {
		if (poll) {
			return;
		}
		clearTimeout(poll);
		poll = setTimeout(function () {
			progressively.check();
			progressively.render();
			poll = null;
		}, defaults.throttle);
	}

    /*
    * default settings
    */
    defaults = {
    	throttle: 300, // appropriate value, don't change unless intended
    	delay: 100,
    	onLoadComplete: function () {},
    	onLoad: function () {},
    	smBreakpoint: 600
    };

    progressively.init = function (options) {
    	options = options || {};

    	defaults = extend(defaults, options);

    	onLoad = defaults.onLoad || onLoad;

    	inodes = [].slice.call(document.querySelectorAll('.progressive__img'));
    	sminodes = [];

    	progressively.render();

    	if (document.addEventListener) {
    		root.addEventListener('scroll', listen, false);
    		root.addEventListener('resize', listen, false);
    		root.addEventListener('load', listen, false);
    	} else {
    		root.attachEvent('onscroll', listen);
    		root.attachEvent('onresize', listen);
    		root.attachEvent('onload', listen);
    	}
    };

    progressively.render = function() {
    	var elem;

    	for (var i = inodes.length - 1; i >= 0; --i) {
    		elem = inodes[i];

    		if (inView(elem) && (elem.classList.contains('progressive--not-loaded') || elem.classList.contains('progressive--loaded-sm'))) {
    			if(!loadImage(elem, defaults)){
    				// Returns false, if only minified version loaded
    				sminodes.push(elem);
    			}
    			inodes.splice(i, 1);
    		}
    	}

    	if(getClientWidth() >= defaults.smBreakpoint){
    		for (var j = sminodes.length - 1; j >= 0; --j) {
    			elem = sminodes[j];

    			if (inView(elem) && (elem.classList.contains('progressive--not-loaded') || elem.classList.contains('progressive--loaded-sm'))) {
    				loadImage(elem, defaults);
    				sminodes.splice(i, 1);
    			}
    		}
    	}

    	this.check();
    };

    progressively.check = function() {
    	if (!inodes.length && !sminodes.length) {
    		defaults.onLoadComplete();
    		this.drop();
    	}
    };

    progressively.drop = function() {
    	if (document.removeEventListener) {
    		root.removeEventListener('scroll', listen);
    		root.removeEventListener('resize', listen);
    	} else {
    		root.detachEvent('onscroll', listen);
    		root.detachEvent('onresize', listen);
    	}
    	clearTimeout(poll);
    };

    return progressively;
});
