import client from './client';

// Helper para obtener el token de la sesión
const getToken = () => {
  const session = localStorage.getItem('claims_session');
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    return parsed.token;
  } catch {
    return null;
  }
};

export const getStatistics = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.employeeId) params.append('employee_id', filters.employeeId);
  if (filters.projectType) params.append('project_type', filters.projectType);
  if (filters.areaId) params.append('area_id', filters.areaId);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/?${params.toString()}`, token);
  return response;
};

export const getClaimsByMonth = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.employeeId) params.append('employee_id', filters.employeeId);
  if (filters.year) params.append('year', filters.year);
  
  const response = await client.get(`/statistics/by-month/?${params.toString()}`, token);
  return response;
};

export const getClaimsByStatus = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.employeeId) params.append('employee_id', filters.employeeId);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/by-status/?${params.toString()}`, token);
  return response;
};

export const getClaimsByType = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.employeeId) params.append('employee_id', filters.employeeId);
  if (filters.areaId) params.append('area_id', filters.areaId);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/by-type/?${params.toString()}`, token);
  return response;
};

export const getClaimsByArea = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/by-area/?${params.toString()}`, token);
  return response;
};

export const getClaimsByProject = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.year) params.append('year', filters.year);
  if (filters.month) params.append('month', filters.month);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/by-project/?${params.toString()}`, token);
  return response;
};

export const getAverageResolutionTime = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.employeeId) params.append('employee_id', filters.employeeId);
  if (filters.areaId) params.append('area_id', filters.areaId);
  if (filters.claimType) params.append('claim_type', filters.claimType);
  
  const response = await client.get(`/statistics/avg-resolution-time/?${params.toString()}`, token);
  return response;
};

export const getKPIs = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.employeeId) params.append('employee_id', filters.employeeId);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/kpis/?${params.toString()}`, token);
  return response;
};

export const getRatingStats = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.clientId) params.append('client_id', filters.clientId);
  if (filters.year) params.append('year', filters.year);
  if (filters.month) params.append('month', filters.month);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/ratings/?${params.toString()}`, token);
  return response;
};

export const getClaimsByEmployee = async (filters = {}) => {
  const token = getToken();
  const params = new URLSearchParams();
  
  if (filters.areaId) params.append('area_id', filters.areaId);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await client.get(`/statistics/by-employee/?${params.toString()}`, token);
  return response;
};
