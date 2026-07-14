import { NavLink } from 'react-router-dom'
import { PageContainer } from './PageContainer'
import { SearchIcon, HeartIcon, SettingsIcon } from '../ui/Icons'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.8)]'
      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
  }`

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <PageContainer>
        <div className="flex items-center justify-between gap-4 py-4">
          <NavLink className="font-display text-[2rem] font-bold tracking-[-0.04em] text-slate-950" to="/">
            Ricerca<span className="text-blue-600">Casa</span>
          </NavLink>

          <nav className="flex items-center gap-2">
            <NavLink className={linkClass} end to="/">
              <SearchIcon className="h-4 w-4" />
              Ricerca
            </NavLink>
            <NavLink className={linkClass} to="/favorites">
              <HeartIcon className="h-4 w-4" />
              Preferiti
            </NavLink>
            <NavLink className={linkClass} to="/settings">
              <SettingsIcon className="h-4 w-4" />
              Impostazioni
            </NavLink>
          </nav>
        </div>
      </PageContainer>
    </header>
  )
}
