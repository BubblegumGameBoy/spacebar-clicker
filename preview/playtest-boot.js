/* Isolated playtest: no online scores, analytics or advertisements. */
window.__MYTHOS_PLAYTEST__ = true;
(() => {
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
