
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RefresherCustomEvent, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, IonButton, IonFab, IonFabButton, IonIcon, IonModal, IonFooter, IonInput, IonLabel, IonItem } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { add, addOutline } from 'ionicons/icons';
import { EventoComponent } from '../evento/evento.component';

import { DataService, Evento } from '../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, EventoComponent, IonButton, IonFab, IonFabButton, IonIcon, IonModal, IonFooter, IonInput, IonLabel, IonItem, FormsModule, CommonModule],
})
export class HomePage {
  private data = inject(DataService);
  private router = inject(Router);
  showModal = false;
  nuevoTitulo = '';
  nuevaFecha = '';
  eventos$!: Observable<Evento[]>;

  constructor() {
    addIcons({ add, addOutline });
    this.eventos$ = this.data.getEvents$();
  }

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  openAddModal() {
    this.nuevoTitulo = '';
    this.nuevaFecha = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.nuevoTitulo = '';
    this.nuevaFecha = '';
  }

  async agregarEvento() {
    await this.data.addEvent({
      title: this.nuevoTitulo,
      date: this.nuevaFecha,
      participants: [],
      items: [],
      description: '',
      location: ''
    });
    this.closeModal();
  }

  async eliminarEvento(id: number) {
    await this.data.deleteEvent(id);
  }
}
