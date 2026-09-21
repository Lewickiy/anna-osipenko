/* ============================================================
   Anna Osipenko — interactions: i18n, reveals, menu, accordion
   ============================================================ */
(function () {
  "use strict";

  /* ---------- i18n ---------- */
  var TRANSLATIONS = {
    en: {
      nav_about: "About",
      nav_productions: "Productions",
      nav_awards: "Awards",
      nav_projects: "Projects",
      nav_contacts: "Contacts",

      hero_kicker: "Opera director · Stage director",
      hero_name_1: "Anna",
      hero_name_2: "Osipenko",
      hero_sub: "Golden Mask nominee. Productions at leading musical theatres of Russia, Slovakia and Kazakhstan.",
      hero_scroll: "Scroll",

      mq_1: "Golden Mask",
      mq_2: "Opera",
      mq_3: "International festivals",
      mq_4: "Musical theatre",
      mq_5: "Multimedia",

      about_title: "About",
      about_lead: "Anna Osipenko is a Russian opera director working in musical theatre, contemporary opera and interdisciplinary art projects.",
      about_p1: "For over fifteen years she has been creating large-scale opera productions, leading theatres and developing international cultural initiatives — from the State Hermitage Museum to open-air stages of Central Europe.",
      about_p2: "Her work focuses on a contemporary reading of the classics and the search for new stage languages at the intersection of music, multimedia and museum space.",
      career_1: "Chief stage director of the Musical Theatre of the Republic of Karelia",
      career_2: "Acting chief stage director of the St Petersburg State Theatre of Musical Comedy",
      career_3: "Founder and stage director of the Operetta Park festival",
      about_caption: "St Petersburg, Russia",

      stat_1: "years in the profession",
      stat_2: "major productions",
      stat_3: "countries — Russia, Slovakia, Kazakhstan",

      prod_title: "Productions",
      prod_sub: "Most significant stage works",
      p1c: "R. Leoncavallo", p1h: "Musical Theatre of the Republic of Karelia",
      p1d: "Six nominations for the Russian national theatre award Golden Mask and the award for Best Male Role (2023).",
      p2c: "W. A. Mozart", p2h: "Musical Theatre of the Republic of Karelia",
      p2d: "Silver Medal of the Russian Academy of Arts for set design and costumes (2026).",
      p3c: "S. V. Rachmaninoff", p3h: "Musical Theatre of the Republic of Karelia",
      p3d: "Long list of the Golden Mask award (2022).",
      p4c: "G. Verdi", p4h: "State Opera of Banská Bystrica, Slovakia",
      p4d: "Staged at the largest open-air opera venues of Slovakia: Pala Bielika amphitheatre (2016) and Lučenec (2019).",
      p5c: "P. I. Tchaikovsky", p5h: "State Opera of Banská Bystrica, Slovakia",
      p5d: "Participant of the International Opera Festival at the National Theatre in Prague, Czech Republic (2015).",

      awards_title: "Awards",
      aw_1t: "Golden Mask",
      aw_1d: "Nominee of the Russian national theatre award in the category Opera — Director's work.",
      aw_2t: "Governor of Omsk Region Prize",
      aw_2d: "Named after N. D. Chonishvili, for services in the development of culture and art.",
      aw_3t: "Governor of St Petersburg commendation",
      aw_3d: "For a production that became one of the key events of the theatre season.",
      aw_4t: "Onezhskaya Maska",
      aw_4d: "Laureate of the Republican theatre award.",

      proj_title: "Projects & expertise",
      pr_1t: "Operetta Park",
      pr_1d: "Founder and stage director of an international open-air festival — a joint project of the Gatchina museum reserve and the Theatre of Musical Comedy.",
      pr_2tag: "Curatorial project",
      pr_2t: "Passions according to Caravaggio",
      pr_2d: "An inter-museum project of the State Hermitage, the Musical Theatre of Karelia and the National Museum of Karelia.",
      pr_3t: "Opera Mechanics. The Grey Car",
      pr_3d: "Together with the Sergei Kuryokhin Centre for Contemporary Art. World premiere of the concert version — December 2026.",
      pr_4tag: "Expertise",
      pr_4t: "Councils & juries",
      pr_4d: "Member of the expert council of the Russian national opera award Onegin. Jury member of the Digital Opera festival.",

      statement: "A contemporary reading of the classics. Large-scale interdisciplinary projects. A new audience for opera.",

      cont_title: "Contacts",
      cont_call: "Let's stage it together",
      cont_email: "Email",
      cont_phone: "Phone",

      footer_note: "Opera director · St Petersburg",
    },
  };

  /* ---------- elements ---------- */
  var langToggle = document.getElementById("langToggle");
  var menuToggle = document.getElementById("menuToggle");
  var siteNav = document.getElementById("siteNav");
  var header = document.getElementById("siteHeader");
  var pageMeta = {
    title: { ru: "Анна Осипенко — оперный режиссёр", en: "Anna Osipenko — Opera Director" },
    desc: {
      ru: "Номинант премии «Золотая Маска». Постановки в музыкальных театрах России, Словакии и Казахстана.",
      en: "Golden Mask nominee. Productions at leading musical theatres of Russia, Slovakia and Kazakhstan.",
    },
  };

  /* ---------- language switching ---------- */
  function setLang(lang) {
    document.documentElement.lang = lang;
    document.title = pageMeta.title[lang];
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", pageMeta.desc[lang]);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = TRANSLATIONS[lang] && TRANSLATIONS[lang][key];
      if (val != null) el.textContent = val;
    });

    langToggle.textContent = lang === "ru" ? "EN" : "RU";
    document.cookie = "site_lang=" + lang + ";path=/;max-age=31536000;samesite=Lax";
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  var initialLang = getCookie("site_lang") || ((navigator.language || "ru").toLowerCase().indexOf("ru") === 0 ? "ru" : "en");
  if (initialLang === "en") setLang("en");

  langToggle.addEventListener("click", function () {
    var next = document.documentElement.lang === "ru" ? "en" : "ru";
    setLang(next);
  });

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
