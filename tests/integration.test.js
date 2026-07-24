const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const gameEngine = require('../gameEngine');
const express = require('express');

describe('Pilar 2: Integridad Transaccional y Condiciones de Carrera', () => {
  let io, serverSocket, clientSocket1, clientSocket2;
  let port;

  beforeAll((done) => {
    const app = express();
    const httpServer = createServer(app);
    io = new Server(httpServer);

    // Reproduce the critical server logic for the test
    io.on('connection', (socket) => {
      socket.on('make_decision', ({ roomCode, requestId, decision }, callback) => {
        // En un entorno asíncrono real, una BBDD podría sufrir race conditions.
        // Node.js es single-threaded, por lo que las funciones en memoria son atómicas.
        // Simularemos el comportamiento del servidor real:
        const res = gameEngine.makeDecision(roomCode, socket.id, requestId, decision);
        if (typeof callback === 'function') callback(res);
      });
    });

    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll(() => {
    io.close();
  });

  beforeEach((done) => {
    clientSocket1 = new Client(`http://localhost:${port}`);
    clientSocket2 = new Client(`http://localhost:${port}`);
    gameEngine.rooms.clear();
    let connected = 0;
    const checkDone = () => { if (++connected === 2) done(); };
    clientSocket1.on('connect', checkDone);
    clientSocket2.on('connect', checkDone);
  });

  afterEach(() => {
    clientSocket1.close();
    clientSocket2.close();
  });

  test('Debería manejar un ataque de SPAM (Race Condition) en donaciones de forma atómica', (done) => {
    const roomCode = 'RACE_ROOM';
    gameEngine.createRoom(roomCode, 'teacher');
    
    // Configurar estado
    gameEngine.addPlayer(roomCode, clientSocket1.id, 'Elite1');
    gameEngine.addPlayer(roomCode, clientSocket2.id, 'Aporo1');
    gameEngine.startCycle(roomCode, 1);
    
    const room = gameEngine.getRoom(roomCode);
    
    // Forzar roles para la prueba
    const elite = room.players.get(clientSocket1.id);
    elite.role = 'ÉLITE';
    elite.resources = 100;
    
    const aporo = room.players.get(clientSocket2.id);
    aporo.role = 'ÁPORO';
    aporo.resources = 10;
    
    // Crear petición pendiente
    room.requests.push({
      id: 'req_123',
      cycle: 1,
      fromId: clientSocket2.id,
      fromRole: 'ÁPORO',
      isForeigner: false,
      needed: 20,
      assignedToId: clientSocket1.id,
      status: 'PENDING',
      decision: null
    });
    
    room.phase = 2; // Decisión

    // Simular que el Elite (clientSocket1) envía 50 peticiones WebSocket en el mismo ms
    const spamCount = 50;
    let completedResponses = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < spamCount; i++) {
      clientSocket1.emit('make_decision', { 
        roomCode, 
        requestId: 'req_123', 
        decision: 'C' 
      }, (res) => {
        if (res.success) successCount++;
        if (res.error) errorCount++;
        
        completedResponses++;
        if (completedResponses === spamCount) {
          // Assertions
          try {
            // Solo 1 petición debió tener éxito
            expect(successCount).toBe(1);
            // Las otras 49 debieron recibir error de "ya fue resuelta"
            expect(errorCount).toBe(49);
            
            // Los recursos de la Élite deben haberse descontado exactamente UNA vez (100 - 15 = 85)
            expect(elite.resources).toBe(85);
            
            // Los recursos del Áporo debieron subir exactamente UNA vez (10 + 20 = 30)
            expect(aporo.resources).toBe(30);
            
            done();
          } catch (e) {
            done(e);
          }
        }
      });
    }
  });
});
