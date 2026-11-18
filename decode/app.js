/* The decoder page. Everything happens in this tab: no requests, no storage, nothing in the address bar. */
(function () {
  var D = window.ColdAisleDecoder;
  var input = document.getElementById("in"), out = document.getElementById("out"), sum = document.getElementById("sum");
  var copyBtn = document.getElementById("copy-all"), last = [];
  var SAMPLE = [
    "19 00 02 19 8E F6 6A 20 00 04 04 41 01 02 FF FF",
    "1A 00 02 39 8E F6 6A 20 00 04 08 65 6F 03 FF FF",
    "1B 00 02 4E 8E F6 6A 33 00 04 0C 12 6F 00 FF FF",
    "1C 00 02 AC 92 F6 6A 20 00 04 07 01 6F 01 FF FF",
    "1D 00 C1 AC 92 F6 6A 7C 2A 00 01 02 03 04 05 06",
    "   5 | 11/13/2026 | 17:08:00 | Button #0x01 | Power Button pressed | Asserted"
  ].join("\n");
  var FIELDS = [[0, 2, "Record ID"], [2, 1, "Type"], [3, 4, "Time"], [7, 2, "Generator"], [9, 1, "Rev"], [10, 1, "Sensor type"], [11, 1, "Sensor no."], [12, 1, "Dir, type"], [13, 3, "Event data"]];
  var VENDOR = [[0, 2, "Record ID"], [2, 1, "Type"], [3, 13, "Vendor data"]];
  var SVG = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function lamp(sev) {
    var id = sev === "critical" ? "l-fault" : sev === "warning" ? "l-warn" : "l-none";
    var s = document.createElementNS(SVG, "svg"); s.setAttribute("class", "lamp " + id); s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS(SVG, "use"); u.setAttribute("href", "#" + id); s.appendChild(u); return s;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function when(e) {
    if (e.timestamp === null || e.timestamp === undefined) return null;
    var d = new Date(e.timestamp * 1000);
    if (e.kind === "list") return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    return d.toISOString().slice(0, 19).replace("T", " ") + " UTC";
  }
  var WORD = { critical: "Fault", warning: "Warning", info: "Information" };

  function byteMap(e) {
    var ul = el("ul", "bytes"); ul.setAttribute("aria-label", "The 16 bytes of this record");
    (e.vendor ? VENDOR : FIELDS).forEach(function (f) {
      var li = el("li"), hex = e.bytes.slice(f[0], f[0] + f[1]).map(function (b) { return (b < 16 ? "0" : "") + b.toString(16).toUpperCase(); }).join(" ");
      li.appendChild(el("code", "", hex)); li.appendChild(el("span", "", f[2])); ul.appendChild(li);
    });
    return ul;
  }
  function card(e) {
    var a = el("article", "ev " + e.severity), h = el("div", "ev-h");
    h.appendChild(lamp(e.severity)); h.appendChild(el("h3", "", e.message));
    var t = when(e), bits = [WORD[e.severity], e.category]; if (t) bits.push(t);
    h.appendChild(el("p", "meta", bits.join(" · "))); a.appendChild(h);
    if (e.bytes) a.appendChild(byteMap(e));
    if (e.advice) {
      var dl = el("dl");
      dl.appendChild(el("dt", "eng", "Usually means")); dl.appendChild(el("dd", "", e.advice.means));
      dl.appendChild(el("dt", "eng", "Try")); dl.appendChild(el("dd", "", e.advice.tryThis));
      a.appendChild(dl);
    }
    if (e.detail) a.appendChild(el("p", "raw", e.detail));
    return a;
  }
  function asText(list) {
    return list.map(function (e) {
      var l = ["[" + WORD[e.severity] + "] " + e.message], t = when(e);
      if (t) l.push("Time: " + t);
      if (e.advice) { l.push("Usually means: " + e.advice.means); l.push("Try: " + e.advice.tryThis); }
      if (e.detail) l.push(e.detail);
      return l.join("\n");
    }).join("\n\n");
  }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function render() {
    last = D.translate(input.value);
    out.textContent = "";
    copyBtn.hidden = last.length === 0;
    if (!last.length) { sum.firstChild.textContent = "Nothing decoded yet"; out.appendChild(el("p", "empty", "Paste a line on the left, or load the sample. Results appear here.")); return; }
    var f = last.filter(function (e) { return e.severity === "critical"; }).length, w = last.filter(function (e) { return e.severity === "warning"; }).length;
    sum.firstChild.textContent = plural(last.length, "entry").replace("entrys", "entries") + ": " + plural(f, "fault") + ", " + plural(w, "warning");
    last.forEach(function (e) { out.appendChild(card(e)); });
  }
  document.getElementById("go").addEventListener("click", render);
  document.getElementById("sample").addEventListener("click", function () { input.value = SAMPLE; render(); });
  document.getElementById("clear").addEventListener("click", function () { input.value = ""; render(); input.focus(); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); render(); } });
  copyBtn.addEventListener("click", function () {
    var t = asText(last), done = function () { copyBtn.textContent = "Copied"; setTimeout(function () { copyBtn.textContent = "Copy as text"; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {}); 
  });
  render();
})();
