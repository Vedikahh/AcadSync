import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/api";
import { useAuth } from "./AuthContext";
import socket from "../services/socket";

const NotificationsContext = createContext();

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const getNotificationId = (notification) => notification?._id || notification?.id;

const getCreatedAt = (notification) => {
  const created = notification?.createdAt || notification?.created_at;
  return created ? new Date(created).getTime() : 0;
};

const mergeNotifications = (currentList, incomingList = []) => {
  const map = new Map();
  currentList.forEach((notification) => {
    const id = getNotificationId(notification);
    if (id) map.set(id, notification);
  });

  incomingList.forEach((notification) => {
    const id = getNotificationId(notification);
    if (!id) return;

    const existing = map.get(id) || {};
    map.set(id, {
      ...existing,
      ...notification,
      id,
      _id: notification._id || existing._id || id,
      createdAt: notification.createdAt || notification.created_at || existing.createdAt || existing.created_at,
      created_at: notification.created_at || notification.createdAt || existing.created_at || existing.createdAt,
    });
  });

  return Array.from(map.values()).sort((a, b) => getCreatedAt(b) - getCreatedAt(a));
};

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    const page = options.page || 1;
    const limit = options.limit || 20;

    try {
      if (!options.silent) setIsLoading(true);
      const data = await getNotifications({ page, limit });

      const incomingItems = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setNotifications((prev) => {
        const next = page === 1 && !options.append ? mergeNotifications([], incomingItems) : mergeNotifications(prev, incomingItems);
        setUnreadCount(next.filter((n) => !n.read).length);
        return next;
      });

      if (data?.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination((prev) => ({ ...prev, page, limit }));
      }

      if (typeof data?.meta?.unreadCount === "number") {
        setUnreadCount(data.meta.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      if (!options.silent) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Refresh every minute while user is logged in
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) {
      if (socket.connected) socket.disconnect();
      return;
    }
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleNotificationPush = (incomingNotification) => {
      if (!incomingNotification) return;
      setNotifications((prev) => {
        const next = mergeNotifications(prev, [incomingNotification]);
        setUnreadCount(next.filter((n) => !n.read).length);
        return next;
      });
    };

    const handleReconnect = () => {
      fetchNotifications({ page: 1, silent: true });
    };

    socket.on("notification:new", handleNotificationPush);
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("notification:new", handleNotificationPush);
      socket.off("connect", handleReconnect);
    };
  }, [fetchNotifications, user]);

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n._id === id || n.id === id) ? { ...n, read: true } : n);
        setUnreadCount(next.filter((n) => !n.read).length);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNextPage = async () => {
    if (!pagination?.hasNextPage || isLoading) return;
    await fetchNotifications({ page: pagination.page + 1, limit: pagination.limit, append: true });
  };

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      fetchNotifications, 
      markAsRead,
      markAllRead,
      fetchNextPage,
      pagination,
      isLoading,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
