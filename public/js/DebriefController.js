export class DebriefController {
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
