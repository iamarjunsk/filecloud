import { createServer } from 'http';
import { app } from './app';
import { config } from './config';
import { wsService } from './services/webSocketService';

const startServer = () => {
  const httpServer = createServer(app);
  
  wsService.initialize(httpServer);
  
  const port = config.port;
  
  httpServer.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
    console.log(`🔧 Environment: ${config.nodeEnv}`);
  });
};

startServer();
