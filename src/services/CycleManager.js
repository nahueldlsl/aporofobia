const MetricsCalculator = require('./MetricsCalculator');
const ActionManager = require('./ActionManager');
const RoomManager = require('./RoomManager');

class CycleManager {
  static startCycle(room, cycleNum = 1) {

    if (cycleNum === 5) {
      room.reglaRentaBasicaActiva = true;
    }

    room.cycle = cycleNum;
    room.phase = 1;
    room.timer = 420; // 7 minutes
    room.survivalCost = (cycleNum === 2 || cycleNum === 4) ? 40 : 30;
    if (!room.requests) room.requests = [];
    room.protestsCount = 0;
    room.socialRevoltActive = false;
    room.specialAlert = null;
    room.status = `CYCLE_${cycleNum}_PHASE_1`;

    const playerList = Array.from(room.players.values());
    const total = playerList.length;
    if (total === 0) return room;

    if (cycleNum === 1) {
      const eliteCount = Math.max(1, Math.round(total * 0.10));
      const mediaCount = Math.max(1, Math.round(total * 0.30));
      const foreignerCount = Math.max(1, Math.round(total * 0.30));
      
      const shuffled = [...playerList].sort(() => Math.random() - 0.5);
      
      // Asignar roles básicos
      shuffled.forEach((p, index) => {
        if (index < eliteCount) {
          p.role = 'ÉLITE';
          p.dignity = 100;
        } else if (index < eliteCount + mediaCount) {
          p.role = 'CLASE_MEDIA';
          p.dignity = 90;
        } else {
          p.role = 'ÁPORO';
          p.dignity = 40;
        }
        p.isForeigner = false;
        p.isInvisible = false;
      });

      // Asignar extranjeros (solo a Clase Media o Áporos, NUNCA a Élite)
      const nonElitePlayers = shuffled.filter(p => p.role !== 'ÉLITE').sort(() => Math.random() - 0.5);
      nonElitePlayers.forEach((p, index) => {
        if (index < foreignerCount) {
          p.isForeigner = true;
          p.dignity = Math.max(0, p.dignity - 15);
        }
      });
    }

    room.players.forEach(p => {
      if (p.isInvisible) {
        p.resources = 0; // Frozen at 0
        return;
      }
      
      if (p.role === 'ÉLITE') {
        const amt = cycleNum === 4 ? 150 : 100;
        if (cycleNum <= 1) {
          p.resources = amt;
        } else if (cycleNum === 2 && Math.random() < 0.20) {
          p.resources -= 50;
          p.role = 'CLASE_MEDIA';
        } else {
          p.resources += amt;
        }
      } else if (p.role === 'CLASE_MEDIA') {
        const amt = cycleNum === 2 ? Math.floor(Math.random() * 21) + 20 : 50;
        if (cycleNum <= 1) p.resources = amt; else p.resources += amt;
        
        // Upward mobility (Meritocracy Illusion)
        if (p.resources >= 100 && cycleNum > 1) {
          p.role = 'ÉLITE';
          p.dignity = 100;
        }
      } else if (p.role === 'ÁPORO') {
        if (cycleNum <= 1) p.resources = 10; else p.resources += 10;
        if (cycleNum === 4 && p.dignity > 0) p.dignity = Math.max(0, p.dignity - 10);
      }
      p.survivalMet = false;
      p.hasRequestedHelp = false;
      p.hasProtested = false;
      p.hasSkippedProtest = false;
      p.isInvisible = p.dignity <= 0;
    });

    if (cycleNum === 1) {
      room.cortinaQuote = { chapter: 'Capítulo 7: El Pacto Social', quote: 'La pobreza no es un fallo individual de suerte o carácter, sino la asignación inicial desigual...' };
    } else if (cycleNum === 2) {
      room.cortinaQuote = { chapter: 'Crisis Económica y Aporofobia', quote: 'Cuando la economía aprieta, el miedo a caer en la pobreza empuja a las clases medias a rechazar a los más desfavorecidos.' };
    } else if (cycleNum === 3) {
      room.cortinaQuote = { chapter: 'Aporofobia Cotidiana', quote: 'No es un odio estridente, sino una indiferencia silenciosa. Nos acostumbramos a que haya descartados en las calles como si fueran parte del paisaje urbano.' };
    } else if (cycleNum === 4) {
      room.cortinaQuote = { chapter: 'Algoritmos y Arquitectura Hostil', quote: 'La tecnología y las ciudades se diseñan para invisibilizar al pobre, negándole el espacio público y el acceso al crédito.' };
    } else if (cycleNum === 5) {
      room.cortinaQuote = { chapter: 'Capítulo 8: Renta Básica y Cordialidad', quote: 'La auténtica justicia cosmopolita exige superar la caridad paternalista...' };
    }

    MetricsCalculator.updateMetrics(room);
    return room;
  }

