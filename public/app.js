/**
 * Proyecto Cosmópolis: El Umbral de la Cordialidad
 * Frontend Client JavaScript - Refactored OOP Architecture
 */

class DOMManager {
  constructor() {
    this.views = {
      landing: document.getElementById('viewLanding'),
      student: document.getElementById('viewStudent'),
      teacher: document.getElementById('viewTeacher'),
      debrief: document.getElementById('viewDebrief')
    };
    
    this.timer = {
      header: document.getElementById('headerTimer'),
      text: document.getElementById('timerText')
    };

    this.landing = {
      studentName: document.getElementById('studentName'),
      studentRoom: document.getElementById('studentRoomCode'),
      teacherRoom: document.getElementById('teacherRoomCode'),
      btnJoinStudent: document.getElementById('btnJoinStudent'),
      btnCreateRoom: document.getElementById('btnCreateRoom')
    };

    this.student = {
      name: document.getElementById('displayStudentName'),
      roleBadge: document.getElementById('studentRoleBadge'),
      roleDesc: document.getElementById('roleDescription'),
      valResources: document.getElementById('valResources'),
      barResources: document.getElementById('barResources'),
      valDignity: document.getElementById('valDignity'),
      barDignity: document.getElementById('barDignity'),
      foreignBadge: document.getElementById('foreignBadgeContainer'),
      cortinaChapter: document.getElementById('studentCortinaChapter'),
      cortinaQuote: document.getElementById('studentCortinaQuote'),
      btnPaySurvival: document.getElementById('btnPaySurvival'),
      btnProtest: document.getElementById('btnProtest'),
      survivalStatus: document.getElementById('survivalStatus'),
      survivalDesc: document.getElementById('survivalDescriptionText'),
      objectiveText: document.getElementById('studentObjectiveText'),
      phases: {
        lobby: document.getElementById('studentLobbyPhase'),
        phase1: document.getElementById('studentPhase1'),
        phase2: document.getElementById('studentPhase2'),
        phase2Decision: document.getElementById('phase2DecisionView'),
        phase2Waiting: document.getElementById('phase2WaitingView'),
        phase3: document.getElementById('studentPhase3')
      },
      requestContainer: document.getElementById('requestContainer'),
      resolutionTitle: document.getElementById('resolutionTitle'),
      resolutionDesc: document.getElementById('resolutionDesc')
    };

    this.teacher = {
      roomCode: document.getElementById('displayRoomCode'),
      valGini: document.getElementById('valGini'),
      valHostRate: document.getElementById('valHostRate'),
      valInvisible: document.getElementById('valInvisible'),
      valEliteInactive: document.getElementById('valEliteInactive'),
      revoltBanner: document.getElementById('revoltBanner'),
      revoltTitle: document.getElementById('revoltTitle'),
      revoltMessage: document.getElementById('revoltMessage'),
      studentsGrid: document.getElementById('studentsGrid'),
      cortinaChapter: document.getElementById('teacherCortinaChapter'),
      cortinaQuote: document.getElementById('teacherCortinaQuote'),
      btnAddBots: document.getElementById('btnAddBots'),
      btnMasterNext: document.getElementById('btnMasterNext'),
      btnOpenGuide: document.getElementById('btnOpenGuide'),
      btnCloseGuide: document.getElementById('btnCloseGuide'),
      guideModal: document.getElementById('teacherGuideModal'),
      btnShowDebrief: document.getElementById('btnShowDebrief'),
      btnBackToTeacher: document.getElementById('btnBackToTeacher'),
      teleprompter: document.getElementById('teleprompterInstruction')
    };

    this.debrief = {
      diagnosisText: document.getElementById('debriefDiagnosisText'),
      statsSummary: document.getElementById('debriefStatsSummary'),
      giniChart: document.getElementById('giniChartCanvas'),
      biasChart: document.getElementById('biasChartCanvas')
    };
  }
}

