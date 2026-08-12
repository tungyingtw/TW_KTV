(function () {
  try {
    var theme = window.localStorage && window.localStorage.getItem('tw_ktv_theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch {}
})();
