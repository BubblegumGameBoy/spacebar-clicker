/* Isolated playtest: no online scores, analytics or advertisements. */
window.__MYTHOS_PLAYTEST__ = true;
(() => {
  const params = new URLSearchParams(location.search);
  const profile = params.get('slot');
  const profilePrefix = profile && /^[a-z0-9-]{1,40}$/.test(profile) ? 'mythos_slot_' + profile + ':' : '';
  const namespace = profilePrefix || (params.has('lab') ? 'mythos_lab:' : params.get('lesson') === '1' ? 'mythos_lesson:' : params.get('lesson') === '2' ? 'mythos_lesson_2:' : '');
  if (namespace) {
    // A separate practice slot preserves existing play and laboratory saves.
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      const native = Storage.prototype[method];
      Storage.prototype[method] = function (key, ...args) {
        return native.call(this, namespace + key, ...args);
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
