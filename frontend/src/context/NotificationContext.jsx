import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [listRes, countRes] = await Promise.all([
        notificationApi.getNotifications({ page_size: 10 }),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(listRes.data.results || listRes.data || []);
      setUnreadCount(countRes.data.unread_count || 0);
    } catch (err) {
      // Silently fail polling error
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
