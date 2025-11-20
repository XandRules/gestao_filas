import { Component, computed, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MedicalQueueService } from './medical-queue.service';
import { Paciente } from './patient.model';
import { AuthService } from './auth.service';

const BASE_URL = 'http://localhost:4303';

@Component({
  selector: 'app-medical-queue',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatButtonToggleModule],
  template: `
    <mat-card class="smart-card max-w-4xl mx-auto">
      <mat-card-header>
        <mat-card-title>Fila de Atendimento Médico</mat-card-title>
        <div class="ml-auto text-sm text-slate-600">Aguardando: {{ aguardandoTotal() }} · Atendidos: {{ atendidosTotal() }}</div>
      </mat-card-header>
      <mat-card-content>
        <div class="flex justify-end mb-3">
          <mat-button-toggle-group class="smart-toggle" [value]="urgentFirst() ? 'urg' : 'arrival'" (change)="setOrder($event.value)" appearance="standard">
            <mat-button-toggle value="arrival">Chegada</mat-button-toggle>
            <mat-button-toggle value="urg">Urgentes primeiro</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <h3 class="text-slate-700 font-semibold mb-2">Aguardando</h3>
        @if (aguardando().length === 0) { <p>Nenhum paciente aguardando.</p> }
        @for (p of aguardando(); track p.id) {
          <div class="flex items-center justify-between py-2 border-b border-slate-200">
            <div>
              <strong>{{ p.nome }}</strong>
              <span class="ml-2 text-xs text-slate-600">{{ p.classificacao === 'urgente' ? 'URGENTE' : 'NORMAL' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button mat-raised-button class="!bg-blue-600 !text-white" (click)="chamar(p)"><mat-icon>campaign</mat-icon> Chamar</button>
              <button mat-raised-button class="!bg-indigo-600 !text-white" (click)="finalizar(p)"><mat-icon>check_circle</mat-icon> Finalizar</button>
            </div>
          </div>
        }

        <h3 class="text-slate-700 font-semibold mt-6 mb-2">Atendidos</h3>
        @if (atendidos().length === 0) { <p>Nenhum paciente atendido.</p> }
        @for (p of atendidos(); track p.id) {
          <div class="flex items-center justify-between py-2 border-b border-slate-200">
            <div>
              <strong>{{ p.nome }}</strong>
              <span class="ml-2 text-xs text-slate-600">{{ p.classificacao === 'urgente' ? 'URGENTE' : 'NORMAL' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Consulta finalizada</span>
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class MedicalQueueComponent {
  private refresh = signal(0);
  constructor(private readonly queue: MedicalQueueService, private readonly auth: AuthService) {}

  aguardando = computed(() => {
    const unidadeId = this.auth.user()?.unidadeId;
    const data = this.queue.queue()
      .filter(p => p.status === 'atendimento' && (!unidadeId || p.unidadeId === unidadeId));
    return this.urgentFirst() ? [...data].sort((a,b) => (b.classificacao === 'urgente' ? 1 : 0) - (a.classificacao === 'urgente' ? 1 : 0) || a.createdAt - b.createdAt) : data.sort((a,b) => a.createdAt - b.createdAt);
  });

  atendidos = computed(() => {
    const unidadeId = this.auth.user()?.unidadeId;
    return this.queue.queue()
      .filter(p => p.status === 'finalizado' && (!unidadeId || p.unidadeId === unidadeId))
      .sort((a,b) => b.createdAt - a.createdAt);
  });

  urgentFirst = signal(false);
  setOrder(val: any) { this.urgentFirst.set(val === 'urg'); this.refresh.set(this.refresh() + 1); }

  aguardandoTotal = computed(() => this.aguardando().length);
  atendidosTotal = computed(() => this.atendidos().length);

  private beep() {
    try {
      const ctx = new (window as any).AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 660; gain.gain.value = 0.2;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 400);
    } catch {}
  }

  async chamar(p: Paciente) {
    const mesa = prompt('Informe o Consultório/Mesa (ex.: Consultório 2)')?.trim() || 'Consultório';
    const senha = prompt('Informe a SENHA (ex.: N015, C007)')?.trim();
    const payload = { nome: p.nome, classificacao: p.classificacao, unidadeId: p.unidadeId as any, local: mesa, fila: 'Atendimento Médico', senha, calledAt: Date.now() };
    try {
      await fetch(`${BASE_URL}/monitor/current`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      await fetch(`${BASE_URL}/monitor/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      this.beep();
    } catch {}
  }

  async finalizar(p: Paciente) {
    await this.queue.updateStatus(p.id, 'finalizado');
    this.refresh.set(this.refresh() + 1);
  }
}