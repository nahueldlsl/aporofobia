class MetricsCalculator {
  static checkCortinaBiases(room) {
    const stats = room.metrics.foreignerHelpStats;
    const localRate = stats.localTotal > 0 ? stats.localOptionC / stats.localTotal : 1;
    const foreignerRate = stats.foreignerTotal > 0 ? stats.foreignerOptionC / stats.foreignerTotal : 1;

    if (stats.foreignerTotal >= 2 && stats.localTotal >= 2 && localRate > (foreignerRate + 0.3)) {
      room.specialAlert = {
        title: 'Diagnóstico Ético: Adela Cortina (Cap. 8)',
        message: 'Se ha detectado una brecha en la ayuda: los ciudadanos locales recibieron respuestas de Justicia (Opción C) significativamente más que los ciudadanos extranjeros.',
        quote: '«A esto Adela Cortina lo llama Aporofobia: no rechazas al extranjero por su origen étnico, rechazas al pobre porque aparenta no tener recursos que ofrecer.»'
      };
    }
  }

  static updateMetrics(room) {
    if (!room) return;
    const playerList = Array.from(room.players.values());
    const n = playerList.length;

    if (n === 0) {
      room.metrics.giniIndex = 0;
      room.metrics.cosmopolitanHostRate = 0;
      room.metrics.invisibleCount = 0;
      return;
    }

    const resources = playerList.map(p => p.resources);
    let sumAbsoluteDiff = 0;
    let sumResources = 0;

    for (let i = 0; i < n; i++) {
      sumResources += resources[i];
      for (let j = 0; j < n; j++) {
        sumAbsoluteDiff += Math.abs(resources[i] - resources[j]);
      }
    }

    const mean = sumResources / n;
    let gini = mean > 0 ? sumAbsoluteDiff / (2 * n * n * mean) : 1.0;
    gini = Math.min(1.0, gini * (room.giniPenaltyMultiplier || 1.0));
    room.metrics.giniIndex = parseFloat(gini.toFixed(3));

    if (room.metrics.giniIndex > 0.60 && room.cycle > 0) {
      if (!room.socialRevoltActive) {
        room.socialRevoltActive = true;
        room.specialAlert = {
          title: '🔥 REVUELTA SOCIAL POR DESIGUALDAD EXTREMA (Gini > 0.60)',
          message: 'El nivel de desigualdad superó el umbral crítico. La inestabilidad social recorta 15 Pts a la Élite.',
          quote: '«La desigualdad extrema genera inestabilidad sistémica.»'
        };
        playerList.filter(p => p.role === 'ÉLITE').forEach(p => {
          p.resources = Math.max(0, p.resources - 15);
        });
      }
    } else {
      room.socialRevoltActive = false;
    }

    const invisibles = playerList.filter(p => p.isInvisible || p.dignity <= 0).length;
    room.metrics.invisibleCount = invisibles;

    const aporos = playerList.filter(p => p.role === 'ÁPORO');
    const hostedWithDignity = aporos.filter(p => p.dignity >= 50 && p.survivalMet).length;
    const hostRate = aporos.length > 0 ? (hostedWithDignity / aporos.length) * 100 : 100;
    room.metrics.cosmopolitanHostRate = Math.round(hostRate);

    const elites = playerList.filter(p => p.role === 'ÉLITE');
    const inactiveElites = elites.filter(p => {
      const dm = p.decisionsMade || { A: 0, B: 0, C: 0 };
      return (dm.A + dm.B + dm.C) === 0;
    }).length;
    room.metrics.eliteInactivityRate = elites.length > 0 ? Math.round((inactiveElites / elites.length) * 100) : 0;
  }

  static getDebriefData(room) {
    if (!room) return null;
    const stats = room.metrics.foreignerHelpStats;
    const localRateC = stats.localTotal > 0 ? Math.round((stats.localOptionC / stats.localTotal) * 100) : 0;
    const foreignerRateC = stats.foreignerTotal > 0 ? Math.round((stats.foreignerOptionC / stats.foreignerTotal) * 100) : 0;

    return {
      code: room.code,
      history: room.history,
      finalGini: room.metrics.giniIndex,
      finalInvisible: room.metrics.invisibleCount,
      localRateC,
      foreignerRateC,
      totalOptionA: room.metrics.optionACount,
      totalOptionB: room.metrics.optionBCount,
      totalOptionC: room.metrics.optionCCount,
      protestsTotal: room.protestsCount,
      cortinaDiagnosis: localRateC > (foreignerRateC + 20)
        ? 'Aporofobia Confirmada: La clase otorgó justicia (Opción C) significativamente más a los ciudadanos nacionales que a los refugiados/extranjeros pobres.'
        : 'Hospitalidad Cosmopolita Lograda: La clase mantuvo niveles equitativos de ayuda hacia ciudadanos nacionales y refugiados sin sesgo xenófobo.'
    };
  }
}

module.exports = MetricsCalculator;