  static advanceToPhase2(room) {
    room.phase = 2;
    room.status = `CYCLE_${room.cycle}_PHASE_2`;
    room.timer = 300; // 5 minutes
    room.timer = 300; // 5 minutes

    const pendingRequests = room.requests.filter(r => r.status === 'PENDING' && r.cycle === room.cycle);
    const surplusPlayers = Array.from(room.players.values()).filter(p => (p.role === 'ÉLITE' || p.role === 'CLASE_MEDIA') && p.connected !== false);

    if (surplusPlayers.length > 0) {
      pendingRequests.forEach((req, idx) => {
        const assignedPlayer = surplusPlayers[idx % surplusPlayers.length];
        req.assignedToId = assignedPlayer.id;
      });
    }
    return room;
  }

  static advanceToPhase3(room) {
    room.requests.filter(r => r.status === 'PENDING' && r.cycle === room.cycle).forEach(req => {
      ActionManager.makeDecision(room, req.assignedToId || 'SYSTEM', req.id, 'A');
    });

    room.phase = 3;
    room.status = `CYCLE_${room.cycle}_PHASE_3`;
    room.timer = 240; // 4 minutes

    const totalReqs = room.requests.length;
    const countA = room.requests.filter(r => r.decision === 'A').length;
    const countB = room.requests.filter(r => r.decision === 'B').length;
    const countC = room.requests.filter(r => r.decision === 'C').length;

    const aporophobiaRate = totalReqs > 0 ? (countA + countB) / totalReqs : 0;
    const hospitalityRate = totalReqs > 0 ? countC / totalReqs : 0;

    room.metrics.aporophobiaScore = Math.round(aporophobiaRate * 100);
    if (totalReqs > 0) room.metrics.hospitalityScore = Math.round(hospitalityRate * 100);

    let outcomeText = '';
    let outcomeType = '';

    const hasForeigners = Array.from(room.players.values()).some(p => p.isForeigner);
    const cycle5Reqs = room.requests.filter(r => r.cycle === 5).length;

    if (room.metrics.giniIndex >= 0.85) {
      outcomeType = 'Colapso_Aporofobico';
      outcomeText = 'DISTOPÍA: La desigualdad extrema ha colapsado el tejido social.';
      for (const p of room.players.values()) {
        if (p.role === 'ÁPORO' && !p.survivalMet) {
          p.isInvisible = true;
          p.dignity = 0;
        }
      }
    } else if (room.metrics.giniIndex < 0.50 && room.metrics.hospitalityScore < 50 && hasForeigners) {
      outcomeType = 'Trampa_Nacionalista';
      outcomeText = 'TRAMPA NACIONALISTA: Igualdad interna asegurada, pero mediante la exclusión absoluta del extranjero.';
    } else if (room.metrics.giniIndex < 0.50 && room.metrics.hospitalityScore >= 50 && room.reglaRentaBasicaActiva) {
      outcomeType = 'Utopia_Cosmopolita';
      outcomeText = 'UTOPÍA COSMOPOLITA: Se ha logrado justicia estructural y hospitalidad plena a través de la Renta Básica.';
    } else if (cycle5Reqs === 0 && room.metrics.invisibleCount === 0) {
      outcomeType = 'POBREZA_CERO';
      outcomeText = 'ESTABILIDAD SOCIAL / POBREZA CERO: Al finalizar el juego, nadie necesitó pedir ayuda y no hubo excluidos.';
    } else if (cycle5Reqs === 0 && room.metrics.invisibleCount > 0) {
      outcomeType = 'SOCIEDAD_ROTA';
      outcomeText = 'SILENCIO ESTRUCTURAL: Al final nadie pidió ayuda, pero porque los más vulnerables ya habían sido invisibilizados (0 Dignidad).';
    } else {
      if (aporophobiaRate >= 0.70) {
        outcomeType = 'DISTOPIA_APOROFOBICA';
        outcomeText = 'DISTOPÍA APOROFÓBICA DETECTADA: Más del 70% de las respuestas fueron Indiferencia (A) o Caridad Paternalista (B).';
        for (const p of room.players.values()) {
          if (p.role === 'ÁPORO' && !p.survivalMet) { p.isInvisible = true; p.dignity = 0; }
        }
      } else if (hospitalityRate >= 0.51) {
        outcomeType = 'AVANCE_COSMOPOLITA';
        outcomeText = 'AVANCE COSMOPOLITA ALCANZADO: ¡La mayoría de las decisiones apoyaron la Justicia Estratégica (C)!';
      } else {
        outcomeType = 'ESTANCAMIENTO';
        outcomeText = 'ESTANCAMIENTO SOCIAL: Se brindó caridad mínima o la sociedad estuvo dividida. La estructura de desigualdad se mantiene.';
      }
    }

    // Apply all individual role changes (upward or downward mobility) globally
    for (const p of room.players.values()) {
      if (p.nextRole) {
        p.role = p.nextRole;
        delete p.nextRole;
      }
    }

    room.resolution = { outcomeType, outcomeText, totalReqs, countA, countB, countC };
    room.history.push({
      cycle: room.cycle,
      gini: room.metrics.giniIndex,
      invisible: room.metrics.invisibleCount,
      hospitality: room.metrics.hospitalityScore,
      aporophobia: room.metrics.aporophobiaScore,
      socialRevolt: room.socialRevoltActive
    });

    MetricsCalculator.updateMetrics(room);
    return room;
  }

