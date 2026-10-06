/**
 * UI Renderer Module
 */

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getInitials(fullName) {
  const names = (fullName || 'Student').trim().split(' ');
  return names.length > 1
    ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
    : names[0].substring(0, 2).toUpperCase();
}

export function getStatusBadge(status) {
  const st = (status || 'Active').toLowerCase();
  let badgeClass = 'badge-active';
  if (st === 'graduated') badgeClass = 'badge-graduated';
  else if (st === 'on leave') badgeClass = 'badge-leave';
  else if (st === 'probation') badgeClass = 'badge-probation';

  return `
    <span class="badge ${badgeClass}">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
      ${escapeHtml(status)}
    </span>
  `;
}

export function getGpaPill(gpaValue) {
  const gpa = parseFloat(gpaValue) || 0;
  let colorClass = 'gpa-mid';
  if (gpa >= 3.75) colorClass = 'gpa-high';
  else if (gpa < 3.0) colorClass = 'gpa-low';

  return `
    <span class="gpa-pill ${colorClass}">
      <i class="ri-star-fill" style="font-size: 13px;"></i>
      ${gpa.toFixed(2)}
    </span>
  `;
}

export function renderStudentsTable(tbodyEl, students, searchQuery, onSeedCallback) {
  if (!students || students.length === 0) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="ri-user-search-line empty-icon"></i>
            <div class="empty-title">No students found</div>
            <div class="empty-desc">
              ${searchQuery ? `No students match "${escapeHtml(searchQuery)}". Try adjusting your search.` : 'Your database is currently empty. Click "Seed Dummy Data" to insert pre-made student records!'}
            </div>
            ${!searchQuery ? `<button class="btn btn-primary btn-sm" id="btn-empty-seed"><i class="ri-database-2-line"></i> Seed Dummy Data</button>` : ''}
          </div>
        </td>
      </tr>
    `;
    const emptySeedBtn = document.getElementById('btn-empty-seed');
    if (emptySeedBtn && onSeedCallback) {
      emptySeedBtn.addEventListener('click', onSeedCallback);
    }
    return;
  }

  tbodyEl.innerHTML = students.map(s => {
    const initials = getInitials(s.full_name);
    const statusBadge = getStatusBadge(s.enrollment_status);
    const gpaPill = getGpaPill(s.gpa);

    return `
      <tr data-id="${s.id}">
        <td>
          <span class="badge badge-id">${escapeHtml(s.student_id)}</span>
        </td>
        <td>
          <div class="student-profile">
            <div class="avatar">${escapeHtml(initials)}</div>
            <div class="student-name-box">
              <span class="student-name">${escapeHtml(s.full_name)}</span>
              <span class="student-email">${escapeHtml(s.email)}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 500;">${s.age} yrs</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(s.phone || 'No phone')}</div>
        </td>
        <td>
          <span style="font-weight: 500;">${escapeHtml(s.major)}</span>
        </td>
        <td>${gpaPill}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div class="action-buttons" style="justify-content: flex-end;">
            <button class="btn-action edit" data-action="edit" data-id="${s.id}" title="Edit Student">
              <i class="ri-edit-line"></i>
            </button>
            <button class="btn-action delete" data-action="delete" data-id="${s.id}" title="Delete Student">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export function updateStatsUI(elements, stats) {
  if (!stats) return;
  elements.statTotal.textContent = stats.total ?? 0;
  elements.statActive.textContent = stats.active ?? 0;
  elements.statGpa.textContent = (stats.avg_gpa ?? 0).toFixed(2);
  elements.statGraduated.textContent = stats.graduated ?? 0;
}

export function updateDbStatusUI(elements, isConnected, dbName = '', error = null) {
  if (isConnected) {
    elements.dbStatusDot.className = 'status-dot connected';
    elements.dbStatusText.textContent = `MongoDB Connected (${dbName})`;
    if (elements.modalDbPill) {
      elements.modalDbPill.style.display = 'inline-flex';
      elements.modalDbPill.className = 'badge badge-active';
      elements.modalDbPill.textContent = 'Connected';
    }
    if (elements.dbErrorAlert) elements.dbErrorAlert.style.display = 'none';
  } else {
    elements.dbStatusDot.className = 'status-dot disconnected';
    elements.dbStatusText.textContent = 'MongoDB Disconnected';
    if (elements.modalDbPill) {
      elements.modalDbPill.style.display = 'inline-flex';
      elements.modalDbPill.className = 'badge badge-probation';
      elements.modalDbPill.textContent = 'Disconnected';
    }
    if (elements.dbErrorAlert) {
      elements.dbErrorAlert.style.display = 'block';
      elements.dbErrorAlert.innerHTML = `<strong>Connection issue:</strong> ${error || 'Could not reach database.'}`;
    }
  }
}
