const PlayerFactory = require('../models/Player');
const MetricsCalculator = require('./MetricsCalculator');

class RoomManager {
  static addPlayer(room, socketId, name, isTeacher = false, persistentId = null) {
    if (isTeacher) {
      room.teacherSocketId = socketId;
      return { room, player: null, isTeacher: true };
    }
    
    // Check if player reconnects
    if (persistentId && room.players.has(persistentId)) {
      const existingPlayer = room.players.get(persistentId);
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      return { room, player: existingPlayer };
    }

    // New player
    const player = PlayerFactory.create(socketId, name, room.players.size, persistentId);
    room.players.set(player.id, player);
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


}

module.exports = RoomManager;
