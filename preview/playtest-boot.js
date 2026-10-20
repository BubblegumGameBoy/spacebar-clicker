/* Isolated playtest: no online scores, analytics or advertisements. */
window.__MYTHOS_PLAYTEST__ = true;
(() => {
  if (new URLSearchParams(location.search).has('lab')) {
    // Only this iframe's Storage prototype is changed. Ordinary play saves stay separate.
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      const native = Storage.prototype[method];
      Storage.prototype[method] = function (key, ...args) {
        return native.call(this, 'mythos_lab:' + key, ...args);
      };
    }
  }
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, options) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin !== location.origin) {
      return Promise.resolve(new Response(JSON.stringify({error: 'playtest_offline'}), {
        status: 503, headers: {'Content-Type': 'application/json'}
      }));
    }
    return nativeFetch(input, options);
  };
})();
