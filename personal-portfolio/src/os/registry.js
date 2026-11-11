import { GamesFolder, ProjectsFolder } from './apps/files'
import { About, Career, Contact, Cv, Readme, Settings, Stack } from './apps/content'
import Project from './apps/Project'
import TerminalShell from './TerminalShell'
import Browser from './apps/Browser'
import Snake from './apps/Snake'
import Doom from './apps/Doom'
import { PROJECTS } from './data'

/*
 * Every app Nicolás OS knows about. To add one: write the component in
 * apps/, add an entry here (pixel icon from icons.jsx, accent colour,
 * preferred window width) and its name/file label to i18n (t.nos.apps /
 * t.nos.files). Put it on the desktop via DESKTOP or in a folder via FOLDERS
 * (data.js).
 */
export const APPS = {
  browser: { icon: 'globe', color: '#6ea8ff', width: 1000, height: 680, bodyClass: 'is-flush', Component: Browser },
  projects: { icon: 'folder', color: '#6ea8ff', width: 560, Component: ProjectsFolder, folder: true },
  // One window per project file (opened from the Proyectos folder).
  project: { icon: 'doc', color: '#6ea8ff', width: 660, Component: Project },
  terminal: { icon: 'terminal', color: '#6ef2b0', width: 720, height: 460, bodyClass: 'is-flush', Component: TerminalShell },
  about: { icon: 'user', color: '#ff9ffc', width: 820, Component: About },
  career: { icon: 'briefcase', color: '#b79bff', width: 720, Component: Career },
  stack: { icon: 'chip', color: '#6ef2b0', width: 560, Component: Stack },
  contact: { icon: 'mail', color: '#ffcf5c', width: 600, Component: Contact },
  cv: { icon: 'doc', color: '#ff8a72', width: 640, Component: Cv },
  games: { icon: 'folder', color: '#9dff6e', width: 520, Component: GamesFolder, folder: true },
  snake: { icon: 'snake', color: '#9dff6e', width: 460, Component: Snake },
  doom: { icon: 'skull', color: '#ff6b4a', width: 780, bodyClass: 'is-snug', Component: Doom },
  settings: { icon: 'gear', color: '#9cc3e0', width: 560, Component: Settings },
  readme: { icon: 'doc', color: '#ecebf5', width: 520, Component: Readme },
}

/** Title (file name), icon, accent colour and display name, in the current language. */
export function appMeta(app, params = {}, t) {
  if (app === 'project') {
    const p = PROJECTS.find((x) => x.id === params.id)
    return { title: p.file, icon: p.icon, color: p.color, name: p.title }
  }
  const def = APPS[app]
  return { title: t.nos.files[app], icon: def.icon, color: def.color, name: t.nos.apps[app] }
}
