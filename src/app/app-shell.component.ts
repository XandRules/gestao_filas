import { Component } from '@angular/core';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { AuthService } from './auth.service';
import { HealthUnitComponent } from './health-unit.component';
import { UserManagementComponent } from './user-management.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ServiceMenuComponent } from './service-menu.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [LoginComponent, RegisterComponent, HealthUnitComponent, UserManagementComponent, MatButtonModule, MatIconModule, MatToolbarModule, MatCardModule, MatButtonToggleModule, ServiceMenuComponent],
  template: `
    <div class="app-smart-root">
      <mat-toolbar class="shadow sticky top-0 z-10">
        <div class="container smart-toolbar-inner">
          <span class="smart-brand">
            <mat-icon>home</mat-icon>
            BemAtende
          </span>
          @if (isLoggedIn()) {
            <nav class="flex items-center gap-2">
              <button mat-raised-button class="!bg-red-600 !text-white hover:!bg-red-700" (click)="logout()">Sair</button>
              <button mat-icon-button aria-label="Ajuda"><mat-icon>help_outline</mat-icon></button>
            </nav>
          }
        </div>
      </mat-toolbar>

      <main class="container py-8">
        @if (!isLoggedIn()) {
          <section>
            <div class="mb-6 smart-subtitle">
              <p>Gerencie filas com eficiência: agilidade no atendimento.</p>
            </div>

            <mat-card class="smart-card smart-card--narrow mx-auto">
              <mat-card-header>
                <mat-card-title>
                  <span class="flex items-center gap-2">
                    <mat-icon>{{ selectedForm === 'login' ? 'person' : 'person_add' }}</mat-icon>
                    {{ selectedForm === 'login' ? 'Login' : 'Cadastro' }}
                  </span>
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="flex justify-center mb-3">
                  <mat-button-toggle-group class="smart-toggle" [value]="selectedForm" (change)="selectedForm = $event.value" appearance="standard">
                    <mat-button-toggle value="login"><mat-icon>person</mat-icon> Login</mat-button-toggle>
                    <mat-button-toggle value="register"><mat-icon>person_add</mat-icon> Cadastro</mat-button-toggle>
                  </mat-button-toggle-group>
                </div>
                <div class="p-4">
                  @if (selectedForm === 'login') {
                    <app-login></app-login>
                  } @else {
                    <app-register></app-register>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </section>
         }
          @if (isLoggedIn()) {
            <section class="max-w-6xl mx-auto mt-6">
              <h2 class="text-emerald-700 text-2xl font-semibold">Dashboard</h2>

              <div class="mt-2">
                @if (serviceSelected !== 'cadastro') {
                  <p>Logado como: <strong>{{ user()?.nome }}</strong></p>
                  <p>Papel: <strong>{{ user()?.role }}</strong></p>
                  @if (user()?.unidadeId) {
                    <p>Unidade: <strong>{{ unidadeNome(user()?.unidadeId) }}</strong></p>
                  }
                }
              </div>

              @if (isAdmin()) {
                <section class="mt-6">
                  <h3 class="mb-2 text-emerald-700 font-medium">Gestão de Unidades (ADMIN)</h3>
                  <app-health-units></app-health-units>

                  <h3 class="mt-6 mb-2 text-emerald-700 font-medium">Gestão de Usuários (ADMIN)</h3>
                  <app-user-management></app-user-management>
                </section>
              }

              @if (!isAdmin()) {
                <section class="mt-6">
                  <app-service-menu [selected]="serviceSelected" (selectedChange)="serviceSelected = $event"></app-service-menu>
                </section>
              }
            </section>
          }
      </main>
    </div>
  `,
})
export class AppShellComponent {
  constructor(private readonly auth: AuthService) {}

  isLoggedIn() { return !!this.auth.user(); }
  user() { return this.auth.user(); }
  logout() { this.auth.logout(); }
  isAdmin() { return this.auth.isAdmin(); }

  unidadeNome(id?: string) {
    if (!id) return '';
    const u = this.auth.units().find(x => x.id === id);
    return u ? u.nome : '';
  }
  selectedForm: 'login' | 'register' = 'login';
  serviceSelected: '' | 'cadastro' | 'pre_consulta' | 'monitor' | 'fila_medica' = '';
}