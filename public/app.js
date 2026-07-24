/**
 * Proyecto Cosmópolis: El Umbral de la Cordialidad
 * Frontend Client JavaScript - Socket.io & UI Logic
 */

const socket = io();

// State
let myRole = null;
let currentRoomCode = null;
let isTeacher = false;
let myPlayerState = null;
let currentPhase = 1;

// DOM Views
const viewLanding = document.getElementById('viewLanding');
const viewStudent = document.getElementById('viewStudent');
const viewTeacher = document.getElementById('viewTeacher');
const viewDebrief = document.getElementById('viewDebrief');
const headerTimer = document.getElementById('headerTimer');
const timerText = document.getElementById('timerText');

// DOM Landing
const studentNameInput = document.getElementById('studentName');
const studentRoomCodeInput = document.getElementById('studentRoomCode');
const teacherRoomCodeInput = document.getElementById('teacherRoomCode');
const btnJoinStudent = document.getElementById('btnJoinStudent');
const btnCreateRoom = document.getElementById('btnCreateRoom');

// DOM Student
const displayStudentName = document.getElementById('displayStudentName');
const studentRoleBadge = document.getElementById('studentRoleBadge');
const roleDescription = document.getElementById('roleDescription');
const valResources = document.getElementById('valResources');
const barResources = document.getElementById('barResources');
const valDignity = document.getElementById('valDignity');
const barDignity = document.getElementById('barDignity');
const foreignBadgeContainer = document.getElementById('foreignBadgeContainer');
const studentCortinaChapter = document.getElementById('studentCortinaChapter');
const studentCortinaQuote = document.getElementById('studentCortinaQuote');
const btnPaySurvival = document.getElementById('btnPaySurvival');
const btnProtest = document.getElementById('btnProtest');
const survivalStatus = document.getElementById('survivalStatus');
const studentLobbyPhase = document.getElementById('studentLobbyPhase');
const studentPhase1 = document.getElementById('studentPhase1');
const studentPhase2 = document.getElementById('studentPhase2');
const phase2DecisionView = document.getElementById('phase2DecisionView');
const phase2WaitingView = document.getElementById('phase2WaitingView');
const studentPhase3 = document.getElementById('studentPhase3');
const requestContainer = document.getElementById('requestContainer');

// DOM Teacher
const displayRoomCode = document.getElementById('displayRoomCode');
const valGini = document.getElementById('valGini');
const valHostRate = document.getElementById('valHostRate');
const valInvisible = document.getElementById('valInvisible');
const valEliteInactive = document.getElementById('valEliteInactive');
const revoltBanner = document.getElementById('revoltBanner');
const revoltTitle = document.getElementById('revoltTitle');
const revoltMessage = document.getElementById('revoltMessage');
const studentsGrid = document.getElementById('studentsGrid');
const teacherCortinaChapter = document.getElementById('teacherCortinaChapter');
const teacherCortinaQuote = document.getElementById('teacherCortinaQuote');
const btnAddBots = document.getElementById('btnAddBots');
const btnMasterNext = document.getElementById('btnMasterNext');
const btnOpenGuide = document.getElementById('btnOpenGuide');
const btnCloseGuide = document.getElementById('btnCloseGuide');
const teacherGuideModal = document.getElementById('teacherGuideModal');
const btnShowDebrief = document.getElementById('btnShowDebrief');
const btnBackToTeacher = document.getElementById('btnBackToTeacher');

// DOM Teleprompter & Onboarding
const teleprompterInstruction = document.getElementById('teleprompterInstruction');
const studentObjectiveText = document.getElementById('studentObjectiveText');

// DOM Debrief
const debriefDiagnosisText = document.getElementById('debriefDiagnosisText');
const debriefStatsSummary = document.getElementById('debriefStatsSummary');

