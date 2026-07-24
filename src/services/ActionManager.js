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
      player.hasRequestedHelp = true;

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

  static skipProtest(room, socketId) {
    const player = room.players.get(socketId);
    if (!player || player.role !== 'ÁPORO') {
      return { error: 'Solo los ciudadanos precarizados pueden omitir.' };
    }
    player.hasSkippedProtest = true;
    return { success: true, player };
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
      // Execute assembly automatically
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

      room.protestsCount = 0; // Reset after successful revolution
      room.specialAlert = {
        title: '✊ REVOLUCIÓN SOCIAL (QUÓRUM ALCANZADO)',
        message: `La Huelga Social triunfó. Se ha expropiado el 20% de la riqueza acumulada de la Élite (${totalExpropriated} Pts) y se redistribuyó entre los precarizados.`,
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

  static makeDecision(room, solverSocketId, requestId, decisionChoice) {
    const req = room.requests.find(r => r.id === requestId);
    if (!req) return { error: 'Petición no encontrada' };
    if (req.status === 'RESOLVED') return { error: 'Esta petición ya fue resuelta' };

    const solver = room.players.get(solverSocketId);
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
        
        // Downward mobility: Middle class falls into poverty if rejected
        if (needyPlayer.role === 'CLASE_MEDIA') {
          needyPlayer.nextRole = 'ÁPORO';
        }
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
    } else if (decisionChoice === 'D') {
      if (solver) {
        solver.resources -= 20;
        solver.dignity = Math.min(100, solver.dignity + 10);
      }
      if (needyPlayer) {
        needyPlayer.dignity = Math.max(0, needyPlayer.dignity - 25);
        if (needyPlayer.dignity <= 0) needyPlayer.isInvisible = true;
        if (needyPlayer.role === 'CLASE_MEDIA') {
          needyPlayer.nextRole = 'ÁPORO';
        }
      }
      room.metrics.optionACount++; // Consider it a rejection for the sake of aporophobia metrics
      if (req.isForeigner) room.metrics.foreignerHelpStats.foreignerTotal++;
      else room.metrics.foreignerHelpStats.localTotal++;
    }

    MetricsCalculator.checkCortinaBiases(room);
    MetricsCalculator.updateMetrics(room);
    return { success: true, req, needyPlayer, solver };
  }


}

module.exports = ActionManager;
