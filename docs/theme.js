// Theme toggle: remembers a choice in localStorage; otherwise follows the system setting.
(function () {
  var b = document.getElementById('theme');
  var root = document.documentElement;
  var system = matchMedia('(prefers-color-scheme: dark)');
  function current() {
    return root.dataset.theme || (system.matches ? 'dark' : 'light');
  }
  function label() { b.textContent = current() === 'dark' ? 'Light theme' : 'Dark theme'; }
  b.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
  system.addEventListener('change', label);
  label();
  b.hidden = false;
})();
