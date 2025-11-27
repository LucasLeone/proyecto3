import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import client from '../api/client';

const StatisticsFilters = ({ onFilterChange, userRole, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    clientId: initialFilters.clientId || '',
    employeeId: initialFilters.employeeId || '',
    projectType: initialFilters.projectType || '',
    areaId: initialFilters.areaId || '',
    status: initialFilters.status || '',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    year: initialFilters.year || new Date().getFullYear(),
  });

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (userRole === 'admin' || userRole === 'employee') {
        const clientsData = await client.get('/clients/', token);
        setClients(clientsData || []);
      }
      
      if (userRole === 'admin') {
        const employeesData = await client.get('/employees/', token);
        setEmployees(employeesData || []);
      }
      
      const areasData = await client.get('/areas/', token);
      setAreas(areasData || []);
      
      const projectsData = await client.get('/projects/', token);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error al cargar opciones de filtros:', error);
      setClients([]);
      setEmployees([]);
      setAreas([]);
      setProjects([]);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      clientId: '',
      employeeId: '',
      projectType: '',
      areaId: '',
      status: '',
      startDate: '',
      endDate: '',
      year: new Date().getFullYear(),
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'resolved', label: 'Resuelto' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  // Generar años para el selector
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Filtros</h2>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de Cliente - Solo visible para admin y empleados */}
        {(userRole === 'admin' || userRole === 'employee') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={filters.clientId}
              onChange={(e) => handleFilterChange('clientId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name || client.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro de Empleado - Solo visible para admin */}
        {userRole === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empleado
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los empleados</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name || employee.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro de Tipo de Proyecto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proyecto
          </label>
          <select
            value={filters.projectType}
            onChange={(e) => handleFilterChange('projectType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Área */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Área
          </label>
          <select
            value={filters.areaId}
            onChange={(e) => handleFilterChange('areaId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Año */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año
          </label>
          <select
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Fecha Inicio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro de Fecha Fin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

StatisticsFilters.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  userRole: PropTypes.oneOf(['client', 'employee', 'admin']).isRequired,
  initialFilters: PropTypes.object,
};

export default StatisticsFilters;
