import { useI18n } from '../../i18n'
import { useOS } from '../context'
import { FOLDERS } from '../data'
import { appMeta } from '../registry'
import { PixelIcon } from '../icons'

/*
 * A folder window: its contents as an icon grid. Each item opens its own
 * window (a project opens its case file, see Project.jsx).
 */
export function Folder({ folder }) {
  const { t } = useI18n()
  const os = useOS()
  const items = FOLDERS[folder] ?? []

  return (
    <div className="app-folder">
      <p className="app-folder__path">
        ~/{appMeta(folder, {}, t).title}/ · {t.nos.explorer.items.replace('{n}', items.length)}
      </p>
      <ul className="app-folder__grid">
        {items.map((it) => {
          const meta = appMeta(it.app, it.params, t)
          return (
            <li key={meta.title}>
              <button
                type="button"
                className="os-icon"
                style={{ '--app-c': meta.color }}
                onClick={(e) => os.open(it.app, it.params, { from: e.currentTarget })}
              >
                <PixelIcon kind={meta.icon} className="os-icon__art" />
                <span className="os-icon__label">{meta.title}</span>
              </button>
            </li>
          )
        })}
        {folder === 'games' && (
          <li>
            <span className="os-icon is-ghost" aria-hidden="true">
              <PixelIcon kind="gamepad" className="os-icon__art" />
              <span className="os-icon__label">{t.nos.explorer.soon}</span>
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}

export const GamesFolder = () => <Folder folder="games" />
export const ProjectsFolder = () => <Folder folder="projects" />
