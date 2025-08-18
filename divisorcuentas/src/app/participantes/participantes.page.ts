import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonModal, IonInput, IonFooter } from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataService, Evento, Participants } from '../services/data.service';

@Component({
  selector: 'app-participantes',
  templateUrl: './participantes.page.html',
  styleUrls: ['./participantes.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonModal, IonInput, IonFooter, FormsModule, NgForOf, RouterModule
  ]
})
export class ParticipantesPage implements OnInit {
  public evento!: Evento;
  participantes: Participants[] = [];
  showModal = false;
  nombreParticipante = '';
  editIndex: number | null = null;
  nuevoParticipante: string = '';
  private route = inject(ActivatedRoute);
  private data = inject(DataService);

  agregarParticipante() {
    if (!this.nuevoParticipante || !this.nuevoParticipante.trim()) return;
    this.participantes.push({
      name: this.nuevoParticipante.trim(),
      montoApagar: 0,
      pagado: false
    });
    if (this.evento) {
      this.evento.participants = [...this.participantes];
      this.data.saveEvents();
    }
    this.nuevoParticipante = '';
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('eventoId'));
    const evento = this.data.getEventById(id);
    if (evento) {
      this.evento = evento;
      this.participantes = this.evento.participants;
    } else {
      this.participantes = [];
    }
  }

  openAdd() {
    this.nombreParticipante = '';
    this.editIndex = null;
    this.showModal = true;
  }

  editParticipante(index: number) {
    this.nombreParticipante = this.participantes[index].name;
    this.editIndex = index;
    this.showModal = true;
  }



  saveParticipante() {
    if (this.nombreParticipante.trim()) {
      if (this.editIndex !== null) {
        this.participantes[this.editIndex] = {
          name: this.nombreParticipante.trim(),
          montoApagar: 0,
          pagado: false
        };
      } else {
        this.participantes.push({
          name: this.nombreParticipante.trim(),
          pagado: false,
          montoApagar: 0
        });
      }
      if (this.evento) {
        this.evento.participants = [...this.participantes];
        this.data.saveEvents();
      }
    }
    this.closeModal();
  }


  deleteParticipante(index: number) {
    this.participantes.splice(index, 1);
    if (this.evento) {
      this.evento.participants = [...this.participantes];
      this.data.saveEvents();
    }
  }

  closeModal() {
    this.showModal = false;
    this.nombreParticipante = '';
    this.editIndex = null;
  }
}
