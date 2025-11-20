import { Injectable, signal, computed } from '@angular/core';

export type ProfessionalType = 'ATENDENTE' | 'ENFERMEIRO' | 'MEDICO' | 'TECNICO_ENFERMAGEM';
export type UserRole = 'ADMIN' | 'USER';

export interface Credentials {
  nome: string;
  senha: string;
}

export interface HealthUnit {
  id: string;
  nome: string;
}

export interface User extends Credentials {
  tipo: ProfessionalType;
  role: UserRole;
  unidadeId?: string;
  nomeCompleto?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentKey = 'bemAtendeCurrentUser';
  private readonly usersKey = 'bemAtendeUsers';
  private readonly unitsKey = 'bemAtendeUnits';

  readonly user = signal<User | null>(null);
  readonly users = signal<User[]>([]);
  readonly units = signal<HealthUnit[]>([]);
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  // -------- Registro e Login --------
  private getDefaultUnitId(): string {
    const lower = (s: string) => s?.toLowerCase();
    const itaim = this.units().find(u => lower(u.nome) === 'itaim');
    if (itaim) return itaim.id;
    const unit = { id: crypto.randomUUID(), nome: 'Itaim' };
    this.units.set([...this.units(), unit]);
    this.persistUnits();
    return unit.id;
  }

  register(newUser: { nomeCompleto?: string; nome: string; senha: string; tipo: ProfessionalType; unidadeId?: string }): { ok: boolean; message?: string } {
    const { nomeCompleto, nome, senha, tipo, unidadeId } = newUser;
    if (!nome?.trim() || !senha?.trim() || !tipo) {
      return { ok: false, message: 'Dados inválidos.' };
    }
    const exists = this.users().some(u => u.nome.toLowerCase() === nome.toLowerCase());
    if (exists) {
      return { ok: false, message: 'Nome de usuário já cadastrado.' };
    }
    const user: User = { nome, senha, tipo, role: 'USER', unidadeId: unidadeId ?? this.getDefaultUnitId(), nomeCompleto };
    const next = [...this.users(), user];
    this.users.set(next);
    this.persistUsers();
    return { ok: true };
  }

  login({ nome, senha }: Credentials): boolean {
    if (!nome?.trim() || !senha?.trim()) {
      return false;
    }
    const found = this.users().find(u => u.nome === nome && u.senha === senha);
    if (!found) {
      return false;
    }
    let target = found;
    if (!target.unidadeId) {
      const unitId = this.getDefaultUnitId();
      target = { ...target, unidadeId: unitId };
      const updatedUsers = this.users().map(u => u.nome === target.nome ? target : u);
      this.users.set(updatedUsers);
      this.persistUsers();
    }
    this.user.set(target);
    this.persistCurrent();
    return true;
  }

  logout(): void {
    this.user.set(null);
    try {
      localStorage.removeItem(this.currentKey);
    } catch {}
  }

  // -------- Unidades de Saúde (ADMIN) --------
  addUnit(nome: string): { ok: boolean; message?: string } {
    if (!this.isAdmin()) return { ok: false, message: 'Permissão negada.' };
    if (!nome?.trim()) return { ok: false, message: 'Nome inválido.' };
    const exists = this.units().some(u => u.nome.toLowerCase() === nome.toLowerCase());
    if (exists) return { ok: false, message: 'Unidade já existe.' };
    const unit: HealthUnit = { id: crypto.randomUUID(), nome };
    this.units.set([...this.units(), unit]);
    this.persistUnits();
    return { ok: true };
  }

  updateUnit(id: string, nome: string): { ok: boolean; message?: string } {
    if (!this.isAdmin()) return { ok: false, message: 'Permissão negada.' };
    const idx = this.units().findIndex(u => u.id === id);
    if (idx < 0) return { ok: false, message: 'Unidade não encontrada.' };
    const updated = { ...this.units()[idx], nome };
    const next = [...this.units()];
    next[idx] = updated;
    this.units.set(next);
    this.persistUnits();
    return { ok: true };
  }

  deleteUnit(id: string): { ok: boolean; message?: string } {
    if (!this.isAdmin()) return { ok: false, message: 'Permissão negada.' };
    const next = this.units().filter(u => u.id !== id);
    this.units.set(next);
    this.persistUnits();
    return { ok: true };
  }

  // -------- Persistência --------
  restore(): void {
    try {
      const rawUnits = localStorage.getItem(this.unitsKey);
      if (rawUnits) this.units.set(JSON.parse(rawUnits) as HealthUnit[]);

      // Seed default unit if none exists
      if (this.units().length === 0) {
        this.units.set([{ id: '1', nome: 'Itaim' }]);
        this.persistUnits();
      }

      const rawUsers = localStorage.getItem(this.usersKey);
      if (rawUsers) this.users.set(JSON.parse(rawUsers) as User[]);

      // Seed ADMIN se não existir nenhum
      if (!this.users().some(u => u.role === 'ADMIN')) {
        const admin: User = { nome: 'admin', senha: 'admin', tipo: 'ATENDENTE', role: 'ADMIN' };
        this.users.set([...this.users(), admin]);
        this.persistUsers();
      }

      const rawCurrent = localStorage.getItem(this.currentKey);
      if (rawCurrent) this.user.set(JSON.parse(rawCurrent) as User);
    } catch {}
  }

  private persistUsers(): void {
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(this.users()));
    } catch {}
  }

  private persistCurrent(): void {
    try {
      localStorage.setItem(this.currentKey, JSON.stringify(this.user()));
    } catch {}
  }

  private persistUnits(): void {
    try {
      localStorage.setItem(this.unitsKey, JSON.stringify(this.units()));
    } catch {}
  }

  updateUserUnit(nome: string, unidadeId: string): { ok: boolean; message?: string } {
    if (!this.isAdmin()) return { ok: false, message: 'Permissão negada.' };
    if (!unidadeId) return { ok: false, message: 'Unidade inválida.' };
    const unitExists = this.units().some(u => u.id === unidadeId);
    if (!unitExists) return { ok: false, message: 'Unidade não encontrada.' };

    const idx = this.users().findIndex(u => u.nome === nome);
    if (idx < 0) return { ok: false, message: 'Usuário não encontrado.' };
    const target = this.users()[idx];
    if (target.role === 'ADMIN') return { ok: false, message: 'ADMIN não pode ser editado.' };

    const updated = { ...target, unidadeId };
    const next = [...this.users()];
    next[idx] = updated;
    this.users.set(next);
    this.persistUsers();

    if (this.user()?.nome === nome) {
      this.user.set(updated);
      this.persistCurrent();
    }
    return { ok: true };
  }
}