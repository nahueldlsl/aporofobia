module.exports = {
  create(socketId, name, currentSize) {
    return {
      id: socketId,
      name: name || `Ciudadano #${currentSize + 1}`,
      role: 'PENDING',
      isForeigner: false,
      isBot: false,
      resources: 0,
      dignity: 100,
      survivalMet: false,
      isInvisible: false,
      hasProtested: false,
      decisionsMade: { A: 0, B: 0, C: 0 }
    };
  },
  
  createBot(botId, botName, isForeigner) {
    return {
      id: botId,
      name: botName,
      role: 'PENDING',
      isForeigner: isForeigner,
      isBot: true,
      resources: 0,
      dignity: 100,
      survivalMet: false,
      isInvisible: false,
      hasProtested: false,
      decisionsMade: { A: 0, B: 0, C: 0 }
    };
  }
};
