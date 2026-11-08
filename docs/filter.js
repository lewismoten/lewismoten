// Projects page: filter cards by tag. Without JavaScript every project shows.
(function () {
  var wrap = document.getElementById('filter');
  var sel = document.getElementById('tagsel');
  var out = document.getElementById('filtercount');
  if (!wrap || !sel) return;
  wrap.hidden = false;
  function apply() {
    var tag = sel.value, shown = 0;
    document.querySelectorAll('.card').forEach(function (c) {
      var ok = !tag || c.dataset.tags.split('|').indexOf(tag) >= 0;
      c.hidden = !ok;
      if (ok) shown++;
    });
    document.querySelectorAll('.group').forEach(function (g) {
      g.hidden = !g.querySelector('.card:not([hidden])');
    });
    out.textContent = tag ? shown + (shown === 1 ? ' project' : ' projects') + ' tagged ' + tag : '';
    try { history.replaceState(null, '', tag ? '#tag=' + encodeURIComponent(tag) : location.pathname); } catch (e) {}
  }
  var m = location.hash.match(/^#tag=(.+)$/);
  if (m) sel.value = decodeURIComponent(m[1]);
  sel.addEventListener('change', apply);
  apply();
})();
