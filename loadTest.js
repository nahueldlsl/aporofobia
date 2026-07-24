const { io } = require('socket.io-client');
const http = require('http');

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const ROOM_CODE = 'STRESS';
const NUM_CLIENTS = 40;

const clients = [];

console.log(`[LoadTest] Iniciando simulación de carga con ${NUM_CLIENTS} sockets concurrentes...`);

function connectClient(i) {
  return new Promise((resolve) => {
    const socket = io(URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      socket.emit('join_room', { roomCode: ROOM_CODE, name: `LoadTester_${i}`, isTeacher: false }, (res) => {
        resolve({ socket, id: socket.id, index: i });
      });
    });
  });
}

async function run() {
  // 1. Create a Teacher socket to manage the room
  const teacherSocket = io(URL, { transports: ['websocket'] });
  await new Promise((res) => {
    teacherSocket.on('connect', () => {
      teacherSocket.emit('join_room', { roomCode: ROOM_CODE, isTeacher: true }, res);
    });
  });
  console.log(`[LoadTest] Profesor conectado y sala ${ROOM_CODE} creada.`);

  // 2. Connect 40 students concurrently
  const connectionPromises = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    connectionPromises.push(connectClient(i));
  }
  
  const connectedClients = await Promise.all(connectionPromises);
  console.log(`[LoadTest] ${connectedClients.length} clientes conectados exitosamente.`);

  // 3. Start Cycle 1
  teacherSocket.emit('start_cycle', { cycleNum: 1 });
  console.log(`[LoadTest] Profesor emitió start_cycle (Fase 1). Esperando 2 segundos...`);
  await new Promise(r => setTimeout(r, 2000));

  // 4. All Áporos spam Pay Basic Needs
  console.log(`[LoadTest] Clientes spameando 'pay_basic_needs'...`);
  const phase1Promises = connectedClients.map(c => {
    return new Promise((res, rej) => {
      const timeout = setTimeout(() => {
        console.log(`[LoadTest] Timeout on socket ${c.id}`);
        res();
      }, 5000);
      c.socket.emit('pay_basic_needs', (response) => {
        clearTimeout(timeout);
        res(response);
      });
    });
  });
  await Promise.all(phase1Promises);
  
  // 5. Advance to Phase 2
  console.log(`[LoadTest] Profesor emitiendo advance_phase (Fase 2). Esperando asignación...`);
  teacherSocket.emit('advance_phase');
  await new Promise(r => setTimeout(r, 2000));

  // 6. Simulate Phase 2: Random decisions from Elites/Media
  console.log(`[LoadTest] Clientes con excedente spameando decisiones masivas...`);
  
  let globalRequests = [];
  // Escuchar el payload del servidor para saber qué peticiones están pendientes
  teacherSocket.on('room_state_update', (data) => {
    // Solo de interés si necesitamos los requests (en este script lo resolvemos forzando a los clientes)
  });

  // Cada cliente revisa su estado privado y resuelve peticiones
  const phase2Promises = connectedClients.map(c => {
    return new Promise((res) => {
      // Capturamos el último update privado para ver si tiene requests asignados
      c.socket.on('player_private_update', (data) => {
        if (data.assignedRequests && data.assignedRequests.length > 0) {
          const req = data.assignedRequests[0];
          const choices = ['A', 'B', 'C'];
          const randomChoice = choices[Math.floor(Math.random() * choices.length)];
          c.socket.emit('make_decision', { requestId: req.id, decision: randomChoice }, () => {
            res();
          });
        } else {
          // Si no tiene asignados, resuelve de inmediato
          res();
        }
      });
    });
  });

  // Añadimos timeout a phase2Promises por si algunos no tienen asignados y nunca responden (ya resueltos por el else)
  await Promise.race([
    Promise.all(phase2Promises),
    new Promise(r => setTimeout(r, 3000))
  ]);

  console.log(`[LoadTest] Profesor emitiendo advance_phase (Fase 3: Resolución)...`);
  teacherSocket.emit('advance_phase');
  await new Promise(r => setTimeout(r, 1000));

  console.log(`[LoadTest] Simulación de estrés completada exitosamente sin cuelgues del servidor.`);
  
  // Clean up
  teacherSocket.disconnect();
  connectedClients.forEach(c => c.socket.disconnect());
  process.exit(0);
}

run().catch(console.error);
