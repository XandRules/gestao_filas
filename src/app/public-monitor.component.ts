import { Component, signal, computed } from '@angular/core';

const MONITOR_KEY = 'bemAtendeMonitorCurrent';
const MONITOR_CLEAR_KEY = 'bemAtendeMonitorAutoClear';
const MONITOR_CLEAR_MS_KEY = 'bemAtendeMonitorAutoClearMs';
const MONITOR_SLIDES_KEY = 'bemAtendeMonitorSlides';
const MONITOR_HISTORY_KEY = 'bemAtendeMonitorHistory';
const BASE_URL = 'http://localhost:4303';

type CallPayload = {
  nome: string;
  classificacao: string; // 'normal' | 'urgente'
  local?: string; // Triagem | Consultório | Guichê etc
  calledAt?: number;
  fila?: string; // Pré-Consulta | Atendimento Médico
  mesa?: string; // Guichê 2 | Consultório 1
  profissional?: string; // Nome do enfermeiro(a) ou médico(a)
  senha?: string; // N015, C007 etc
};

@Component({
  selector: 'app-public-monitor',
  standalone: true,
  styles: [`
    .monitor { display:flex; height:100vh; background:#ffffff; padding:16px; box-sizing:border-box; }
    .monitor-left { --overlay-h: 140px; flex: 2; position: relative; background:#000; border-radius:8px; overflow:hidden; }
    .campaign-wrap { position:absolute; top:0; left:0; right:0; bottom:var(--overlay-h); display:flex; align-items:center; justify-content:center; }
    .campaign-wrap img { display:block; width:100%; height:100%; object-fit:contain; object-position:center; }
    .monitor-right { flex: 1; padding-left:16px; display:flex; flex-direction:column; gap:12px; }
    .card { background:#0a3a82; color:#fff; border-radius:10px; padding:12px 16px; box-shadow:0 2px 8px rgba(0,0,0,.2); }
    .tag { background:#ff8c00; color:#fff; font-weight:700; font-size:12px; padding:4px 8px; border-radius:4px; }
    .row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:6px 0; }
    .value { font-weight:800; }
    .value.atendimento { font-size:28px; text-transform:capitalize; }
    .value.mesa { font-size:34px; }
    .value.senha { font-size:54px; }
    .placeholder { background:#f1f5f9; color:#334155; border-radius:10px; display:flex; align-items:center; justify-content:center; height:100%; padding:12px; }
    .overlay-history { position:absolute; left:0; right:0; bottom:0; background:#ffffff; border-top:6px solid #0a3a82; padding:14px 16px 16px; min-height: var(--overlay-h); display:flex; flex-direction:column; justify-content:center; }
    .overlay-history h3 { color:#0a3a82; font-size:22px; margin:0 0 8px; font-weight:800; text-align:center; }
    .history-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; }
    .history-item { background:#0a3a82; color:#fff; border-radius:8px; padding:8px; }
    .history-row { display:flex; justify-content:space-between; align-items:center; }
    .history-senha { font-size:28px; font-weight:800; }
    .history-mesa { font-size:18px; }
    .controls { position:fixed; right:16px; top:16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,.1); }
  `],
  template: `
    <section class="monitor">
      <div class="monitor-left">
        <div class="campaign-wrap">
          @if (campaignSrc()) {
            <img [src]="campaignSrc()" (load)="imgLoaded.set(true)" (error)="imgLoaded.set(false)" alt="Campanha" />
          } @else {
            <div class="placeholder">
              <div>
                <h2 style="margin:0 0 8px; font-size:24px; font-weight:800; color:#0a3a82;">Informações</h2>
                <p style="font-size:18px;">{{ slidesArr()[slideIndex()] }}</p>
              </div>
            </div>
          }
        </div>

        <div class="overlay-history">
          <h3>ÚLTIMAS SENHAS</h3>
          <div class="history-grid">
            @for (h of history(); track h.calledAt) {
              <div class="history-item">
                <div class="history-row">
                  <span class="tag">SENHA</span>
                  <span class="history-senha">{{ ticketCode(h) }}</span>
                </div>
                <div class="history-row">
                  <span class="tag">MESA</span>
                  <span class="history-mesa">{{ h.profissional || h.mesa || h.local || '—' }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="monitor-right">
        @if (current()) {
          <div class="card">
            <div class="row"><span class="tag">ATENDIMENTO</span><span class="value atendimento">{{ atendimentoAtual() }}</span></div>
          </div>
          <div class="card">
            <div class="row"><span class="tag">MESA</span><span class="value mesa">{{ mesaAtual() }}</span></div>
          </div>
          <div class="card">
            <div class="row"><span class="tag">SENHA</span><span class="value senha">{{ nomeAtual() }}</span></div>
          </div>
        } @else {
          <div class="placeholder"><p style="font-size:18px;">Aguardando próximo chamado...</p></div>
        }
      </div>


    </section>
  `,
})
export class PublicMonitorComponent {
  // Chamada atual e histórico
  current = signal<CallPayload | null>(null);
  history = signal<CallPayload[]>([]);

