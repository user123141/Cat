// src/hooks/useNotifications.ts
import { useState, useCallback } from 'react';
import { NotificationItem } from '../types';

export const sendNativeNotification = (title: string, body: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: 'maccat_alert_' + title.replace(/\s+/g, '_'),
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  }
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'paw'
  ) => {
    const newNotif: NotificationItem = {
      id: Math.random().toString(),
      title,
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    sendNativeNotification,
  };
};