class UIManager {
  constructor(dom) {
    this.dom = dom;
  }

  showView(viewName) {
    Object.values(this.dom.views).forEach(v => {
      if(v) v.classList.add('hidden');
    });

    if (this.dom.views[viewName]) {
      this.dom.views[viewName].classList.remove('hidden');
    } else {
      this.dom.views.landing.classList.remove('hidden');
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateTimer(seconds) {
    this.dom.timer.header.classList.remove('hidden');
    this.dom.timer.text.textContent = this.formatTime(seconds);
  }
}

class StudentController {
  constructor(dom, socketClient, appState) {
    this.dom = dom;
    this.socketClient = socketClient;
    this.appState = appState;
    this.bindEvents();
  }

  bindEvents() {
    this.dom.student.btnPaySurvival.addEventListener('click', () => this.handlePaySurvival());
    this.dom.student.btnProtest.addEventListener('click', () => this.handleProtest());
  }

  handlePaySurvival() {
    this.dom.student.btnPaySurvival.disabled = true;
    this.socketClient.emit('pay_basic_needs', null, (res) => {
      if (res && res.success) {
        if (res.neededHelp) {
          this.dom.student.survivalStatus.innerHTML = `
            <span style="color: var(--red-dignity);">
              ⚠️ Tus recursos no cubren el umbral. Has gastado todo y enviado una Petición Anónima de Acogida al grupo.
            </span>
          `;
        } else {
          this.dom.student.survivalStatus.innerHTML = `
            <span style="color: var(--emerald-hospitality);">
              ✅ Has cubierto tus necesidades básicas del ciclo. Dignidad +5.
            </span>
          `;
        }
      } else {
        this.dom.student.btnPaySurvival.disabled = false;
      }
    });
  }

  handleProtest() {
    this.dom.student.btnProtest.disabled = true;
    this.socketClient.emit('trigger_protest', null, (res) => {
      if (res && res.success) {
        this.dom.student.btnProtest.textContent = 'En Huelga ✊';
        alert(`✊ Convocatoria a Huelga Social registrada (${res.protestsCount} convocatorias acumuladas).`);
      } else {
        this.dom.student.btnProtest.disabled = false;
        alert(res?.error || 'No se pudo registrar la convocatoria.');
      }
    });
  }

  render(player, assignedRequests) {
    this.appState.myRole = player.role;
    this.appState.myPlayerState = player;
    
    this.renderRoleHeader(player);
    this.renderStatsBar(player);
    this.renderSurvivalUI(player);
    this.renderPhases(assignedRequests);
  }

  renderRoleHeader(player) {
    const s = this.dom.student;
    s.roleBadge.className = `role-pill ${player.role}`;
    
    if (player.role === 'ÉLITE') {
      s.roleBadge.textContent = 'ÉLITE (Gran Excedente)';
      s.roleDesc.textContent = 'Dispones de abundantes recursos. Tienes la capacidad ética y financiera de responder a las peticiones de ayuda.';
      if (s.objectiveText) s.objectiveText.textContent = 'Decidir si usarás tu privilegio para ayudar a los excluidos o para enriquecerte más.';
      s.btnProtest.classList.add('hidden');
    } else if (player.role === 'CLASE_MEDIA') {
      s.roleBadge.textContent = 'CLASE MEDIA (Recursos Estables)';
      s.roleDesc.textContent = 'Dispones de recursos medios. Puedes contribuir a la sostenibilidad social si te administras bien.';
      if (s.objectiveText) s.objectiveText.textContent = 'Sobrevivir a la inflación y decidir si ayudas a los más vulnerables sin caer en la precariedad.';
      s.btnProtest.classList.add('hidden');
    } else if (player.role === 'ÁPORO') {
      s.roleBadge.textContent = 'ÁPORO (Precarizado)';
      s.roleDesc.textContent = 'Tus recursos están por debajo del umbral de supervivencia. Si no recibes ayuda, caerás en la invisibilidad.';
      if (s.objectiveText) s.objectiveText.textContent = 'Enviar peticiones de auxilio al sistema para no perecer, o convocar una Huelga Social masiva si alcanzan el quórum del 40%.';
      s.btnProtest.classList.remove('hidden');
    } else {
      s.roleBadge.textContent = 'ESPERANDO ASIGNACIÓN...';
      s.roleDesc.textContent = 'La partida aún no ha comenzado. El docente iniciará la simulación y se te asignará un rol en breve.';
      if (s.objectiveText) s.objectiveText.textContent = 'Espera el inicio de la simulación.';
      s.btnProtest.classList.add('hidden');
    }

    if (player.isForeigner) s.foreignBadge.classList.remove('hidden');
    else s.foreignBadge.classList.add('hidden');
  }

  renderStatsBar(player) {
    const s = this.dom.student;
    s.valResources.textContent = `${player.resources} Pts`;
    s.barResources.style.width = `${Math.min(100, player.resources)}%`;
    s.valDignity.textContent = `${player.dignity}/100`;
    s.barDignity.style.width = `${player.dignity}%`;
    s.barDignity.className = `meter-bar-fill ${player.dignity < 30 ? 'fill-red' : player.dignity > 70 ? 'fill-emerald' : 'fill-gold'}`;
  }

  renderSurvivalUI(player) {
    const s = this.dom.student;
    const cost = this.appState.currentSurvivalCost;

    if (player.role === 'PENDING') {
      s.btnPaySurvival.disabled = true;
      s.survivalStatus.innerHTML = '';
    } else if (player.survivalMet) {
      s.btnPaySurvival.disabled = true;
      s.survivalStatus.innerHTML = `<span style="color: var(--emerald-hospitality);">✅ Necesidades básicas cubiertas para este ciclo.</span>`;
    } else {
      s.btnPaySurvival.disabled = false;
      s.survivalStatus.innerHTML = ''; 

      if (player.resources < cost) {
        s.btnPaySurvival.textContent = `Gastar todo (${player.resources} Pts) y Pedir Ayuda`;
        if (s.survivalDesc) {
          s.survivalDesc.textContent = 'Tus recursos no alcanzan para sobrevivir. Gastarás todo lo que tienes y enviarás una Petición Anónima. Depender de los demás expone tu dignidad.';
        }
      } else {
        s.btnPaySurvival.textContent = `Cubrir Necesidades Básicas (${cost} Pts)`;
        if (s.survivalDesc) {
          s.survivalDesc.textContent = 'Sobrevivir este ciclo tiene un costo. Gastarás recursos para cubrir comida y techo. Si hay crisis, costará más caro.';
        }
      }
    }
  }

  renderPhases(assignedRequests) {
    const { status, phase } = this.appState;
    const p = this.dom.student.phases;

    Object.values(p).forEach(el => el && el.classList.add('hidden'));

    if (status === 'LOBBY') {
      p.lobby.classList.remove('hidden');
    } else if (phase === 3) {
      p.phase3.classList.remove('hidden');
    } else if (phase === 2) {
      p.phase2.classList.remove('hidden');
      if (assignedRequests && assignedRequests.length > 0) {
        p.phase2Decision.classList.remove('hidden');
        this.renderAssignedRequests(assignedRequests);
      } else {
        p.phase2Waiting.classList.remove('hidden');
      }
    } else {
      p.phase1.classList.remove('hidden');
    }
  }

  renderAssignedRequests(requests) {
    const container = this.dom.student.requestContainer;
    container.innerHTML = '';

    requests.forEach(req => {
      const card = document.createElement('div');
      card.style.background = 'rgba(255, 255, 255, 0.02)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = 'var(--radius-md)';
      card.style.padding = '1.25rem';
      card.style.marginBottom = '1.5rem';

      const originLabel = req.isForeigner ? '🌐 Ciudadano Refugiado / Extranjero' : '👤 Ciudadano Nacional';
      
      const p = this.appState.myPlayerState;
      const canAffordB = p && p.resources >= 10;
      const canAffordC = p && p.resources >= 15;

      const attrB = !canAffordB ? 'style="opacity: 0.5; filter: grayscale(100%);"' : '';
      const attrC = !canAffordC ? 'style="opacity: 0.5; filter: grayscale(100%);"' : '';

      const tagB = !canAffordB ? '⚠️ FONDOS INSUFICIENTES - Opción B' : 'Opción B — Empatía Cobarde / Caridad';
      const tagC = !canAffordC ? '⚠️ FONDOS INSUFICIENTES - Opción C' : 'Opción C — Compromiso Ético / Justicia Cosmopolita';

      card.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--cyan-media); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
          Petición Anónima de Acogida — Déficit: 20 Pts (${originLabel})
        </div>
        <p style="font-size: 0.95rem; margin-bottom: 1.25rem; color: var(--text-main);">
          «${req.message}»
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <button class="decision-option-btn opt-a" onclick="window.app.studentCtrl.submitDecision('${req.id}', 'A')">
            <div class="option-tag">Opción A — Rechazo / Indiferencia</div>
            <div class="option-title">Conservar Excedente (Costo: 0 Pts)</div>
            <div class="option-desc">Priorizas tu riqueza personal. El solicitante pierde -25 Pts de Dignidad y aumenta el Índice Gini de Desigualdad.</div>
          </button>

          <button class="decision-option-btn opt-b" onclick="window.app.studentCtrl.submitDecision('${req.id}', 'B')" ${attrB}>
            <div class="option-tag">${tagB}</div>
            <div class="option-title">Donación Mínima (Costo: 10 Pts)</div>
            <div class="option-desc">Le otorgas lo mínimo para no perecer (10 Pts). Sobrevive, pero se mantiene en el rol precarizado sin movilidad social.</div>
          </button>

          <button class="decision-option-btn opt-c" onclick="window.app.studentCtrl.submitDecision('${req.id}', 'C')" ${attrC}>
            <div class="option-tag">${tagC}</div>
            <div class="option-title">Fondo Estratégico de Acogida (Costo: 15 Pts)</div>
            <div class="option-desc">Financias la inclusión completa con dignidad (+30 Dignidad). El solicitante asciende a Clase Media en el próximo ciclo y reduce la desigualdad global.</div>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  submitDecision(requestId, choice) {
    this.socketClient.emit('make_decision', { requestId, decision: choice }, (res) => {
      if (res && res.success) {
        alert(`Decisión ${choice} registrada con éxito.`);
      } else {
        alert(res?.error || 'Error al procesar decisión.');
      }
    });
  }
}

class TeacherController {
  constructor(dom, socketClient, appState, uiManager) {
    this.dom = dom;
    this.socketClient = socketClient;
    this.appState = appState;
    this.uiManager = uiManager;
    this.bindEvents();
  }

  bindEvents() {
    const t = this.dom.teacher;
    t.btnAddBots.addEventListener('click', () => this.socketClient.emit('add_bots', { count: 10 }));
    t.btnMasterNext.addEventListener('click', () => this.handleMasterNext());
    t.btnShowDebrief.addEventListener('click', () => this.handleShowDebrief());
    t.btnBackToTeacher.addEventListener('click', () => this.uiManager.showView('teacher'));
    
    if (t.btnOpenGuide) t.btnOpenGuide.addEventListener('click', () => t.guideModal.classList.remove('hidden'));
    if (t.btnCloseGuide) t.btnCloseGuide.addEventListener('click', () => t.guideModal.classList.add('hidden'));
  }

  handleMasterNext() {
    const { status, phase, cycle } = this.appState;
    if (status === 'LOBBY') {
      this.socketClient.emit('start_cycle', { cycleNum: 1 });
    } else if (phase === 1 || phase === 2) {
      this.socketClient.emit('advance_phase');
    } else if (phase === 3) {
      const nextCycle = cycle + 1;
      if (nextCycle <= 5) {
        this.socketClient.emit('start_cycle', { cycleNum: nextCycle });
      } else {
        this.handleShowDebrief();
      }
    }
  }

  handleShowDebrief() {
    this.socketClient.emit('get_debrief', null, (debrief) => {
      if (debrief) {
        window.app.debriefCtrl.render(debrief);
        this.uiManager.showView('debrief');
      }
    });
  }

  render(data) {
    const t = this.dom.teacher;
    
    t.valGini.textContent = data.metrics.giniIndex.toFixed(3);
    t.valHostRate.textContent = `${data.metrics.cosmopolitanHostRate}%`;
    t.valInvisible.textContent = data.metrics.invisibleCount;
    t.valEliteInactive.textContent = `${data.metrics.eliteInactivityRate}%`;

    this.renderTeleprompter();
    this.renderMasterButton();
    this.renderStudentsGrid(data.playersSummary);
  }

  renderTeleprompter() {
    const { status, phase, cycle } = this.appState;
    const tp = this.dom.teacher.teleprompter;
    if (!tp) return;

    if (status === 'LOBBY') {
      tp.innerHTML = '<strong>Sala de Espera:</strong> Espera a que se unan los alumnos. Cuando estés listo, pulsa "Iniciar Ciclo 1".';
    } else if (phase === 1) {
      tp.innerHTML = `<strong>Fase 1 (Ciclo ${cycle}):</strong> Diles a tus alumnos que miren sus celulares e intenten <strong>Cubrir sus Necesidades Básicas</strong>. Los más pobres tendrán que enviar peticiones de ayuda al sistema.`;
    } else if (phase === 2) {
      tp.innerHTML = `<strong>Fase 2 (Ciclo ${cycle}):</strong> La Élite ha recibido las peticiones anónimas. Pídeles que elijan entre Indiferencia, Caridad o Justicia para ayudar a sus compañeros.`;
    } else if (phase === 3) {
      tp.innerHTML = `<strong>Fase 3 (Ciclo ${cycle}): Resolución.</strong> El ciclo terminó. Pide a la clase que comente qué pasó y por qué tomaron esas decisiones. Cuando termines el debate, avanza al siguiente Ciclo.`;
    }
  }

  renderMasterButton() {
    const { status, phase, cycle } = this.appState;
    const btn = this.dom.teacher.btnMasterNext;
    if (!btn) return;

    if (status === 'LOBBY') {
      btn.innerHTML = '▶ Iniciar Ciclo 1 (Asignación)';
      btn.style.background = '#10B981'; 
      btn.style.color = '#FFF';
    } else if (phase === 1 || phase === 2) {
      btn.innerHTML = '⏩ Forzar Avance de Fase';
      btn.style.background = 'rgba(255,255,255,0.1)'; 
      btn.style.color = 'var(--text-muted)';
    } else if (phase === 3) {
      btn.style.background = '#F59E0B'; 
      btn.style.color = '#000';
      if (cycle === 1) btn.innerHTML = '▶ Iniciar Ciclo 2 (Crisis Inflacionaria)';
      else if (cycle === 2) btn.innerHTML = '▶ Iniciar Ciclo 3 (Extranjeros)';
      else if (cycle === 3) btn.innerHTML = '▶ Iniciar Ciclo 4 (Aporofobia)';
      else if (cycle === 4) btn.innerHTML = '▶ Iniciar Ciclo 5 (Renta Básica)';
      else {
        btn.innerHTML = '📊 Ver Debriefing Final';
        btn.style.background = '#6366F1';
        btn.style.color = '#FFF';
      }
    }
  }

  renderStudentsGrid(players) {
    const grid = this.dom.teacher.studentsGrid;
    grid.innerHTML = '';
    if (!players || players.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Esperando a que se unan estudiantes a la sala...</div>`;
      return;
    }

    players.forEach(p => {
      const node = document.createElement('div');
      node.className = `student-node role-${p.role} ${p.isInvisible ? 'is-invisible' : ''} ${p.isForeigner ? 'is-foreign' : ''}`;

      let avatar = '👤';
      if (p.role === 'ÉLITE') avatar = '👑';
      else if (p.role === 'CLASE_MEDIA') avatar = '💼';
      else if (p.isInvisible) avatar = '👻';

      node.innerHTML = `
        <div class="node-avatar">${avatar}</div>
        <div class="node-name">${p.name}</div>
        <div class="node-dignity">Dignidad: ${p.dignity} | ${p.resources} Pts</div>
      `;
      grid.appendChild(node);
    });
  }
}

class DebriefController {
  constructor(dom) {
    this.dom = dom;
  }

  render(debrief) {
    const d = this.dom.debrief;
    d.diagnosisText.textContent = `«${debrief.cortinaDiagnosis}»`;
    d.statsSummary.innerHTML = `
      <strong>Resumen de Decisiones del Aula:</strong><br>
      - Opción A (Rechazo/Indiferencia): ${debrief.totalOptionA}<br>
      - Opción B (Caridad Paternalista): ${debrief.totalOptionB}<br>
      - Opción C (Justicia y Compromiso Ético): ${debrief.totalOptionC}<br>
      - Huelgas/Asambleas Sociales Convocadas: ${debrief.protestsTotal}
    `;

    this.drawGiniChart(debrief.history, d.giniChart);
    this.drawBiasChart(debrief.localRateC, debrief.foreignerRateC, d.biasChart);
  }

  drawGiniChart(history, canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let y = 40; y < h - 40; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    if (!history || history.length === 0) return;

    const stepX = (w - 80) / Math.max(1, history.length - 1);
    ctx.beginPath();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;

    history.forEach((pt, idx) => {
      const x = 40 + idx * stepX;
      const y = (h - 40) - (pt.gini * (h - 80));
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    history.forEach((pt, idx) => {
      const x = 40 + idx * stepX;
      const y = (h - 40) - (pt.gini * (h - 80));
      ctx.fillStyle = pt.gini > 0.6 ? '#EF4444' : '#10B981';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F1F5F9';
      ctx.font = '12px Space Grotesk';
      ctx.fillText(`Ciclo ${pt.cycle}: Gini ${pt.gini}`, x - 30, y - 12);
    });
  }

  drawBiasChart(localRate, foreignerRate, canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    const barWidth = 80;
    const maxH = h - 80;

    const localH = (localRate / 100) * maxH;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(100, h - 40 - localH, barWidth, localH);
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Space Grotesk';
    ctx.fillText(`${localRate}% Opción C`, 95, h - 45 - localH);
    ctx.fillText('Nacionales', 105, h - 15);

    const foreignH = (foreignerRate / 100) * maxH;
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(300, h - 40 - foreignH, barWidth, foreignH);
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Space Grotesk';
    ctx.fillText(`${foreignerRate}% Opción C`, 295, h - 45 - foreignH);
    ctx.fillText('Refugiados', 305, h - 15);
  }
}

class SocketClient {
  constructor() {
    this.socket = io();
  }

  emit(event, data, callback) {
    this.socket.emit(event, data, callback);
  }

  on(event, callback) {
    this.socket.on(event, callback);
  }
}

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
    if (this.state.status === 'LOBBY') {
       // Lobby is handled by renderPhases in studentCtrl
       return; 
    }
    if (this.state.phase === 3 && resolution) {
      this.dom.student.resolutionTitle.textContent = resolution.outcomeType.replace(/_/g, ' ');
      this.dom.student.resolutionDesc.textContent = resolution.outcomeText;
    }
  }
}

// Initialize Application
window.app = new App();
