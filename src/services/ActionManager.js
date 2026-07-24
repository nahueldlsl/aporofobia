const MetricsCalculator = require('./MetricsCalculator');

class ActionManager {
  static payBasicNeeds(room, socketId) {
    const player = room.players.get(socketId);
    if (!player) return { error: 'Jugador no encontrado' };

    const SURVIVAL_COST = room.survivalCost || 30;
    if (player.resources >= SURVIVAL_COST) {
      player.resources -= SURVIVAL_COST;
      player.survivalMet = true;
      player.dignity = Math.min(100, player.dignity + 5);
      MetricsCalculator.updateMetrics(room);
      return { success: true, player, neededHelp: false };
    } else {
      const paid = player.resources;
      const deficit = SURVIVAL_COST - paid;
      player.resources = 0;
      player.survivalMet = false;

      let existingReq = room.requests.find(r => r.fromId === socketId && r.cycle === room.cycle);
      if (!existingReq) {
        const botMessage = player.isForeigner
          ? 'Solicito hospitalidad urgente para cubrir el umbral de alimentación y abrigo familiar.'
          : 'Requiero apoyo solidario básico para subsistir este ciclo en condiciones de dignidad.';

        existingReq = {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          cycle: room.cycle,
          fromId: socketId,
          fromRole: player.role,
          isForeigner: player.isForeigner,
          message: botMessage,
          needed: deficit,
          assignedToId: null,
          status: 'PENDING',
          decision: null
        };
        room.requests.push(existingReq);
      }
      MetricsCalculator.updateMetrics(room);
      return { success: true, player, neededHelp: true, request: existingReq };
    }
  }

  static triggerProtest(room, socketId) {
    const player = room.players.get(socketId);
    if (!player || player.role !== 'ÁPORO') {
      return { error: 'Solo los ciudadanos precarizados pueden convocar una Huelga Social.' };
    }
    if (!player.hasProtested) {
      player.hasProtested = true;
      room.protestsCount++;
    }

    const aporos = Array.from(room.players.values()).filter(p => p.role === 'ÁPORO');
    const aporosCount = aporos.length;

    if (aporosCount > 0 && (room.protestsCount / aporosCount) >= 0.40) {
      room.status = 'ASAMBLEA';
      room.specialAlert = {
        title: '✊ ASAMBLEA Y HUELGA SOCIAL DE PRECARIZADOS (QUÓRUM ALCANZADO)',
        message: 'Los ciudadanos precarizados han convocado una Huelga Social masiva. El sistema económico se paraliza.',
        quote: '«La movilización de los excluidos visibiliza que la pobreza es una injusticia distributiva, no una fatalidad del destino.»'
      };
    } else {
      room.specialAlert = {
        title: '✊ INICIO DE HUELGA SOCIAL',
        message: `Un grupo de ciudadanos precarizados ha iniciado protestas (${room.protestsCount} participantes). Si alcanzan el 40%, convocarán Asamblea.`,
        quote: '«La movilización de los excluidos visibiliza que la pobreza es una injusticia distributiva, no una fatalidad del destino.»'
      };
    }
    MetricsCalculator.updateMetrics(room);
    return { success: true, protestsCount: room.protestsCount };
  }

  static resolveAssemblyVote(room, voteResult) {
    if (voteResult === 'APROBADO') {
      const elites = Array.from(room.players.values()).filter(p => p.role === 'ÉLITE');
      const aporos = Array.from(room.players.values()).filter(p => p.role === 'ÁPORO');
      
      let totalExpropriated = 0;
      elites.forEach(e => {
        const amount = Math.floor(e.resources * 0.20);
        e.resources -= amount;
        totalExpropriated += amount;
      });

      if (aporos.length > 0) {
        const share = Math.floor(totalExpropriated / aporos.length);
        aporos.forEach(a => { a.resources += share; });
      }
    } else if (voteResult === 'RECHAZADO') {
      room.giniPenaltyMultiplier = 1.5;
    }
    room.status = `CYCLE_${room.cycle}_PHASE_${room.phase}`;
    room.specialAlert = null;
    MetricsCalculator.updateMetrics(room);
    return { success: true };
  }

