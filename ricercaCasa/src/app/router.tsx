import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { FavoriteDetailsPage } from '../pages/FavoriteDetailsPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SearchPage } from '../pages/SearchPage'
import { SettingsPage } from '../pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <SearchPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'favorites/:id', element: <FavoriteDetailsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
