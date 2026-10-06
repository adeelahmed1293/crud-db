/**
 * API Service Client Module
 */

/**
 * Fetch students list with search, status filtering and sorting
 */
export async function apiGetStudents({ search = '', status = 'All', sortBy = 'created_at', order = -1 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  params.append('sort_by', sortBy);
  params.append('order', order);

  const res = await fetch(`/api/students?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch dashboard stats
 */
export async function apiGetStats() {
  const res = await fetch('/api/students/stats');
  if (!res.ok) {
    throw new Error('Failed to fetch statistics');
  }
  return await res.json();
}

/**
 * Create a new student
 */
export async function apiCreateStudent(payload) {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error creating student: ${res.status}`);
  }
  return await res.json();
}

/**
 * Update an existing student
 */
export async function apiUpdateStudent(id, payload) {
  const res = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error updating student: ${res.status}`);
  }
  return await res.json();
}

/**
 * Delete a student
 */
export async function apiDeleteStudent(id) {
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error deleting student: ${res.status}`);
  }
  return await res.json();
}

/**
 * Seed dummy students
 */
export async function apiSeedStudents(force = true) {
  const res = await fetch(`/api/students/seed?force=${force}`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Seeding failed');
  }
  return await res.json();
}

/**
 * Check database health
 */
export async function apiCheckHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error('Health check endpoint failed');
  }
  return await res.json();
}

/**
 * Update MongoDB connection URI
 */
export async function apiUpdateMongoUri(mongoUri) {
  const res = await fetch('/api/update-mongo-uri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mongodb_url: mongoUri })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update MongoDB URI');
  }
  return await res.json();
}
