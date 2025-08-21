import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import Layout from './components/layout/Layout'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Quizzes from './pages/Quizzes'
import Tutorials from './pages/Tutorials'
import Subjects from './pages/Subjects'
import Colleges from './pages/Colleges'
import Departments from './pages/Departments'
import Courses from './pages/Courses'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'users', element: <Users /> },
      { path: 'quizzes', element: <Quizzes /> },
      { path: 'subjects', element: <Subjects /> },
      { path: 'colleges', element: <Colleges /> },
      { path: 'departments', element: <Departments /> },
      { path: 'courses', element: <Courses /> },
      { path: 'tutorials', element: <Tutorials /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
