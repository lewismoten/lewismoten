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
  var texts = items.map(function (c) { return (c.textContent + ' ' + c.dataset.tags.replace(/\|/g, ' ')).toLowerCase(); });
  var tag = '', all = false;
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
      b.parentNode.hidden = !(all || i < limit || on);
    });
    more.hidden = btns.length <= limit;
    more.setAttribute('aria-expanded', all ? 'true' : 'false');
    more.textContent = all ? 'Show fewer tags' : 'Show all tags (' + btns.length + ')';
    active.hidden = !tag;
    activeName.textContent = tag;
    clear.disabled = !tag && !q;
    out.textContent = (tag || q) ? shown + ' of ' + items.length + ' ' + noun + 's shown' + (shown ? '' : '. Try another search or clear filters.') : items.length + ' ' + noun + 's';
    // Leave unrelated anchors and query parameters intact.
    if (tag || /^#tag=/.test(location.hash)) {
      try { history.replaceState(null, '', location.pathname + location.search + (tag ? '#tag=' + encodeURIComponent(tag) : '')); } catch (e) {}
    }
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      // A selected tag outside the first twelve must stay visible when toggled off.
      if (tag === b.dataset.tag && btns.indexOf(b) >= limit) all = true;
      tag = tag === b.dataset.tag ? '' : b.dataset.tag;
      apply();
    });
  });
  more.addEventListener('click', function () { all = !all; apply(); });
  clear.addEventListener('click', function () { tag = ''; search.value = ''; apply(); search.focus(); });
  search.addEventListener('input', apply);
  function readTag() {
    var m = location.hash.match(/^#tag=(.*)$/), value = '';
    try { if (m) value = decodeURIComponent(m[1]); } catch (e) {}
    tag = btns.some(function (b) { return b.dataset.tag === value; }) ? value : '';
    apply();
  }
  window.addEventListener('hashchange', readTag);
  readTag();
  wrap.hidden = false;
})();
