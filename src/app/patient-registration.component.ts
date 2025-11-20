import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreConsultaQueueService } from './pre-consultation-queue.service';
import { Classificacao, Paciente } from './patient.model';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  template: `
    <mat-card class="smart-card smart-card--narrow mx-auto mt-4">
      <mat-card-header>
        <mat-card-title>
          Cadastro do Paciente
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="form-stack">
          <mat-form-field appearance="fill">
            <mat-label>Nome</mat-label>
            <input matInput [(ngModel)]="nome" name="nome" required />
          </mat-form-field>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <mat-form-field appearance="fill">
              <mat-label>CPF</mat-label>
              <input matInput [(ngModel)]="cpf" name="cpf" placeholder="000.000.000-00" />
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Data de Nascimento</mat-label>
              <input matInput type="date" [(ngModel)]="dataNascimento" name="dataNascimento" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="fill">
            <mat-label>Contato</mat-label>
            <input matInput [(ngModel)]="contato" name="contato" placeholder="Telefone ou e-mail" />
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Queixa principal</mat-label>
            <textarea matInput rows="3" [(ngModel)]="queixa" name="queixa"></textarea>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Classificação</mat-label>
            <mat-select [(ngModel)]="classificacao" name="classificacao">
              <mat-option value="normal">Normal</mat-option>
              <mat-option value="urgente">Urgente</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="flex justify-end">
            <button mat-raised-button color="primary" class="!bg-emerald-600 !text-white" (click)="submit()">Salvar e Enviar para Pré-Consulta</button>
          </div>

          @if (erro) { <p class="text-red-600 text-sm">{{ erro }}</p> }
          @if (ok) { <p class="text-emerald-700 text-sm">Paciente enviado para Pré-Consulta.</p> }
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class PatientRegistrationComponent {
  nome = '';
  cpf = '';
  dataNascimento = '';
  contato = '';
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
      cpf: this.cpf?.trim() || undefined,
      dataNascimento: this.dataNascimento || undefined,
      contato: this.contato?.trim() || undefined,
      queixa: this.queixa?.trim() || undefined,
      classificacao: this.classificacao,
      createdAt: Date.now(),
      status: 'pre_consulta',
      unidadeId: this.auth.user()?.unidadeId,
    };

    this.queue.add(paciente);
    this.ok = 'ok';
    // limpa campos para próximo cadastro
    this.nome = ''; this.cpf = ''; this.dataNascimento = ''; this.contato = ''; this.queixa = '';
    this.classificacao = 'normal';
  }
}