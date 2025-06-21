// Simple notification utility
let notificationTimeout;

export const showNotification = (message, type = 'info', duration = 3000) => {
  // Clear any existing notification
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  // Remove any existing notification element
  const existingNotification = document.getElementById('global-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'global-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    transform: translateX(100%);
  `;

  // Set background color based on type
  switch (type) {
    case 'error':
      notification.style.backgroundColor = '#dc3545';
      break;
    case 'success':
      notification.style.backgroundColor = '#28a745';
      break;
    case 'warning':
      notification.style.backgroundColor = '#ffc107';
      notification.style.color = '#212529';
      break;
    default:
      notification.style.backgroundColor = '#17a2b8';
  }

  notification.textContent = message;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove after duration
  notificationTimeout = setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, duration);

  // Allow manual dismissal
  notification.addEventListener('click', () => {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  });
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
} 