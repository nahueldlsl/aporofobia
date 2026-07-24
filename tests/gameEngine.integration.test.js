const gameEngine = require('../gameEngine');

describe('Auditoría de Flujos Críticos - Proyecto Cosmópolis', () => {
  let roomCode = 'TEST-ROOM';

  beforeEach(() => {
    // Reset gameEngine room state before each test
    gameEngine.rooms = new Map();
    gameEngine.createRoom(roomCode, 'teacher-socket');
  });

  describe('1. Máquina de Estados y Bloqueo de Interfaz (Mecánica de Huelga)', () => {
    it('Debe registrar Convocar_Huelga solo si proviene del rol ÁPORO (Precarizado)', () => {
      const room = gameEngine.getRoom(roomCode);
      
      // Inject Elite Player
      room.players.set('elite-1', { id: 'elite-1', role: 'ÉLITE' });
      // Inject Aporo Player
      room.players.set('aporo-1', { id: 'aporo-1', role: 'ÁPORO' });

      // Attempt by Elite should fail
      const resultElite = gameEngine.triggerProtest(roomCode, 'elite-1');
      expect(resultElite.error).toBeDefined();

      // Attempt by Aporo should succeed
      const resultAporo = gameEngine.triggerProtest(roomCode, 'aporo-1');
      expect(resultAporo.success).toBe(true);
    });

    it('Lógica de Quórum: El servidor debe emitir Estado_Asamblea al alcanzar 40% de los precarizados', () => {
      const room = gameEngine.getRoom(roomCode);
      
      // Inject 5 Aporos
      for (let i = 1; i <= 5; i++) {
        room.players.set(`aporo-${i}`, { id: `aporo-${i}`, role: 'ÁPORO', hasProtested: false });
      }

      // 40% of 5 = 2 aporos.
      gameEngine.triggerProtest(roomCode, 'aporo-1');
      // At this point, 1/5 = 20%. Should NOT be Asamblea.
      expect(room.status).not.toBe('ASAMBLEA');

      gameEngine.triggerProtest(roomCode, 'aporo-2');
      // At this point, 2/5 = 40%. State MUST change to ASAMBLEA.
      expect(room.status).toBe('ASAMBLEA');
    });

    it('Prueba de Seguridad (Anti-Cheat): Debe rechazar Donar_Recurso de la Élite durante estado Asamblea', () => {
      const room = gameEngine.getRoom(roomCode);
      room.status = 'ASAMBLEA'; // Force Asamblea State
      room.players.set('elite-1', { id: 'elite-1', role: 'ÉLITE', resources: 100 });
      room.requests.push({ id: 'mock-req-id', fromId: 'mock-aporo', status: 'PENDING' });
      
      // Intentar donar recursos
      const result = gameEngine.makeDecision(roomCode, 'elite-1', 'mock-req-id', 'C');
      
      // La transacción debe ser abortada por el Anti-Cheat
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/bloqueado/i); // Expects some blocking message
      expect(room.players.get('elite-1').resources).toBe(100); // Resources intact
    });
  });

  describe('2. Mutación de Variables y Votación (Resolución de Asamblea)', () => {
    it('Si es Aprobado: deduce exactamente 20% del inventario de Élite y lo suma a Precarizados', () => {
      const room = gameEngine.getRoom(roomCode);
      room.status = 'ASAMBLEA';
      
      room.players.set('elite-1', { id: 'elite-1', role: 'ÉLITE', resources: 100 });
      room.players.set('aporo-1', { id: 'aporo-1', role: 'ÁPORO', resources: 10 });
      room.players.set('aporo-2', { id: 'aporo-2', role: 'ÁPORO', resources: 5 });

      gameEngine.resolveAssemblyVote(roomCode, 'APROBADO');

      // Elite loses 20% (20 pts) -> 80
      expect(room.players.get('elite-1').resources).toBe(80);
      
      // Precarizados split the 20 pts -> 10 pts each
      expect(room.players.get('aporo-1').resources).toBe(20);
      expect(room.players.get('aporo-2').resources).toBe(15);
    });

    it('Si es Rechazada: aplica un multiplicador negativo drástico al Gini_Index', () => {
      const room = gameEngine.getRoom(roomCode);
      room.status = 'ASAMBLEA';
      room.players.set('elite-1', { id: 'elite-1', role: 'ÉLITE', resources: 100 });
      room.players.set('aporo-1', { id: 'aporo-1', role: 'ÁPORO', resources: 5 });
      gameEngine.updateMetrics(roomCode); // calc initial Gini

      gameEngine.resolveAssemblyVote(roomCode, 'RECHAZADO');

      // Gini was roughly ~0.45 initially, 1.5 multiplier should push it beyond 0.65
      expect(room.metrics.giniIndex).toBeGreaterThan(0.60); 
    });
  });

  describe('3. Integración del "Factor Extranjero" (Aislamiento de Bots)', () => {
    it('Ayudas (Opción C) suman a Hospitality_Score SOLO si el receptor es un Bot (Extranjero)', () => {
      const room = gameEngine.getRoom(roomCode);
      
      room.players.set('elite-1', { id: 'elite-1', role: 'ÉLITE', resources: 100, decisionsMade: {} });
      room.players.set('human-poor', { id: 'human-poor', role: 'ÁPORO', isBot: false, dignity: 50 });
      room.players.set('bot-foreign', { id: 'bot-foreign', role: 'ÁPORO', isBot: true, dignity: 50 });

      room.requests.push({ id: 'req-human', fromId: 'human-poor', status: 'PENDING', isForeigner: false });
      room.requests.push({ id: 'req-bot', fromId: 'bot-foreign', status: 'PENDING', isForeigner: true });

      // Help local human
      gameEngine.makeDecision(roomCode, 'elite-1', 'req-human', 'C');
      const hospitalityAfterHuman = room.metrics.hospitalityScore || 0;
      
      // Help foreigner bot
      gameEngine.makeDecision(roomCode, 'elite-1', 'req-bot', 'C');
      const hospitalityAfterBot = room.metrics.hospitalityScore || 0;

      // Score should only increase for the Bot
      expect(hospitalityAfterHuman).toBe(0);
      expect(hospitalityAfterBot).toBeGreaterThan(0);
    });
  });

  describe('4. Árbol de Resolución de Finales (End-to-End Win States)', () => {
    it('Test A: Gini >= 0.95 emite Colapso_Aporofobico', () => {
      const room = gameEngine.getRoom(roomCode);
      room.metrics.giniIndex = 0.96;
      room.metrics.hospitalityScore = 10;
      
      const result = gameEngine.advanceToPhase3(roomCode);
      expect(result.resolution.outcomeType).toBe('Colapso_Aporofobico');
    });

    it('Test B: Gini < 0.50 y Hospitality < Umbral emite Trampa_Nacionalista', () => {
      const room = gameEngine.getRoom(roomCode);
      room.metrics.giniIndex = 0.40;
      room.metrics.hospitalityScore = 20; // Below hypothetical threshold of 50
      
      const result = gameEngine.advanceToPhase3(roomCode);
      expect(result.resolution.outcomeType).toBe('Trampa_Nacionalista');
    });

    it('Test C: Gini < 0.50, Hospitality >= Umbral y Renta_Basica == true emite Utopia_Cosmopolita', () => {
      const room = gameEngine.getRoom(roomCode);
      room.metrics.giniIndex = 0.40;
      room.metrics.hospitalityScore = 80;
      room.reglaRentaBasicaActiva = true; // Inject specific rule state
      
      const result = gameEngine.advanceToPhase3(roomCode);
      expect(result.resolution.outcomeType).toBe('Utopia_Cosmopolita');
    });
  });
});
