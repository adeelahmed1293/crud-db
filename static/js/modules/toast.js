/**
 * Toast Notification System Module
 */
const toastContainer = document.getElementById('toast-container');

export function showToast(title, message, type = 'info', duration = 3500) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'ri-information-line';
  if (type === 'success') iconClass = 'ri-checkbox-circle-line';
  else if (type === 'error') iconClass = 'ri-error-warning-line';
  else if (type === 'warning') iconClass = 'ri-alert-line';

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  // Close handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast);
  });

  toastContainer.appendChild(toast);

  // Auto remove timer
  const timer = setTimeout(() => {
    removeToast(toast);
  }, duration);

  function removeToast(el) {
    clearTimeout(timer);
    el.classList.add('removing');
    el.addEventListener('animationend', () => {
      el.remove();
    });
  }
}
