const CycleManager = require('../src/services/CycleManager.js');
const ActionManager = require('../src/services/ActionManager.js');
const MetricsCalculator = require('../src/services/MetricsCalculator.js');

// Mock a room
function createRoom(numPlayers) {
  const room = {
    roomCode: 'TEST',
    players: new Map(),
    cycle: 1,
    phase: 1,
    requests: [],
    history: [],
    metrics: {
      giniIndex: 0,
      cosmopolitanHostRate: 0,
      invisibleCount: 0,
      aporophobiaScore: 0,
      hospitalityScore: 0,
      foreignerHelpStats: { localTotal: 0, localOptionC: 0, foreignerTotal: 0, foreignerOptionC: 0 }
    },
    survivalCost: 30,
    reglaRentaBasicaActiva: false
  };

  for (let i = 0; i < numPlayers; i++) {
    room.players.set(`p${i}`, {
      id: `p${i}`,
      role: 'PENDING',
      resources: 0,
      dignity: 100,
      isForeigner: false,
      survivalMet: false,
      hasRequestedHelp: false,
      hasProtested: false,
      hasSkippedProtest: false,
      isInvisible: false,
      decisionsMade: {}
    });
  }
  return room;
}

function runSimulation(numPlayers, strategy) {
  const room = createRoom(numPlayers);
  CycleManager.startCycle(room, 1);

  for (let c = 1; c <= 5; c++) {
    // Phase 1
    const players = Array.from(room.players.values());
    for (const p of players) {
      if (p.isInvisible) continue;
      ActionManager.payBasicNeeds(room, p.id);
      
      // Protests
      if (p.role === 'ÁPORO' && p.hasRequestedHelp) {
        if (Math.random() < 0.5) p.hasProtested = true;
        else p.hasSkippedProtest = true;
      }
    }

    CycleManager.advanceToPhase2(room);

    // Phase 2
    for (const req of room.requests) {
      if (req.status === 'PENDING' && req.assignedToId) {
        let decision = 'A';
        const solver = room.players.get(req.assignedToId);
        
        if (strategy === 'EGOIST') {
          decision = 'A'; // Always reject
        } else if (strategy === 'ALTRUIST') {
          if (solver && solver.resources >= 15) decision = 'C';
          else if (solver && solver.resources >= 10) decision = 'B';
          else decision = 'A';
        } else if (strategy === 'MIXED') {
          const rand = Math.random();
          if (rand < 0.4 && solver && solver.resources >= 15) decision = 'C';
          else if (rand < 0.7 && solver && solver.resources >= 10) decision = 'B';
          else if (rand < 0.8 && solver && solver.resources >= 20) decision = 'D';
          else decision = 'A';
        } else if (strategy === 'COLLAPSE') {
          if (solver && solver.role === 'CLASE_MEDIA' && solver.resources >= 20) {
            decision = 'D'; // Middle class bankrupts itself
          } else {
            decision = 'A'; // Elite ignores
          }
        }
        
        ActionManager.makeDecision(room, req.assignedToId, req.id, decision);
      }
    }

    CycleManager.advanceToPhase3(room);
    
    // Check if game ended prematurely
    if (room.status === 'FINISHED') break;

    if (c < 5) {
      CycleManager.startCycle(room, c + 1);
    }
  }

  // Calculate final outcome
  CycleManager.advanceToPhase3(room); // Forces outcome resolution if cycle 5
  return room;
}

const strategies = ['EGOIST', 'ALTRUIST', 'MIXED', 'COLLAPSE'];
const results = {};

for (const strategy of strategies) {
  results[strategy] = {};
  for (let i = 0; i < 100; i++) {
    const room = runSimulation(20, strategy);
    const type = room.resolution ? room.resolution.outcomeType : 'UNKNOWN';
    if (i === 0) {
      console.log(`--- STRATEGY: ${strategy} ---`);
      console.log(`Gini: ${room.metrics.giniIndex}`);
      console.log(`Hospitality: ${room.metrics.hospitalityScore}`);
      console.log(`Aporophobia: ${room.metrics.aporophobiaScore}`);
      console.log(`Requests: ${room.requests.length}`);
      console.log(`Resources:`, Array.from(room.players.values()).map(p => p.resources));
      console.log(`Outcome: ${type}`);
    }
    results[strategy][type] = (results[strategy][type] || 0) + 1;
  }
}

console.log(JSON.stringify(results, null, 2));
