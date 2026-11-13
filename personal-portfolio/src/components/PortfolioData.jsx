import {
    SiReact,
    SiNextdotjs,
    SiRemix,
    SiAstro,
    SiTypescript,
    SiJavascript,
    SiHtml5,
    SiCss3,
    SiTailwindcss,
    SiBootstrap,
    SiNodedotjs,
    SiPython,
    SiOpenjdk,
    SiPhp,
    SiLaravel,
    SiPostgresql,
    SiMysql,
    SiMongodb,
    SiSupabase,
    SiDocker,
    SiAmazonwebservices,
    SiVercel,
    SiGithub,
    SiGithubactions,
    SiShopify,
    SiClaude,
} from 'react-icons/si';
import {
    LuBot,
    LuDatabase,
    LuDatabaseZap,
    LuFlaskConical,
    LuMessageSquareText,
    LuPlug,
    LuSparkles,
    LuWorkflow,
    LuZap,
} from 'react-icons/lu';

// stack.json: the same four groups as the CV. Levels: Avanzado, Medio-alto, Intermedio, Básico.
const stack = [
    {
        group: 'frontend',
        items: [
            { name: 'React', level: 'Avanzado', icon: <SiReact /> },
            { name: 'Next.js', level: 'Intermedio', icon: <SiNextdotjs /> },
            { name: 'Remix', level: 'Intermedio', icon: <SiRemix /> },
            { name: 'JavaScript (ES6+)', level: 'Avanzado', icon: <SiJavascript /> },
            { name: 'TypeScript', level: 'Básico', icon: <SiTypescript /> },
            { name: 'Astro', level: 'Intermedio', icon: <SiAstro /> },
            { name: 'HTML5', level: 'Avanzado', icon: <SiHtml5 /> },
            { name: 'CSS3', level: 'Avanzado', icon: <SiCss3 /> },
            { name: 'Tailwind CSS', level: 'Avanzado', icon: <SiTailwindcss /> },
            { name: 'Bootstrap', level: 'Avanzado', icon: <SiBootstrap /> },
        ],
    },
    {
        group: 'backend_db',
        items: [
            { name: 'Node.js', level: 'Medio-alto', icon: <SiNodedotjs /> },
            { name: 'Python', level: 'Medio-alto', icon: <SiPython /> },
            { name: 'Java', level: 'Intermedio', icon: <SiOpenjdk /> },
            { name: 'PHP', level: 'Avanzado', icon: <SiPhp /> },
            { name: 'Laravel', level: 'Intermedio', icon: <SiLaravel /> },
            { name: 'SQL', level: 'Avanzado', icon: <LuDatabase /> },
            { name: 'PostgreSQL (pgvector)', level: 'Intermedio', icon: <SiPostgresql /> },
            { name: 'MySQL', level: 'Avanzado', icon: <SiMysql /> },
            { name: 'MongoDB', level: 'Intermedio', icon: <SiMongodb /> },
            { name: 'Supabase', level: 'Avanzado', icon: <SiSupabase /> },
        ],
    },
    {
        group: 'cloud_tools',
        items: [
            { name: 'Docker', level: 'Intermedio', icon: <SiDocker /> },
            { name: 'AWS', level: 'Intermedio', icon: <SiAmazonwebservices /> },
            { name: 'Vercel', level: 'Avanzado', icon: <SiVercel /> },
            { name: 'Serverless · Edge Functions', level: 'Medio-alto', icon: <LuZap /> },
            { name: 'Git · GitHub', level: 'Avanzado', icon: <SiGithub /> },
            { name: 'GitHub Actions', level: 'Medio-alto', icon: <SiGithubactions /> },
            { name: 'Playwright', level: 'Medio-alto', icon: <LuFlaskConical /> },
            { name: 'Shopify Dev', level: 'Intermedio', icon: <SiShopify /> },
        ],
    },
    {
        group: 'ai',
        items: [
            { name: 'Claude API', level: 'Avanzado', icon: <SiClaude /> },
            { name: 'RAG', level: 'Medio-alto', icon: <LuDatabaseZap /> },
            { name: 'AI agents', level: 'Medio-alto', icon: <LuBot /> },
            { name: 'n8n', level: 'Intermedio', icon: <LuWorkflow /> },
            { name: 'MCP servers', level: 'Intermedio', icon: <LuPlug /> },
            { name: 'LLM integration', level: 'Avanzado', icon: <LuSparkles /> },
            { name: 'Prompt engineering', level: 'Medio-alto', icon: <LuMessageSquareText /> },
        ],
    },
];

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
    stack,
    skills: stack.flatMap((g) => g.items),
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
