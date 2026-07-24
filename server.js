const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const gameEngine = require('./gameEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const activeTimers = new Map();

function broadcastGameState(roomCode) {
  const room = gameEngine.getRoom(roomCode);
  if (!room) return;

  const playerArray = Array.from(room.players.values());

  const publicPayload = {
    code: room.code,
    status: room.status,
    cycle: room.cycle,
    phase: room.phase,
    timer: room.timer,
    survivalCost: room.survivalCost || 30,
    metrics: room.metrics,
    protestsCount: room.protestsCount,
    socialRevoltActive: room.socialRevoltActive,
    cortinaQuote: room.cortinaQuote,
    specialAlert: room.specialAlert,
    resolution: room.resolution,
    playerCount: playerArray.length,
    playersSummary: playerArray.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      isForeigner: p.isForeigner,
      dignity: p.dignity,
      resources: p.resources,
      survivalMet: p.survivalMet,
      isInvisible: p.isInvisible
    })),
    requestsCount: room.requests.length,
    pendingRequestsCount: room.requests.filter(r => r.status === 'PENDING').length
  };

  io.to(roomCode).emit('room_state_update', publicPayload);

  room.players.forEach((player) => {
    const assignedRequests = room.requests.filter(r => r.assignedToId === player.id && r.status === 'PENDING');
    const myRequest = room.requests.find(r => r.fromId === player.id && r.cycle === room.cycle);

    io.to(player.id).emit('player_private_update', {
      player,
      assignedRequests,
      myRequest
    });
  });
}

function startRoomTimer(roomCode) {
  if (activeTimers.has(roomCode)) {
    clearInterval(activeTimers.get(roomCode));
  }

  const timerId = setInterval(() => {
    const room = gameEngine.getRoom(roomCode);
    if (!room || room.status === 'LOBBY' || room.status === 'FINISHED') {
      clearInterval(timerId);
      activeTimers.delete(roomCode);
      return;
    }

    if (room.timer > 0) {
      room.timer--;
      if (room.timer % 5 === 0) {
        broadcastGameState(roomCode);
      }
    } else {
      gameEngine.autoAdvancePhase(roomCode);
      broadcastGameState(roomCode);
    }
  }, 1000);

  activeTimers.set(roomCode, timerId);
}

function checkAndAutoAdvance(roomCode) {
  if (gameEngine.checkPhaseCompletion(roomCode)) {
    const room = gameEngine.getRoom(roomCode);
    if (!room) return;
    
    // Slight delay so users see the UI change before the phase switches
    setTimeout(() => {
      gameEngine.autoAdvancePhase(roomCode);
      broadcastGameState(roomCode);
    }, 1500);
  }
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ teacherName }, callback) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = gameEngine.createRoom(roomCode, socket.id);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    if (typeof callback === 'function') callback({ success: true, roomCode });
    broadcastGameState(roomCode);
  });

  socket.on('join_room', ({ roomCode, name, isTeacher }, callback) => {
    const cleanCode = roomCode?.trim().toUpperCase();
    const result = gameEngine.addPlayer(cleanCode, socket.id, name, isTeacher);

    if (result.error) {
      if (typeof callback === 'function') callback({ success: false, error: result.error });
      return;
    }

    socket.join(cleanCode);
    socket.roomCode = cleanCode;

    if (typeof callback === 'function') {
      callback({
        success: true,
        roomCode: cleanCode,
        isTeacher: !!isTeacher,
        player: result.player
      });
    }

    broadcastGameState(cleanCode);
  });

  socket.on('add_bots', ({ count }) => {
    if (!socket.roomCode) return;
    gameEngine.addBots(socket.roomCode, count || 10);
    broadcastGameState(socket.roomCode);
  });

  // Main Cycles
  socket.on('start_cycle', ({ cycleNum }) => {
    if (!socket.roomCode) return;
    gameEngine.startCycle(socket.roomCode, cycleNum || 1);
    startRoomTimer(socket.roomCode);
    broadcastGameState(socket.roomCode);
  });

  socket.on('advance_phase', () => {
    if (!socket.roomCode) return;
    const room = gameEngine.getRoom(socket.roomCode);
    if (!room) return;

    gameEngine.autoAdvancePhase(socket.roomCode);
    broadcastGameState(socket.roomCode);
  });

  // Áporo Collective Strike
  socket.on('trigger_protest', (callback) => {
    if (!socket.roomCode) return;
    const res = gameEngine.triggerProtest(socket.roomCode, socket.id);
    if (typeof callback === 'function') callback(res);
    broadcastGameState(socket.roomCode);
    checkAndAutoAdvance(socket.roomCode);
  });

  socket.on('pay_basic_needs', (callback) => {
    if (!socket.roomCode) return;
    const res = gameEngine.payBasicNeeds(socket.roomCode, socket.id);
    if (typeof callback === 'function') callback(res);
    broadcastGameState(socket.roomCode);
    checkAndAutoAdvance(socket.roomCode);
  });

  socket.on('make_decision', ({ requestId, decision }, callback) => {
    if (!socket.roomCode) return;
    const res = gameEngine.makeDecision(socket.roomCode, socket.id, requestId, decision);
    if (typeof callback === 'function') callback(res);
    broadcastGameState(socket.roomCode);
    checkAndAutoAdvance(socket.roomCode);
  });

  // Final Debrief Request
  socket.on('get_debrief', (callback) => {
    if (!socket.roomCode) return;
    const debrief = gameEngine.getDebriefData(socket.roomCode);
    if (typeof callback === 'function') callback(debrief);
  });

  socket.on('disconnect', () => {
    const res = gameEngine.removePlayer(socket.id);
    if (res) broadcastGameState(res.roomCode);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Proyecto Cosmópolis iniciado en http://localhost:${PORT}`);
  console.log(`====================================================`);
});
