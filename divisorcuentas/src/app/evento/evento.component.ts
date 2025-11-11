
import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Platform, IonItem, IonLabel, IonNote, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, trash } from 'ionicons/icons';
import { Evento } from '../services/data.service';

@Component({
  selector: 'app-evento',
  templateUrl: './evento.component.html',
  styleUrls: ['./evento.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonLabel, IonNote, IonIcon, IonButton],
})
export class EventoComponent {
  private platform = inject(Platform);
  @Input() evento?: Evento;
  @Output() eliminar = new EventEmitter<number>();
  showDelete = false;
  private longPressTimeout: any;

  isIos() {
    return this.platform.is('ios');
  }
  constructor() {
    addIcons({ chevronForward, trash });
  }
  onEliminar(e: Event) {
    e.stopPropagation();
    this.showDelete = false;
    if (this.evento) {
      this.eliminar.emit(this.evento.id);
    }
  }
  onPointerDown() {
    this.longPressTimeout = setTimeout(() => {
      this.showDelete = true;
    }, 600);
  }
  onPointerUp() {
    clearTimeout(this.longPressTimeout);
  }
  onPointerLeave() {
    clearTimeout(this.longPressTimeout);
  }
  onBlur() {
    this.showDelete = false;
  }
}
