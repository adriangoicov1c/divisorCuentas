import { Router } from '@angular/router';
import { NgZone, ViewChild } from '@angular/core'; // 👈 Importa NgZone
import { FormsModule } from '@angular/forms';

import { Component, inject, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { JsonPipe, NgIf, NgFor,  CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { ActivatedRoute } from '@angular/router';
import { Platform, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonTitle, IonAccordion, IonItem, IonAccordionGroup, IonLabel, IonButton, IonSelectOption, IonModal, IonList, IonCheckbox, IonFooter, IonInput, IonIcon } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircle, trashOutline, checkmarkCircle } from 'ionicons/icons';
import { DataService, Evento, Items, Participants } from '../services/data.service';


@Component({
  selector: 'app-view-evento',
  templateUrl: './view-evento.page.html',
  styleUrls: ['./view-evento.page.scss'],
  standalone: true,
  imports: [IonIcon,  IonCheckbox, 
            IonList, 
            IonModal, 
            IonAccordionGroup, 
            IonItem, 
            IonAccordion, 
            IonTitle, 
            IonHeader, 
            IonToolbar, 
            IonButtons, 
            IonBackButton, 
            IonContent, 
            CommonModule, 
            NgIf, 
            NgFor, 
            FormsModule, 
            RouterModule, 
            ClpCurrencyPipe, 
             
            IonLabel, 
            IonButton, 
            IonFooter],
})
export class ViewEventoPage implements OnInit {
  
  @ViewChildren('selectRef') selectRefs!: QueryList<ElementRef<HTMLSelectElement>>;

  
  public selectRefsArr: ElementRef<HTMLSelectElement>[] = [];
  public evento!: Evento;
  public cuadraturaValida: boolean = true;
  private data = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private platform = inject(Platform);
  private router = inject(Router);
  public participantes: string[] = [];

  public tempItemSelected: Items =  null as any;

  public incluyePropina: boolean = false;

  public nuevoParticipante: string = '';
  public modal: boolean = false;
  checked: boolean = false;

  toggleCheck(index: number) {
    this.evento.participants[index].pagado = !this.evento.participants[index].pagado;
    this.data.saveEvents();
  }


  constructor(private ngZone: NgZone ) {
    addIcons({checkmarkCircle,personCircle,trashOutline});
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

    if (this.evento.items) {
      this.evento.items.forEach(item => {
        if (!Array.isArray(item.participant)) item.participant = [];
      });
    }
    // Helper para acceder al selectRefs como array en el template
    
  }



  calcularMontoApagar() {
    
    this.evento.incluyePropina = this.incluyePropina;
    //alert("Calculando monto a pagar...");
    // Reset montos
    this.evento.participants.forEach(p => p.montoApagar = 0);
    this.evento.items!.forEach(item => {
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






  
  asignarParticipante(index: number, participante: string) {
    
    if (this.evento.items && this.evento.items[index]) {
      if (this.evento.items[index].participant.findIndex(p => p == participante) == -1){
        this.evento.items[index].participant.push(participante);
      }
    
    }

    this.calcularMontoApagar();

      
    
  }


  toggleSelection(participant: any) {

    this.tempItemSelected.participant.indexOf(participant.name) === -1 ? this.tempItemSelected.participant.push(participant.name) : this.tempItemSelected.participant.splice(this.tempItemSelected.participant.indexOf(participant.name), 1);
  }

  openModal(item: Items) {
    
    this.tempItemSelected = item;
    this.modal = true;
  }

  close() {
    this.modal = false;
  }

  guardarAsignaciones() {
    
    
    const idx = this.evento.items!.findIndex((element) => element.id == this.tempItemSelected.id);
    
    this.tempItemSelected.participant.forEach(element => {
      this.asignarParticipante(idx, element);  
    });
    
    
    this.close();
    this.calcularMontoApagar();
    this.tempItemSelected = null as any;
  }

}



