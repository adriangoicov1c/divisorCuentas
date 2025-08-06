import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { Component, inject, OnInit } from '@angular/core';
import { JsonPipe, NgIf, NgFor, CurrencyPipe, CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { ActivatedRoute } from '@angular/router';
import { Platform, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonItem, IonIcon, IonLabel, IonNote, IonButton } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircle, trashOutline } from 'ionicons/icons';
import { DataService, Evento } from '../services/data.service';

@Component({
  selector: 'app-view-evento',
  templateUrl: './view-evento.page.html',
  styleUrls: ['./view-evento.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonItem, IonIcon, IonLabel, IonNote, IonButton, CommonModule, NgIf, NgFor, CurrencyPipe, FormsModule, RouterModule, ClpCurrencyPipe],
})
export class ViewEventoPage implements OnInit {
  public evento!: Evento;
  private data = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private platform = inject(Platform);
  private router = inject(Router);
  goToParticipantes() {
    this.router.navigate(['/participantes']);
  }
  public incluyePropina: boolean = false;

  public nuevoParticipante: string = '';

  constructor() {
    addIcons({personCircle,trashOutline});
  }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id') as string;
    this.evento = this.data.getEvents().find(event => event.id === parseInt(id, 10)) as Evento;
  }

  getBackButtonText() {
    return this.platform.is('ios') ? 'Eventos' : '';
  }

  agregarParticipante() {
    if (!this.nuevoParticipante || !this.nuevoParticipante.trim()) return;
    if (!this.evento.participants) this.evento.participants = [];
    this.evento.participants.push(this.nuevoParticipante.trim());
    this.nuevoParticipante = '';
  }

  eliminarParticipante(index: number) {
    if (this.evento.participants && index > -1) {
      this.evento.participants.splice(index, 1);
    }
  }

  subtotal(): number {
    return this.evento?.items?.reduce((acc, item) => acc + item.price, 0) || 0;
  }

  propina(): number {
    return this.subtotal() * 0.10;
  }

  total(): number {
    var total = this.subtotal();
    if(this.incluyePropina)
      total = total * 1.10;
    return total;
  }

  getTotalPorParticipante(participante: string): number {
    
    if (!this.evento || !this.evento.items) return 0;
    
    var valorPorParticipante: number = this.evento.items
      .filter(item => item.participant === participante)
      .reduce((acc, item) => acc + item.price, 0);

    if (this.incluyePropina) 
       valorPorParticipante *= 1.10;
    
    return valorPorParticipante;
  }
}
