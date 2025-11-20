import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, HealthUnit, ProfessionalType } from './auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  template: `
    <div class="form-stack">
      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Nome completo</mat-label>
        <input matInput [(ngModel)]="nomeCompleto" name="nomeCompleto" placeholder="Seu nome completo" required />
      </mat-form-field>

      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Usuário</mat-label>
        <input matInput [(ngModel)]="usuario" name="usuario" placeholder="Escolha seu usuário" required />
      </mat-form-field>

      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Senha</mat-label>
        <input matInput type="password" [(ngModel)]="senha" name="senha" placeholder="Crie uma senha" required />
      </mat-form-field>

      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Tipo profissional</mat-label>
        <mat-select [(ngModel)]="tipo" name="tipo" required>
          @for (t of tipos; track t) {
            <mat-option [value]="t">{{ mapTipo(t) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (tipo === 'MEDICO' || tipo === 'ENFERMEIRO' || tipo === 'TECNICO_ENFERMAGEM') {
        <mat-form-field class="w-full" appearance="fill">
          <mat-label>Unidade de Saúde</mat-label>
          <mat-select [(ngModel)]="unidadeId" name="unidadeId">
            @for (u of unidades(); track u.id) {
              <mat-option [value]="u.id">{{ u.nome }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <div class="flex justify-end">
        <button mat-raised-button color="primary" class="!bg-emerald-600 !text-white" (click)="submit()">Cadastrar</button>
      </div>

      @if (erro) { <p class="text-red-600 text-sm">{{ erro }}</p> }
      @if (ok) { <p class="text-emerald-700 text-sm">Cadastro realizado com sucesso!</p> }
    </div>
  `,
})
export class RegisterComponent {
  nomeCompleto = '';
  usuario = '';
  senha = '';
  tipo: ProfessionalType | '' = '';
  unidadeId: string | undefined;
  erro = '';
  ok = '';

  // Lista local de tipos profissionais
  tipos: ProfessionalType[] = ['ATENDENTE', 'ENFERMEIRO', 'MEDICO', 'TECNICO_ENFERMAGEM'];

  constructor(private readonly auth: AuthService) {}

  unidades(): HealthUnit[] { return this.auth.units(); }

  mapTipo(t: ProfessionalType) {
    switch (t) {
      case 'ATENDENTE': return 'Atendente';
      case 'ENFERMEIRO': return 'Enfermeiro(a)';
      case 'MEDICO': return 'Médico(a)';
      case 'TECNICO_ENFERMAGEM': return 'Técnico de Enfermagem';
    }
  }

  async submit() {
    this.erro = '';
    this.ok = '' as any;

    if (!this.nomeCompleto?.trim()) { this.erro = 'Informe o nome completo.'; return; }
    if (!this.usuario?.trim()) { this.erro = 'Informe o usuário.'; return; }

    const res = await this.auth.register({ nomeCompleto: this.nomeCompleto, nome: this.usuario, senha: this.senha, tipo: this.tipo as ProfessionalType, unidadeId: this.unidadeId });
    if (!res.ok) { this.erro = res.message || 'Erro ao cadastrar.'; return; }
    this.ok = 'ok';
  }
}