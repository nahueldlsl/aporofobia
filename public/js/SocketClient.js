export class SocketClient {
  constructor() {
    // Requires <script src="/socket.io/socket.io.js"></script> in index.html
    this.socket = io();
  }

  emit(event, data, callback) {
    this.socket.emit(event, data, callback);
  }

  on(event, callback) {
    this.socket.on(event, callback);
  }
}
