import { IoAdapter } from '@nestjs/platform-socket.io';
import * as socketio from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  constructor(app, private isCorsEnabled: boolean = false) {
    super(app);
  }

  createIOServer(port: number, options?: socketio.ServerOptions): socketio.Server {
    if (this.isCorsEnabled) {
      options.cors = {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true,
      };
    }

    const server = super.createIOServer(port, options);

    return server;
  }
}