function showView(viewName) {
  viewLanding.classList.add('hidden');
  viewStudent.classList.add('hidden');
  viewTeacher.classList.add('hidden');
  viewDebrief.classList.add('hidden');

  if (viewName === 'student') viewStudent.classList.remove('hidden');
  else if (viewName === 'teacher') viewTeacher.classList.remove('hidden');
  else if (viewName === 'debrief') viewDebrief.classList.remove('hidden');
  else viewLanding.classList.remove('hidden');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/* ==========================================================================
   EVENT LISTENERS - LANDING & JOIN
   ========================================================================== */

btnJoinStudent.addEventListener('click', () => {
  const name = studentNameInput.value.trim() || 'Estudiante Anónimo';
  const code = studentRoomCodeInput.value.trim().toUpperCase();

  if (!code) {
    alert('Por favor ingresa un código de sala válido.');
    return;
  }

  socket.emit('join_room', { roomCode: code, name, isTeacher: false }, (res) => {
    if (res.success) {
      currentRoomCode = res.roomCode;
      isTeacher = false;
      displayStudentName.textContent = name;
      showView('student');
    } else {
      alert(res.error || 'Error al unirse a la sala.');
    }
  });
});

btnCreateRoom.addEventListener('click', () => {
  const code = teacherRoomCodeInput.value.trim().toUpperCase();

  if (code) {
    socket.emit('join_room', { roomCode: code, isTeacher: true }, (res) => {
      if (res.success) {
        currentRoomCode = res.roomCode;
        isTeacher = true;
        displayRoomCode.textContent = currentRoomCode;
        showView('teacher');
      } else {
        alert(res.error || 'No se pudo unir a la sala');
      }
    });
  } else {
    socket.emit('create_room', { teacherName: 'Profesor' }, (res) => {
      if (res.success) {
        currentRoomCode = res.roomCode;
        isTeacher = true;
        displayRoomCode.textContent = currentRoomCode;
        showView('teacher');
      }
    });
  }
});

/* ==========================================================================
   EVENT LISTENERS - STUDENT ACTIONS
   ========================================================================== */

btnPaySurvival.addEventListener('click', () => {
  socket.emit('pay_basic_needs', (res) => {
    if (res && res.success) {
      if (res.neededHelp) {
        survivalStatus.innerHTML = `
          <span style="color: var(--red-dignity);">
            ⚠️ Tus recursos no cubren el umbral. Has gastado todo y enviado una Petición Anónima de Acogida al grupo.
          </span>
        `;
        btnPaySurvival.disabled = true;
      } else {
        survivalStatus.innerHTML = `
          <span style="color: var(--emerald-hospitality);">
            ✅ Has cubierto tus necesidades básicas del ciclo. Dignidad +5.
          </span>
        `;
        btnPaySurvival.disabled = true;
      }
    }
  });
});

btnProtest.addEventListener('click', () => {
  socket.emit('trigger_protest', (res) => {
    if (res && res.success) {
      alert(`✊ Convocatoria a Huelga Social registrada (${res.protestsCount} convocatorias acumuladas).`);
    } else {
      alert(res?.error || 'No se pudo registrar la convocatoria.');
    }
  });
});

/* ==========================================================================
   EVENT LISTENERS - TEACHER ACTIONS & DEBRIEF
   ========================================================================== */

btnAddBots.addEventListener('click', () => {
  socket.emit('add_bots', { count: 10 });
});

btnMasterNext.addEventListener('click', () => {
  if (currentStatus === 'LOBBY') {
    socket.emit('start_cycle_0');
  } else if (currentPhase === 1 || currentPhase === 2) {
    socket.emit('advance_phase');
  } else if (currentPhase === 3) {
    // Determine next cycle
    const nextCycle = (window.currentGlobalCycle || 0) + 1;
    if (nextCycle <= 5) {
      socket.emit('start_cycle', { cycleNum: nextCycle });
    } else {
      socket.emit('get_debrief', (debrief) => {
        if (debrief) {
          renderDebriefView(debrief);
          showView('debrief');
        }
      });
    }
  }
});

btnShowDebrief.addEventListener('click', () => {
  socket.emit('get_debrief', (debrief) => {
    if (debrief) {
      renderDebriefView(debrief);
      showView('debrief');
    }
  });
});

btnBackToTeacher.addEventListener('click', () => {
  showView('teacher');
});

if (btnOpenGuide) {
  btnOpenGuide.addEventListener('click', () => {
    teacherGuideModal.classList.remove('hidden');
  });
}

if (btnCloseGuide) {
  btnCloseGuide.addEventListener('click', () => {
    teacherGuideModal.classList.add('hidden');
  });
}

/* ==========================================================================
   SOCKET.IO REAL-TIME LISTENERS
   ========================================================================== */

let currentStatus = 'LOBBY';
let currentAssignedRequests = [];
window.currentGlobalCycle = 0;
window.currentSurvivalCost = 30;

socket.on('room_state_update', (data) => {
  currentPhase = data.phase;
  currentStatus = data.status;
  window.currentGlobalCycle = data.cycle;
  window.currentSurvivalCost = data.survivalCost || 30;

  if (data.timer !== undefined) {
    headerTimer.classList.remove('hidden');
    timerText.textContent = formatTime(data.timer);
  }

  if (data.cortinaQuote) {
    studentCortinaChapter.textContent = data.cortinaQuote.chapter;
    studentCortinaQuote.textContent = `«${data.cortinaQuote.quote}»`;
    teacherCortinaChapter.textContent = data.cortinaQuote.chapter;
    teacherCortinaQuote.textContent = `«${data.cortinaQuote.quote}»`;
  }

  // Social Revolt & Special Alerts
  if (data.specialAlert) {
    revoltBanner.classList.remove('hidden');
    revoltTitle.textContent = data.specialAlert.title;
    revoltMessage.textContent = `${data.specialAlert.message} ${data.specialAlert.quote}`;
  } else {
    revoltBanner.classList.add('hidden');
  }

  if (isTeacher) {
    valGini.textContent = data.metrics.giniIndex.toFixed(3);
    valHostRate.textContent = `${data.metrics.cosmopolitanHostRate}%`;
    valInvisible.textContent = data.metrics.invisibleCount;
    valEliteInactive.textContent = `${data.metrics.eliteInactivityRate}%`;

    // UPDATE TELEPROMPTER
    if (teleprompterInstruction) {
      if (currentStatus === 'LOBBY') {
        teleprompterInstruction.innerHTML = '<strong>Sala de Espera:</strong> Espera a que se unan los alumnos. Cuando estés listo, pulsa "C0: Tutorial".';
      } else if (currentPhase === 1) {
        teleprompterInstruction.innerHTML = `<strong>Fase 1 (Ciclo ${data.cycle}):</strong> Diles a tus alumnos que miren sus celulares e intenten <strong>Cubrir sus Necesidades Básicas</strong>. Los más pobres tendrán que enviar peticiones de ayuda al sistema.`;
      } else if (currentPhase === 2) {
        teleprompterInstruction.innerHTML = `<strong>Fase 2 (Ciclo ${data.cycle}):</strong> La Élite ha recibido las peticiones anónimas. Pídeles que elijan entre Indiferencia, Caridad o Justicia para ayudar a sus compañeros.`;
      } else if (currentPhase === 3) {
        teleprompterInstruction.innerHTML = `<strong>Fase 3 (Ciclo ${data.cycle}): Resolución.</strong> El ciclo terminó. Pide a la clase que comente qué pasó y por qué tomaron esas decisiones. Cuando termines el debate, avanza al siguiente Ciclo.`;
      }
    }

    // UPDATE MASTER BUTTON
    if (btnMasterNext) {
      if (currentStatus === 'LOBBY') {
        btnMasterNext.innerHTML = '▶ Iniciar Ciclo 0 (Tutorial)';
        btnMasterNext.style.background = '#10B981'; // Emerald
        btnMasterNext.style.color = '#FFF';
      } else if (currentPhase === 1 || currentPhase === 2) {
        btnMasterNext.innerHTML = '⏩ Forzar Avance de Fase';
        btnMasterNext.style.background = 'rgba(255,255,255,0.1)'; // Dimmed
        btnMasterNext.style.color = 'var(--text-muted)';
      } else if (currentPhase === 3) {
        btnMasterNext.style.background = '#F59E0B'; // Amber
        btnMasterNext.style.color = '#000';
        if (data.cycle === 0) btnMasterNext.innerHTML = '▶ Iniciar Ciclo 1 (Asignación)';
        else if (data.cycle === 1) btnMasterNext.innerHTML = '▶ Iniciar Ciclo 2 (Crisis Inflacionaria)';
        else if (data.cycle === 2) btnMasterNext.innerHTML = '▶ Iniciar Ciclo 3 (Extranjeros)';
        else if (data.cycle === 3) btnMasterNext.innerHTML = '▶ Iniciar Ciclo 4 (Aporofobia)';
        else if (data.cycle === 4) btnMasterNext.innerHTML = '▶ Iniciar Ciclo 5 (Renta Básica)';
        else {
          btnMasterNext.innerHTML = '📊 Ver Debriefing Final';
          btnMasterNext.style.background = '#6366F1';
          btnMasterNext.style.color = '#FFF';
        }
      }
    }

    renderStudentNodesGrid(data.playersSummary);
  } else {
    if (currentStatus === 'LOBBY') {
      studentLobbyPhase.classList.remove('hidden');
      studentPhase1.classList.add('hidden');
      studentPhase2.classList.add('hidden');
      studentPhase3.classList.add('hidden');
    } else if (currentPhase === 3) {
      studentLobbyPhase.classList.add('hidden');
      studentPhase1.classList.add('hidden');
      studentPhase2.classList.add('hidden');
      studentPhase3.classList.remove('hidden');
      
      const resTitle = document.getElementById('resolutionTitle');
      const resDesc = document.getElementById('resolutionDesc');
      if (data.resolution) {
        resTitle.textContent = data.resolution.outcomeType.replace(/_/g, ' ');
        resDesc.textContent = data.resolution.outcomeText;
      }
    } else {
      studentPhase3.classList.add('hidden');
    }
  }
});

socket.on('player_private_update', ({ player, assignedRequests, myRequest }) => {
  if (!player) return;
  myPlayerState = player;
  myRole = player.role;

  studentRoleBadge.className = `role-pill ${player.role}`;
  if (player.role === 'ÉLITE') {
    studentRoleBadge.textContent = 'ÉLITE (Gran Excedente)';
    roleDescription.textContent = 'Dispones de abundantes recursos. Tienes la capacidad ética y financiera de responder a las peticiones de ayuda.';
    if (studentObjectiveText) studentObjectiveText.textContent = 'Decidir si usarás tu privilegio para ayudar a los excluidos o para enriquecerte más.';
    btnProtest.classList.add('hidden');
  } else if (player.role === 'CLASE_MEDIA') {
    studentRoleBadge.textContent = 'CLASE MEDIA (Recursos Estables)';
    roleDescription.textContent = 'Dispones de recursos medios. Puedes contribuir a la sostenibilidad social si te administras bien.';
    if (studentObjectiveText) studentObjectiveText.textContent = 'Sobrevivir a la inflación y decidir si ayudas a los más vulnerables sin caer en la precariedad.';
    btnProtest.classList.add('hidden');
  } else if (player.role === 'ÁPORO') {
    studentRoleBadge.textContent = 'ÁPORO (Precarizado)';
    roleDescription.textContent = 'Tus recursos están por debajo del umbral de supervivencia. Si no recibes ayuda, caerás en la invisibilidad.';
    if (studentObjectiveText) studentObjectiveText.textContent = 'Enviar peticiones de auxilio al sistema para no perecer, o convocar una Huelga Social masiva si alcanzan el quórum del 40%.';
    btnProtest.classList.remove('hidden');
  } else {
    studentRoleBadge.textContent = 'ESPERANDO ASIGNACIÓN...';
    roleDescription.textContent = 'La partida aún no ha comenzado. El docente iniciará la simulación y se te asignará un rol en breve.';
    if (studentObjectiveText) studentObjectiveText.textContent = 'Espera el inicio de la simulación.';
    btnProtest.classList.add('hidden');
  }

  if (player.isForeigner) foreignBadgeContainer.classList.remove('hidden');
  else foreignBadgeContainer.classList.add('hidden');

  valResources.textContent = `${player.resources} Pts`;
  barResources.style.width = `${Math.min(100, player.resources)}%`;

  valDignity.textContent = `${player.dignity}/100`;
  barDignity.style.width = `${player.dignity}%`;
  barDignity.className = `meter-bar-fill ${player.dignity < 30 ? 'fill-red' : player.dignity > 70 ? 'fill-emerald' : 'fill-gold'}`;

  if (player.role === 'PENDING') {
    btnPaySurvival.disabled = true;
    survivalStatus.innerHTML = '';
  } else if (player.survivalMet) {
    btnPaySurvival.disabled = true;
    survivalStatus.innerHTML = `<span style="color: var(--emerald-hospitality);">✅ Necesidades básicas cubiertas para este ciclo.</span>`;
  } else {
    btnPaySurvival.disabled = false;
    survivalStatus.innerHTML = ''; // Limpiar advertencias de ciclos anteriores

    const survivalDescElement = document.getElementById('survivalDescriptionText');
    if (player.resources < window.currentSurvivalCost) {
      btnPaySurvival.textContent = `Gastar todo (${player.resources} Pts) y Pedir Ayuda`;
      if (survivalDescElement) {
        survivalDescElement.textContent = 'Tus recursos no alcanzan para sobrevivir. Gastarás todo lo que tienes y enviarás una Petición Anónima. Depender de los demás expone tu dignidad.';
      }
    } else {
      btnPaySurvival.textContent = `Cubrir Necesidades Básicas (${window.currentSurvivalCost} Pts)`;
      if (survivalDescElement) {
        survivalDescElement.textContent = 'Sobrevivir este ciclo tiene un costo. Gastarás recursos para cubrir comida y techo. Si hay crisis, costará más caro.';
      }
    }
  }

  currentAssignedRequests = assignedRequests;

  studentLobbyPhase.classList.add('hidden');
  studentPhase1.classList.add('hidden');
  studentPhase2.classList.add('hidden');
  studentPhase3.classList.add('hidden');

  if (currentStatus === 'LOBBY') {
    studentLobbyPhase.classList.remove('hidden');
  } else if (currentPhase === 3) {
    studentPhase3.classList.remove('hidden');
  } else if (currentPhase === 2) {
    studentPhase2.classList.remove('hidden');
    
    if (assignedRequests && assignedRequests.length > 0) {
      phase2DecisionView.classList.remove('hidden');
      phase2WaitingView.classList.add('hidden');
      renderAssignedRequests(assignedRequests);
    } else {
      phase2DecisionView.classList.add('hidden');
      phase2WaitingView.classList.remove('hidden');
    }
  } else {
    studentPhase1.classList.remove('hidden');
  }
});

/* ==========================================================================
   RENDER & CANVAS CHART FUNCTIONS
   ========================================================================== */

function renderStudentNodesGrid(players) {
  studentsGrid.innerHTML = '';
  if (!players || players.length === 0) {
    studentsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Esperando a que se unan estudiantes a la sala...</div>`;
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
    studentsGrid.appendChild(node);
  });
}

function renderAssignedRequests(requests) {
  requestContainer.innerHTML = '';

  requests.forEach(req => {
    const card = document.createElement('div');
    card.style.background = 'rgba(255, 255, 255, 0.02)';
    card.style.border = '1px solid var(--border-subtle)';
    card.style.borderRadius = 'var(--radius-md)';
    card.style.padding = '1.25rem';
    card.style.marginBottom = '1.5rem';

    const originLabel = req.isForeigner ? '🌐 Ciudadano Refugiado / Extranjero' : '👤 Ciudadano Nacional';

    const canAffordB = myPlayerState && myPlayerState.resources >= 10;
    const canAffordC = myPlayerState && myPlayerState.resources >= 15;

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
        <button class="decision-option-btn opt-a" onclick="submitDecision('${req.id}', 'A')">
          <div class="option-tag">Opción A — Rechazo / Indiferencia</div>
          <div class="option-title">Conservar Excedente (Costo: 0 Pts)</div>
          <div class="option-desc">Priorizas tu riqueza personal. El solicitante pierde -25 Pts de Dignidad y aumenta el Índice Gini de Desigualdad.</div>
        </button>

        <button class="decision-option-btn opt-b" onclick="submitDecision('${req.id}', 'B')" ${attrB}>
          <div class="option-tag">${tagB}</div>
          <div class="option-title">Donación Mínima (Costo: 10 Pts)</div>
          <div class="option-desc">Le otorgas lo mínimo para no perecer (10 Pts). Sobrevive, pero se mantiene en el rol precarizado sin movilidad social.</div>
        </button>

        <button class="decision-option-btn opt-c" onclick="submitDecision('${req.id}', 'C')" ${attrC}>
          <div class="option-tag">${tagC}</div>
          <div class="option-title">Fondo Estratégico de Acogida (Costo: 15 Pts)</div>
          <div class="option-desc">Financias la inclusión completa con dignidad (+30 Dignidad). El solicitante asciende a Clase Media en el próximo ciclo y reduce la desigualdad global.</div>
        </button>
      </div>
    `;
    requestContainer.appendChild(card);
  });
}

