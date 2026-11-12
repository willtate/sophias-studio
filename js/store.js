/* Tiny IndexedDB wrapper for saving each page's colouring. Falls back to memory. */
(function () {
  'use strict';
  var DB = 'color-studio', STORE = 'art';
  var mem = {};
  var dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve) {
      try {
        var req = indexedDB.open(DB, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      if (!db) return fn(null);
      return new Promise(function (resolve) {
        try {
          var t = db.transaction(STORE, mode);
          var res = fn(t.objectStore(STORE));
          t.oncomplete = function () { resolve(res && res.result); };
          t.onerror = t.onabort = function () { resolve(undefined); };
        } catch (e) { resolve(undefined); }
      });
    });
  }

  window.ArtStore = {
    get: function (id) {
      return tx('readonly', function (s) { return s ? s.get(id) : null; })
        .then(function (v) { return v || mem[id] || null; });
    },
    put: function (id, blob) {
      mem[id] = blob;
      return tx('readwrite', function (s) { return s ? s.put(blob, id) : null; });
    },
    remove: function (id) {
      delete mem[id];
      return tx('readwrite', function (s) { return s ? s.delete(id) : null; });
    }
  };
})();
