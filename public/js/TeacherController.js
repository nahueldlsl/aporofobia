export class TeacherController {
  constructor(dom, socketClient, appState, uiManager) {
    this.dom = dom;
    this.socketClient = socketClient;
    this.appState = appState;
    this.uiManager = uiManager;
    this.bindEvents();
  }

  bindEvents() {
    const t = this.dom.teacher;
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
