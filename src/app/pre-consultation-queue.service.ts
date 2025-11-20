import { Injectable } from '@angular/core';
import { Paciente } from './patient.model';

@Injectable({ providedIn: 'root' })
export class PreConsultaQueueService {
  private _queue: Paciente[] = [];
  private readonly baseUrl = 'http://localhost:4303';
  private readonly resource = 'preConsultaQueue';

  constructor() {
    this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/${this.resource}`);
      const data = await res.json();
      this._queue = Array.isArray(data) ? data : [];
    } catch {
      this._queue = [];
    }
  }

  queue(): Paciente[] { return [...this._queue]; }

  async add(p: Paciente): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/${this.resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const created = await res.json();
      this._queue = [...this._queue, created];
    } catch {}
  }

  async updateStatus(id: string, status: Paciente['status']): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${this.resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      this._queue = this._queue.map(x => x.id === id ? { ...x, status } : x);
    } catch {}
  }

  async removeById(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${this.resource}/${id}`, { method: 'DELETE' });
      this._queue = this._queue.filter(x => x.id !== id);
    } catch {}
  }

  async clear(): Promise<void> {
    const ids = this._queue.map(x => x.id);
    for (const id of ids) {
      try { await fetch(`${this.baseUrl}/${this.resource}/${id}`, { method: 'DELETE' }); } catch {}
    }
    this._queue = [];
  }
}