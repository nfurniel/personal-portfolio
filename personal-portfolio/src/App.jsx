import './App.css'
import NicolasOS from './os/NicolasOS'
import { I18nProvider } from './i18n'

/*
 * The portfolio is Nicolás OS: one screen with a terminal card that boots
 * into a desktop holding every part of it, on a plain black page.
 */

export default function App() {
  return (
    <I18nProvider>
      <NicolasOS />
    </I18nProvider>
  )
}
