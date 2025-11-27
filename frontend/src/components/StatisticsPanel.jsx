import { useState, useEffect } from 'react';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import DoughnutChart from './charts/DoughnutChart';
import {
  getClaimsByMonth,
  getClaimsByStatus,
  getClaimsByType,
  getClaimsByArea,
  getClaimsByProject,
  getAverageResolutionTime,
  getRatingStats,
  getClaimsByEmployee,
} from '../api/statistics';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';

const StatisticsPanel = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Filtros independientes para cada estadística
  const [ratingFilters, setRatingFilters] = useState({ 
    year: '',
    month: ''
  });
  const [projectFilters, setProjectFilters] = useState({ 
    year: '',
    month: ''
  });
  const [statusFilters, setStatusFilters] = useState({ projectId: '' });
  const [typeFilters, setTypeFilters] = useState({});
  
  // Datos
  const [ratingStats, setRatingStats] = useState([]);
  const [claimsByProject, setClaimsByProject] = useState([]);
  const [claimsByStatus, setClaimsByStatus] = useState([]);
  const [claimsByEmployee, setClaimsByEmployee] = useState([]);
  const [claimsByType, setClaimsByType] = useState([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [resolvedClaims, setResolvedClaims] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [inProgressClaims, setInProgressClaims] = useState(0);
  
  // Opciones para filtros (solo para admin/employee)
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [authError, setAuthError] = useState(false);
  const [employeeFilters, setEmployeeFilters] = useState({});

  useEffect(() => {
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    
    if (!user) {
      return;
    }
    
    setAuthError(false);
    loadFilterOptions();
    loadAllStatistics();
  }, [user, token]);

  const loadFilterOptions = async () => {
    try {
      if (user.role === 'admin' || user.role === 'employee') {
        const clientsData = await client.get('/clients/', token);
        setClients(clientsData || []);
        
        const areasData = await client.get('/areas/', token);
        setAreas(areasData || []);
      }
      
      const projectsData = await client.get('/projects/', token);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      if (error.message === 'Token inválido') {
        setAuthError(true);
      }
    }
  };

  const loadAllStatistics = async () => {
    setLoading(true);
    try {
      if (user.role === 'client') {
        await Promise.all([
          loadRatingStats(),
          loadClaimsByProject(),
          loadClaimsByStatus(),
          loadClaimsByType(),
          loadClaimsTotals(),
        ]);
      } else if (user.role === 'employee' || user.role === 'admin') {
        await Promise.all([
          loadRatingStats(),
          loadClaimsByProject(),
          loadClaimsByStatus(),
          loadClaimsByType(),
          loadClaimsTotals(),
          loadClaimsByArea(),
          loadClaimsByEmployee(),
        ]);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatingStats = async (filters = null) => {
    try {
      const data = await getRatingStats(filters || ratingFilters);
      setRatingStats(data || []);
    } catch (error) {
      console.error('Error cargando calificaciones:', error);
      setRatingStats([]);
    }
  };

  const loadClaimsByProject = async (filters = null) => {
    try {
      const data = await getClaimsByProject(filters || projectFilters);
      setClaimsByProject(data || []);
    } catch (error) {
      console.error('Error:', error);
      setClaimsByProject([]);
    }
  };

  const loadClaimsByStatus = async (filters = null) => {
    try {
      const data = await getClaimsByStatus(filters || statusFilters);
      setClaimsByStatus(data || []);
    } catch (error) {
      console.error('Error cargando datos por estado:', error);
      setClaimsByStatus([]);
    }
  };

  const loadClaimsByType = async (filters = null) => {
    try {
      const data = await getClaimsByType(filters || typeFilters);
      setClaimsByType(data || []);
    } catch (error) {
      console.error('Error cargando tipos de reclamos:', error);
      setClaimsByType([]);
    }
  };

  const [claimsByArea, setClaimsByArea] = useState([]);
  const [areaFilters, setAreaFilters] = useState({});

  const loadClaimsByArea = async (filters = null) => {
    try {
      const data = await getClaimsByArea(filters || areaFilters);
      setClaimsByArea(data || []);
    } catch (error) {
      console.error('Error:', error);
      setClaimsByArea([]);
    }
  };

  const loadClaimsByEmployee = async (filters = null) => {
    try {
      const data = await getClaimsByEmployee(filters || employeeFilters);
      setClaimsByEmployee(data || []);
    } catch (error) {
      console.error('Error:', error);
      setClaimsByEmployee([]);
    }
  };

  const loadClaimsTotals = async () => {
    try {
      const claims = await client.get('/claims/', token);
      const total = claims.length;
      const resolved = claims.filter(c => c.status === 'Resuelto').length;
      const pending = claims.filter(c => c.status === 'Ingresado').length;
      const inProgress = claims.filter(c => c.status === 'En Proceso').length;
      setTotalClaims(total);
      setResolvedClaims(resolved);
      setPendingClaims(pending);
      setInProgressClaims(inProgress);
    } catch (error) {
      console.error('Error cargando totales:', error);
      setTotalClaims(0);
      setResolvedClaims(0);
      setPendingClaims(0);
      setInProgressClaims(0);
    }
  };

  // Preparar datos para gráficos
  const ratingChartData = {
    labels: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
    datasets: [
      {
        label: 'Cantidad de calificaciones',
        data: ratingStats.length > 0 
          ? ratingStats.map(item => item.count)
          : [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(248, 113, 113, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(96, 165, 250, 0.7)',
          'rgba(167, 139, 250, 0.7)',
          'rgba(52, 211, 153, 0.7)',
        ],
        borderColor: [
          'rgba(248, 113, 113, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(96, 165, 250, 1)',
          'rgba(167, 139, 250, 1)',
          'rgba(52, 211, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const projectChartData = {
    labels: claimsByProject.map(item => item.project) || [],
    datasets: [
      {
        label: 'Reclamos',
        data: claimsByProject.map(item => item.count) || [],
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
        borderColor: 'rgba(96, 165, 250, 1)',
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: claimsByStatus.map(item => item.status) || [],
    datasets: [
      {
        data: claimsByStatus.map(item => item.count) || [],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',
          'rgba(96, 165, 250, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(248, 113, 113, 0.8)',
        ],
        borderColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(96, 165, 250, 1)',
          'rgba(52, 211, 153, 1)',
          'rgba(248, 113, 113, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const typeChartData = {
    labels: claimsByType.map(item => item.type) || [],
    datasets: [
      {
        data: claimsByType.map(item => item.count) || [],
        backgroundColor: [
          'rgba(167, 139, 250, 0.8)',
          'rgba(244, 114, 182, 0.8)',
          'rgba(96, 165, 250, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(248, 113, 113, 0.8)',
        ],
        borderColor: '#1e293b',
        borderWidth: 2,
      },
    ],
  };

  const areaChartData = {
    labels: claimsByArea.map(item => item.area) || [],
    datasets: [
      {
        label: 'Reclamos',
        data: claimsByArea.map(item => item.count) || [],
        backgroundColor: 'rgba(167, 139, 250, 0.7)',
        borderColor: 'rgba(167, 139, 250, 1)',
        borderWidth: 1,
      },
    ],
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (authError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center rounded-xl border border-red-800 bg-gradient-to-br from-red-900/90 to-red-900/50 backdrop-blur-sm p-8">
          <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-xl font-semibold text-red-100 mb-2">Sesión Expirada</h3>
          <p className="text-red-200 mb-4">Tu sesión ha expirado. Por favor, inicia sesión nuevamente.</p>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Estadísticas y Métricas</h1>
        <p className="text-slate-400 text-sm">
          {user.role === 'client' && 'Visualiza las estadísticas de tus reclamos'}
          {user.role === 'employee' && 'Visualiza las estadísticas de los reclamos que gestionas'}
          {user.role === 'admin' && 'Visualiza las estadísticas globales del sistema'}
        </p>
      </div>

      {/* ESTADÍSTICAS PARA CLIENTES */}
      {user.role === 'client' && (
        <>
          {/* Números totales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Reclamos Totales</p>
                  <p className="text-4xl font-bold text-blue-400">{totalClaims}</p>
                </div>
                <div className="rounded-full bg-blue-500/20 p-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Reclamos Resueltos</p>
                  <p className="text-4xl font-bold text-green-400">{resolvedClaims}</p>
                </div>
                <div className="rounded-full bg-green-500/20 p-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Calificaciones de Satisfacción */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Calificaciones de Satisfacción</h2>
              <div className="flex gap-2">
                <select
                  value={ratingFilters.year || ''}
                  onChange={(e) => {
                    const newFilters = { ...ratingFilters, year: e.target.value };
                    setRatingFilters(newFilters);
                    loadRatingStats(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los años</option>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <select
                  value={ratingFilters.month || ''}
                  onChange={(e) => {
                    const newFilters = { ...ratingFilters, month: e.target.value };
                    setRatingFilters(newFilters);
                    loadRatingStats(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los meses</option>
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-80">
              {ratingStats && ratingStats.length > 0 && ratingStats.some(r => r.count > 0) ? (
                <BarChart data={ratingChartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">No hay calificaciones para este período</p>
                </div>
              )}
            </div>
          </div>

          {/* Reclamos por Proyecto */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Reclamos por Proyecto</h2>
              <div className="flex gap-2">
                <select
                  value={projectFilters.year || new Date().getFullYear()}
                  onChange={(e) => {
                    const newFilters = { ...projectFilters, year: e.target.value };
                    setProjectFilters(newFilters);
                    loadClaimsByProject(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los años</option>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <select
                  value={projectFilters.month || ''}
                  onChange={(e) => {
                    const newFilters = { ...projectFilters, month: e.target.value };
                    setProjectFilters(newFilters);
                    loadClaimsByProject(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los meses</option>
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-80">
              {claimsByProject && claimsByProject.length > 0 ? (
                <BarChart data={projectChartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">No hay datos disponibles para este período</p>
                </div>
              )}
            </div>
          </div>

          {/* Reclamos por Estado */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Reclamos por Estado</h2>
              <div className="flex gap-2">
                <select
                  value={statusFilters.projectId || ''}
                  onChange={(e) => {
                    const newFilters = { ...statusFilters, projectId: e.target.value };
                    setStatusFilters(newFilters);
                    loadClaimsByStatus(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-80">
              {claimsByStatus && claimsByStatus.length > 0 ? (
                <DoughnutChart data={statusChartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ESTADÍSTICAS PARA EMPLEADOS Y ADMIN */}
      {(user.role === 'employee' || user.role === 'admin') && (
        <>
          {/* Números totales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Reclamos Totales</p>
                  <p className="text-4xl font-bold text-blue-400">{totalClaims}</p>
                </div>
                <div className="rounded-full bg-blue-500/20 p-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Resueltos</p>
                  <p className="text-4xl font-bold text-green-400">{resolvedClaims}</p>
                </div>
                <div className="rounded-full bg-green-500/20 p-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">En Proceso</p>
                  <p className="text-4xl font-bold text-yellow-400">{inProgressClaims}</p>
                </div>
                <div className="rounded-full bg-yellow-500/20 p-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Pendientes</p>
                  <p className="text-4xl font-bold text-orange-400">{pendingClaims}</p>
                </div>
                <div className="rounded-full bg-orange-500/20 p-4">
                  <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Reclamos por Estado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Reclamos por Estado</h2>
                <div className="flex gap-2">
                  <select
                    value={statusFilters.clientId || ''}
                    onChange={(e) => {
                      const newFilters = { ...statusFilters, clientId: e.target.value };
                      setStatusFilters(newFilters);
                      loadClaimsByStatus(newFilters);
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.company_name || client.full_name || client.email}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilters.projectId || ''}
                    onChange={(e) => {
                      const newFilters = { ...statusFilters, projectId: e.target.value };
                      setStatusFilters(newFilters);
                      loadClaimsByStatus(newFilters);
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los proyectos</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-80">
                {claimsByStatus && claimsByStatus.length > 0 ? (
                  <DoughnutChart data={statusChartData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm">No hay datos disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tipos de Reclamos */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Tipos de Reclamos</h2>
                <div className="flex gap-2">
                  <select
                    value={typeFilters.clientId || ''}
                    onChange={(e) => {
                      const newFilters = { ...typeFilters, clientId: e.target.value };
                      setTypeFilters(newFilters);
                      loadClaimsByType(newFilters);
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.company_name || client.full_name || client.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-80">
                {claimsByType && claimsByType.length > 0 ? (
                  <PieChart data={typeChartData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm">No hay datos disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reclamos por Proyecto */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Reclamos por Proyecto</h2>
              <div className="flex gap-2">
                <select
                  value={projectFilters.clientId || ''}
                  onChange={(e) => {
                    const newFilters = { ...projectFilters, clientId: e.target.value };
                    setProjectFilters(newFilters);
                    loadClaimsByProject(newFilters);
                  }}
                  className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los clientes</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.company_name || client.full_name || client.email}</option>
                  ))}
                </select>
                <select
                  value={projectFilters.year || ''}
                  onChange={(e) => {
                    const newFilters = { ...projectFilters, year: e.target.value };
                    setProjectFilters(newFilters);
                    loadClaimsByProject(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los años</option>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <select
                  value={projectFilters.month || ''}
                  onChange={(e) => {
                    const newFilters = { ...projectFilters, month: e.target.value };
                    setProjectFilters(newFilters);
                    loadClaimsByProject(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los meses</option>
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-80">
              {claimsByProject && claimsByProject.length > 0 ? (
                <BarChart data={projectChartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">No hay datos disponibles para este período</p>
                </div>
              )}
            </div>
          </div>

          {/* Calificaciones de Satisfacción */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Calificaciones de Satisfacción</h2>
              <div className="flex gap-2">
                <select
                  value={ratingFilters.clientId || ''}
                  onChange={(e) => {
                    const newFilters = { ...ratingFilters, clientId: e.target.value };
                    setRatingFilters(newFilters);
                    loadRatingStats(newFilters);
                  }}
                  className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los clientes</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.company_name || client.full_name || client.email}</option>
                  ))}
                </select>
                <select
                  value={ratingFilters.year || ''}
                  onChange={(e) => {
                    const newFilters = { ...ratingFilters, year: e.target.value };
                    setRatingFilters(newFilters);
                    loadRatingStats(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los años</option>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <select
                  value={ratingFilters.month || ''}
                  onChange={(e) => {
                    const newFilters = { ...ratingFilters, month: e.target.value };
                    setRatingFilters(newFilters);
                    loadRatingStats(newFilters);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los meses</option>
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-80">
              {ratingStats && ratingStats.length > 0 && ratingStats.some(r => r.count > 0) ? (
                <BarChart data={ratingChartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-sm">No hay calificaciones para este período</p>
                </div>
              )}
            </div>
          </div>

          {/* Carga por Área */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Carga de Trabajo por Área</h2>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={areaFilters.startDate || ''}
                    onChange={(e) => {
                      const newFilters = { ...areaFilters, startDate: e.target.value };
                      setAreaFilters(newFilters);
                      loadClaimsByArea(newFilters);
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={areaFilters.endDate || ''}
                    onChange={(e) => {
                      const newFilters = { ...areaFilters, endDate: e.target.value };
                      setAreaFilters(newFilters);
                      loadClaimsByArea(newFilters);
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="h-80">
                {claimsByArea && claimsByArea.length > 0 ? (
                  <BarChart data={areaChartData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm">No hay datos disponibles para este período</p>
                  </div>
                )}
              </div>
            </div>

          {/* Reclamos Atendidos por Empleado */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Reclamos Atendidos por Empleado</h2>
              </div>
              <div className="overflow-x-auto">
                {claimsByEmployee && claimsByEmployee.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-300">
                      <tr>
                        <th className="px-6 py-3">Empleado</th>
                        <th className="px-6 py-3">Área</th>
                        <th className="px-6 py-3">Total Reclamos</th>
                        <th className="px-6 py-3">Resueltos</th>
                        <th className="px-6 py-3">Pendientes</th>
                        <th className="px-6 py-3">% Resueltos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimsByEmployee.map((emp, index) => {
                        const pending = emp.total - emp.resolved;
                        const percentage = emp.total > 0 ? ((emp.resolved / emp.total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-100">{emp.employee}</td>
                            <td className="px-6 py-4 text-slate-300">{emp.area}</td>
                            <td className="px-6 py-4 text-blue-400 font-semibold">{emp.total}</td>
                            <td className="px-6 py-4 text-green-400 font-semibold">{emp.resolved}</td>
                            <td className="px-6 py-4 text-yellow-400 font-semibold">{pending}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-slate-300 text-xs whitespace-nowrap">{percentage}%</span>
                              </div>
                            </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-slate-400 text-sm">No hay datos disponibles para este período</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsPanel;
