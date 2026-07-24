export class StudentController {
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
    this.dom.student.btnPaySurvival.classList.add('hidden');
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
        this.dom.student.btnPaySurvival.classList.remove('hidden');
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
      s.btnPaySurvival.classList.add('hidden');
      s.survivalStatus.innerHTML = '';
    } else if (player.survivalMet) {
      s.btnPaySurvival.disabled = true;
      s.btnPaySurvival.classList.add('hidden');
      s.survivalStatus.innerHTML = `<span style="color: var(--emerald-hospitality);">✅ Necesidades básicas cubiertas para este ciclo.</span>`;
    } else {
      s.btnPaySurvival.disabled = false;
      s.btnPaySurvival.classList.remove('hidden');
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
        
        const role = this.appState.myRole;
        if (role === 'ÉLITE' || role === 'CLASE_MEDIA') {
          p.phase2Waiting.innerHTML = `
            <h3 class="section-title">Fase 2: Esperando Resolución</h3>
            <div style="padding: 1.5rem; background: rgba(245, 158, 11, 0.05); border: 1px solid var(--gold-wealth); border-radius: var(--radius-md);">
              <h4 style="color: var(--gold-wealth); margin-bottom: 0.5rem;">No tienes peticiones asignadas...</h4>
              <p style="color: var(--text-muted); font-size: 0.95rem;">
                En este ciclo no te ha tocado revisar ninguna petición de ayuda, o bien ya no hay ciudadanos precarizados que la necesiten. Espera a que el resto de la sociedad tome sus decisiones.
              </p>
            </div>
          `;
        } else {
          p.phase2Waiting.innerHTML = `
            <h3 class="section-title">Fase 2: Esperando Solidaridad</h3>
            <div style="padding: 1.5rem; background: rgba(245, 158, 11, 0.05); border: 1px solid var(--gold-wealth); border-radius: var(--radius-md);">
              <h4 style="color: var(--gold-wealth); margin-bottom: 0.5rem;">Tu petición está en la mesa de los más privilegiados...</h4>
              <p style="color: var(--text-muted); font-size: 0.95rem;">
                La sociedad está deliberando. Dependiendo de si la Élite y la Clase Media optan por la <strong>indiferencia</strong>, la <strong>caridad</strong> o la <strong>justicia estructural</strong>, tu destino y dignidad cambiarán. ¿Se comprometerán con la hospitalidad cosmopolita que describe Adela Cortina?
              </p>
            </div>
          `;
        }
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
