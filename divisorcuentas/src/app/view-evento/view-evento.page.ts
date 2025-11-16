import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { Component, inject, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { JsonPipe, NgIf, NgFor,  CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { ActivatedRoute } from '@angular/router';
import { Platform, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonTitle, IonAccordion, IonItem, IonAccordionGroup, IonLabel } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircle, trashOutline } from 'ionicons/icons';
import { DataService, Evento, Participants } from '../services/data.service';

@Component({
  selector: 'app-view-evento',
  templateUrl: './view-evento.page.html',
  styleUrls: ['./view-evento.page.scss'],
  standalone: true,
  imports: [IonAccordionGroup, IonItem, IonAccordion, IonTitle, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent,  CommonModule, NgIf, NgFor,  FormsModule, RouterModule, ClpCurrencyPipe],
})
export class ViewEventoPage implements OnInit, AfterViewInit {
  @ViewChildren('selectRef') selectRefs!: QueryList<ElementRef<HTMLSelectElement>>;
  public selectRefsArr: ElementRef<HTMLSelectElement>[] = [];
  public evento!: Evento;
  public cuadraturaValida: boolean = true;
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
    this.incluyePropina = this.evento.incluyePropina;
    this.calcularMontoApagar();
    // Asegurar que participant sea array
    if (this.evento.items) {
      this.evento.items.forEach(item => {
        if (!Array.isArray(item.participant)) item.participant = [];
      });
    }
  }

  ngAfterViewInit(): void {
    this.selectRefsArr = this.selectRefs ? this.selectRefs.toArray() : [];
  }

  calcularMontoApagar() {
    if (!this.evento || !this.evento.items) return;
    this.evento.incluyePropina = this.incluyePropina;
    // Reset montos
    this.evento.participants.forEach(p => p.montoApagar = 0);
    // Dividir monto de cada item entre sus participantes
    this.evento.items.forEach(item => {
      if (Array.isArray(item.participant) && item.participant.length > 0) {
        const montoPorPersona = item.price / item.participant.length;
        item.participant.forEach(nombre => {
          const participante = this.evento.participants.find(p => p.name === nombre);
          if (participante) participante.montoApagar += montoPorPersona;
        });
      }
    });
    // Aplicar propina si corresponde
    if (this.incluyePropina) {
      this.evento.participants.forEach(p => p.montoApagar *= 1.10);
    }
    this.data.saveEvents();
    // Validar cuadratura
    this.cuadraturaValida = Math.abs(this.totalAsignado() - this.total()) < 1;
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

  getTotalPorParticipante(participante: Participants): number {
    if (!this.evento || !this.evento.items) return 0;
    var valorPorParticipante: number = this.evento.items
      .filter(item => {
        const p = item.participant;
        if (!p) return false;
        return Array.isArray(p) ? p.includes(participante.name) : p === participante.name;
      })
      .reduce((acc, item) => acc + item.price, 0);
    if (this.incluyePropina) 
       valorPorParticipante *= 1.10;
    return valorPorParticipante;
  }

  totalAsignado(): number {
    return this.evento?.participants?.reduce((acc, participante) => acc + participante.montoApagar, 0) || 0;
  }

  getBackButtonText() {
    return this.platform.is('ios') ? 'Eventos' : '';
  }

  agregarParticipante() {
    if (!this.nuevoParticipante || !this.nuevoParticipante.trim()) return;
    if (!this.evento.participants) this.evento.participants = [];
    var newParticipant ={
      name: this.nuevoParticipante.trim(),
      montoApagar: 0,
      pagado: false
    }
    this.evento.participants.push(newParticipant);
    this.nuevoParticipante = '';
  }
/*
  calcularMontoApagar()  {
    if (!this.evento || !this.evento.items) return;
    this.evento.incluyePropina = this.incluyePropina;
    // Reset montos
    this.evento.participants.forEach(p => p.montoApagar = 0);
    // Dividir monto de cada item entre sus participantes
    this.evento.items.forEach(item => {
      if (Array.isArray(item.participant) && item.participant.length > 0) {
        const montoPorPersona = item.price / item.participant.length;
        item.participant.forEach(nombre => {
          const participante = this.evento.participants.find(p => p.name === nombre);
          if (participante) participante.montoApagar += montoPorPersona;
        });
      }
    });
    // Aplicar propina si corresponde
    if (this.incluyePropina) {
      this.evento.participants.forEach(p => p.montoApagar *= 1.10);
    }
    this.data.saveEvents();
    // Validar cuadratura
    this.cuadraturaValida = Math.abs(this.totalAsignado() - this.total()) < 1;
  }*/



  }
/*
  asignarParticipante(index: number, participante: string) {
    console.log("Asignar participante:", participante);
    if (this.evento.items && this.evento.items[index]) {
      this.evento.items[index].participant.push(participante);
      this.calcularMontoApagar()
    }
    
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

  getTotalPorParticipante(participante: Participants): number {
    
    if (!this.evento || !this.evento.items) return 0;
    
    var valorPorParticipante: number = this.evento.items
      .filter(item => {
        const p = item.participant;
        if (!p) return false;
        return Array.isArray(p) ? p.includes(participante.name) : p === participante.name;
      })
      .reduce((acc, item) => acc + item.price, 0);


    if (this.incluyePropina) 
       valorPorParticipante *= 1.10;
    
    return valorPorParticipante;
  }

  totalAsignado(): number {
    return this.evento?.participants?.reduce((acc, participante) => acc + participante.montoApagar, 0) || 0;
  }
}*/


