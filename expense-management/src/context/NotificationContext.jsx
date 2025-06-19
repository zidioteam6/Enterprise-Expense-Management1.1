import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  }); // persistent for bell
  const [toasts, setToasts] = useState([]); // temporary for tile

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add a notification (persistent for bell, temporary for toast)
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const time = new Date().toLocaleTimeString();
    const newNotification = { id, message, type, time };
    setNotifications(prevNotifications => [...prevNotifications, newNotification]);
    setToasts(prevToasts => [...prevToasts, newNotification]);
    // Auto-dismiss toast after 3 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Remove a notification by id (from bell)
  const removeNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  // Remove a toast by id (from tile only)
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Clear all notifications (from bell and localStorage)
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
      {/* Toast notifications (tiles) */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg text-white max-w-sm w-full
              ${toast.type === 'success' ? 'bg-green-500' : ''}
              ${toast.type === 'error' ? 'bg-red-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-500' : ''}
            `}
            role="alert"
          >
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 