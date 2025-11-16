
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { BehaviorSubject } from 'rxjs';


export interface Evento {
  id: number;
  title: string;
  date: string;
  description?: string;
  participants: Participants[];
  items?: Items[];
  incluyePropina: boolean;
  // Puedes agregar más campos según la gestión que necesites
}

export interface Participants {
  name: string;
  montoApagar: number;
  pagado: boolean;
}

export interface Items {
  id: number;
  name: string;
  price: number;
  participant: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {


  public events: Evento[] = [];
  public events$ = new BehaviorSubject<Evento[]>([]);


  constructor(private storageService: StorageService) {
    this.loadEvents();
  }

  async loadEvents() {
    const stored = await this.storageService.getEvents();
    //const stored = null;
    if (stored) {
      this.events = stored;
    } else {
      // Si no hay datos, inicializa con los de ejemplo
      this.events = [
        {
          id: 0,
          title: 'Trip to Vegas',
          date: '2023-10-01',
          description: 'Viaje con amigos a Las Vegas',
          participants: [{ name: 'Ana', pagado: false, montoApagar: 0 }, { name: 'Luis', pagado: false, montoApagar: 0 }, { name: 'Pedro', pagado: false, montoApagar: 0 }, { name: 'Sofía', pagado: false, montoApagar: 0 }, { name: 'Miguel', pagado: false, montoApagar: 0 }],
          items: [],
          incluyePropina: false
        },
        {
          id: 1,
          title: 'Swim lessons',
          date: '2023-10-02',
          description: 'Clases de natación para niños',
          participants: [{ name: 'Carlos', pagado: false, montoApagar: 0 }, { name: 'Marta', pagado: false, montoApagar: 0 }, { name: 'Lucía', pagado: false, montoApagar: 0 }, { name: 'Andrés', pagado: false, montoApagar: 0 }],
          items: [
            { id: 0, name: 'Swim Gear', price: 50, participant: ["Carlos"] },
            { id: 1, name: 'Pool Passes', price: 10, participant: [] }
          ],
          incluyePropina: true
        },
        {
          id: 2,
          title: 'Family Calendar Meeting',
          date: '2023-10-03',
          description: 'Reunión familiar para organizar el calendario',
          participants: [{ name: 'Juan', pagado: false, montoApagar: 0 }, { name: 'María', pagado: false, montoApagar: 0 }, { name: 'Elena', pagado: false, montoApagar: 0 }, { name: 'Pablo', pagado: false, montoApagar: 0 }, { name: 'Familia', pagado: false, montoApagar: 0 }],
          items: [
            { id: 0, name: 'Agenda', price: 5, participant: [] },
            { id: 1, name: 'Snacks', price: 10, participant: [] }
          ],
          incluyePropina: false
        }
      ];
      await this.saveEvents();
    }
    this.events$.next(this.events);
  }

  async saveEvents() {
    await this.storageService.setEvents(this.events);
    this.events$.next(this.events);
  }


  public getEvents(): Evento[] {
    return this.events;
  }

  public getEvents$() {
    return this.events$.asObservable();
  }

  public getEventById(id: number): Evento | undefined {
    return this.events.find(event => event.id === id);
  }

  public async addEvent(event: Omit<Evento, 'id'>): Promise<Evento> {
    const newId = this.events.length > 0 ? Math.max(...this.events.map(e => e.id)) + 1 : 0;
    const newEvent: Evento = { id: newId, ...event };
    this.events.push(newEvent);
    await this.saveEvents();
    return newEvent;
  }

  public async updateEvent(id: number, updatedEvent: Partial<Omit<Evento, 'id'>>): Promise<Evento | undefined> {
    const event = this.getEventById(id);
    if (event) {
      Object.assign(event, updatedEvent);
      await this.saveEvents();
      return event;
    }
    return undefined;
  }

  public async deleteEvent(id: number): Promise<boolean> {
    const index = this.events.findIndex(event => event.id === id);
    if (index > -1) {
      this.events.splice(index, 1);
      await this.saveEvents();
      return true;
    }
    return false;
  }


}
