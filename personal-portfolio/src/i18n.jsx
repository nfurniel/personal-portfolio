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
      greeting: 'Hey 👋, soy Nicolás', title: ['Full Stack Developer', '& Estudiante de DAWE'],
      lede: 'Construyo interfaces que se sienten calmadas, cuidadas y silenciosamente rápidas. Front y back, con cariño por los detalles.',
      current: 'Actualmente: trabajando en proyectos personales y abierto a oportunidades.',
      work: 'Ver mi trabajo', alt: 'Nicolás Furnieles',
    },
    projects: { eyebrow: 'Trabajo seleccionado', title: 'Proyectos recientes', lede: 'Una selección de proyectos académicos y personales. Haz clic en cualquier tarjeta para abrir la demo en vivo.', open: 'abrir', demo: 'demo', repo: 'repositorio', stars: 'estrellas en GitHub' },
    about: { eyebrow: 'Sobre mí', title: 'Un poco sobre mi historia', description: 'Soy Nicolás Furnieles, estudiante de segundo año de Desarrollo de Aplicaciones Web y Escritorio (DAWE) en la UTAD. Me apasiona el desarrollo web y estoy constantemente aprendiendo nuevas tecnologías para crear aplicaciones modernas y eficientes. Actualmente me estoy especializando en desarrollo Full Stack, trabajando con React, PHP, Laravel, MySQL y MongoDB.', secondary: 'Fuera del código, me gusta cuidar los detalles: cómo se siente una transición, cómo respira una tipografía, cómo un botón comunica sin necesitar palabras. Creo que la calidad está en lo pequeño.', what: 'Lo que hago', areas: '6 áreas en las que trabajo', education: 'Educación', educationSub: 'Formación y aprendizaje continuo', period: '2024 — 2026', experience: 'Experiencia laboral', experienceSub: 'Prácticas en empresa y trabajo en equipo', experienceItems: [{ role: 'Becario de Desarrollo Frontend', company: 'Aitaca', period: 'Feb 2026 — Jun 2026', description: 'Desarrollo de componentes reutilizables en React y Remix para tiendas Shopify, dentro de un equipo ágil con Git, Docker y AWS. Mantenimiento y optimización de sitios WordPress, afinando el rendimiento con Chrome DevTools.' }] },
    contact: { eyebrow: 'Contacto', title: 'Cerremos la distancia', lede: 'Disponible para proyectos, colaboraciones y prácticas. Si construyes algo interesante, me encantaría escuchar de qué va.', projects: 'Ver proyectos', location: 'Ubicación', hours: 'Horario', availability: 'Disponibilidad', hoursValue: 'GMT+1 · Respondo rápido', availabilityValue: 'Open to work · 2026' },
    actions: { contact: 'Contactar', copied: 'Email copiado', copy: 'Copiar {email}', showEmail: 'Mostrar email' },
    footer: 'Construido con React, Three.js y GSAP',
  },
  en: {
    nav: { home: 'Home', projects: 'Projects', about: 'About', contact: 'Contact', primary: 'Primary', theme: 'Switch to {theme} theme', language: 'Language' },
    hero: {
      greeting: 'Hey 👋, I’m Nicolás', title: ['Full Stack Developer', '& DAWE Student'],
      lede: 'I build interfaces that feel calm, thoughtful, and quietly fast. Front and back end, with care for the details.',
      current: 'Currently: working on personal projects and open to opportunities.', work: 'See my work', alt: 'Nicolás Furnieles',
    },
    projects: { eyebrow: 'Selected work', title: 'Recent projects', lede: 'A selection of academic and personal projects. Click any card to open the live demo.', open: 'open', demo: 'demo', repo: 'repository', stars: 'GitHub stars' },
    about: { eyebrow: 'About me', title: 'A little about my story', description: 'I’m Nicolás Furnieles, a second-year Web and Desktop Application Development (DAWE) student at UTAD. I love web development and constantly learn new technologies to build modern, efficient applications. I’m currently specializing in Full Stack development with React, PHP, Laravel, MySQL, and MongoDB.', secondary: 'Outside of code, I care about the details: how a transition feels, how typography breathes, and how a button communicates without needing words. I believe quality lives in the small things.', what: 'What I do', areas: '6 areas I work in', education: 'Education', educationSub: 'Training and continuous learning', period: '2024 — 2026', experience: 'Work experience', experienceSub: 'Internships and real-world teamwork', experienceItems: [{ role: 'Frontend Developer Intern', company: 'Aitaca', period: 'Feb 2026 — Jun 2026', description: 'Built reusable React and Remix components for Shopify storefronts, working on an agile team with Git, Docker and AWS. Maintained and optimized WordPress sites, fine-tuning performance with Chrome DevTools.' }] },
    contact: { eyebrow: 'Contact', title: 'Let’s close the distance', lede: 'Available for projects, collaborations, and internships. If you are building something interesting, I would love to hear about it.', projects: 'View projects', location: 'Location', hours: 'Hours', availability: 'Availability', hoursValue: 'GMT+1 · Quick responses', availabilityValue: 'Open to work · 2026' },
    actions: { contact: 'Contact me', copied: 'Email copied', copy: 'Copy {email}', showEmail: 'Show email' }, footer: 'Built with React, Three.js and GSAP',
  },
  fr: {
    nav: { home: 'Accueil', projects: 'Projets', about: 'À propos', contact: 'Contact', primary: 'Principal', theme: 'Passer au thème {theme}', language: 'Langue' },
    hero: {
      greeting: 'Salut 👋, je suis Nicolás', title: ['Développeur Full Stack', '& Étudiant DAWE'],
      lede: 'Je crée des interfaces calmes, soignées et discrètement rapides. Front et back-end, avec le souci du détail.',
      current: 'Actuellement : je travaille sur des projets personnels et je suis ouvert aux opportunités.', work: 'Voir mon travail', alt: 'Nicolás Furnieles',
    },
    projects: { eyebrow: 'Travail sélectionné', title: 'Projets récents', lede: 'Une sélection de projets académiques et personnels. Cliquez sur une carte pour ouvrir la démo en ligne.', open: 'ouvrir', demo: 'démo', repo: 'dépôt', stars: 'étoiles GitHub' },
    about: { eyebrow: 'À propos de moi', title: 'Un peu de mon histoire', description: 'Je suis Nicolás Furnieles, étudiant en deuxième année de développement d’applications web et de bureau (DAWE) à l’UTAD. Je suis passionné par le développement web et j’apprends constamment de nouvelles technologies pour créer des applications modernes et efficaces. Je me spécialise actuellement dans le développement Full Stack avec React, PHP, Laravel, MySQL et MongoDB.', secondary: 'En dehors du code, j’aime soigner les détails : le ressenti d’une transition, le souffle d’une typographie et la façon dont un bouton communique sans mots. Je crois que la qualité se trouve dans les petites choses.', what: 'Ce que je fais', areas: '6 domaines dans lesquels je travaille', education: 'Formation', educationSub: 'Formation et apprentissage continu', period: '2024 — 2026', experience: 'Expérience professionnelle', experienceSub: 'Stages et travail en équipe', experienceItems: [{ role: 'Stagiaire développeur frontend', company: 'Aitaca', period: 'Fév 2026 — Juin 2026', description: 'Développement de composants réutilisables en React et Remix pour des boutiques Shopify, au sein d’une équipe agile avec Git, Docker et AWS. Maintenance et optimisation de sites WordPress, avec une attention particulière aux performances via Chrome DevTools.' }] },
    contact: { eyebrow: 'Contact', title: 'Rapprochons-nous', lede: 'Disponible pour des projets, des collaborations et des stages. Si vous construisez quelque chose d’intéressant, j’aimerais en savoir plus.', projects: 'Voir les projets', location: 'Localisation', hours: 'Horaires', availability: 'Disponibilité', hoursValue: 'GMT+1 · Réponse rapide', availabilityValue: 'Open to work · 2026' },
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
