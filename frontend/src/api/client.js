const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return null
  }

  let data
  try {
    data = await response.json()
  } catch (err) {
    data = null
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message || response.statusText
    throw new Error(detail)
  }

  return data
}

export const api = {
  async login(email, password) {
    return request('/auth/login/', { method: 'POST', body: { email, password } })
  },

  // Areas
  listAreas(token) {
    return request('/areas/', { token })
  },
  createArea(token, payload) {
    return request('/areas/', { method: 'POST', body: payload, token })
  },
  updateArea(token, id, payload) {
    return request(`/areas/${id}/`, { method: 'PUT', body: payload, token })
  },
  deleteArea(token, id) {
    return request(`/areas/${id}/`, { method: 'DELETE', token })
  },

  // Employees
  listEmployees(token) {
    return request('/employees/', { token })
  },
  createEmployee(token, payload) {
    return request('/employees/', { method: 'POST', body: payload, token })
  },
  updateEmployee(token, id, payload) {
    return request(`/employees/${id}/`, { method: 'PUT', body: payload, token })
  },
  deleteEmployee(token, id) {
    return request(`/employees/${id}/`, { method: 'DELETE', token })
  },

  // Clients
  listClients(token) {
    return request('/clients/', { token })
  },
  createClient(token, payload) {
    return request('/clients/', { method: 'POST', body: payload, token })
  },
  updateClient(token, id, payload) {
    return request(`/clients/${id}/`, { method: 'PUT', body: payload, token })
  },
  deleteClient(token, id) {
    return request(`/clients/${id}/`, { method: 'DELETE', token })
  },

  // Projects
  listProjects(token, { clientId } = {}) {
    const query = clientId ? `?client_id=${clientId}` : ''
    return request(`/projects/${query}`, { token })
  },
  createProject(token, payload) {
    return request('/projects/', { method: 'POST', body: payload, token })
  },
  updateProject(token, id, payload) {
    return request(`/projects/${id}/`, { method: 'PUT', body: payload, token })
  },
  deleteProject(token, id) {
    return request(`/projects/${id}/`, { method: 'DELETE', token })
  },

  // Claims
  listClaims(token, { status, clientId } = {}) {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (clientId) params.append('client_id', clientId)
    const q = params.toString() ? `?${params.toString()}` : ''
    return request(`/claims/${q}`, { token })
  },
  createClaim(token, payload) {
    return request('/claims/', { method: 'POST', body: payload, token })
  },
  updateClaim(token, id, payload) {
    return request(`/claims/${id}/`, { method: 'PUT', body: payload, token })
  },
  claimTimeline(token, id, { publicOnly = false } = {}) {
    const path = publicOnly ? `/claims/${id}/timeline/?public=1` : `/claims/${id}/timeline/`
    return request(path, { token })
  },
  addComment(token, id, comment) {
    return request(`/claims/${id}/comments/`, { method: 'POST', body: { comment }, token })
  },
  addAction(token, id, action_description) {
    return request(`/claims/${id}/actions/`, { method: 'POST', body: { action_description }, token })
  },
}
