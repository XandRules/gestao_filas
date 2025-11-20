import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, HealthUnit } from './auth.service';

@Component({
  selector: 'app-health-units',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (isAdmin()) {
      <div class="units-card max-w-2xl mx-auto mt-6 p-6 bg-white rounded-xl shadow ring-1 ring-gray-200">
        <h2 class="text-emerald-700 font-semibold">Unidades de Saúde</h2>

        <form (ngSubmit)="add()" class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mt-3">
          <input class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" [(ngModel)]="novoNome" name="novoNome" placeholder="Nome da unidade" required />
          <button class="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" type="submit">Adicionar</button>
        </form>
        @if (erro) { <p class="text-red-600 mt-2">{{ erro }}</p> }

        <ul class="units-list list-none p-0 mt-4 grid gap-2">
          @for (u of units(); track u.id; let i = $index) {
            <li class="flex gap-2 items-center">
              <input class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" [(ngModel)]="u.nome" name="nome-{{i}}" />
              <button class="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" (click)="save(u)">Salvar</button>
              <button class="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" (click)="del(u)">Remover</button>
            </li>
          }
        </ul>
      </div>
    } @else {
      <p class="text-red-600">Apenas ADMIN pode gerenciar unidades.</p>
    }
  `,
  styles: [
    `
    /* estilos mínimos preservados */
    `,
  ],
})
export class HealthUnitComponent {
  novoNome = '';
  erro = '';

  constructor(private readonly auth: AuthService) {}

  isAdmin() { return this.auth.isAdmin(); }
  units() { return this.auth.units(); }

  add(): void {
    const r = this.auth.addUnit(this.novoNome);
    if (!r.ok) { this.erro = r.message || 'Erro ao adicionar.'; return; }
    this.novoNome = '';
    this.erro = '';
  }

  save(u: HealthUnit): void {
    const r = this.auth.updateUnit(u.id, u.nome);
    if (!r.ok) this.erro = r.message || 'Erro ao salvar.'; else this.erro = '';
  }

  del(u: HealthUnit): void {
    const r = this.auth.deleteUnit(u.id);
    if (!r.ok) this.erro = r.message || 'Erro ao remover.'; else this.erro = '';
  }
}