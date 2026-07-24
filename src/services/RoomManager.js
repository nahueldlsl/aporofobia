const PlayerFactory = require('../models/Player');
const MetricsCalculator = require('./MetricsCalculator');

class RoomManager {
  static addPlayer(room, socketId, name, isTeacher = false) {
    if (isTeacher) {
      room.teacherSocketId = socketId;
      return { room, player: null, isTeacher: true };
    }
    if (room.players.has(socketId)) {
      return { room, player: room.players.get(socketId) };
    }

    const player = PlayerFactory.create(socketId, name, room.players.size);
    room.players.set(socketId, player);
    MetricsCalculator.updateMetrics(room);
    return { room, player };
  }

  static removePlayer(room, socketId) {
    if (room && room.players.has(socketId)) {
      room.players.delete(socketId);
      MetricsCalculator.updateMetrics(room);
      return true;
    }
    return false;
  }

  static addBots(room, count = 10) {
    const names = [
      'Amina (Refugiada)', 'Mateo', 'Lucía', 'Tariq (Refugiado)', 'Elena', 
      'Omar (Refugiado)', 'Sofia', 'Yusuf (Refugiado)', 'Carlos', 'Zainab (Refugiada)',
      'Diego', 'Nia (Refugiada)', 'Hugo', 'Fatima (Refugiada)', 'Gabriel'
    ];

    for (let i = 0; i < count; i++) {
      const botId = `bot_${Date.now()}_${i}`;
      const botName = names[i % names.length];
      const isForeigner = botName.includes('Refugiad');
      const bot = PlayerFactory.createBot(botId, botName, isForeigner);
      room.players.set(botId, bot);
    }
    MetricsCalculator.updateMetrics(room);
  }
}

module.exports = RoomManager;
