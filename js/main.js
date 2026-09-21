/* ============================================================
   Anna Osipenko — interactions: reveals, menu, accordion
   ============================================================ */
(function () {
  "use strict";

  /* ---------- elements ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var siteNav = document.getElementById("siteNav");
  var header = document.getElementById("siteHeader");

  /* ---------- header state ---------- */
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  menuToggle.addEventListener("click", function () {
    var open = siteNav.classList.toggle("open");
    menuToggle.classList.toggle("open", open);
  });
  siteNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      siteNav.classList.remove("open");
      menuToggle.classList.remove("open");
    });
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- productions accordion ---------- */
  document.querySelectorAll(".prod-row").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".prod-item");
      var detail = item.querySelector(".prod-detail");
      var isOpen = item.classList.contains("open");

      document.querySelectorAll(".prod-item.open").forEach(function (other) {
        if (other !== item) {
          other.classList.remove("open");
          other.querySelector(".prod-row").setAttribute("aria-expanded", "false");
          other.querySelector(".prod-detail").style.maxHeight = "";
        }
      });

      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      detail.style.maxHeight = !isOpen ? detail.scrollHeight + "px" : "";
    });
  });

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll(".num-val");
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var start = null;
    var dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count");
    });
  }

  /* ---------- year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