  static checkPhaseCompletion(room) {
    if (room.phase === 1) {
      const humans = Array.from(room.players.values()).filter(p => p.connected !== false);
      if (humans.length === 0) return false;
      return humans.every(p => {
        const hasReq = room.requests.some(r => r.fromId === p.id && r.cycle === room.cycle);
        if (p.role === 'ÁPORO' && hasReq) {
          return p.hasProtested || p.hasSkippedProtest;
        }
        return p.survivalMet || hasReq || p.isInvisible;
      });
    } else if (room.phase === 2) {
      const assignedToHumans = room.requests.filter(r => {
        const solver = room.players.get(r.assignedToId);
        return solver && r.cycle === room.cycle && solver.connected !== false;
      });
      if (assignedToHumans.length === 0) return true; 
      return assignedToHumans.every(r => r.status === 'RESOLVED');
    }
    return false;
  }

  static autoAdvancePhase(room) {
    if (!room || room.status === 'FINISHED') return room;
    if (room.phase === 1) {
      this.advanceToPhase2(room);
    } else if (room.phase === 2) {
      this.advanceToPhase3(room);
    } else if (room.phase === 3) {
      if (room.cycle < 5) {
        this.startCycle(room, room.cycle + 1);
      } else {
        room.status = 'FINISHED';
      }
    }
    return room;
  }
}

module.exports = CycleManager;
