const RoomFactory = require('./src/models/Room');
const RoomManager = require('./src/services/RoomManager');
const CycleManager = require('./src/services/CycleManager');
const ActionManager = require('./src/services/ActionManager');
const MetricsCalculator = require('./src/services/MetricsCalculator');

class GameEngineFacade {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomCode, teacherSocketId) {
    const room = RoomFactory.create(roomCode, teacherSocketId);
    this.rooms.set(roomCode.toUpperCase(), room);
    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase());
  }

  addPlayer(roomCode, socketId, name, isTeacher = false) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada' };
    return RoomManager.addPlayer(room, socketId, name, isTeacher);
  }

  removePlayer(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      if (RoomManager.removePlayer(room, socketId)) {
        return { roomCode: code, room };
      }
    }
    return null;
  }




  startCycle(roomCode, cycleNum = 1) {
    const room = this.getRoom(roomCode);
    return room ? CycleManager.startCycle(room, cycleNum) : null;
  }

  payBasicNeeds(roomCode, socketId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no existe' };
    return ActionManager.payBasicNeeds(room, socketId);
  }

  triggerProtest(roomCode, socketId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no existe' };
    return ActionManager.triggerProtest(room, socketId);
  }

  resolveAssemblyVote(roomCode, voteResult) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no existe' };
    return ActionManager.resolveAssemblyVote(room, voteResult);
  }

  advanceToPhase2(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? CycleManager.advanceToPhase2(room) : null;
  }

  makeDecision(roomCode, solverSocketId, requestId, decisionChoice) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada' };
    return ActionManager.makeDecision(room, solverSocketId, requestId, decisionChoice);
  }

  executeBotDecisions(roomCode) {
    const room = this.getRoom(roomCode);
    if (room) ActionManager.executeBotDecisions(room);
  }

  advanceToPhase3(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? CycleManager.advanceToPhase3(room) : null;
  }

  checkCortinaBiases(room) {
    // Kept for backward compatibility if any test calls it directly
    MetricsCalculator.checkCortinaBiases(room);
  }

  updateMetrics(roomCode) {
    const room = this.getRoom(roomCode);
    if (room) MetricsCalculator.updateMetrics(room);
  }

  checkPhaseCompletion(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? CycleManager.checkPhaseCompletion(room) : false;
  }

  getDebriefData(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? MetricsCalculator.getDebriefData(room) : null;
  }

  autoAdvancePhase(roomCode) {
    const room = this.getRoom(roomCode);
    return room ? CycleManager.autoAdvancePhase(room) : null;
  }
}

module.exports = new GameEngineFacade();