  // Slides texto (fallback)
  slidesArr = signal<string[]>([
    'Bem-vindo ao BemAtende — organização que agiliza seu atendimento.',
    'Use máscara quando estiver com sintomas respiratórios.',
    'Mantenha distância e higienize as mãos com frequência.',
  ]);

  // Slides imagem (campanha-X.png)
  slidesImages = signal<string[]>([]);
  imgLoaded = signal<boolean>(true);

  // Índice do carrossel
  slideIndex = signal(0);
  carouselLength = computed(() => this.slidesImages().length || this.slidesArr().length);
  campaignSrc = computed(() => {
    const imgs = this.slidesImages();
    if (!imgs.length) return '';
    return imgs[this.slideIndex() % imgs.length];
  });

  // Auto-limpeza da chamada
  autoClear = signal<boolean>(false);
  autoClearMs = signal<number>(15000);
  private clearTimer: any = null;
  private lastCalledAt: number | undefined;
  private slideTimer: any = null;

  constructor() {
    this.readSettings();
    this.readSlides();
    this.detectAssetsSlides();
    this.fetchCurrent();
    this.fetchHistory();

    // polling leve para dados do monitor
    setInterval(() => { this.fetchCurrent(); }, 3000);
    setInterval(() => { this.fetchHistory(); }, 10000);

    // Rotação do carrossel baseada em textos ou imagens
    this.slideTimer = setInterval(() => {
      const len = this.carouselLength();
      const next = len ? (this.slideIndex() + 1) % len : 0;
      this.imgLoaded.set(false);
      this.slideIndex.set(next);
    }, 8000);
  }

  // Derivados para exibição
  filaAtual = computed(() => this.current()?.fila || this.inferFila(this.current()));
  mesaAtual = computed(() => this.current()?.profissional || this.current()?.mesa || this.current()?.local || '—');
  senhaAtual = computed(() => this.ticketCode(this.current()));
  atendimentoAtual = computed(() => {
    const c = this.current();
    const v = c?.classificacao || '';
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : '—';
  });
  nomeAtual = computed(() => this.current()?.nome || '—');

  private inferFila(c?: CallPayload | null) {
    if (!c) return '—';
    if (c.fila) return c.fila;
    if ((c.local || '').toLowerCase().includes('triagem')) return 'Pré-Consulta';
    if ((c.local || '').toLowerCase().includes('consult')) return 'Atendimento Médico';
    return 'Atendimento';
  }

  ticketCode(c?: CallPayload | null) {
    if (!c) return '—';
    if (c.senha) return c.senha;
    const prefix = c.classificacao === 'urgente' ? 'U' : 'N';
    const num = ((c.calledAt || Date.now()) % 1000).toString().padStart(3, '0');
    return `${prefix}${num}`;
  }

  private readSettings() {
    try {
      const auto = localStorage.getItem(MONITOR_CLEAR_KEY);
      const msRaw = localStorage.getItem(MONITOR_CLEAR_MS_KEY);
      this.autoClear.set(auto ? auto === 'true' : false);
      this.autoClearMs.set(msRaw ? +msRaw : 15000);
    } catch {
      this.autoClear.set(false);
      this.autoClearMs.set(15000);
    }
  }

  private readSlides() {
    try {
      const raw = localStorage.getItem(MONITOR_SLIDES_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length) this.slidesArr.set(arr);
    } catch {}
  }

  private detectAssetsSlides(max = 10) {
    const found: string[] = [];
    for (let i = 1; i <= max; i++) {
      const src = `/assets/campanha-${i}.png`;
      const img = new Image();
      img.onload = () => { found.push(src); this.slidesImages.set([...found]); };
      img.onerror = () => {};
      img.src = src;
    }
  }

