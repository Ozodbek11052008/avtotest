(function () {
  'use strict';

  function block(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  document.addEventListener('contextmenu', block);
  document.addEventListener('copy', block);
  document.addEventListener('cut', block);

  document.addEventListener('keydown', function (e) {
    var key = e.key || e.keyCode;
    var ctrl = e.ctrlKey || e.metaKey;
    if (key === 'F12' || e.keyCode === 123) return block(e);
    if (ctrl && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) return block(e);
    if (ctrl && (key === 'u' || key === 'U' || e.keyCode === 85)) return block(e);
    if (ctrl && (key === 's' || key === 'S' || e.keyCode === 83)) return block(e);
    if (e.shiftKey && (key === 'F12' || e.keyCode === 123)) return block(e);
    if (e.altKey && (key === 'F12' || e.keyCode === 123)) return block(e);
    if (e.altKey && (key === 'F11' || e.keyCode === 122)) return block(e);
  });

  try {
    var style = document.createElement('style');
    style.textContent = 'body, body * { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; } input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; }';
    document.head.appendChild(style);
  } catch (err) {}

})();
