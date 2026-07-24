import { DOMManager } from './DOMManager.js';
import { UIManager } from './UIManager.js';
import { SocketClient } from './SocketClient.js';
import { StudentController } from './StudentController.js';
import { TeacherController } from './TeacherController.js';
import { DebriefController } from './DebriefController.js';

class App {
  constructor() {
    this.state = {
      myRole: null,
      currentRoomCode: null,
      isTeacher: false,
      myPlayerState: null,
      phase: 1,
      status: 'LOBBY',
      cycle: 1,
      currentSurvivalCost: 30
    };

    this.dom = new DOMManager();
    this.ui = new UIManager(this.dom);
    this.socketClient = new SocketClient();

    this.studentCtrl = new StudentController(this.dom, this.socketClient, this.state);
    this.teacherCtrl = new TeacherController(this.dom, this.socketClient, this.state, this.ui);
    this.debriefCtrl = new DebriefController(this.dom);

    this.bindLandingEvents();
    this.bindSocketEvents();
    
    // Attach to window so inner HTML onClick handlers work (e.g. submitDecision)
    window.app = this;
  }

  bindLandingEvents() {
    const l = this.dom.landing;
    l.btnJoinStudent.addEventListener('click', () => {
      const name = l.studentName.value.trim() || 'Estudiante Anónimo';
      const code = l.studentRoom.value.trim().toUpperCase();
      if (!code) return alert('Por favor ingresa un código de sala válido.');

      this.socketClient.emit('join_room', { roomCode: code, name, isTeacher: false }, (res) => {
        if (res.success) {
          this.state.currentRoomCode = res.roomCode;
          this.state.isTeacher = false;
          this.dom.student.name.textContent = name;
          this.ui.showView('student');
        } else alert(res.error || 'Error al unirse a la sala.');
      });
    });

    l.btnCreateRoom.addEventListener('click', () => {
      const code = l.teacherRoom.value.trim().toUpperCase();
      const payload = code ? { roomCode: code, isTeacher: true } : { teacherName: 'Profesor' };
      const event = code ? 'join_room' : 'create_room';

      this.socketClient.emit(event, payload, (res) => {
        if (res.success) {
          this.state.currentRoomCode = res.roomCode;
          this.state.isTeacher = true;
          this.dom.teacher.roomCode.textContent = res.roomCode;
          this.ui.showView('teacher');
        } else alert(res.error || 'No se pudo crear/unir a la sala');
      });
    });
  }

  bindSocketEvents() {
    this.socketClient.on('room_state_update', (data) => this.handleRoomStateUpdate(data));
    this.socketClient.on('player_private_update', (data) => this.handlePlayerPrivateUpdate(data));
  }

  handleRoomStateUpdate(data) {
    this.state.phase = data.phase;
    this.state.status = data.status;
    this.state.cycle = data.cycle;
    this.state.currentSurvivalCost = data.survivalCost || 30;

    if (data.timer !== undefined) this.ui.updateTimer(data.timer);

    this.updateCortinaQuotes(data.cortinaQuote);
    this.updateRevoltBanner(data.specialAlert);

    if (this.state.isTeacher) {
      this.teacherCtrl.render(data);
    } else {
      this.handleStudentPhaseResolution(data.resolution);
    }
  }

  handlePlayerPrivateUpdate({ player, assignedRequests }) {
    if (!player) return;
    this.studentCtrl.render(player, assignedRequests);
  }

  updateCortinaQuotes(quoteData) {
    if (!quoteData) return;
    this.dom.student.cortinaChapter.textContent = quoteData.chapter;
    this.dom.student.cortinaQuote.textContent = `«${quoteData.quote}»`;
    this.dom.teacher.cortinaChapter.textContent = quoteData.chapter;
    this.dom.teacher.cortinaQuote.textContent = `«${quoteData.quote}»`;
  }

  updateRevoltBanner(alertData) {
    const t = this.dom.teacher;
    if (alertData) {
      t.revoltBanner.classList.remove('hidden');
      t.revoltTitle.textContent = alertData.title;
      t.revoltMessage.textContent = `${alertData.message} ${alertData.quote}`;
    } else {
      t.revoltBanner.classList.add('hidden');
    }
  }

  handleStudentPhaseResolution(resolution) {
    if (this.state.status === 'LOBBY') return;
    if (this.state.phase === 3 && resolution) {
      this.dom.student.resolutionTitle.textContent = resolution.outcomeType.replace(/_/g, ' ');
      this.dom.student.resolutionDesc.textContent = resolution.outcomeText;
    }
  }
}

// Initialize Application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
