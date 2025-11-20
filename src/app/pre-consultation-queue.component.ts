import { Component, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { PreConsultaQueueService } from './pre-consultation-queue.service';
import { Paciente } from './patient.model';
import { AuthService } from './auth.service';
import { MedicalQueueService } from './medical-queue.service';

const MONITOR_KEY = 'bemAtendeMonitorCurrent';

@Component({
  selector: 'app-pre-consultation-queue',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatButtonToggleModule],
  template: `
    <mat-card class="smart-card max-w-4xl mx-auto">
      <mat-card-header>
        <mat-card-title>Fila de Pré-Consulta</mat-card-title>
        <div class="ml-auto text-sm text-slate-600">Total: {{ total() }} · Urgentes: {{ urgentes() }}</div>
      </mat-card-header>
      <mat-card-content>
        <div class="flex justify-end mb-3">
          <mat-button-toggle-group class="smart-toggle" [value]="urgentFirst() ? 'urg' : 'arrival'" (change)="setOrder($event.value)" appearance="standard">
            <mat-button-toggle value="arrival">Chegada</mat-button-toggle>
            <mat-button-toggle value="urg">Urgentes primeiro</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
        @if (list().length === 0) { <p>Nenhum paciente aguardando.</p> }
        @for (p of list(); track p.id) {
          <div class="flex items-center justify-between py-2 border-b border-slate-200">
            <div>
              <strong>{{ p.nome }}</strong>
              <span class="ml-2 text-xs text-slate-600">{{ p.classificacao === 'urgente' ? 'URGENTE' : 'NORMAL' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button mat-raised-button class="!bg-blue-600 !text-white" (click)="chamar(p)"><mat-icon>campaign</mat-icon> Chamar</button>
              <button mat-raised-button class="!bg-emerald-600 !text-white" (click)="iniciar(p)"><mat-icon>play_arrow</mat-icon> Iniciar</button>
              <button mat-raised-button class="!bg-indigo-600 !text-white" (click)="finalizar(p)"><mat-icon>check_circle</mat-icon> Finalizar</button>
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class PreConsultationQueueComponent {
  private refresh = signal(0);
  constructor(private readonly queue: PreConsultaQueueService, private readonly auth: AuthService, private readonly medical: MedicalQueueService) {}

  list = computed(() => {
    const unidadeId = this.auth.user()?.unidadeId;
    const data = this.queue.queue()
      .filter(p => p.status === 'pre_consulta' && (!unidadeId || p.unidadeId === unidadeId));
    return this.urgentFirst() ? [...data].sort((a,b) => (b.classificacao === 'urgente' ? 1 : 0) - (a.classificacao === 'urgente' ? 1 : 0) || a.createdAt - b.createdAt) : data.sort((a,b) => a.createdAt - b.createdAt);
  });
  
  urgentFirst = signal(false);
  setOrder(val: any) { this.urgentFirst.set(val === 'urg'); this.refresh.set(this.refresh() + 1); }
  
  total = computed(() => this.list().length);
  urgentes = computed(() => this.list().filter(p => p.classificacao === 'urgente').length);
  private beep() {
    try {
      const ctx = new (window as any).AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880; // A5
      gain.gain.value = 0.2;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 500);
    } catch {}
  }

  chamar(p: Paciente) {
    const mesa = prompt('Informe o Guichê/Mesa (ex.: Triagem 1, Guichê 3)')?.trim() || 'Triagem';
    const senha = prompt('Informe a SENHA (ex.: N015, C007)')?.trim();
    const payload = { nome: p.nome, classificacao: p.classificacao, unidadeId: p.unidadeId, local: mesa, fila: 'Pré-Consulta', senha, calledAt: Date.now() };
    localStorage.setItem(MONITOR_KEY, JSON.stringify(payload));
    this.beep();
  }

  iniciar(p: Paciente) {
    this.queue.updateStatus(p.id, 'atendimento');
    this.refresh.set(this.refresh() + 1);
  }

  finalizar(p: Paciente) {
    // move para fila médica e remove da pré-consulta
    this.medical.add({ ...p, status: 'atendimento' });
    this.queue.removeById(p.id);
    this.refresh.set(this.refresh() + 1);
  }
}