window.submitDecision = function(requestId, choice) {
  socket.emit('make_decision', { requestId, decision: choice }, (res) => {
    if (res && res.success) {
      alert(`Decisión ${choice} registrada con éxito.`);
    } else {
      alert(res?.error || 'Error al procesar decisión.');
    }
  });
};

/* ==========================================================================
   DEBRIEFING CANVAS CHARTS RENDERER
   ========================================================================== */

function renderDebriefView(debrief) {
  debriefDiagnosisText.textContent = `«${debrief.cortinaDiagnosis}»`;
  debriefStatsSummary.innerHTML = `
    <strong>Resumen de Decisiones del Aula:</strong><br>
    - Opción A (Rechazo/Indiferencia): ${debrief.totalOptionA}<br>
    - Opción B (Caridad Paternalista): ${debrief.totalOptionB}<br>
    - Opción C (Justicia y Compromiso Ético): ${debrief.totalOptionC}<br>
    - Huelgas/Asambleas Sociales Convocadas: ${debrief.protestsTotal}
  `;

  drawGiniChart(debrief.history);
  drawBiasChart(debrief.localRateC, debrief.foreignerRateC);
}

function drawGiniChart(history) {
  const canvas = document.getElementById('giniChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let y = 40; y < h - 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }

  // Draw Gini Curve
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

  // Draw Points
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

function drawBiasChart(localRate, foreignerRate) {
  const canvas = document.getElementById('biasChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const barWidth = 80;
  const maxH = h - 80;

  // Local Bar
  const localH = (localRate / 100) * maxH;
  ctx.fillStyle = '#10B981';
  ctx.fillRect(100, h - 40 - localH, barWidth, localH);
  ctx.fillStyle = '#FFF';
  ctx.font = '14px Space Grotesk';
  ctx.fillText(`${localRate}% Opción C`, 95, h - 45 - localH);
  ctx.fillText('Nacionales', 105, h - 15);

  // Foreigner Bar
  const foreignH = (foreignerRate / 100) * maxH;
  ctx.fillStyle = '#06B6D4';
  ctx.fillRect(300, h - 40 - foreignH, barWidth, foreignH);
  ctx.fillStyle = '#FFF';
  ctx.font = '14px Space Grotesk';
  ctx.fillText(`${foreignerRate}% Opción C`, 295, h - 45 - foreignH);
  ctx.fillText('Refugiados', 305, h - 15);
}
