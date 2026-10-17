import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
]

const translations = {
  es: {
    nav: { home: 'Inicio', projects: 'Proyectos', about: 'Sobre mí', contact: 'Contacto', primary: 'Principal', theme: 'Cambiar al tema {theme}', language: 'Idioma' },
    hero: {
      greeting: 'Hey 👋, soy Nicolás', title: ['Web App Developer', '& AI Engineer'],
      lede: 'Construyo aplicaciones web que integran IA para resolver problemas reales. Front y back, con cariño por los detalles.',
      current: 'Actualmente: abierto a oportunidades y construyendo proyectos con LLMs, RAG y automatizaciones.',
      work: 'Ver mi trabajo', alt: 'Nicolás Furnieles',
    },
    projects: {
      eyebrow: 'Trabajo seleccionado', title: 'Proyectos recientes', lede: 'Una selección de proyectos académicos, personales y comerciales. Haz clic en cualquier tarjeta para abrir la demo en vivo.',
      openLabel: '{title} — abrir web', demoLabel: 'Web de {title}',
      items: {
        'quick-arrival': { tag: 'Proyecto final DAWE · 2026', description: 'Web app para monitorizar los autobuses de Madrid con llegadas en tiempo real, un mapa interactivo con seguimiento en vivo y una función colaborativa inspirada en Waze.' },
        'cosmos-api': { tag: 'Open source · 2025', description: 'API REST de astronomía open source construida con FastAPI. Endpoints sobre planetas, datos espaciales y más.' },
        veta: { tag: 'Producto · 2026', description: 'Herramienta RAG que ayuda a las empresas a encontrar ayudas públicas relevantes a partir de datos oficiales de la BDNS e IA, enlazando siempre a la fuente oficial.' },
        'casas-madera-vip': { tag: 'Comercial · 2026', description: 'Web comercial para un cliente real: restauración de casas de madera, con una UX interactiva moderna y transiciones fluidas.' },
      },
    },
    about: {
      eyebrow: 'Sobre mí', title: 'Un poco sobre mi historia',
      description: 'Soy Nicolás Furnieles, desarrollador web graduado en Desarrollo de Aplicaciones Web (DAWE) por U-tad. Me centro en construir aplicaciones web que integran IA para resolver problemas reales: integración de LLMs, MCPs, sistemas RAG y automatización de flujos de trabajo con n8n, siempre sobre una base Full Stack con React, Node.js, PHP y bases de datos SQL y NoSQL.',
      secondary: 'Aprendo construyendo: experimento con nuevas tecnologías y convierto ideas en software que funciona. Y me gusta cuidar los detalles: cómo se siente una transición, cómo respira una tipografía, cómo un botón comunica sin necesitar palabras.',
      what: 'Lo que hago', areas: '6 áreas en las que trabajo',
      services: [
        { label: 'Frontend Development', hint: 'React, TypeScript, accesibilidad' },
        { label: 'Full Stack', hint: 'APIs REST, Node.js, Laravel' },
        { label: 'IA & LLMs', hint: 'RAG, MCP, integración de LLMs' },
        { label: 'Automatización', hint: 'n8n, Playwright, QA con IA' },
        { label: 'Bases de datos', hint: 'MySQL, MongoDB, modelado' },
        { label: 'Performance', hint: 'Core Web Vitals, Lighthouse' },
      ],
      stackReset: 'Reiniciar stack',
      education: 'Educación', educationSub: 'Formación y aprendizaje continuo',
      educationItems: [
        { school: 'U-tad', degree: 'Desarrollo de Aplicaciones Web (DAWE)', period: 'Sept 2024 — Jun 2026', description: 'Base sólida en ingeniería de software, desarrollo web full stack, bases de datos y diseño de aplicaciones. Proyecto final: Quick Arrival App, con seguimiento en tiempo real de los autobuses de Madrid integrado con el Consorcio Regional de Transportes (CRTM). Nota: 9.' },
        { school: '42 Madrid', degree: 'Piscina 2024 · Bootcamp de programación', period: 'Jun 2024 — Jul 2024', description: 'Fundamentos de programación en C a través de ejercicios prácticos, resolución autónoma de problemas, proyectos en grupo y revisiones de código entre compañeros.' },
      ],
      experience: 'Experiencia laboral', experienceSub: 'Prácticas en empresa y trabajo en equipo',
      experienceItems: [{ role: 'Web App Developer (prácticas)', company: 'Aitaca', period: 'Feb 2026 — Jun 2026', description: 'Desarrollo y optimización de aplicaciones e-commerce para Shopify con React y Remix: integración backend, frontend, tests unitarios y rendimiento con Lighthouse. Creé un framework de QA automatizado con Playwright e IA, migré la web corporativa a un tema de WordPress a medida (PHP, JavaScript, HTML) y gestioné despliegues y entornos con Docker, AWS y Git.' }],
    },
    contact: { eyebrow: 'Contacto', title: 'Cerremos la distancia', lede: 'Disponible para proyectos, colaboraciones y oportunidades laborales. Si construyes algo interesante, me encantaría escuchar de qué va.', projects: 'Ver proyectos', location: 'Ubicación', hours: 'Horario', availability: 'Disponibilidad', locationValue: 'Madrid, España', hoursValue: 'GMT+1 · Respondo rápido', availabilityValue: 'Open to work · 2026' },
    actions: { contact: 'Contactar', copied: 'Email copiado', copy: 'Copiar {email}', showEmail: 'Mostrar email' },
    footer: 'Construido con React, Three.js y GSAP',
  },
  en: {
    nav: { home: 'Home', projects: 'Projects', about: 'About', contact: 'Contact', primary: 'Primary', theme: 'Switch to {theme} theme', language: 'Language' },
    hero: {
      greeting: 'Hey 👋, I’m Nicolás', title: ['Web App Developer', '& AI Engineer'],
      lede: 'I build web applications that integrate AI to solve real-world problems. Front and back end, with care for the details.',
      current: 'Currently: open to opportunities and building projects with LLMs, RAG and automations.', work: 'See my work', alt: 'Nicolás Furnieles',
    },
    projects: {
      eyebrow: 'Selected work', title: 'Recent projects', lede: 'A selection of academic, personal and commercial projects. Click any card to open the live demo.',
      openLabel: '{title} — open website', demoLabel: '{title} website',
      items: {
        'quick-arrival': { tag: 'DAWE final project · 2026', description: 'A web app for monitoring Madrid’s buses with real-time arrival information, an interactive map with live tracking and a Waze-inspired collaborative feature.' },
        'cosmos-api': { tag: 'Open source · 2025', description: 'An open-source astronomy REST API built with FastAPI. Endpoints for planets, space data and more.' },
        veta: { tag: 'Product · 2026', description: 'A RAG tool that helps businesses find relevant public funding opportunities using official BDNS data and AI, always linking back to the official source.' },
        'casas-madera-vip': { tag: 'Commercial · 2026', description: 'Commercial website for a real client dedicated to restoring wooden houses, with a modern interactive UX and smooth transitions.' },
      },
    },
    about: {
      eyebrow: 'About me', title: 'A little about my story',
      description: 'I’m Nicolás Furnieles, a web developer who graduated in Web Application Development (DAWE) at U-tad. I focus on building web applications that integrate AI to solve real-world problems: integrating LLMs, MCPs, RAG systems and workflow automations with n8n, all on a Full Stack foundation with React, Node.js, PHP and SQL and NoSQL databases.',
      secondary: 'I learn by building: experimenting with new technologies and turning ideas into working software. And I care about the details: how a transition feels, how typography breathes, and how a button communicates without needing words.',
      what: 'What I do', areas: '6 areas I work in',
      services: [
        { label: 'Frontend Development', hint: 'React, TypeScript, accessibility' },
        { label: 'Full Stack', hint: 'REST APIs, Node.js, Laravel' },
        { label: 'AI & LLMs', hint: 'RAG, MCP, LLM integration' },
        { label: 'Automation', hint: 'n8n, Playwright, AI-powered QA' },
        { label: 'Databases', hint: 'MySQL, MongoDB, data modeling' },
        { label: 'Performance', hint: 'Core Web Vitals, Lighthouse' },
      ],
      stackReset: 'Reset stack',
      education: 'Education', educationSub: 'Training and continuous learning',
      educationItems: [
        { school: 'U-tad', degree: 'Web Application Development (DAWE)', period: 'Sep 2024 — Jun 2026', description: 'A solid foundation in software engineering, full-stack web development, databases and application design. Final project: Quick Arrival App, with real-time tracking of Madrid’s buses through Madrid’s Regional Transport Consortium (CRTM). Grade: 9.' },
        { school: '42 Madrid', degree: '2024 Pool · Programming Bootcamp', period: 'Jun 2024 — Jul 2024', description: 'C programming fundamentals through hands-on exercises, independent problem-solving, group projects and peer code reviews.' },
      ],
      experience: 'Work experience', experienceSub: 'Internships and real-world teamwork',
      experienceItems: [{ role: 'Web App Developer Intern', company: 'Aitaca', period: 'Feb 2026 — Jun 2026', description: 'Developed and optimized Shopify e-commerce applications with React and Remix, covering backend integration, frontend, unit testing and Lighthouse performance work. Built an automated QA testing framework with Playwright and AI, migrated the company website to a custom WordPress theme (PHP, JavaScript, HTML) and managed deployments and environments with Docker, AWS and Git.' }],
    },
    contact: { eyebrow: 'Contact', title: 'Let’s close the distance', lede: 'Available for projects, collaborations, and job opportunities. If you are building something interesting, I would love to hear about it.', projects: 'View projects', location: 'Location', hours: 'Hours', availability: 'Availability', locationValue: 'Madrid, Spain', hoursValue: 'GMT+1 · Quick responses', availabilityValue: 'Open to work · 2026' },
    actions: { contact: 'Contact me', copied: 'Email copied', copy: 'Copy {email}', showEmail: 'Show email' }, footer: 'Built with React, Three.js and GSAP',
  },
  fr: {
    nav: { home: 'Accueil', projects: 'Projets', about: 'À propos', contact: 'Contact', primary: 'Principal', theme: 'Passer au thème {theme}', language: 'Langue' },
    hero: {
      greeting: 'Salut 👋, je suis Nicolás', title: ['Développeur Web', '& Ingénieur IA'],
      lede: 'Je crée des applications web qui intègrent l’IA pour résoudre des problèmes concrets. Front et back-end, avec le souci du détail.',
      current: 'Actuellement : ouvert aux opportunités et en train de construire des projets avec des LLM, du RAG et des automatisations.', work: 'Voir mon travail', alt: 'Nicolás Furnieles',
    },
    projects: {
      eyebrow: 'Travail sélectionné', title: 'Projets récents', lede: 'Une sélection de projets académiques, personnels et commerciaux. Cliquez sur une carte pour ouvrir la démo en ligne.',
      openLabel: '{title} — ouvrir le site', demoLabel: 'Site de {title}',
      items: {
        'quick-arrival': { tag: 'Projet de fin d’études DAWE · 2026', description: 'Application web pour suivre les bus de Madrid avec les arrivées en temps réel, une carte interactive avec suivi en direct et une fonction collaborative inspirée de Waze.' },
        'cosmos-api': { tag: 'Open source · 2025', description: 'API REST d’astronomie open source construite avec FastAPI. Endpoints sur les planètes, les données spatiales et plus encore.' },
        veta: { tag: 'Produit · 2026', description: 'Outil RAG qui aide les entreprises à trouver les aides publiques pertinentes à partir des données officielles de la BDNS et de l’IA, toujours avec un lien vers la source officielle.' },
        'casas-madera-vip': { tag: 'Commercial · 2026', description: 'Site commercial pour un vrai client spécialisé dans la restauration de maisons en bois, avec une UX interactive moderne et des transitions fluides.' },
      },
    },
    about: {
      eyebrow: 'À propos de moi', title: 'Un peu de mon histoire',
      description: 'Je suis Nicolás Furnieles, développeur web diplômé en développement d’applications web (DAWE) à l’U-tad. Je me concentre sur la création d’applications web qui intègrent l’IA pour résoudre des problèmes concrets : intégration de LLM, MCP, systèmes RAG et automatisation de workflows avec n8n, sur une base Full Stack avec React, Node.js, PHP et des bases de données SQL et NoSQL.',
      secondary: 'J’apprends en construisant : j’expérimente de nouvelles technologies et je transforme des idées en logiciels qui fonctionnent. Et j’aime soigner les détails : le ressenti d’une transition, le souffle d’une typographie et la façon dont un bouton communique sans mots.',
      what: 'Ce que je fais', areas: '6 domaines dans lesquels je travaille',
      services: [
        { label: 'Développement frontend', hint: 'React, TypeScript, accessibilité' },
        { label: 'Full Stack', hint: 'API REST, Node.js, Laravel' },
        { label: 'IA & LLM', hint: 'RAG, MCP, intégration de LLM' },
        { label: 'Automatisation', hint: 'n8n, Playwright, QA avec IA' },
        { label: 'Bases de données', hint: 'MySQL, MongoDB, modélisation' },
        { label: 'Performance', hint: 'Core Web Vitals, Lighthouse' },
      ],
      stackReset: 'Réinitialiser le stack',
      education: 'Formation', educationSub: 'Formation et apprentissage continu',
      educationItems: [
        { school: 'U-tad', degree: 'Développement d’applications web (DAWE)', period: 'Sept 2024 — Juin 2026', description: 'Une base solide en génie logiciel, développement web full stack, bases de données et conception d’applications. Projet de fin d’études : Quick Arrival App, avec le suivi en temps réel des bus de Madrid grâce au Consortium régional des transports (CRTM). Note : 9.' },
        { school: '42 Madrid', degree: 'Piscine 2024 · Bootcamp de programmation', period: 'Juin 2024 — Juil 2024', description: 'Fondamentaux de la programmation en C à travers des exercices pratiques, la résolution autonome de problèmes, des projets de groupe et des revues de code entre pairs.' },
      ],
      experience: 'Expérience professionnelle', experienceSub: 'Stages et travail en équipe',
      experienceItems: [{ role: 'Stagiaire développeur d’applications web', company: 'Aitaca', period: 'Fév 2026 — Juin 2026', description: 'Développement et optimisation d’applications e-commerce Shopify avec React et Remix : intégration backend, frontend, tests unitaires et performances avec Lighthouse. Création d’un framework de QA automatisé avec Playwright et l’IA, migration du site de l’entreprise vers un thème WordPress sur mesure (PHP, JavaScript, HTML) et gestion des déploiements et environnements avec Docker, AWS et Git.' }],
    },
    contact: { eyebrow: 'Contact', title: 'Rapprochons-nous', lede: 'Disponible pour des projets, des collaborations et des opportunités professionnelles. Si vous construisez quelque chose d’intéressant, j’aimerais en savoir plus.', projects: 'Voir les projets', location: 'Localisation', hours: 'Horaires', availability: 'Disponibilité', locationValue: 'Madrid, Espagne', hoursValue: 'GMT+1 · Réponse rapide', availabilityValue: 'Open to work · 2026' },
    actions: { contact: 'Me contacter', copied: 'Email copié', copy: 'Copier {email}', showEmail: 'Afficher l’email' }, footer: 'Créé avec React, Three.js et GSAP',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('language') : null
    return translations[stored] ? stored : 'es'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => {
    const t = translations[language]
    const translate = (value, params = {}) => Object.entries(params).reduce((text, [key, replacement]) => text.replace(`{${key}}`, replacement), value)
    return { language, setLanguage, t, translate }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
