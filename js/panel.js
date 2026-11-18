/* The front panel on the home page. Without this file the panel rests in its finished state: OS, SSH and dashboard out, BMC lit. */
(function () {
  var panel = document.getElementById("panel"), button = document.getElementById("hang"), say = document.getElementById("say");
  if (!panel || !button || !say) return;
  var lamps = panel.querySelectorAll("[data-lamp]"), down = say.textContent, timers = [], up = true;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function light() {
    timers.forEach(clearTimeout); timers = []; up = true;
    lamps.forEach(function (l) { l.classList.add("on"); });
    say.textContent = "Everything answers. For now.";
    button.textContent = "Hang the OS";
  }
  function hang() {
    timers.forEach(clearTimeout); timers = []; up = false;
    button.textContent = "Start it again";
    var step = still ? 0 : 420;
    lamps.forEach(function (l, i) {
      if (still) l.classList.remove("on");
      else timers.push(setTimeout(function () { l.classList.remove("on"); }, step * i));
    });
    if (still) say.textContent = down;
    else timers.push(setTimeout(function () { say.textContent = down; }, step * lamps.length));
  }
  light();
  button.hidden = false;
  button.addEventListener("click", function () { if (up) hang(); else light(); });
})();
