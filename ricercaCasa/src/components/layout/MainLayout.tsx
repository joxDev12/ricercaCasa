import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  )
}
