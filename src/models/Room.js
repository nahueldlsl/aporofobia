module.exports = {
  create(roomCode, teacherSocketId) {
    return {
      code: roomCode,
      teacherSocketId,
      status: 'LOBBY', // LOBBY, CYCLE_0_TUTORIAL, CYCLE_1_PHASE_1, etc., FINISHED
      cycle: 0, // 0: Tutorial, 1, 2, 3, 4, 5
      phase: 1,
      timer: 120,
      timerInterval: null,
      survivalCost: 30,
      players: new Map(),
      requests: [],
      protestsCount: 0,
      socialRevoltActive: false,
      reglaRentaBasicaActiva: false,
      giniPenaltyMultiplier: 1.0,
      metrics: {
        giniIndex: 0,
        cosmopolitanHostRate: 0,
        invisibleCount: 0,
        aporophobiaScore: 0,
        hospitalityScore: 0,
        totalRequests: 0,
        optionACount: 0,
        optionBCount: 0,
        optionCCount: 0,
        eliteInactivityRate: 0,
        foreignerHelpStats: { localOptionC: 0, localTotal: 0, foreignerOptionC: 0, foreignerTotal: 0 }
      },
      history: [],
      cortinaQuote: null,
      specialAlert: null,
      resolution: null
    };
  }
};
