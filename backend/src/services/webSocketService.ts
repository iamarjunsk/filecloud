import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export interface FileEvent {
  type: 'created' | 'updated' | 'deleted';
  userId: string;
  folderId?: string | null;
  fileId?: string;
  folderId?: string;
  data?: any;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use(this.authenticate.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('Client connected:', socket.id);

      if (socket.userId) {
        this.joinUserRoom(socket);
      }

      socket.on('join:folder', (folderId: string) => {
        socket.join(`folder:${folderId}`);
      });

      socket.on('leave:folder', (folderId: string) => {
        socket.leave(`folder:${folderId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.userId) {
          this.leaveUserRoom(socket);
        }
      });
    });

    console.log('WebSocket server initialized');
  }

  private authenticate(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as { id: string };
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  }

  private joinUserRoom(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    if (!this.userSockets.has(socket.userId)) {
      this.userSockets.set(socket.userId, new Set());
    }
    this.userSockets.get(socket.userId)!.add(socket.id);

    socket.join(`user:${socket.userId}`);
  }

  private leaveUserRoom(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    const userSocketSet = this.userSockets.get(socket.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(socket.userId);
      }
    }
  }

  emitFileEvent(event: FileEvent) {
    if (!this.io) return;

    if (event.folderId) {
      this.io.to(`folder:${event.folderId}`).emit('file:change', event);
    }

    this.io.to(`user:${event.userId}`).emit('file:change', event);
  }

  emitFolderEvent(event: FileEvent) {
    if (!this.io) return;

    if (event.folderId) {
      this.io.to(`folder:${event.folderId}`).emit('folder:change', event);
    }

    this.io.to(`user:${event.userId}`).emit('folder:change', event);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const wsService = new WebSocketService();
