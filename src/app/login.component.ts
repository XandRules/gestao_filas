import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="form-stack">
      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Usuário</mat-label>
        <input matInput [(ngModel)]="username" name="username" placeholder="Digite seu usuário" />
      </mat-form-field>

      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Senha</mat-label>
        <input matInput [(ngModel)]="password" name="password" type="password" placeholder="Digite sua senha" />
      </mat-form-field>

      <div class="flex justify-end">
        <button mat-raised-button color="primary" class="!bg-emerald-600 !text-white" (click)="login()">Entrar</button>
      </div>

      @if (error) { <p class="text-red-600 text-sm">{{ error }}</p> }
    </div>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private readonly auth: AuthService) {}

  login() {
    this.error = '';
    const res = this.auth.login({ nome: this.username, senha: this.password });
    if (!res) {
      this.error = 'Credenciais inválidas';
      return;
    }
  }
}