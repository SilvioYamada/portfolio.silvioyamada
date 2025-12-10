document.addEventListener("DOMContentLoaded", () => {
  initPortfolioSlider();
  initScrollAnimations();
  initNavScrollSpy();
});

function initPortfolioSlider() {
  const sliderContainer = document.getElementById("portfolioSlider");
  if (!sliderContainer) return;

  const track = sliderContainer.querySelector(".slider-track");
  const slides = sliderContainer.querySelectorAll(".slider-slide");
  const prevBtn = sliderContainer.querySelector(".prev-btn");
  const nextBtn = sliderContainer.querySelector(".next-btn");
  const indicatorsContainer =
    sliderContainer.querySelector(".slider-indicators");
  const view = sliderContainer.querySelector(".slider-main-view");

  let currentSlideIndex = 0;
  const totalSlides = slides.length;
  let slideWidth = 0;

  // Aplicar background blur apenas no slide de mídia social
  const midiaSocialSlide = sliderContainer.querySelector(".midia-social-slide");
  if (midiaSocialSlide) {
    const img = midiaSocialSlide.querySelector("img");
    if (img) {
      const imgSrc = img.getAttribute("src");
      midiaSocialSlide.style.setProperty("--bg-image", `url('${imgSrc}')`);
    }
  }

  function adjustDimensions() {
    slideWidth = view.clientWidth;
    slides.forEach((slide) => {
      slide.style.width = `${slideWidth}px`;
    });
    track.style.width = `${slideWidth * totalSlides}px`;
    updateSliderPosition(false);
  }

  function updateSliderPosition(animate = true) {
    const offset = -currentSlideIndex * slideWidth;
    track.style.transform = `translateX(${offset}px)`;
    track.style.transition = animate
      ? "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)"
      : "none";
    updateIndicators();
  }

  function goToNextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
    updateSliderPosition();
  }

  function goToPrevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
    updateSliderPosition();
  }

  function createIndicators() {
    indicatorsContainer.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement("span");
      dot.classList.add("indicator-dot");
      dot.setAttribute("data-index", i);
      dot.addEventListener("click", () => {
        currentSlideIndex = i;
        updateSliderPosition();
      });
      indicatorsContainer.appendChild(dot);
    }
  }

  function updateIndicators() {
    indicatorsContainer
      .querySelectorAll(".indicator-dot")
      .forEach((dot, index) => {
        dot.classList.toggle("active", index === currentSlideIndex);
      });
  }

  createIndicators();
  adjustDimensions();

  prevBtn.addEventListener("click", goToPrevSlide);
  nextBtn.addEventListener("click", goToNextSlide);

  window.addEventListener("resize", () => {
    adjustDimensions();
  });

  let startX = 0;
  view.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  view.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goToPrevSlide();
      } else {
        goToNextSlide();
      }
    }
  });
}

function initScrollAnimations() {
  const sections = document.querySelectorAll(".fade-in-section");

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    observer.observe(section);
  });
}

