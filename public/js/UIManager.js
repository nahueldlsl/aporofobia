export class UIManager {
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
