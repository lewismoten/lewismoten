// Theme toggle: remembers a choice in localStorage; otherwise follows the system setting.
(function () {
  var b = document.getElementById('theme');
  var root = document.documentElement;
  function current() {
    return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function label() { b.textContent = current() === 'dark' ? 'Light theme' : 'Dark theme'; }
  b.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
  label();
})();
