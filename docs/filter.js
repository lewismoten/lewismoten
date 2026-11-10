// Projects and Archive: a tag cloud, a search box and a count. Without JavaScript every item shows.
// The chosen tag stays in the address as #tag=name.
(function () {
  var wrap = document.getElementById('filter');
  if (!wrap) return;
  var noun = wrap.dataset.noun, limit = +wrap.dataset.shown;
  var search = document.getElementById('fsearch'), out = document.getElementById('filtercount');
  var more = document.getElementById('tagmore'), clear = document.getElementById('tagclear');
  var active = document.getElementById('activetag'), activeName = document.getElementById('activename');
  var btns = Array.prototype.slice.call(document.querySelectorAll('.tagbtn'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.card, .arow'));
  var texts = items.map(function (c) { return c.textContent.toLowerCase(); });
  var tag = '', all = false;
  wrap.hidden = false;
  function apply() {
    var q = search.value.trim().toLowerCase(), shown = 0;
    items.forEach(function (c, i) {
      var ok = (!tag || c.dataset.tags.split('|').indexOf(tag) >= 0) && (!q || texts[i].indexOf(q) >= 0);
      c.hidden = !ok;
      if (ok) shown++;
    });
    document.querySelectorAll('.group').forEach(function (g) { g.hidden = !g.querySelector('.card:not([hidden]), .arow:not([hidden])'); });
    btns.forEach(function (b, i) {
      var t = b.dataset.tag, on = t === tag;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.parentNode.hidden = q ? t.toLowerCase().indexOf(q) < 0 && !on : !(all || i < limit || on);
    });
    more.hidden = !!q;
    more.setAttribute('aria-expanded', all ? 'true' : 'false');
    more.textContent = all ? 'Show fewer tags' : 'Show all tags (' + btns.length + ')';
    active.hidden = !tag;
    activeName.textContent = tag;
    out.textContent = (tag || q) ? shown + ' of ' + items.length + ' ' + noun + 's shown' : items.length + ' ' + noun + 's';
    try { history.replaceState(null, '', tag ? '#tag=' + encodeURIComponent(tag) : location.pathname); } catch (e) {}
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { tag = tag === b.dataset.tag ? '' : b.dataset.tag; apply(); });
  });
  more.addEventListener('click', function () { all = !all; apply(); });
  clear.addEventListener('click', function () { tag = ''; apply(); search.focus(); });
  search.addEventListener('input', apply);
  var m = location.hash.match(/^#tag=(.+)$/);
  if (m) tag = decodeURIComponent(m[1]);
  apply();
})();
