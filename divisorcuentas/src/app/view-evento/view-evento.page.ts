import { Router } from '@angular/router';
import { NgZone, ViewChild } from '@angular/core'; // 👈 Importa NgZone
import { FormsModule } from '@angular/forms';

import { Component, inject, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { JsonPipe, NgIf, NgFor, CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { ActivatedRoute } from '@angular/router';
import { Platform, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonTitle, IonAccordion, IonItem, IonAccordionGroup, IonLabel, IonButton, IonSelectOption, IonModal, IonList, IonCheckbox, IonFooter, IonInput, IonIcon, IonChip } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircle, trashOutline, checkmarkCircle, close, shareSocialOutline } from 'ionicons/icons';
import { DataService, Evento, Items, Participants } from '../services/data.service';
import * as htmlToImage from 'html-to-image';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { GestureController } from '@ionic/angular';


@Component({
  selector: 'app-view-evento',
  templateUrl: './view-evento.page.html',
  styleUrls: ['./view-evento.page.scss'],
  standalone: true,
  imports: [IonChip, IonIcon, IonCheckbox,
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
  @ViewChild('accordionGroup', { static: false }) accordionGroup: any;

  @ViewChildren('participanteItem', { read: ElementRef }) items!: QueryList<ElementRef>;


  public selectRefsArr: ElementRef<HTMLSelectElement>[] = [];
  public evento!: Evento;
  public cuadraturaValida: boolean = true;
  private data = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);
  private platform = inject(Platform);
  private router = inject(Router);
  public participantes: string[] = [];

  public tempItemSelected: Items = null as any;

  public incluyePropina: boolean = false;

  public nuevoParticipante: string = '';
  public modal: boolean = false;
  checked: boolean = false;


  longPressTimeout: any;

  toggleCheck(index: number) {
    this.evento.participants[index].pagado = !this.evento.participants[index].pagado;
    this.data.saveEvents();
  }


  constructor(private ngZone: NgZone, private gestureCtrl: GestureController) {
    addIcons({ shareSocialOutline, close, checkmarkCircle, personCircle, trashOutline });
  }


  ngAfterViewInit() {
    this.items.changes.subscribe(() => {
      this.initializeGestures();
    });

    // También inicializar al cargar por primera vez
    this.initializeGestures();
  }

  initializeGestures() {
    this.items.forEach((itemRef, index) => {
      const el = itemRef.nativeElement as HTMLElement;

      const gesture = this.gestureCtrl.create({
        el,
        threshold: 0,
        gestureName: 'long-press',
        onStart: () => {
          this.longPressTimeout = setTimeout(() => {
            const participante = this.evento.participants[index];
            this.togglePago(index);
          }, 600); // duración del long press
        },
        onEnd: () => {
          clearTimeout(this.longPressTimeout);
        }
      });

      gesture.enable();
    });
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



  togglePago(index: number) {
    
    this.evento.participants[index].pagado = !this.evento.participants[index].pagado;
    this.data.saveEvents();
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
    if (this.incluyePropina)
      total = total * 1.10;
    return total;
  }


  getDetalleSinPropina(nombre: string) {
    const detalles = [];

    for (const item of this.evento.items!) {
      if (!item.participant || item.participant.length === 0) continue;
      if (!item.participant.includes(nombre)) continue;

      const participantes = item.participant.length;
      const monto = item.price / participantes;

      detalles.push({
        name: item.name,
        monto,
        participantes
      });
    }

    return detalles;
  }

  getPropinaParticipante(nombre: string) {
    if (!this.incluyePropina || this.propina() <= 0) return 0;

    const detalles = this.getDetalleSinPropina(nombre);
    const subtotal = detalles.reduce((acc, d) => acc + d.monto, 0);

    return subtotal * 0.10; // 10% exacto
  }


  getDetalleParticipante(nombre: string) {
    const detalles = this.getDetalleSinPropina(nombre);

    // Agregar propina proporcional
    const propinaPersonal = this.getPropinaParticipante(nombre);
    if (propinaPersonal > 0) {
      detalles.push({
        name: 'Propina (10%)',
        monto: propinaPersonal,
        participantes: 1
      });
    }

    return detalles;
  }

  getTotalParticipante(nombre: string) {
    return this.getDetalleParticipante(nombre)
      .reduce((acc, d) => acc + d.monto, 0);
  }



  async compartirDetalle() {
    const node = document.getElementById('exportDetalle');
    if (!node) return;

    try {
      // 1. Convertir a PNG en Base64
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        backgroundColor: '#06192D' // Fondo si deseas asegurar color
      });

      // 2. Guardar archivo temporal
      const fileName = `detalle_${Date.now()}.png`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: dataUrl.split(',')[1], // quitar "data:image/png;base64,"
        directory: Directory.Cache
      });

      // 3. Compartir
      await Share.share({
        title: 'Detalle de gasto',
        text: 'Te comparto el detalle del evento',
        url: savedFile.uri
      });

    } catch (err) {
      console.error('Error compartiendo imagen', err);
    }
  }





  cuadraturaGlobal() {
    const sumaPorPersona = this.evento.participants
      .map(p => this.getTotalParticipante(p.name))
      .reduce((a, b) => a + b, 0);

    const sumaItems = this.evento.items!.reduce((a, b) => a + b.price, 0);

    const propinaTotal = this.incluyePropina ? this.propina() : 0;

    return Math.abs((sumaItems + propinaTotal) - sumaPorPersona) < 1;
  }



  cuadraturaPersona(nombre: string) {
    const totalMostrado = this.getTotalParticipante(nombre);
    const totalCalculado = this.evento.participants.find(p => p.name === nombre)?.montoApagar || 0;

    return Math.abs(totalMostrado - totalCalculado) < 1;
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
      if (this.evento.items[index].participant.findIndex(p => p == participante) == -1) {
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



