import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})

export class StorageService {

  private _storage: Storage | null = null;
  private readonly EVENTS_KEY = 'eventos';
  private _initPromise: Promise<void>;

  constructor(private storage: Storage) {
    this._initPromise = this.init();
  }

  private async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }


  async getEvents(): Promise<any[]> {
    await this._initPromise;
    return (await this._storage?.get(this.EVENTS_KEY)) || [];
  }


  async setEvents(events: any[]): Promise<void> {
    await this._initPromise;
    await this._storage?.set(this.EVENTS_KEY, events);
  }
}
