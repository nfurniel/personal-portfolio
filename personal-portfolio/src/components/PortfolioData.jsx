import {
    SiReact,
    SiTypescript,
    SiLaravel,
    SiMysql,
    SiMongodb,
    SiTailwindcss,
    SiBootstrap,
    SiPhp,
    SiGit,
    SiGithub,
    SiHtml5,
    SiCss3,
    SiJavascript,
    SiVite,
    SiLinkedin,
} from 'react-icons/si';

export const portfolioData = {
    header: {
        name: "Nicolás Furnieles",
        title: "Full Stack Developer",
        subtitle: "Estudiante de DAWE apasionado por crear experiencias web modernas y funcionales.",
        social: {
            linkedin: "https://www.linkedin.com/in/nicolas-furnieles-0b9117347/",
            github: "https://github.com/nfurniel",
            email: "mailto:nicopk2018@gmail.com"
        }
    },
    about: {
        title: "Sobre Mí",
        description: "Soy Nicolás Furnieles, estudiante de segundo año de Desarrollo de Aplicaciones Web y Escritorio (DAWE) en la UTAD. Me apasiona el desarrollo web y estoy constantemente aprendiendo nuevas tecnologías para crear aplicaciones modernas y eficientes. Actualmente estoy especializándome en desarrollo Full Stack, trabajando con tecnologías como React, PHP, Laravel y bases de datos como MySQL y MongoDB. Me encanta combinar diseño y funcionalidad para crear experiencias de usuario excepcionales."
    },
    philosophy: [
        {
            title: "Aprendizaje Continuo",
            description: "La tecnología evoluciona constantemente. Me comprometo a mantenerme actualizado con las últimas tendencias y mejores prácticas del desarrollo web."
        },
        {
            title: "Código Limpio",
            description: "Escribir código legible y mantenible es fundamental. Me esfuerzo por seguir las mejores prácticas y convenciones de cada tecnología que utilizo."
        },
        {
            title: "Diseño Responsive",
            description: "Cada aplicación debe funcionar perfectamente en cualquier dispositivo. El diseño responsive no es opcional, es esencial."
        },
        {
            title: "Experiencia de Usuario",
            description: "La tecnología debe servir a las personas. Siempre pienso en cómo hacer que las aplicaciones sean más intuitivas y fáciles de usar."
        }
    ],
    experience: [
        {
            title: "Estudiante de DAWE",
            company: "UTAD",
            period: "Actualidad",
            description: "Cursando segundo año de Desarrollo de Aplicaciones Web y Escritorio. Aprendiendo y aplicando tecnologías modernas de desarrollo web, desde el frontend hasta el backend."
        },
        {
            title: "Proyecto: Aplicación Web con Laravel",
            company: "Académico",
            period: "2024",
            description: "Desarrollo de una aplicación web completa utilizando Laravel. Implementación de sistema de autenticación, CRUD completo y conexión con base de datos MySQL. Diseño responsive con Bootstrap."
        },
        {
            title: "Proyecto: SPA con React y TypeScript",
            company: "Académico",
            period: "2024",
            description: "Creación de una Single Page Application moderna utilizando React y TypeScript. Implementación de componentes reutilizables, gestión de estado y consumo de APIs REST. Estilizado con Tailwind CSS."
        }
    ],
    education: [
        {
            degree: "Desarrollo de Aplicaciones Web y Escritorio (DAWE)",
            school: "UTAD",
            description: "Formación integral en desarrollo web full stack. Frontend (HTML, CSS, JS, React) y Backend (PHP, Laravel, MySQL, MongoDB)."
        },
        {
            degree: "Desarrollo Frontend Moderno",
            school: "UTAD - Formación Académica",
            description: "Especialización en React, TypeScript y frameworks CSS como Bootstrap y Tailwind."
        },
        {
            degree: "Desarrollo Backend y Bases de Datos",
            school: "UTAD - Formación Académica",
            description: "Aprendizaje de PHP, Laravel, MySQL, MongoDB y arquitecturas MVC."
        }
    ],
    skills: [
        { name: "React", level: "Avanzado", icon: <SiReact /> },
        { name: "TypeScript", level: "Intermedio", icon: <SiTypescript /> },
        { name: "JavaScript", level: "Avanzado", icon: <SiJavascript /> },
        { name: "HTML5", level: "Avanzado", icon: <SiHtml5 /> },
        { name: "CSS3", level: "Avanzado", icon: <SiCss3 /> },
        { name: "Tailwind CSS", level: "Avanzado", icon: <SiTailwindcss /> },
        { name: "Bootstrap", level: "Avanzado", icon: <SiBootstrap /> },
        { name: "Laravel", level: "Intermedio", icon: <SiLaravel /> },
        { name: "PHP", level: "Avanzado", icon: <SiPhp /> },
        { name: "MySQL", level: "Avanzado", icon: <SiMysql /> },
        { name: "MongoDB", level: "Intermedio", icon: <SiMongodb /> },
        { name: "Git", level: "Intermedio", icon: <SiGit /> },
        { name: "GitHub", level: "Intermedio", icon: <SiGithub /> },
        { name: "Vite", level: "Intermedio", icon: <SiVite /> }
    ],
    softSkills: [
        "Trabajo en Equipo",
        "Aprendizaje Rápido",
        "Resolución de Problemas",
        "Pasión por el Código"
    ]
};

export const logoLoopItems = portfolioData.skills.map(skill => ({
    node: skill.icon,
    title: skill.name,
    ariaLabel: skill.name
}));
