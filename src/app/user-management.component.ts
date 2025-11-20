import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, HealthUnit, User } from './auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-3xl mx-auto mt-6 p-6 bg-white rounded-xl shadow ring-1 ring-gray-200">
      <h2 class="text-emerald-700 font-semibold">Gerenciar Usuários</h2>

      @if (users(); as list) {
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-emerald-700 mb-4">Usuários</h2>
          @for (u of list; track u.nome) {
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-700">{{ u.nome }}</span>
              <span class="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">{{ u.role }}</span>
            </div>
          }
        </div>
      } @else {
        <p class="text-gray-600">Nenhum usuário cadastrado ainda.</p>
      }
      @if (users(); as list) {
        <div class="mt-4 grid gap-2">
          @for (u of list; track u.nome) {
            <div class="flex items-center gap-3">
              <span class="px-3 py-2 rounded-md bg-emerald-50 text-emerald-700">{{ u.nome }}</span>
              <span class="text-xs text-gray-600">{{ u.role }}</span>
              <select class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" [(ngModel)]="u.unidadeId" [disabled]="u.role === 'ADMIN'">
                <option [ngValue]="null">Selecione unidade</option>
                @for (unit of units(); track unit.id) {
                  <option [ngValue]="unit.id">{{ unit.nome }}</option>
                }
              </select>
              <button class="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" (click)="save(u)" [disabled]="u.role === 'ADMIN'">Salvar</button>
            </div>
          }
        </div>
      } @else {
        <p class="text-gray-600">Nenhum usuário encontrado.</p>
      }

      @if (erro) { <p class="text-red-600 mt-2">{{ erro }}</p> }
      @if (ok) { <p class="text-emerald-700 mt-2">{{ ok }}</p> }
    </div>
  `,
  styles: [
    `
    /* estilos mínimos preservados */
    `,
  ],
})
export class UserManagementComponent {
  erro = '';
  ok = '';
  selectedUnits: Record<string, string | undefined> = {};

  constructor(private readonly auth: AuthService) {}

  isAdmin() { return this.auth.isAdmin(); }
  users() { return this.auth.users().filter(u => !!u && typeof u === 'object'); }
  units() { return this.auth.units(); }

  save(u: User): void {
    this.erro = '';
    this.ok = '' as any;

    if (u.role === 'ADMIN') {
      this.erro = 'ADMIN não pode ser editado.';
      return;
    }
    const unidadeId = this.selectedUnits[u.nome] ?? u.unidadeId;
    if (!unidadeId) { this.erro = 'Selecione uma unidade válida.'; return; }
    const res = this.auth.updateUserUnit(u.nome, unidadeId);
    if (!res.ok) { this.erro = res.message || 'Erro ao salvar.'; return; }
    this.ok = 'ok';
  }

  mapTipo(t: User['tipo']) {
    switch (t) {
      case 'ATENDENTE': return 'Atendente';
      case 'ENFERMEIRO': return 'Enfermeiro(a)';
      case 'MEDICO': return 'Médico(a)';
      case 'TECNICO_ENFERMAGEM': return 'Técnico de Enfermagem';
    }
  }
}