  static makeDecision(room, solverSocketId, requestId, decisionChoice) {
    const req = room.requests.find(r => r.id === requestId);
    if (!req) return { error: 'Petición no encontrada' };
    if (req.status === 'RESOLVED') return { error: 'Esta petición ya fue resuelta' };

    const solver = room.players.get(solverSocketId);
    if (room.status === 'ASAMBLEA' && solver && solver.role === 'ÉLITE') {
      return { error: 'BLOQUEADO: El sistema financiero está paralizado por la Asamblea. La Élite no puede realizar transacciones.' };
    }
    if (decisionChoice === 'B' && solver && solver.resources < 10) {
      return { error: 'FONDOS INSUFICIENTES: La Opción B cuesta 10 Pts. No puedes salvar a todos.' };
    }
    if (decisionChoice === 'C' && solver && solver.resources < 15) {
      return { error: 'FONDOS INSUFICIENTES: La Opción C cuesta 15 Pts. No puedes salvar a todos.' };
    }

    const needyPlayer = room.players.get(req.fromId);
    req.status = 'RESOLVED';
    req.decision = decisionChoice;

    if (solver) {
      solver.decisionsMade[decisionChoice] = (solver.decisionsMade[decisionChoice] || 0) + 1;
    }

    if (decisionChoice === 'A') {
      if (needyPlayer) {
        needyPlayer.dignity = Math.max(0, needyPlayer.dignity - 25);
        if (needyPlayer.dignity <= 0) needyPlayer.isInvisible = true;
      }
      room.metrics.optionACount++;
      if (req.isForeigner) room.metrics.foreignerHelpStats.foreignerTotal++;
      else room.metrics.foreignerHelpStats.localTotal++;
    } else if (decisionChoice === 'B') {
      if (solver) solver.resources -= 10;
      if (needyPlayer) {
        needyPlayer.resources += 10;
        needyPlayer.survivalMet = true;
        needyPlayer.dignity = Math.min(100, needyPlayer.dignity + 5);
      }
      room.metrics.optionBCount++;
      if (req.isForeigner) room.metrics.foreignerHelpStats.foreignerTotal++;
      else room.metrics.foreignerHelpStats.localTotal++;
    } else if (decisionChoice === 'C') {
      if (solver) solver.resources -= 15;
      if (needyPlayer) {
        needyPlayer.resources += 20;
        needyPlayer.survivalMet = true;
        needyPlayer.dignity = Math.min(100, needyPlayer.dignity + 30);
        needyPlayer.isInvisible = false;
        needyPlayer.nextRole = 'CLASE_MEDIA';
      }
      room.metrics.optionCCount++;
      if (req.isForeigner) {
        room.metrics.foreignerHelpStats.foreignerOptionC++;
        room.metrics.foreignerHelpStats.foreignerTotal++;
        if (needyPlayer.isBot) {
          room.metrics.hospitalityScore = (room.metrics.hospitalityScore || 0) + 10;
        }
      } else {
        room.metrics.foreignerHelpStats.localOptionC++;
        room.metrics.foreignerHelpStats.localTotal++;
      }
    }

    MetricsCalculator.checkCortinaBiases(room);
    MetricsCalculator.updateMetrics(room);
    return { success: true, req, needyPlayer, solver };
  }

  static executeBotDecisions(room) {
    const pendingReqs = room.requests.filter(r => r.status === 'PENDING');
    pendingReqs.forEach(req => {
      const solver = room.players.get(req.assignedToId);
      if (solver && solver.isBot) {
        const rand = Math.random();
        const choice = rand < 0.3 ? 'A' : rand < 0.7 ? 'B' : 'C';
        this.makeDecision(room, solver.id, req.id, choice);
      }
    });
  }
}

module.exports = ActionManager;
