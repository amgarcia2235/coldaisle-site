/* Copy buttons and the print button. The page reads and prints the same without this file. */
(function () {
  function fallback(text) {
    var t = document.createElement("textarea");
    t.value = text; t.setAttribute("readonly", ""); t.className = "vh";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(t);
  }
  document.querySelectorAll(".copy").forEach(function (b) {
    b.hidden = false;
    b.addEventListener("click", function () {
      var text = b.parentNode.querySelector("pre").textContent;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
      else { fallback(text); done(); }
    });
  });
  var p = document.getElementById("print");
  if (p) { p.hidden = false; p.addEventListener("click", function () { window.print(); }); }
})();
