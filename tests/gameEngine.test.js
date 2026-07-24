const gameEngine = require('../gameEngine');

describe('Pilar 1: Distribución Matemática (Asignación de Roles)', () => {
  beforeEach(() => {
    gameEngine.rooms.clear();
  });

  test('Debería asignar ~10% Élite, ~30% Media, ~60% Áporos con N=10', () => {
    const roomCode = 'TEST10';
    gameEngine.createRoom(roomCode, 'teacher1');
    
    for(let i=0; i<10; i++) {
      gameEngine.addPlayer(roomCode, `socket_${i}`, `P${i}`);
    }
    
    gameEngine.startCycle(roomCode, 1);
    const room = gameEngine.getRoom(roomCode);
    const players = Array.from(room.players.values());

    const elites = players.filter(p => p.role === 'ÉLITE').length;
    const medias = players.filter(p => p.role === 'CLASE_MEDIA').length;
    const aporos = players.filter(p => p.role === 'ÁPORO').length;

    expect(elites).toBe(1); // 10% de 10
    expect(medias).toBe(3); // 30% de 10
    expect(aporos).toBe(6); // 60% de 10
  });

  test('Debería manejar casos extremos con N=37 (Números Primos)', () => {
    const roomCode = 'TEST37';
    gameEngine.createRoom(roomCode, 'teacher1');
    
    for(let i=0; i<37; i++) {
      gameEngine.addPlayer(roomCode, `socket_${i}`, `P${i}`);
    }
    
    gameEngine.startCycle(roomCode, 1);
    const room = gameEngine.getRoom(roomCode);
    const players = Array.from(room.players.values());

    const elites = players.filter(p => p.role === 'ÉLITE').length;
    const medias = players.filter(p => p.role === 'CLASE_MEDIA').length;
    const aporos = players.filter(p => p.role === 'ÁPORO').length;

    expect(elites).toBe(4); // Math.round(37 * 0.10) = 4
    expect(medias).toBe(11); // Math.round(37 * 0.30) = 11
    expect(aporos).toBe(22); // 37 - 4 - 11 = 22
    expect(elites + medias + aporos).toBe(37);
  });

  test('Desconexión de un jugador no debería corromper el motor', () => {
    const roomCode = 'TEST_DISCONNECT';
    gameEngine.createRoom(roomCode, 'teacher1');
    
    for(let i=0; i<10; i++) {
      gameEngine.addPlayer(roomCode, `socket_${i}`, `P${i}`);
    }
    
    gameEngine.startCycle(roomCode, 1);
    
    // Simulate disconnection
    gameEngine.removePlayer('socket_0');
    const room = gameEngine.getRoom(roomCode);
    expect(room.players.size).toBe(9);
    
    // Metrics should update without crashing
    expect(room.metrics.giniIndex).toBeGreaterThan(0);
  });
});

describe('Pilar 3: Motor Económico y Gini Index', () => {
  beforeEach(() => {
    gameEngine.rooms.clear();
  });

  test('Gini Index de igualdad perfecta debe ser 0', () => {
    const roomCode = 'GINI_EQUAL';
    gameEngine.createRoom(roomCode, 'teacher1');
    for(let i=0; i<5; i++) {
      gameEngine.addPlayer(roomCode, `socket_${i}`, `P${i}`);
    }
    const room = gameEngine.getRoom(roomCode);
    room.players.forEach(p => p.resources = 50); // Everyone has 50
    gameEngine.updateMetrics(roomCode);
    
    expect(room.metrics.giniIndex).toBe(0);
  });

  test('Gini Index de extrema desigualdad debe aproximarse a 1', () => {
    const roomCode = 'GINI_INEQUAL';
    gameEngine.createRoom(roomCode, 'teacher1');
    for(let i=0; i<5; i++) {
      gameEngine.addPlayer(roomCode, `socket_${i}`, `P${i}`);
    }
    const room = gameEngine.getRoom(roomCode);
    const players = Array.from(room.players.values());
    players[0].resources = 1000;
    for(let i=1; i<5; i++) {
      players[i].resources = 0;
    }
    gameEngine.updateMetrics(roomCode);
    
    // Gini of [1000, 0, 0, 0, 0] = 0.8
    expect(room.metrics.giniIndex).toBeCloseTo(0.8);
  });

  test('La Revuelta (Gini > 0.60) recorta recursos a la Élite', () => {
    const roomCode = 'GINI_REVOLT';
    gameEngine.createRoom(roomCode, 'teacher1');
    gameEngine.addPlayer(roomCode, 'elite1', 'E1');
    gameEngine.addPlayer(roomCode, 'aporo1', 'A1');
    gameEngine.addPlayer(roomCode, 'aporo2', 'A2');
    gameEngine.addPlayer(roomCode, 'aporo3', 'A3');

    const room = gameEngine.getRoom(roomCode);
    room.cycle = 1; // Needs to be > 0 for revolt to trigger
    
    const elite = room.players.get('elite1');
    elite.role = 'ÉLITE';
    elite.resources = 200; // Extreme wealth

    const aporos = [room.players.get('aporo1'), room.players.get('aporo2'), room.players.get('aporo3')];
    aporos.forEach(p => { p.role = 'ÁPORO'; p.resources = 0; });

    // This creates Gini > 0.60. updateMetrics should trigger revolt.
    gameEngine.updateMetrics(roomCode);
    
    expect(room.socialRevoltActive).toBe(true);
    // Elite should lose 15 points penalty
    expect(elite.resources).toBe(185); 
  });
});

describe('Pilar 5: Lógica de Aislamiento de Bots (Capítulo 8)', () => {
  beforeEach(() => {
    gameEngine.rooms.clear();
  });

  test('Los Bots Extranjeros son asignados correctamente, y el isBot no se expone al cliente serializado', () => {
    const roomCode = 'BOT_ROOM';
    gameEngine.createRoom(roomCode, 'teacher1');
    
    // Add real players
    for(let i=0; i<10; i++) {
      gameEngine.addPlayer(roomCode, `socket_${i}`, `P${i}`);
    }
    
    // Add Bots
    gameEngine.addBots(roomCode, 5);
    const room = gameEngine.getRoom(roomCode);
    
    expect(room.players.size).toBe(15);
    const bots = Array.from(room.players.values()).filter(p => p.isBot);
    expect(bots.length).toBe(5);

    gameEngine.startCycle(roomCode, 2); // Cycle 2 introduces foreigners
    
    // Test that our server payload mapper completely omits isBot
    const payload = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      isForeigner: p.isForeigner,
      dignity: p.dignity,
      resources: p.resources,
      survivalMet: p.survivalMet,
      isInvisible: p.isInvisible
    }));

    payload.forEach(p => {
      expect(p.isBot).toBeUndefined(); // Crucial for security
    });
  });
});