function initNavScrollSpy() {
  const sections = document.querySelectorAll("main section");
  const navLinks = document.querySelectorAll("nav ul li a");

  if (!sections.length || !navLinks.length) return;

  let currentActive = null;

  const setActiveLink = (id) => {
    if (currentActive === id || !id) return;
    currentActive = id;

    navLinks.forEach((link) => {
      const matches = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", matches);
    });

    // Notify parent (if embedding) about the active change (optional)
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: "activeChanged", active: id }, "*");
      } catch (e) {}
    }
  };

  // Highlight clicked link immediately for better feedback and persist until scroll.
  let manualNav = false;
  let lastManualId = null;
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = link.getAttribute("href") || "";
      const id = target.startsWith("#") ? target.slice(1) : target;
      if (!id) return;

      // Only handle internal anchor links (ignore external links)
      if (target.startsWith("#")) {
        // Prevent the browser's instant jump
        e.preventDefault();

        // Smooth scroll into view (gives a nicer transition and controllable timing)
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }

        setActiveLink(id);
        manualNav = true;
        lastManualId = id;

        // Persist click in sessionStorage so refreshes preserve the active
        try {
          sessionStorage.setItem('siteMenuClicked', JSON.stringify({ path: `#${id}`, time: Date.now() }));
        } catch(e) {}

        // Aguarda o scroll terminar e verifica se a âncora está visível
        // (melhorando a condição para visibilidade parcial — evita perder o ativo)
        setTimeout(() => {
          manualNav = false;
          if (section) {
            const rect = section.getBoundingClientRect();
            // Se a seção estiver parcialmente ou totalmente visível, mantém o ativo
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              setActiveLink(id);
            }
          }
        }, 700); // 700ms: usa valor um pouco maior pra acomodar smooth scroll
      }
    });
  });

  // No load: if sessionStorage had a click, apply it
  try {
    const clickInfo = JSON.parse(sessionStorage.getItem('siteMenuClicked'));
    if (clickInfo && clickInfo.path && clickInfo.path.startsWith('#')) {
      const id = clickInfo.path.slice(1);
      const clickedLink = document.querySelector(`nav ul li a[href="${clickInfo.path}"]`);
      if (clickedLink) setActiveLink(id);
      sessionStorage.removeItem('siteMenuClicked');
    }
  } catch (e) {}

  // Não força ativo no hero ao carregar, deixa o scroll spy decidir

  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -45% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    if (manualNav && lastManualId) {
      setActiveLink(lastManualId);
      return;
    }
    const visibleSections = entries
      .filter((entry) => entry.isIntersecting)
      .sort(
        (a, b) =>
          Math.abs(a.boundingClientRect.top) -
          Math.abs(b.boundingClientRect.top)
      );

    if (!visibleSections.length) return;

    const id = visibleSections[0].target.id;
    setActiveLink(id);
  }, observerOptions);

  sections.forEach((section) => {
    observer.observe(section);
  });
}

// --- Menu Hamburger ---
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");
const menuOverlay = document.querySelector(".menu-overlay");
const navLinks = document.querySelectorAll("nav ul li a");

// Accessibility / focus trap variables
let previousActiveElement = null;
let focusableElements = [];
let firstFocusable = null;
let lastFocusable = null;
let focusTrapHandler = null;
let resizeTimeout = null; // debounce for resize

function openMenu() {
  previousActiveElement = document.activeElement;
  menuToggle.classList.add("active");
  nav.classList.add("active");
  menuOverlay.classList.add("active");
  menuToggle.setAttribute("aria-expanded", "true");
  nav.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // setup focusable elements inside nav
  focusableElements = Array.from(
    nav.querySelectorAll(
      'a, button, input, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute("disabled"));
  firstFocusable = focusableElements[0] || nav;
  lastFocusable = focusableElements[focusableElements.length - 1] || nav;

  // focus first
  (firstFocusable || nav).focus();

  // trap focus
  focusTrapHandler = function (e) {
    if (e.key === "Tab") {
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    } else if (e.key === "Escape") {
      closeMenu();
    }
  };

  document.addEventListener("keydown", focusTrapHandler);
}

function closeMenu() {
  menuToggle.classList.remove("active");
  nav.classList.remove("active");
  menuOverlay.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
  nav.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  try {
    document.removeEventListener("keydown", focusTrapHandler);
  } catch (e) {}

  focusTrapHandler = null;

  // restore focus
  if (
    previousActiveElement &&
    typeof previousActiveElement.focus === "function"
  ) {
    previousActiveElement.focus();
  }
}

// toggle opens/closes (guarded)
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    if (nav.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close the menu when clicking a nav link (attach defensively)
  if (navLinks && navLinks.length) {
    navLinks.forEach((link) => {
      try {
        link.addEventListener("click", closeMenu);
      } catch (e) {}
    });
  }

  // Close the menu when clicking the overlay
  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }

  // Hide nav and close it during resize to prevent it appearing while the layout changes
  window.addEventListener("resize", () => {
    try {
      document.body.classList.add("is-resizing");
      if (nav && nav.classList.contains("active")) closeMenu();
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        document.body.classList.remove("is-resizing");
      }, 300);
    } catch (e) {}
  });

  // Also handle orientationchange for mobile devices
  window.addEventListener("orientationchange", () => {
    try {
      document.body.classList.add("is-resizing");
      if (nav && nav.classList.contains("active")) closeMenu();
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        document.body.classList.remove("is-resizing");
      }, 300);
    } catch (e) {}
  });
} else {
  // Defensive fallback: if elements missing, no-op
  console.warn("Menu elements not found: menuToggle or nav missing.");
}

// (nav-close removed) close handled via overlay and links
