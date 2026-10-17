/* Joyce Kiesel — portfolio
   Sections: utils · work strip (infinite + parallax + drag) · index & filters · hover stickers ·
   index thumbnails · type reveal · J drawing · Casa do Povo letters · Nossa Chance glitter · cursor · copy e-mail */
(function () {
  'use strict';
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- work strip: native horizontal scroll, infinite loop, parallax on page scroll ---------- */
  var section = $('#work'), stage = $('.stage', section), track = $('#track'), count = $('#count');
  var originals = $$('.proj', track);
  // two clones (before/after) make the loop seamless; clones lose ids so anchors stay unique
  function makeClone() {
    var frag = document.createDocumentFragment();
    originals.forEach(function (p) {
      var c = p.cloneNode(true);
      c.removeAttribute('id'); c.setAttribute('aria-hidden', 'true'); c.classList.add('clone');
      $$('[id]', c).forEach(function (n) { n.removeAttribute('id'); });
      $$('video', c).forEach(function (v) { v.preload = 'none'; });
      frag.appendChild(c);
    });
    return frag;
  }
  track.insertBefore(makeClone(), track.firstChild);
  track.appendChild(makeClone());
  var loopW = 0;
  function measure() {
    var first = originals.find(function (p) { return !p.hidden; });
    var visible = $$('.proj:not(.clone)', track).filter(function (p) { return !p.hidden; });
    if (!first) return;
    var last = visible[visible.length - 1];
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    loopW = last.offsetLeft + last.offsetWidth + gap - first.offsetLeft;
    if (stage.scrollLeft < loopW * 0.5 || stage.scrollLeft > loopW * 1.5) stage.scrollLeft = first.offsetLeft - pad();
    updateCount();
  }
  function pad() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
  function wrap() {
    if (!loopW || jumping) return;
    if (stage.scrollLeft < loopW * 0.5) stage.scrollLeft += loopW;
    else if (stage.scrollLeft > loopW * 1.5) stage.scrollLeft -= loopW;
  }
  // the counter reads what is actually on screen (clones included), so it is right wherever the loop is
  originals.forEach(function (p, i) { p.dataset.i = i; });
  $$('.proj.clone', track).forEach(function (c, i) { c.dataset.i = i % originals.length; });
  function updateCount() {
    var vis = originals.filter(function (p) { return !p.hidden; }); if (!vis.length) { count.textContent = ''; return; }
    var sl = stage.getBoundingClientRect().left, edge = stage.clientWidth * 0.35, best = null, bestL = -Infinity;
    $$('.proj', track).forEach(function (p) {
      if (p.hidden) return;
      var l = p.getBoundingClientRect().left - sl;
      if (l <= edge && l > bestL) { bestL = l; best = p; }
    });
    var o = best ? originals[+best.dataset.i] : vis[0], n = vis.indexOf(o) + 1;
    count.textContent = String(n).padStart(2, '0') + ' / ' + String(vis.length).padStart(2, '0') + '  ' + $('.cap b', o).textContent;
  }
  stage.addEventListener('scroll', function () { wrap(); updateCount(); }, { passive: true });
  // parallax: as the section passes through the viewport the strip drifts sideways, hinting it can be scrolled
  var drift = 0;
  function parallax() {
    if (REDUCED) return;
    var r = section.getBoundingClientRect(), p = (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight;
    drift = Math.max(-1, Math.min(1, p)) * innerWidth * 0.12;
    track.style.transform = 'translate3d(' + (-drift) + 'px,0,0)';
  }
  addEventListener('scroll', parallax, { passive: true });
  addEventListener('resize', function () { measure(); parallax(); });
  $$('img', track).forEach(function (i) { if (!i.complete) i.addEventListener('load', measure, { once: true }); });
  measure(); parallax();
  // mouse drag (touch scrolls natively)
  var dragX = null, startL = 0, moved = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button) return;
    glideId++; jumping = false;
    dragX = e.clientX; startL = stage.scrollLeft; moved = false; stage.classList.add('drag');
  });
  addEventListener('pointermove', function (e) {
    if (dragX === null) return;
    var dx = e.clientX - dragX; if (Math.abs(dx) > 3) moved = true;
    stage.scrollLeft = startL - dx; wrap();
  });
  addEventListener('pointerup', function () { dragX = null; stage.classList.remove('drag'); });
  stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  // vertical mouse wheel over the strip with Shift, or horizontal trackpad, scroll it; plain wheel keeps scrolling the page
  // videos play only when visible
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); } else en.target.pause();
    });
  }, { root: stage, rootMargin: '0px 300px' });
  $$('video', track).forEach(function (v) { vio.observe(v); });

  var jumping = false, glideId = 0;
  // own easing for horizontal jumps: native smooth scrolling gets cancelled when the page scrolls vertically at the same time
  function glide(target) {
    var from = stage.scrollLeft, d = target - from, t0 = null, dur = REDUCED ? 0 : 1100, id = ++glideId;
    jumping = true;
    function step(ts) {
      if (id !== glideId) return;
      if (t0 === null) t0 = ts;
      var k = dur ? Math.min(1, (ts - t0) / dur) : 1, e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      stage.scrollLeft = from + d * e;
      if (k < 1) requestAnimationFrame(step); else { jumping = false; updateCount(); }
    }
    requestAnimationFrame(step);
    // fallback when the tab is not painting frames: land on the target directly
    setTimeout(function () { if (id === glideId && t0 === null) { stage.scrollLeft = target; jumping = false; updateCount(); } }, 200);
  }
  function goTo(id) {
    var el = document.getElementById(id); if (!el) return;
    var top = section.getBoundingClientRect().top + scrollY - (innerHeight - section.offsetHeight) / 2;
    scrollTo({ top: top, behavior: REDUCED ? 'auto' : 'smooth' });
    // target inside the middle copy; if it sits past the wrap point use the identical clone one loop earlier
    var target = el.offsetLeft - pad();
    if (target > loopW * 1.5) target -= loopW;
    glide(target);
  }

  /* ---------- index & filters ---------- */
  $('#list').addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]'); if (!a) return; e.preventDefault(); goTo(a.dataset.go);
  });
  $$('.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.f;
      $$('.chip').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      $$('[data-tags]').forEach(function (el) { el.hidden = !(f === 'all' || el.dataset.tags.split(' ').indexOf(f) > -1); });
      measure();
    });
  });
  $$('.top a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
      scrollTo({ top: t.id === 'top' ? 0 : t.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
    });
  });

  /* ---------- Casa do Povo: sticker follows the cursor over underlined words ---------- */
  ['projetos', 'eventos', 'povo', 'acervo', 'apoie'].forEach(function (k) { new Image().src = 'svg/' + k + '.svg'; });
  $$('.hov').forEach(function (f) {
    var st = $('.hst', f);
    function move(e) { var r = f.getBoundingClientRect(); st.style.left = (e.clientX - r.left) + 'px'; st.style.top = (e.clientY - r.top) + 'px'; }
    $$('.hw', f).forEach(function (w) {
      w.addEventListener('mouseenter', function (e) { st.src = 'svg/' + w.dataset.s + '.svg'; move(e); st.classList.add('on'); });
      w.addEventListener('mousemove', move);
      w.addEventListener('mouseleave', function () { st.classList.remove('on'); });
      w.addEventListener('click', function () {
        var r = f.getBoundingClientRect(), b = w.getBoundingClientRect();
        st.src = 'svg/' + w.dataset.s + '.svg'; st.style.left = (b.left + b.width / 2 - r.left) + 'px'; st.style.top = (b.top + b.height / 2 - r.top) + 'px'; st.classList.add('on');
      });
    });
  });

  /* ---------- index thumbnails ---------- */
  if (FINE) {
    var pk = $('#peek');
    $$('#list a').forEach(function (a) {
      if (a.dataset.th) new Image().src = a.dataset.th;
      a.addEventListener('mouseenter', function () { if (a.dataset.th) { pk.src = a.dataset.th; pk.classList.add('on'); } });
      a.addEventListener('mouseleave', function () { pk.classList.remove('on'); });
      a.addEventListener('mousemove', function (e) { pk.style.transform = 'translate(' + (e.clientX + 24) + 'px,' + (e.clientY - 80) + 'px)'; });
    });
  }

  /* ---------- footer J draws itself once ---------- */
  var g = $('.glyph');
  if (g) new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { g.classList.add('draw'); o.disconnect(); } }); }, { threshold: 0.4 }).observe(g);

  /* ---------- Casa do Povo wordmark: letters rearrange between layouts (widths measured, never overlap) ---------- */
  var LAYOUTS = [
    { rows: [[[0, .5], [1, .12], [2, 0], [3, .12], [4, .5]], [[5, 0], [6, 0], [7, 0], [8, 0]]], ry: [0, 1.55], gap: .04 },
    { rows: [[[0, 0], [1, 0], [2, 0], [3, 0]], [[4, .15], [5, 0], [6, .32], [7, 0], [8, .32]]], ry: [0, 1.1], gap: .06 },
    { rows: [[[0, .3], [1, 0], [2, .18], [3, .36]], [[4, .1], [5, 0], [6, 0], [7, .35], [8, 0]]], ry: [0, 1.3], gap: .05 },
    { rows: [[[0, 0], [1, 0], [2, .2], [3, .4], [4, .75]], [[5, 0], [6, 0], [7, .3], [8, 0]]], ry: [0, 1.75], gap: .04 }
  ];
  $$('.bt-letters').forEach(function (box) {
    var L = $$('.lt', box), i = 0;
    function layout() {
      var W = box.clientWidth, H = box.clientHeight; if (!W) return;
      var fs = Math.min(.84 * W / 4.2, .72 * H / 2.95);
      L.forEach(function (l) { l.style.fontSize = fs + 'px'; });
      var wd = L.map(function (l) { return l.offsetWidth; }), f = LAYOUTS[i], pos = [], rw = [], maxY = 0;
      f.rows.forEach(function (row, r) {
        var x = 0;
        row.forEach(function (t) { pos[t[0]] = [x, (f.ry[r] + t[1]) * fs]; x += wd[t[0]] + f.gap * fs; maxY = Math.max(maxY, (f.ry[r] + t[1] + 1) * fs); });
        rw[r] = x - f.gap * fs;
      });
      f.rows.forEach(function (row, r) { var off = (W - rw[r]) / 2; row.forEach(function (t) { pos[t[0]][0] += off; }); });
      var oy = (H - maxY) / 2;
      L.forEach(function (l, k) { l.style.transitionDelay = (k * 35) + 'ms'; l.style.transform = 'translate(' + pos[k][0] + 'px,' + (oy + pos[k][1]) + 'px)'; });
    }
    layout(); addEventListener('resize', layout);
    if (!REDUCED) setInterval(function () { i = (i + 1) % LAYOUTS.length; layout(); }, 2800);
  });

  /* ---------- Nossa Chance: glitter condenses into the lettering ---------- */
  var glitterSrc = new Image(); glitterSrc.src = 'img/nossachance-6.jpg';
  $$('.glit').forEach(function (fig) {
    var cv = $('canvas', fig), cx = cv.getContext('2d'), P = [], W, H, dpr = Math.min(2, devicePixelRatio || 1), t0 = null, run = false, base = null;
    var ease = function (t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); };
    function build() {
      W = cv.clientWidth; H = cv.clientHeight; if (!W || !glitterSrc.complete) return;
      cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var k = Math.min(W / glitterSrc.width, H / glitterSrc.height) * .92, w = glitterSrc.width * k | 0, h = glitterSrc.height * k | 0;
      var o = document.createElement('canvas'); o.width = w; o.height = h; var c = o.getContext('2d'); c.drawImage(glitterSrc, 0, 0, w, h);
      var d = c.getImageData(0, 0, w, h).data, ox = (W - w) / 2, oy = (H - h) / 2, st = Math.max(2, Math.round(w / 420)); P = [];
      for (var y = 0; y < h; y += st) for (var x = 0; x < w; x += st) {
        var v = d[(y * w + x) * 4]; if (v <= 70) continue;
        var ang = Math.random() * 6.283, rad = 20 + Math.random() * 90;
        P.push({ tx: ox + x, ty: oy + y, v: v / 255, sx: ox + x + Math.cos(ang) * rad, sy: oy + y + Math.sin(ang) * rad - 30, d: (x / w) * 2.2 + Math.random() * .5, tw: Math.random() * 6.28, s: st * (.5 + Math.random() * .7) });
      }
      base = { o: o, ox: ox, oy: oy };
      if (REDUCED) cx.drawImage(o, ox, oy);
    }
    function frame(ts) {
      if (!run) return; if (t0 === null) t0 = ts;
      var t = (ts - t0) / 1000, T = 10; if (t > T) { t0 = ts; t = 0; }
      cx.clearRect(0, 0, W, H);
      var form = Math.min(1, Math.max(0, (t - 2.4) / 1.6)), fade = t > 8.4 ? Math.min(1, (t - 8.4) / 1.2) : 0;
      if (base && form > 0) { cx.globalAlpha = form * (1 - fade); cx.drawImage(base.o, base.ox, base.oy); cx.globalAlpha = 1; }
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; if (t < p.d) continue;
        var e = ease((t - p.d) / 1.4), x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e, tw = .5 + .5 * Math.sin(t * 7 + p.tw);
        var a = Math.min(1, (t - p.d) * 2.5) * (e < 1 ? .25 + .6 * tw : (1 - form) * .8 + form * tw * .35) * p.v * (1 - fade);
        if (a < .04) continue;
        cx.fillStyle = 'rgba(255,255,255,' + a + ')'; cx.beginPath(); cx.arc(x, y, p.s * .55, 0, 6.283); cx.fill();
        if (e >= 1 && tw > .985 && Math.random() < .015) { var r = p.s * 4; cx.globalAlpha = a; cx.fillRect(x - r, y - .5, r * 2, 1); cx.fillRect(x - .5, y - r, 1, r * 2); cx.globalAlpha = 1; }
      }
      requestAnimationFrame(frame);
    }
    if (glitterSrc.complete) build(); else glitterSrc.addEventListener('load', build);
    addEventListener('resize', build);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (REDUCED) return;
        if (e.isIntersecting && !run) { run = true; t0 = null; requestAnimationFrame(frame); } else if (!e.isIntersecting) run = false;
      });
    }, { root: stage, rootMargin: '0px 300px' }).observe(fig);
  });

  /* ---------- custom cursor (mouse only): dot, grows over links, "Drag" over the strip ---------- */
  if (FINE) {
    document.documentElement.classList.add('has-cur');
    var cur = document.createElement('div'); cur.className = 'cur';
    cur.innerHTML = '<span>Drag</span><svg class="arr" viewBox="0 0 40 16" aria-hidden="true"><path d="M1 8H38M31 1.5L38 8L31 14.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
    document.body.appendChild(cur);
    var side = 0;  // -1 left edge, 1 right edge, 0 middle of the strip
    stage.addEventListener('click', function (e) {
      if (!side || moved) return;
      glide(stage.scrollLeft + side * stage.clientWidth * 0.6);
    });
    var mx = -100, my = -100, cxp = -100, cyp = -100;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY; cur.classList.add('on');
      var t = e.target;
      var inStage = !!t.closest('.stage') && !t.closest('.hw');
      side = 0;
      if (inStage) { var r = stage.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width; side = fx < .28 ? -1 : fx > .72 ? 1 : 0; }
      cur.classList.toggle('drag', inStage && !side);
      cur.classList.toggle('al', inStage && side === -1);
      cur.classList.toggle('ar', inStage && side === 1);
      cur.classList.toggle('link', !inStage && !!t.closest('a,button,.hw'));
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    (function loop() {
      cxp += (mx - cxp) * .22; cyp += (my - cyp) * .22;
      cur.style.transform = 'translate(' + cxp + 'px,' + cyp + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- copy e-mail ---------- */
  $('#copy').addEventListener('click', function () {
    var b = this, m = $('#mail'), t = m.textContent;
    function sel() { var r = document.createRange(); r.selectNodeContents(m); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected, press Ctrl/⌘ C'; }
    try { navigator.clipboard.writeText(t).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy e-mail'; }, 1800); }, sel); } catch (e) { sel(); }
  });
})();
