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

  // Apply background blur only to the social media slide
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

        // Wait for the scroll to finish and verify the anchor is visible
        // (melhorando a condição para visibilidade parcial — evita perder o ativo)
        setTimeout(() => {
          manualNav = false;
          if (section) {
            const rect = section.getBoundingClientRect();
            // If the section is partially or fully visible, keep it active
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              setActiveLink(id);
            }
          }
        }, 700); // 700ms: usa valor um pouco maior pra acomodar smooth scroll
      }
    });
  });

  // Do not force the hero active on load; let the scroll spy decide

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
          Math.abs(b.boundingClientRect.top),
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
      'a, button, input, textarea, [tabindex]:not([tabindex="-1"])',
    ),
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

// --- Tradução (i18n) ---
const TRANSLATIONS = {
  pt: {
    "nav.home": "Início",
    "nav.about": "Sobre",
    "nav.portfolio": "Portfólio",
    "nav.experience": "Experiência",
    "nav.contact": "Contato",
    "hero.title":
      "Olá, eu sou Silvio Yamada. <br />Eu transformo complexidade em experiências digitais que geram resultados.",
    "hero.subtitle":
      "Com 17 anos de experiência, meu foco é criar soluções que unem as necessidades dos usuários aos objetivos do seu negócio.",
    "section.what": "O que eu trago para a mesa",
    "portfolio.title": "Portfólio Seletivo",
    "experience.title": "Experiência Comprovada",
    "btn.view": "Ver Site",
    "contact.title": "Vamos Transformar Seus Desafios em Sucesso?",
    "contact.paragraph":
      "Estou sempre aberto a novas oportunidades e projetos que exijam uma combinação de visão de design e profundidade técnica. Entre em contato!",
    "contact.linkedin": "LinkedIn",
    "contact.whatsapp": "WhatsApp",
    "footer.text": "📏 Desenvolvido por Silvio Yamada | UI/UX Designer © 2026",
    "portfolio.subtitle":
      "Uma seleção de trabalhos que demonstram meu processo, da pesquisa ao pixel final.",
    "cta.portfolio": "Veja Meu Portfólio",
    "cta.linkedin": "Conecte-se no LinkedIn",
    "about.paragraph":
      "Minha paixão está em todo o ciclo: da pesquisa e validação de necessidades de usuários à criação de interfaces atraentes e altamente utilizáveis.",
    "skills.user.title": "Foco no Usuário",
    "skills.user.li1": "Entrevistas & Pesquisa",
    "skills.user.li2": "Testes de Usabilidade",
    "skills.user.li3": "Criação de User Journeys",
    "skills.user.li4": "Desenvolvimento de Personas",
    "skills.tech.title": "Habilidade Técnica",
    "skills.tech.li1": "Figma",
    "skills.tech.li2": "Adobe XD & Photoshop",
    "skills.tech.li3": "Adobe Illustrator",
    "skills.tech.li4": "Aplicação de Design Systems",
    "skills.business.title": "Resultados de Negócio",
    "skills.business.li1": "Otimização de fluxos de checkout",
    "skills.business.li2": "Melhoria nas taxas de conversão",
    "skills.business.li3": "Design para apps B2B complexos",
    "skills.business.li4": "Soluções para clientes internacionais",
    "portfolio.cta": "Ver Portfólio Completo no Behance",

    "slide1.title": "Ferramenta Drag-and-Drop | Builderall Website Builder",
    "slide1.desc":
      "Projeto de reestruturação de UI/UX para editor de websites.",
    "slide1.alt": "Ferramenta Drag-and-Drop — Builderall Website Builder",
    "slide1.aria": "Abrir projeto Builderall Website Builder no Behance",

    "slide2.title": "Booking | Sistema de Agendamento",
    "slide2.desc":
      "Desenvolvimento de uma plataforma completa de agendamento online.",
    "slide2.alt": "Booking — Sistema de Agendamento",
    "slide2.aria": "Abrir projeto Booking no Behance",

    "slide3.title": "Chatbot — Plataforma CRM e WhatsApp Launch Manager",
    "slide3.desc": "Interface de gestão de leads e automação via WhatsApp.",
    "slide3.alt": "Chatbot CRM — WhatsApp Launch Manager",
    "slide3.aria": "Abrir projeto Chatbot no Behance",

    "slide4.title": "Bergen Elite — Website Esportivo",
    "slide4.desc": "Website esportivo com foco em engajamento do público.",
    "slide4.alt": "Bergen Elite — Website Esportivo",
    "slide4.aria": "Abrir projeto Bergen Elite no Behance",

    "slide5.title": "CRM — Wordpress for Builderall",
    "slide5.desc": "Interface de análise para gerenciar funis de vendas.",
    "slide5.alt": "CRM — Wordpress for Builderall",
    "slide5.aria": "Abrir projeto CRM Wordpress no Behance",

    "slide6.title": "CRM — WhatsApp Launch Manager",
    "slide6.desc": "Redesign de landing page com foco em conversão.",
    "slide6.alt": "CRM WhatsApp Launch Manager",
    "slide6.aria": "Abrir projeto CRM WhatsApp no Behance",

    "slide7.title": "BBall — Gerenciador de Basquetebol",
    "slide7.desc":
      "Plataforma de gestão esportiva completa para times de basquetebol.",
    "slide7.alt": "BBall — Gerenciador de Basquetebol",
    "slide7.aria": "Abrir projeto BBall no Behance",

    "slide8.title": "Mídias Sociais — Peixinhos Restaurante",
    "slide8.desc":
      "Estratégia e design de conteúdo para fortalecer presença digital local.",
    "slide8.alt": "Peixinhos Restaurante — Mídias Sociais",
    "slide8.aria": "Abrir projeto Peixinhos no Behance",

    "exp.builderall.companyInfo":
      "A Builderall é uma plataforma de marketing digital completa que oferece diversas ferramentas em um único ambiente, com o objetivo de ajudar empreendedores e empresas a crescerem online.",
    "exp.builderall.description":
      "Responsável pelo design e usabilidade de uma suíte de 50+ ferramentas de marketing digital. Liderei o redesign de produtos-chave, resultando em melhorias na retenção e satisfação do usuário.",
    "exp.limodas.title": "Designer Gráfico",
    "exp.limodas.companyInfo":
      "A Li Modas Oficial é uma loja virtual especializada em vestidos temáticos infantis e juvenis, oferecendo produtos no atacado e varejo para todo o Brasil e exterior.",
    "exp.limodas.description":
      "Criação de identidade visual e materiais de marketing digital para e-commerce focado em moda infantil, impulsionando presença da marca nas redes sociais.",
    "exp.admake.companyInfo":
      "A Admake é uma agência especializada em e-commerce e marketing digital.",
    "exp.admake.description":
      "Desenvolvimento de layouts e front-end para websites institucionais e campanhas de marketing digital, garantindo desempenho visual e técnico.",
    "exp.horizon.title": "Gráfico & Web Designer",
    "exp.horizon.companyInfo":
      "A Horizon Marketing é uma empresa especializada em marketing para varejo.",
    "exp.horizon.description":
      "Focado na criação de identidades visuais e design de interfaces para websites e landing pages, garantindo consistência da marca no digital.",
    "exp.fisk.title": "Gráfico & Web Designer",
    "exp.fisk.companyInfo":
      "A FISK Marília é uma escola de idiomas que oferece cursos de inglês e espanhol.",
    "exp.fisk.description":
      "Produção de materiais gráficos promocionais, design de anúncios e atualização do website institucional para suportar campanhas de matrícula.",
    "exp.tray.companyInfo":
      "A Tray é uma plataforma de e-commerce robusta, pertencente à Locaweb, que facilita a criação e gestão de lojas virtuais.",
    "exp.tray.description":
      "Criação de layouts de e-commerce e banners promocionais para melhorar a atratividade visual e performance de vendas, otimizando a experiência do usuário.",
    "exp.rednose.title": "Web Designer / Fotografia",
    "exp.rednose.companyInfo":
      "A Red Nose é uma marca de moda masculina com estilo urbano, esportivo e casual.",
    "exp.rednose.description":
      "Responsável pelo design web e fotografia de produtos, criando identidade visual consistente e material fotográfico de alta qualidade para catálogos e campanhas.",

    "share.text":
      "💎 Achou meu trabalho interessante? Compartilhe com quem está procurando um designer de verdade!",
    "share.twitter.title": "Compartilhar no Twitter",
    "share.facebook.title": "Compartilhar no Facebook",
    "share.whatsapp.title": "Compartilhar no WhatsApp",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.portfolio": "Portfolio",
    "nav.experience": "Experience",
    "nav.contact": "Contact",
    "hero.title":
      "Hi, I'm Silvio Yamada. <br />I turn complexity into digital experiences that deliver results.",
    "hero.subtitle":
      "With 17 years of experience, I focus on creating solutions that align user needs with business goals.",
    "section.what": "What I Bring to the Table",
    "portfolio.title": "Selected Portfolio",
    "portfolio.subtitle":
      "A curated selection of projects that show my process — from research to the final pixel.",
    "cta.portfolio": "See My Portfolio",
    "cta.linkedin": "Connect on LinkedIn",
    "about.paragraph":
      "My passion spans the full product lifecycle: from user research and needs validation to crafting attractive, highly usable interfaces.",
    "skills.user.title": "User-centered",
    "skills.user.li1": "Interviews & Research",
    "skills.user.li2": "Usability Testing",
    "skills.user.li3": "User Journeys",
    "skills.user.li4": "Persona Development",
    "skills.tech.title": "Technical Skills",
    "skills.tech.li1": "Figma",
    "skills.tech.li2": "Adobe XD & Photoshop",
    "skills.tech.li3": "Adobe Illustrator",
    "skills.tech.li4": "Design Systems",
    "skills.business.title": "Business Impact",
    "skills.business.li1": "Checkout flow optimization",
    "skills.business.li2": "Conversion rate improvements",
    "skills.business.li3": "Design for complex B2B apps",
    "skills.business.li4": "Solutions for international clients",
    "experience.title": "Proven Experience",
    "portfolio.cta": "See Full Portfolio on Behance",
    "slide1.title": "Drag-and-Drop Editor | Builderall Website Builder",
    "slide1.desc": "UI/UX restructuring project for a website editor.",
    "slide1.alt": "Drag-and-Drop Editor — Builderall Website Builder",
    "slide1.aria": "Open Builderall Website Builder project on Behance",
    "slide2.title": "Booking | Online Scheduling System",
    "slide2.desc": "Development of a complete online scheduling platform.",
    "slide2.alt": "Booking — Online Scheduling System",
    "slide2.aria": "Open Booking project on Behance",
    "slide3.title": "Chatbot — CRM & WhatsApp Launch Manager",
    "slide3.desc": "Lead management interface and WhatsApp automation.",
    "slide3.alt": "Chatbot CRM — WhatsApp Launch Manager",
    "slide3.aria": "Open Chatbot project on Behance",
    "slide4.title": "Bergen Elite — Sports Website",
    "slide4.desc": "Sports website focused on audience engagement.",
    "slide4.alt": "Bergen Elite — Sports Website",
    "slide4.aria": "Open Bergen Elite project on Behance",
    "slide5.title": "CRM — Wordpress for Builderall",
    "slide5.desc": "Analytics interface for managing sales funnels.",
    "slide5.alt": "CRM — Wordpress for Builderall",
    "slide5.aria": "Open CRM Wordpress project on Behance",
    "slide6.title": "CRM — WhatsApp Launch Manager",
    "slide6.desc": "Landing page redesign focused on conversion.",
    "slide6.alt": "CRM WhatsApp Launch Manager",
    "slide6.aria": "Open CRM WhatsApp project on Behance",
    "slide7.title": "BBall — Basketball Management System",
    "slide7.desc": "Complete sports management platform for basketball teams.",
    "slide7.alt": "BBall — Basketball Management System",
    "slide7.aria": "Open BBall project on Behance",
    "slide8.title": "Social Media — Peixinhos Restaurante",
    "slide8.desc":
      "Content strategy and design to strengthen a local restaurant's digital presence.",
    "slide8.alt": "Peixinhos Restaurante — Social Media",
    "slide8.aria": "Open Peixinhos project on Behance",
    "exp.builderall.companyInfo":
      "Builderall is a comprehensive digital marketing platform that provides many tools in a single environment to help entrepreneurs and businesses grow online.",
    "exp.builderall.description":
      "Responsible for the design and usability of a suite of 50+ marketing tools. I led key product redesigns that significantly improved user retention and satisfaction.",
    "exp.limodas.title": "Graphic Designer",
    "exp.limodas.companyInfo":
      "Li Modas Oficial is an online store specialized in themed children's and youth dresses, offering wholesale and retail across Brazil and abroad.",
    "exp.limodas.description":
      "Created full visual identity and digital marketing assets for an e-commerce focused on children's fashion, boosting brand presence on social media.",
    "exp.admake.companyInfo":
      "Admake is an agency specialized in e-commerce and digital marketing.",
    "exp.admake.description":
      "Developed layouts and front-end for corporate websites and digital marketing campaigns, ensuring visual quality and technical performance.",
    "exp.horizon.title": "Graphic & Web Designer",
    "exp.horizon.companyInfo":
      "Horizon Marketing is a company specialized in retail marketing.",
    "exp.horizon.description":
      "Focused on brand visual identities and interface design for websites and landing pages, ensuring brand consistency across digital channels.",
    "exp.fisk.title": "Graphic & Web Designer",
    "exp.fisk.companyInfo":
      "FISK Marília is a language school offering English and Spanish courses.",
    "exp.fisk.description":
      "Produced promotional graphic materials (flyers, posters), ad designs and updated the institutional website to support enrollment campaigns.",
    "exp.tray.companyInfo":
      "Tray is a robust e-commerce platform by Locaweb that simplifies creating and managing online stores.",
    "exp.tray.description":
      "Created e-commerce layouts and promotional banners to improve visual appeal and sales performance, optimizing user experience on commerce platforms.",
    "exp.rednose.title": "Web Designer / Photography",
    "exp.rednose.companyInfo":
      "Red Nose is a men's fashion brand with an urban, sporty and casual style.",
    "exp.rednose.description":
      "Responsible for web design and product photography, creating consistent visual identity and high-quality photo material for catalogs and digital campaigns.",
    "contact.paragraph":
      "I’m open to new opportunities and projects that require both design vision and technical depth. Get in touch!",
    "share.text":
      "💎 Liked my work? Share it with someone looking for a real designer!",
    "share.twitter.title": "Share on Twitter/X",
    "share.facebook.title": "Share on Facebook",
    "share.whatsapp.title": "Share on WhatsApp",
    "btn.view": "View Site",
    "contact.title": "Ready to Turn Your Challenges into Success?",
    "contact.paragraph":
      "I’m open to new opportunities and projects that require both design vision and technical depth. Get in touch!",
    "contact.linkedin": "LinkedIn",
    "contact.whatsapp": "WhatsApp",
    "footer.text": "📏 Desenvolvido por Silvio Yamada | UI/UX Designer © 2026",
  },
};

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.pt;

  // innerHTML translations
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const txt = dict[key];
    if (typeof txt !== "undefined") el.innerHTML = txt;
  });

  // title attributes
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    const txt = dict[key];
    if (typeof txt !== "undefined") el.setAttribute("title", txt);
  });

  // alt attributes for images
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (!key) return;
    const txt = dict[key];
    if (typeof txt !== "undefined") el.setAttribute("alt", txt);
  });

  // aria-labels
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    const txt = dict[key];
    if (typeof txt !== "undefined") el.setAttribute("aria-label", txt);
  });

  // Update html lang
  document.documentElement.lang = lang === "pt" ? "pt-br" : "en";

  // Mark active button
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });

  try {
    localStorage.setItem("site_lang", lang);
  } catch (e) {
    // ignore
  }
}

// Initialize language buttons
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    applyTranslations(lang);
  });
});

// Apply initial language (saved preference or PT)
(function () {
  let preferred = "pt";
  try {
    const saved = localStorage.getItem("site_lang");
    if (saved) preferred = saved;
  } catch (e) {
    // ignore
  }
  applyTranslations(preferred);
})();
