import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { PreConsultaQueueService } from './pre-consultation-queue.service';
import { Classificacao, Paciente } from './patient.model';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatRadioModule],
  template: `
    <section class="max-w-7xl mx-auto mt-4">
      <h2 class="flex items-center gap-2 text-2xl font-semibold">
        <mat-icon>assignment_ind</mat-icon>
        Cadastro do Paciente
      </h2>
      <p class="text-sm text-slate-600 mb-4">Preencha os dados essenciais para iniciar o atendimento.</p>

      <div class="space-y-6">
        <mat-form-field appearance="outline" class="w-full field-xl">
          <mat-label>Nome</mat-label>
          <input matInput [(ngModel)]="nome" name="nome" required />
          <mat-hint>Obrigatório</mat-hint>
        </mat-form-field>

        <div>
          <label class="block mb-2 text-sm font-medium text-slate-700">Classificação</label>
          <mat-radio-group class="flex gap-8" [(ngModel)]="classificacao" name="classificacao">
            <mat-radio-button value="normal">Normal</mat-radio-button>
            <mat-radio-button value="urgente" color="warn">Urgente</mat-radio-button>
          </mat-radio-group>
        </div>

        <mat-form-field appearance="outline" class="w-full field-xl">
          <mat-label>Queixa principal</mat-label>
          <textarea matInput rows="5" [(ngModel)]="queixa" name="queixa"></textarea>
          <mat-hint align="end">{{ queixa.length }}/240</mat-hint>
        </mat-form-field>

        <div class="flex items-center justify-between pt-1">
          <div class="text-sm">
            @if (erro) { <span class="text-red-600">{{ erro }}</span> }
            @if (ok) { <span class="text-emerald-700">Paciente enviado para Pré-Consulta.</span> }
          </div>
          <div class="flex gap-2">
            <button mat-stroked-button (click)="clear()">Limpar</button>
            <button mat-raised-button color="primary" class="!bg-emerald-600 !text-white" (click)="submit()">
              <span class="flex items-center gap-2">
                <mat-icon>send</mat-icon>
                Salvar e Enviar
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PatientRegistrationComponent {
  nome = '';
  queixa = '';
  classificacao: Classificacao = 'normal';
  erro = '';
  ok = '' as any;

  constructor(private readonly queue: PreConsultaQueueService, private readonly auth: AuthService) {}

  submit() {
    this.erro = '';
    this.ok = '' as any;

    if (!this.nome?.trim()) { this.erro = 'Informe o nome'; return; }

    const paciente: Paciente = {
      id: crypto.randomUUID(),
      nome: this.nome.trim(),
      queixa: this.queixa?.trim() || undefined,
      classificacao: this.classificacao,
      createdAt: Date.now(),
      status: 'pre_consulta',
      unidadeId: this.auth.user()?.unidadeId,
    };

    this.queue.add(paciente);
    this.ok = 'ok';
    // limpa campos para próximo cadastro
    this.nome = ''; this.queixa = '';
    this.classificacao = 'normal';
  }

  clear() {
    this.erro = '';
    this.ok = '' as any;
    this.nome = '';
    this.queixa = '';
    this.classificacao = 'normal';
  }
}