import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PatientRegistrationComponent } from './patient-registration.component';
import { PreConsultationQueueComponent } from './pre-consultation-queue.component';
import { PublicMonitorComponent } from './public-monitor.component';
import { MedicalQueueComponent } from './medical-queue.component';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-service-menu',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, PatientRegistrationComponent, PreConsultationQueueComponent, PublicMonitorComponent, MedicalQueueComponent],
  template: `
    <section class="service-menu">
      <h2 class="service-menu__title">Sistemas</h2>

      @if (!selected) {
        <button mat-raised-button class="service-btn" (click)="onNavigate('normal')">
          Atendimento Normal
        </button>

        <button mat-raised-button class="service-btn" (click)="onNavigate('retirada')">
          Retirada de Material
        </button>

        <button mat-raised-button class="service-btn" (click)="onNavigate('consultoria')">
          Consultoria
        </button>

        <button mat-raised-button class="service-btn" (click)="onNavigate('prioritario')">
          <span class="service-btn__icon"><mat-icon>accessible</mat-icon></span>
          Atendimento Prioritário
        </button>

        @if (isEnfermagem()) {
          <button mat-raised-button class="service-btn" (click)="onNavigate('pre_consulta')">
            <span class="service-btn__icon"><mat-icon>assignment</mat-icon></span>
            Fila de Pré-Consulta
          </button>

          <button mat-raised-button class="service-btn" (click)="onNavigate('monitor')">
            <span class="service-btn__icon"><mat-icon>display_settings</mat-icon></span>
            Monitor Público
          </button>
        }

        @if (isMedico()) {
          <button mat-raised-button class="service-btn" (click)="onNavigate('fila_medica')">
            <span class="service-btn__icon"><mat-icon>local_hospital</mat-icon></span>
            Fila de Atendimento Médico
          </button>
        }
      }

      @if (selected === 'cadastro') {
        <app-patient-registration></app-patient-registration>
        <div class="flex justify-end mt-3">
          <button mat-raised-button class="!bg-slate-500 !text-white" (click)="selected = ''; selectedChange.emit('')">Voltar</button>
        </div>
      }

      @if (selected === 'pre_consulta') {
        <app-pre-consultation-queue></app-pre-consultation-queue>
        <div class="flex justify-end mt-3">
          <button mat-raised-button class="!bg-slate-500 !text-white" (click)="selected = ''; selectedChange.emit('')">Voltar</button>
        </div>
      }

      @if (selected === 'monitor') {
        <app-public-monitor></app-public-monitor>
        <div class="flex justify-end mt-3">
          <button mat-raised-button class="!bg-slate-500 !text-white" (click)="selected = ''; selectedChange.emit('')">Voltar</button>
        </div>
      }

      @if (selected === 'fila_medica') {
        <app-medical-queue></app-medical-queue>
        <div class="flex justify-end mt-3">
          <button mat-raised-button class="!bg-slate-500 !text-white" (click)="selected = ''; selectedChange.emit('')">Voltar</button>
        </div>
      }
    </section>
  `,
})
export class ServiceMenuComponent {
  @Input() selected: '' | 'cadastro' | 'pre_consulta' | 'monitor' | 'fila_medica' = '';
  @Output() selectedChange = new EventEmitter<'' | 'cadastro' | 'pre_consulta' | 'monitor' | 'fila_medica'>();
  constructor(private readonly auth: AuthService) {}

  isEnfermagem() { return this.auth.user()?.tipo === 'ENFERMEIRO' || this.auth.user()?.tipo === 'TECNICO_ENFERMAGEM'; }
  isMedico() { return this.auth.user()?.tipo === 'MEDICO'; }

  onNavigate(target: 'normal'|'retirada'|'consultoria'|'prioritario'|'pre_consulta'|'monitor'|'fila_medica') {
    if (target === 'normal' || target === 'prioritario') { this.selected = 'cadastro'; this.selectedChange.emit(this.selected); return; }
    if (target === 'pre_consulta' || target === 'monitor' || target === 'fila_medica') { this.selected = target; this.selectedChange.emit(this.selected); return; }
    console.log('Navegar para:', target);
    alert('Funcionalidade em preparação: ' + target);
  }
}