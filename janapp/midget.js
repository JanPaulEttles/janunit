'use strict';

var sizeof = require( 'js-sizeof' );

var midget = function() {
    var self = this;
    self._cache = {};
    self._timeouts = {};
    self._hits = 0;
    self._misses = 0;
    self._size = 0;

    return self;
};

midget.prototype = {
    get size() {
        return this._size;
    },
    get memsize() {
        return sizeof( this._cache );
    },
    get hits() {
        return this._hits;
    },
    get keys() {
      var keys = [];
      for(var k in this._cache) {
          keys.push(k);
      }
      return keys;
    },
    get misses() {
        return this._misses;
    }
};

midget.prototype.put = function( key, value, time ) {
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

midget.prototype.del = function( key ) {
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

midget.prototype.clear = function() {
    var self = this;

    for ( var key in self._timeouts ) {
        clearTimeout( self._timeouts[ key ] );
    }

    self._cache = {};
    self._timeouts = {};
    self._size = 0;
};

midget.prototype.get = function( key ) {
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

module.exports = midget;
