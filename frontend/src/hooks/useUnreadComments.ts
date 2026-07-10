import { useState, useCallback } from 'react';

/**
 * useUnreadComments — tracks unread comment counts per task.
 * A task's count increments when a new-comment socket event arrive while the user does not have that task's dialog open.
 * The count resets to 0 when the user opens the dialog.
 */
export const useUnreadComments = () => {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  const markUnread = useCallback((taskId: string) => {
    setUnreadCounts(prev => {
      const next = new Map(prev);
      next.set(taskId, (next.get(taskId) ?? 0) + 1);
      return next;
    });
  }, []);

  const markRead = useCallback((taskId: string) => {
    setUnreadCounts(prev => {
      if (!prev.has(taskId)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  // Returns the unread count (0 if none)
  const unreadCount = useCallback((taskId: string) => {
    return unreadCounts.get(taskId) ?? 0;
  }, [unreadCounts]);

  // Kept for backward compatibility — true if count > 0
  const hasUnread = useCallback((taskId: string) => {
    return (unreadCounts.get(taskId) ?? 0) > 0;
  }, [unreadCounts]);

  return { markUnread, markRead, hasUnread, unreadCount };
};
