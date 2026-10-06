/**
 * Modals Controller Module
 */

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

export function setupModalDismissHandlers() {
  // Close buttons with data-close attribute
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  // Clicking outside modal content
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

export function populateStudentForm(elements, student = null) {
  if (!student) {
    // Add mode
    elements.modalTitle.textContent = 'Add New Student';
    elements.studentForm.reset();
    elements.formMongoId.value = '';
    const nextNumber = Math.floor(100 + Math.random() * 900);
    elements.formStudentId.value = `STU-2024-${nextNumber}`;
    elements.formStatus.value = 'Active';
  } else {
    // Edit mode
    elements.modalTitle.textContent = `Edit Student: ${student.full_name}`;
    elements.formMongoId.value = student.id;
    elements.formStudentId.value = student.student_id;
    elements.formFullName.value = student.full_name;
    elements.formEmail.value = student.email;
    elements.formAge.value = student.age;
    elements.formPhone.value = student.phone || '';
    elements.formMajor.value = student.major;
    elements.formGpa.value = student.gpa;
    elements.formStatus.value = student.enrollment_status;
  }
}

export function populateDeleteModal(elements, student) {
  elements.deleteStudentName.textContent = student.full_name;
  elements.deleteStudentId.textContent = `${student.student_id} • ${student.major}`;
}
