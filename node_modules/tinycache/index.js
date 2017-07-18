'use strict';

var sizeof = require( 'js-sizeof' );

var TinyCache = function() {
    var self = this;
    self._cache = {};
    self._timeouts = {};
    self._hits = 0;
    self._misses = 0;
    self._size = 0;

    return self;
};

TinyCache.prototype = {
    get size() {
        return this._size;
    },
    get memsize() {
        return sizeof( this._cache ); /* Returns the approximate memory usage of all objects stored in the cache and cache overhead */
    },
    get hits() {
        return this._hits;
    },
    get misses() {
        return this._misses;
    }
};

TinyCache.prototype.put = function( key, value, time ) {
    var self = this;

    if ( self._timeouts[ key ] ) {
        clearTimeout( self._timeouts[ key ] );
        delete self._timeouts[ key ];
    }

    self._cache[ key ] = value;
    
    if ( !isNaN( time ) ) {
        self._timeouts[ key ] = setTimeout( self.del.bind( self, key ), time );
    }

    ++self._size;
};

TinyCache.prototype.del = function( key ) {
    var self = this;

    clearTimeout( self._timeouts[ key ] );
    delete self._timeouts[ key ];
    
    if ( !( key in self._cache )  ) {
        return false;
    }
    
    delete self._cache[ key ];
    --self._size;
    return true;
};

TinyCache.prototype.clear = function() {
    var self = this;

    for ( var key in self._timeouts ) {
        clearTimeout( self._timeouts[ key ] );
    }

    self._cache = {};
    self._timeouts = {};
    self._size = 0;
};

TinyCache.prototype.get = function( key ) {
    var self = this;
    
    if ( typeof key === 'undefined' ) {
        return self._cache;
    }
    
    if ( !( key in self._cache ) ) {
        ++self._misses;
        return null;
    }

    ++self._hits;
    return self._cache[ key ];
};

TinyCache.shared = new TinyCache();

if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = TinyCache;
}
else if ( typeof define === 'function' && define.amd ) {
    /* global define */
    define( [], function() {
        return TinyCache;
    } );
}
else {
    /* global window */
    window.TinyCache = TinyCache;
}