  private readHistory() {
    try {
      const raw = localStorage.getItem(MONITOR_HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) this.history.set(arr.slice(0, 6));
    } catch {}
  }

  // Popula dados estáticos de demonstração se não houver dados
  private seedDemoIfEmpty() {
    try {
      const now = Date.now();
      const curRaw = localStorage.getItem(MONITOR_KEY);
      const histRaw = localStorage.getItem(MONITOR_HISTORY_KEY);
      const slidesRaw = localStorage.getItem(MONITOR_SLIDES_KEY);

      if (!slidesRaw) {
        const demoSlides = [
          'Bem-vindo ao BemAtende — organização que agiliza seu atendimento.',
          'Campanha de vacinação disponível. Procure a recepção.',
          'Mantenha distância e higienize as mãos com frequência.',
        ];
        localStorage.setItem(MONITOR_SLIDES_KEY, JSON.stringify(demoSlides));
        this.slidesArr.set(demoSlides);
      }

      if (!histRaw) {
        const demoHist = [
          { nome: 'Paciente A', classificacao: 'normal', fila: 'Atendimento Normal', mesa: 'Guichê 3', senha: 'N004', calledAt: now - 120000 },
          { nome: 'Paciente B', classificacao: 'normal', fila: 'Atendimento Normal', mesa: 'Guichê 3', senha: 'C007', calledAt: now - 90000 },
          { nome: 'Paciente C', classificacao: 'normal', fila: 'Atendimento Normal', mesa: 'Guichê 3', senha: 'N014', calledAt: now - 60000 },
        ];
        localStorage.setItem(MONITOR_HISTORY_KEY, JSON.stringify(demoHist));
        this.history.set(demoHist.slice(0, 6));
      }

      if (!curRaw) {
        const demoCur = { nome: 'Paciente Demo', classificacao: 'normal', fila: 'Atendimento Normal', mesa: 'Guichê 2', senha: 'N015', calledAt: now } as any;
        localStorage.setItem(MONITOR_KEY, JSON.stringify(demoCur));
        this.current.set(demoCur);
      }
    } catch {}
  }

  toggleAutoClear(on: boolean) {
    this.autoClear.set(on);
    localStorage.setItem(MONITOR_CLEAR_KEY, String(on));
    this.scheduleClear();
  }

  autoClearSeconds() { return Math.round(this.autoClearMs() / 1000); }

  setAutoClearSeconds(sec: number) {
    const ms = Math.max(5000, sec * 1000);
    this.autoClearMs.set(ms);
    localStorage.setItem(MONITOR_CLEAR_MS_KEY, String(ms));
    this.scheduleClear();
  }

  private async fetchCurrent() {
    try {
      const res = await fetch(`${BASE_URL}/monitor/current`);
      const payload: CallPayload | null = await res.json();
      const normalized = payload && typeof payload === 'object' ? {
        ...payload,
        calledAt: payload.calledAt || (payload as any).chamadoEm || Date.now(),
      } : null;
      const prev = this.current();
      this.current.set(normalized);
      if (normalized && normalized.calledAt && normalized.calledAt !== this.lastCalledAt) {
        this.lastCalledAt = normalized.calledAt;
        this.beep();
        this.scheduleClear();
      }
    } catch {
      // mantém estado anterior
    }
  }

  private async fetchHistory() {
    try {
      const res = await fetch(`${BASE_URL}/monitor/history`);
      const arr = await res.json();
      const list: CallPayload[] = Array.isArray(arr) ? arr.map((x: any) => ({
        nome: x.nome || '—',
        classificacao: x.classificacao || 'normal',
        local: x.local,
        fila: x.fila,
        mesa: x.mesa,
        profissional: x.profissional,
        senha: x.senha,
        calledAt: x.calledAt || x.chamadoEm || Date.now(),
      })) : [];
      this.history.set(list.slice(0, 6));
    } catch {
      // mantém estado anterior
    }
  }

  private scheduleClear() {
    if (this.clearTimer) { clearTimeout(this.clearTimer); this.clearTimer = null; }
    if (this.autoClear() && this.current()) {
      this.clearTimer = setTimeout(() => { this.current.set(null); }, this.autoClearMs());
    }
  }

  private beep() {
    try {
      const ctx = new (window as any).AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880; // mais agudo para destaque de chamada
      gain.gain.value = 0.25;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 600);
    } catch {}
  }
}