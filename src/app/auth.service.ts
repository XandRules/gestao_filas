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
  id?: number;
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
  private readonly baseUrl = 'http://localhost:4303';

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

  async register(newUser: { nomeCompleto?: string; nome: string; senha: string; tipo: ProfessionalType; unidadeId?: string }): Promise<{ ok: boolean; message?: string }> {
    const { nomeCompleto, nome, senha, tipo, unidadeId } = newUser;
    if (!nome?.trim() || !senha?.trim() || !tipo) {
      return { ok: false, message: 'Dados inválidos.' };
    }
    try {
      const payload = { username: nome, password: senha, role: this.mapRoleFromTipo(tipo), name: nomeCompleto || nome, tipo, unidadeId: unidadeId ?? this.getDefaultUnitId() };
      const res = await fetch(`${this.baseUrl}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const created = await res.json();
      const user: User = { id: created?.id, nome, senha: '', tipo, role: this.mapRole(created?.role), unidadeId: created?.unidadeId, nomeCompleto: created?.name };
      this.users.set([...this.users(), user]);
      this.persistUsers();
      return { ok: true };
    } catch {
      return { ok: false, message: 'Erro ao cadastrar.' };
    }
  }

  async login({ nome, senha }: Credentials): Promise<boolean> {
    if (!nome?.trim() || !senha?.trim()) { return false; }
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: nome, password: senha }) });
      if (!res.ok) return false;
      const data = await res.json();
      const uRaw = data?.user || {};
      const target: User = { id: uRaw.id, nome: uRaw.username || nome, senha: '', tipo: this.mapTipoFromRole(uRaw.role), role: this.mapRole(uRaw.role), unidadeId: uRaw.unidadeId ?? this.getDefaultUnitId(), nomeCompleto: uRaw.name };
      this.user.set(target);
      this.persistCurrent();
      return true;
    } catch { return false; }
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

    // Atualiza backend se houver id
    const id = updated.id;
    if (id) {
      fetch(`${this.baseUrl}/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unidadeId }) }).catch(() => {});
    }

    if (this.user()?.nome === nome) {
      this.user.set(updated);
      this.persistCurrent();
    }
    return { ok: true };
  }

  private mapRole(r: any): UserRole { return r === 'admin' ? 'ADMIN' : 'USER'; }
  private mapTipoFromRole(r: any): ProfessionalType {
    switch (r) {
      case 'doctor': return 'MEDICO';
      case 'nurse': return 'ENFERMEIRO';
      default: return 'ATENDENTE';
    }
  }
  private mapRoleFromTipo(t: ProfessionalType): string {
    switch (t) {
      case 'MEDICO': return 'doctor';
      case 'ENFERMEIRO': return 'nurse';
      default: return 'staff';
    }
  }
}