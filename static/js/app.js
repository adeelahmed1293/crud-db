/**
 * StudentHub Application Master Controller
 * Modular ES6 Entrypoint
 */

import { state } from './modules/state.js';
import { showToast } from './modules/toast.js';
import {
  apiGetStudents,
  apiGetStats,
  apiCreateStudent,
  apiUpdateStudent,
  apiDeleteStudent,
  apiSeedStudents,
  apiCheckHealth,
  apiUpdateMongoUri
} from './modules/api.js';
import {
  renderStudentsTable,
  updateStatsUI,
  updateDbStatusUI
} from './modules/ui.js';
import {
  openModal,
  closeModal,
  setupModalDismissHandlers,
  populateStudentForm,
  populateDeleteModal
} from './modules/modals.js';

// DOM Element Registry
const elements = {
  tbody: document.getElementById('students-tbody'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  btnAddStudent: document.getElementById('btn-add-student'),
  btnSeed: document.getElementById('btn-seed'),
  btnRefresh: document.getElementById('btn-refresh'),

  // Database status indicators
  dbStatusBtn: document.getElementById('db-status-btn'),
  dbStatusDot: document.getElementById('db-status-dot'),
  dbStatusText: document.getElementById('db-status-text'),
  modalDbPill: document.getElementById('modal-db-pill'),
  dbErrorAlert: document.getElementById('db-error-alert'),
  mongoUriInput: document.getElementById('mongo-uri-input'),
  btnSaveMongo: document.getElementById('btn-save-mongo'),

  // Modals
  studentModal: document.getElementById('student-modal'),
  deleteModal: document.getElementById('delete-modal'),
  dbModal: document.getElementById('db-modal'),
  modalTitle: document.getElementById('modal-title'),
  studentForm: document.getElementById('student-form'),

  // Student Form Inputs
  formMongoId: document.getElementById('form-student-mongo-id'),
  formStudentId: document.getElementById('form-student-id'),
  formFullName: document.getElementById('form-full-name'),
  formEmail: document.getElementById('form-email'),
  formAge: document.getElementById('form-age'),
  formPhone: document.getElementById('form-phone'),
  formMajor: document.getElementById('form-major'),
  formGpa: document.getElementById('form-gpa'),
  formStatus: document.getElementById('form-status'),
  btnSaveStudent: document.getElementById('btn-save-student'),

  // Delete Modal Confirmation
  deleteStudentName: document.getElementById('delete-student-name'),
  deleteStudentId: document.getElementById('delete-student-id'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),

  // Dashboard Stats
  statTotal: document.getElementById('stat-total'),
  statActive: document.getElementById('stat-active'),
  statGpa: document.getElementById('stat-gpa'),
  statGraduated: document.getElementById('stat-graduated')
};

// ==========================================================================
// Core Operations
// ==========================================================================

async function loadStudents(showNotification = false) {
  try {
    const students = await apiGetStudents({
      search: state.searchQuery,
      status: state.filterStatus,
      sortBy: state.sortBy,
      order: state.sortOrder
    });

    state.students = students;
    renderStudentsTable(elements.tbody, students, state.searchQuery, handleSeedData);
    await loadStats();

    if (showNotification) {
      showToast('Data Synced', `Loaded ${students.length} student records from database`, 'info', 2000);
    }
  } catch (err) {
    elements.tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="ri-error-warning-line empty-icon" style="color: #f87171;"></i>
            <div class="empty-title">Could not load students</div>
            <div class="empty-desc">${err.message}</div>
            <button class="btn btn-secondary btn-sm" id="btn-retry-fetch">Retry</button>
          </div>
        </td>
      </tr>
    `;
    const retryBtn = document.getElementById('btn-retry-fetch');
    if (retryBtn) retryBtn.addEventListener('click', () => loadStudents(true));
    showToast('Database Error', err.message, 'error', 5000);
  }
}

async function loadStats() {
  try {
    const stats = await apiGetStats();
    updateStatsUI(elements, stats);
  } catch (err) {
    console.warn('Failed to load stats:', err);
  }
}

async function checkHealth() {
  try {
    const health = await apiCheckHealth();
    state.dbConnected = health.connected;
    updateDbStatusUI(elements, health.connected, health.database, health.error);
  } catch (err) {
    state.dbConnected = false;
    updateDbStatusUI(elements, false, '', 'Server unreachable');
  }
}

async function handleSeedData() {
  elements.btnSeed.disabled = true;
  elements.btnSeed.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Seeding...`;

  try {
    const result = await apiSeedStudents(true);
    showToast('Data Seeded', result.message || `Seeded ${result.seeded_count} students`, 'success');
    await loadStudents(false);
  } catch (err) {
    showToast('Seed Failed', err.message, 'error', 4500);
  } finally {
    elements.btnSeed.disabled = false;
    elements.btnSeed.innerHTML = `<i class="ri-database-2-line"></i> Seed Dummy Data`;
  }
}

// ==========================================================================
// Event Listeners Registration
// ==========================================================================

function setupEventListeners() {
  setupModalDismissHandlers();

  // Add Student Button
  elements.btnAddStudent.addEventListener('click', () => {
    populateStudentForm(elements, null);
    openModal('student-modal');
  });

  // Seed Button
  elements.btnSeed.addEventListener('click', handleSeedData);

  // Refresh Button
  elements.btnRefresh.addEventListener('click', () => loadStudents(true));

  // Table Action Buttons Delegation (Edit / Delete)
  elements.tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('button[data-action="edit"]');
    const deleteBtn = e.target.closest('button[data-action="delete"]');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const student = state.students.find(s => s.id === id);
      if (student) {
        populateStudentForm(elements, student);
        openModal('student-modal');
      }
    } else if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const student = state.students.find(s => s.id === id);
      if (student) {
        state.deleteStudentId = id;
        populateDeleteModal(elements, student);
        openModal('delete-modal');
      }
    }
  });

  // Save Student Form Submit (Create or Update)
  elements.studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mongoId = elements.formMongoId.value;
    const isEditing = Boolean(mongoId);

    const payload = {
      student_id: elements.formStudentId.value.trim(),
      full_name: elements.formFullName.value.trim(),
      email: elements.formEmail.value.trim(),
      age: parseInt(elements.formAge.value, 10),
      phone: elements.formPhone.value.trim() || null,
      major: elements.formMajor.value.trim(),
      gpa: parseFloat(elements.formGpa.value),
      enrollment_status: elements.formStatus.value
    };

    elements.btnSaveStudent.disabled = true;
    elements.btnSaveStudent.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Saving...`;

    try {
      if (isEditing) {
        const updated = await apiUpdateStudent(mongoId, payload);
        showToast('Student Updated', `Successfully updated "${updated.full_name}"`, 'success');
      } else {
        const created = await apiCreateStudent(payload);
        showToast('Student Created', `Successfully added "${created.full_name}" (${created.student_id})`, 'success');
      }
      closeModal('student-modal');
      await loadStudents(false);
    } catch (err) {
      showToast('Save Failed', err.message, 'error', 4500);
    } finally {
      elements.btnSaveStudent.disabled = false;
      elements.btnSaveStudent.innerHTML = `<i class="ri-check-line"></i> Save Student`;
    }
  });

  // Confirm Delete Button
  elements.btnConfirmDelete.addEventListener('click', async () => {
    if (!state.deleteStudentId) return;

    elements.btnConfirmDelete.disabled = true;
    elements.btnConfirmDelete.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Deleting...`;

    try {
      await apiDeleteStudent(state.deleteStudentId);
      closeModal('delete-modal');
      showToast('Record Deleted', 'Student record has been deleted from MongoDB.', 'warning');
      state.deleteStudentId = null;
      await loadStudents(false);
    } catch (err) {
      showToast('Delete Failed', err.message, 'error', 4500);
    } finally {
      elements.btnConfirmDelete.disabled = false;
      elements.btnConfirmDelete.innerHTML = `<i class="ri-delete-bin-line"></i> Delete Student`;
    }
  });

  // Real-time Search with Debounce
  let searchTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      loadStudents(false);
    }, 300);
  });

  // Filter Buttons
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filterStatus = btn.dataset.status;
      loadStudents(false);
    });
  });

  // Sort Selector
  elements.sortSelect.addEventListener('change', (e) => {
    const [sortBy, order] = e.target.value.split(':');
    state.sortBy = sortBy;
    state.sortOrder = parseInt(order, 10);
    loadStudents(false);
  });

  // DB Status Pill -> Open Modal
  elements.dbStatusBtn.addEventListener('click', () => {
    openModal('db-modal');
  });

  // Save / Reconnect MongoDB URI
  elements.btnSaveMongo.addEventListener('click', async () => {
    const uri = elements.mongoUriInput.value.trim();
    if (!uri) {
      showToast('Validation Error', 'Please enter a valid MongoDB connection string.', 'warning');
      return;
    }

    elements.btnSaveMongo.disabled = true;
    elements.btnSaveMongo.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Connecting...`;

    try {
      const res = await apiUpdateMongoUri(uri);
      if (res.health && res.health.connected) {
        showToast('Connected to MongoDB', `Successfully connected to database: ${res.health.database}`, 'success');
        closeModal('db-modal');
        await checkHealth();
        await loadStudents(false);
      } else {
        const errorMsg = res.health ? res.health.error : 'Connection failed';
        showToast('Connection Failed', errorMsg, 'error', 6000);
        updateDbStatusUI(elements, false, '', errorMsg);
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      elements.btnSaveMongo.disabled = false;
      elements.btnSaveMongo.innerHTML = `<i class="ri-plug-line"></i> Connect & Save`;
    }
  });
}

// ==========================================================================
// Initialization
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await checkHealth();
  await loadStudents(false);
});
