import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api/client'
import { LoginScreen } from './components/LoginScreen'
import { Layout } from './components/Layout'
import { Overview } from './components/Overview'
import { AreasPanel } from './components/AreasPanel'
import { EmployeesPanel } from './components/EmployeesPanel'
import { ClientsPanel } from './components/ClientsPanel'
import { ProjectsPanel } from './components/ProjectsPanel'
import { ClaimsPanel } from './components/ClaimsPanel'
import { MyClaimsPanel } from './components/MyClaimsPanel'
import { useAuth } from './hooks/useAuth'

function App() {
  const { token, user, role, login, logout, loading: authLoading, error: authError } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [areas, setAreas] = useState([])
  const [clients, setClients] = useState([])
  const [bootstrapError, setBootstrapError] = useState(null)
  const [projects, setProjects] = useState([])

  const isAdmin = role === 'admin'
  const isEmployee = role === 'employee'
  const isClient = role === 'client'

  const fetchAreas = useCallback(async () => {
    if (!token || !(isAdmin || isEmployee)) return
    const data = await api.listAreas(token)
    setAreas(data)
  }, [token, isAdmin, isEmployee])

  const fetchClients = useCallback(async () => {
    if (!token || !isAdmin) return
    const data = await api.listClients(token)
    setClients(data)
  }, [token, isAdmin])

  const fetchProjects = useCallback(async () => {
    if (!token) return
    const data = await api.listProjects(token)
    setProjects(data)
  }, [token])

  useEffect(() => {
    if (!token) return
    setBootstrapError(null)

    const bootstrap = async () => {
      if (!(isAdmin || isEmployee)) {
        setAreas([])
        setClients([])
        return
      }
      try {
        if (isAdmin) {
          await Promise.all([fetchAreas(), fetchClients(), fetchProjects()])
        } else if (isEmployee) {
          await Promise.all([fetchAreas(), fetchProjects()])
        } else {
          await fetchProjects()
        }
      } catch (err) {
        setBootstrapError(err.message)
      }
    }

    bootstrap()
  }, [token, isAdmin, isEmployee, fetchAreas, fetchClients, fetchProjects])

  useEffect(() => {
    if (!token) {
      setActiveTab('overview')
    }
  }, [token])

  const tabs = useMemo(() => {
    if (!token) return []
    if (isAdmin) {
      return [
        { id: 'overview', label: 'Resumen' },
        { id: 'areas', label: 'Áreas' },
        { id: 'employees', label: 'Empleados' },
        { id: 'clients', label: 'Clientes' },
        { id: 'projects', label: 'Proyectos' },
        { id: 'claims', label: 'Reclamos' },
      ]
    }
    if (isEmployee) {
      return [
        { id: 'overview', label: 'Resumen' },
        { id: 'projects', label: 'Proyectos' },
        { id: 'claims', label: 'Reclamos' },
      ]
    }
    if (isClient) {
      return [
        { id: 'overview', label: 'Resumen' },
        { id: 'projects', label: 'Mis Proyectos' },
        { id: 'claims', label: 'Mis Reclamos' },
      ]
    }
    return [
      { id: 'overview', label: 'Resumen' },
    ]
  }, [token, isAdmin, isEmployee, isClient])

  if (!token) {
    return <LoginScreen onLogin={login} loading={authLoading} error={authError} />
  }

  return (
    <Layout
      user={user}
      role={role}
      onLogout={logout}
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {bootstrapError ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">
          {bootstrapError}
        </div>
      ) : null}

      {activeTab === 'overview' ? <Overview user={{ ...user, role }} /> : null}

      {activeTab === 'areas' && isAdmin ? (
        <AreasPanel token={token} onChange={setAreas} />
      ) : null}

      {activeTab === 'employees' && isAdmin ? <EmployeesPanel token={token} areas={areas} /> : null}

      {activeTab === 'clients' && isAdmin ? (
        <ClientsPanel token={token} onChange={setClients} />
      ) : null}

      {activeTab === 'projects' ? (
        <ProjectsPanel token={token} role={role} clients={isAdmin ? clients : []} />
      ) : null}
      {activeTab === 'claims' && (isAdmin || isEmployee) ? (
        <ClaimsPanel token={token} areas={areas} projects={projects} clients={clients} />
      ) : null}
      {activeTab === 'claims' && isClient ? <MyClaimsPanel token={token} projects={projects} /> : null}
    </Layout>
  )
}

export default App
