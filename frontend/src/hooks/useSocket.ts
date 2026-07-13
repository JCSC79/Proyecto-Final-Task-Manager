import React, { createContext, useContext, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { IComment } from '../api/comment.api';
import type { Task } from '../types/task';

const SOCKET_URL = 'http://localhost:3000';

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

/**
 * SocketProvider — creates ONE persistent socket connection for the whole session.
 * Uses a ref to hold the socket instance and state only to trigger a context re-render after the socket is ready (avoiding synchronous setState inside useEffect).
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketState, setSocketState] = React.useState<Socket | null>(null);

  useEffect(() => {
    if (socketState?.connected) {
      return;
    }

    const s = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
    });

    s.once('connect', () => {
      console.log('[Socket] Connected:', s.id);
      setSocketState(s);
    });

    s.on('connect_error', (err) => console.warn('[Socket] Error:', err.message));

    return () => {
      s.disconnect();
      setSocketState(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.createElement(
    SocketContext.Provider,
    { value: { socket: socketState } },
    children
  );
};

export const useSocketContext = () => useContext(SocketContext);

import type { IProject } from '../types/project';

/**
 * useSocket — attaches listeners to the shared socket (does NOT create a new connection).
 */
export const useSocket = (handlers: {
  onNewComment?: (comment: IComment) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (payload: { id: string }) => void;
  onProjectCreated?: (project: IProject) => void;
  onProjectDeleted?: (payload: { id: string }) => void;
  onProjectMembersChanged?: (payload: { id: string }) => void;
  onUserRegistered?: () => void;
}) => {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (handlers.onNewComment) {
      socket.on('new-comment', handlers.onNewComment);
    }
    if (handlers.onTaskUpdated) {
      socket.on('task-updated', handlers.onTaskUpdated);
    }
    if (handlers.onTaskDeleted) {
      socket.on('task-deleted', handlers.onTaskDeleted);
    }
    if (handlers.onProjectCreated) {
      socket.on('project-created', handlers.onProjectCreated);
    }
    if (handlers.onProjectDeleted) {
      socket.on('project-deleted', handlers.onProjectDeleted);
    }
    if (handlers.onProjectMembersChanged) {
      socket.on('project-members-changed', handlers.onProjectMembersChanged);
    }
    if (handlers.onUserRegistered) {
      socket.on('user-registered', handlers.onUserRegistered);
    }
    return () => {
      if (handlers.onNewComment) {
        socket.off('new-comment', handlers.onNewComment);
      }
      if (handlers.onTaskUpdated) {
        socket.off('task-updated', handlers.onTaskUpdated);
      }
      if (handlers.onTaskDeleted) {
        socket.off('task-deleted', handlers.onTaskDeleted);
      }
      if (handlers.onProjectCreated) {
        socket.off('project-created', handlers.onProjectCreated);
      }
      if (handlers.onProjectDeleted) {
        socket.off('project-deleted', handlers.onProjectDeleted);
      }
      if (handlers.onProjectMembersChanged) {
        socket.off('project-members-changed', handlers.onProjectMembersChanged);
      }
      if (handlers.onUserRegistered) {
        socket.off('user-registered', handlers.onUserRegistered);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const joinTask = (taskId: string) => socket?.emit('join-task', taskId);
  const leaveTask = (taskId: string) => socket?.emit('leave-task', taskId);

  return { joinTask, leaveTask };
};
