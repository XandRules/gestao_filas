import { Injectable } from '@angular/core';
import { Paciente } from './patient.model';

const STORAGE_KEY = 'preConsultaQueue';

@Injectable({ providedIn: 'root' })
export class PreConsultaQueueService {
  private _queue: Paciente[] = [];

  constructor() {
    this._queue = this.read();
  }

  private read(): Paciente[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Paciente[] : [];
    } catch {
      return [];
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._queue));
  }

  queue(): Paciente[] { return [...this._queue]; }

  add(p: Paciente) {
    this._queue.push(p);
    this.persist();
  }

  updateStatus(id: string, status: Paciente['status']) {
    const idx = this._queue.findIndex(x => x.id === id);
    if (idx >= 0) {
      this._queue[idx] = { ...this._queue[idx], status };
      this.persist();
    }
  }

  removeById(id: string) {
    this._queue = this._queue.filter(x => x.id !== id);
    this.persist();
  }

  clear() { this._queue = []; this.persist(); }
}