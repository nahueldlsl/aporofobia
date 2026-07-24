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


}

module.exports = RoomManager;
