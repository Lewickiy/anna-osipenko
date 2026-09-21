/* ============================================================
   Anna Osipenko — accordion interactions
   ============================================================ */
(function () {
  "use strict";

  var items = Array.prototype.slice.call(document.querySelectorAll(".acc-item"));

  /* ---------- подгонка кегля горизонтальной надписи под ширину экрана ----------
     Строка «Анна Осипенко · Режиссёр-постановщик · Куратор» должна тянуться
     от края до края шапки. Измеряем фактическую длину при базовом кегле
     и масштабируем пропорционально доступной ширине. */
  var sideName = document.getElementById("sideName");
  var BASE_PX = 16;
  function fitSideName() {
    if (!sideName) return;
    /* подгоняем по фактической ширине контейнера (≤ 900px), а не окна */
    var side = document.getElementById("side");
    sideName.style.fontSize = BASE_PX + "px";
    var len = sideName.scrollWidth;             /* длина строки по горизонтали */
    var avail = side ? side.clientWidth - 12 : window.innerWidth - 12;
    if (len > 0 && avail > 0) {
      var size = BASE_PX * (avail / len);
      /* не выше внутренней высоты шапки — она равна строке заголовка аккордеона */
      var maxByH = side ? side.clientHeight : Infinity;
      sideName.style.fontSize = Math.max(9, Math.min(size, maxByH, 72)).toFixed(2) + "px";
    }
  }
  fitSideName();
  window.addEventListener("resize", fitSideName);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitSideName);
  }

  function setBodyHeight(item, open) {
    var body = item.querySelector(".acc-body");
    body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
  }

  function setOpen(item, open) {
    var btn = item.querySelector(".acc-btn");
    item.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    setBodyHeight(item, open);
  }

  /* --- открытие/закрытие: открыт один блок, повторный клик закрывает --- */
  items.forEach(function (item) {
    var btn = item.querySelector(".acc-btn");
    btn.addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");

      items.forEach(function (other) {
        if (other !== item && other.classList.contains("is-open")) setOpen(other, false);
      });

      setOpen(item, willOpen);

      /* подравнять высоту, если размеры изменились (шрифты, зум) */
      if (willOpen) {
        window.requestAnimationFrame(function () {
          var body = item.querySelector(".acc-body");
          body.style.maxHeight = body.scrollHeight + "px";
        });
      }
    });
  });

  /* --- доступность: навигация стрелками по заголовкам --- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    var idx = items.findIndex(function (it) { return it.contains(document.activeElement); });
    if (idx === -1) return;
    e.preventDefault();
    var next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next].querySelector(".acc-btn").focus();
  });

  /* --- пересчёт высоты открытого блока при ресайзе --- */
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      fitSideName();
      var open = document.querySelector(".acc-item.is-open");
      if (open) {
        var body = open.querySelector(".acc-body");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    }, 150);
  });
})();
