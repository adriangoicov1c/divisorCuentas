import { Component, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf,  CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput, IonFooter, IonFab, IonFabButton, IonCardHeader, IonCardContent, IonCardTitle, IonCard } from '@ionic/angular/standalone';
import { IonSpinner } from '@ionic/angular/standalone';
import { IonText } from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataService, Evento, Items } from '../services/data.service';
import {  BoletaParseResult } from '../../utils/boleta-parser';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardTitle, IonCardContent, IonCardHeader, IonFabButton, IonFab,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput,
    FormsModule, NgForOf, RouterModule, CommonModule, ClpCurrencyPipe,
    IonText, IonSpinner, IonFooter]
})
export class ItemsPage implements OnInit, OnDestroy {
  // Dev-only keyboard simulator
  public keyboardSimulated: boolean = false;
  @ViewChild(IonContent) content?: IonContent;
  private keyboardListenerShow: any = null;
  private keyboardListenerHide: any = null;
  private focusedElement: HTMLElement | null = null;
  private windowKeyboardShowHandler: any = null;
  private windowKeyboardHideHandler: any = null;
  constructor(private camera: Camera) {}
  async abrirCamaraOGaleria() {
    if ((window as any).cordova && this.camera) {
      // Cordova disponible
      const options: CameraOptions = {
        quality: 80,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        sourceType: this.camera.PictureSourceType.CAMERA // o PHOTOLIBRARY
      };
      try {
        const imageData = await this.camera.getPicture(options);
        const base64Image = 'data:image/jpeg;base64,' + imageData;
        this.procesarImagenBase64(base64Image);
      } catch (err) {
        this.ocrError = 'No se pudo obtener la imagen (Cordova).';
      }
    } else {
      // Web
      const input = document.getElementById('ocrInput') as HTMLInputElement;
      if (input) input.click();
      else this.ocrError = 'No se encontró el input para subir imagen.';
    }
  }


  procesarImagenBase64(base64Image: string) {
    // Aquí puedes adaptar tu flujo para procesar la imagen base64 con OCR
    // Por ejemplo, enviar a Tesseract.js o Gemini
    // this.callGeminiWithImage(base64Image, 'Extrae los items de la boleta');
  }
  public boletaParseResult: BoletaParseResult | null = null;
  public evento!: Evento;
  public items: Items[] = [];
  public nuevoNombre: string = '';
  public nuevoMonto: number | null = null;
  public ocrCargando: boolean = false;
  public ocrError: string = '';
  public base64textString: string = '';
  private route = inject(ActivatedRoute);
  private data = inject(DataService);


  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('eventoId'));
    const evento = this.data.getEventById(id);
    if (evento) {
      this.evento = evento;
      this.items = this.evento.items ?? [];
    }
    // register keyboard listeners when running on device
    try {
      if ((window as any).cordova) {
        // Prefer cordova-plugin-ionic-keyboard events if present
        const kb = (window as any).Keyboard || (window as any).cordova?.plugins?.Keyboard;
        if (kb && kb.onKeyboardWillShow) {
          this.keyboardListenerShow = kb.onKeyboardWillShow((info: any) => {
            const height = info.keyboardHeight || 300;
            document.body.classList.add('keyboard-simulated');
            this.ensureGlobalOverlay(true);
            this.setContentPadding(height);
            // If we have a focused element, ensure it's visible above the keyboard
            if (this.focusedElement) {
              this.scrollToInput({ target: this.focusedElement });
            }
          });
        }
        if (kb && kb.onKeyboardWillHide) {
          this.keyboardListenerHide = kb.onKeyboardWillHide(() => {
            document.body.classList.remove('keyboard-simulated');
            this.ensureGlobalOverlay(false);
            this.setContentPadding(0);
          });
        }
      }
    } catch (err) {
      console.debug('Keyboard plugin not available', err);
    }

    // Also listen for window events (some platforms emit keyboardDidShow/Hide)
    try {
      this.windowKeyboardShowHandler = (ev: any) => {
        const height = ev && (ev.keyboardHeight || ev.detail?.keyboardHeight || ev.detail?.keyboardheight || ev.detail?.height) || 300;
        this.handleKeyboardShown(height);
      };
      this.windowKeyboardHideHandler = () => {
        document.body.classList.remove('keyboard-simulated');
        this.ensureGlobalOverlay(false);
        this.setContentPadding(0);
      };
      window.addEventListener('keyboardDidShow', this.windowKeyboardShowHandler);
      window.addEventListener('keyboardDidHide', this.windowKeyboardHideHandler);
    } catch (e) {
      console.debug('window keyboard events not available', e);
    }
  }

  ngOnDestroy(): void {
    try {
      // If listeners were set via Cordova plugin, they may expose remove() or unsubscribe()
      if (this.keyboardListenerShow) {
        if (typeof this.keyboardListenerShow.unsubscribe === 'function') this.keyboardListenerShow.unsubscribe();
        if (typeof this.keyboardListenerShow.remove === 'function') this.keyboardListenerShow.remove();
      }
      if (this.keyboardListenerHide) {
        if (typeof this.keyboardListenerHide.unsubscribe === 'function') this.keyboardListenerHide.unsubscribe();
        if (typeof this.keyboardListenerHide.remove === 'function') this.keyboardListenerHide.remove();
      }
    } catch (e) { /* noop */ }
    try {
      if (this.windowKeyboardShowHandler) window.removeEventListener('keyboardDidShow', this.windowKeyboardShowHandler);
      if (this.windowKeyboardHideHandler) window.removeEventListener('keyboardDidHide', this.windowKeyboardHideHandler);
    } catch (e) { /* noop */ }
  }

  onFocus(ev: any) {
    try {
      const target = ev && ev.target ? (ev.target as HTMLElement) : null;
      this.focusedElement = target ? (target.closest('ion-item') || target.closest('ion-input') || target) as HTMLElement : null;
      this.scrollToInput(ev);
    } catch (e) {
      console.debug('onFocus error', e);
    }
  }

  // Handle keyboard shown: adjust padding and scroll focused element into view
  private async handleKeyboardShown(height: number) {
    try {
      const keyboardHeight = height || 300;
      document.body.classList.add('keyboard-simulated');
      this.ensureGlobalOverlay(true);
      await this.setContentPadding(keyboardHeight);

      if (!this.focusedElement) return;

      // compute position relative to viewport
      const elRect = this.focusedElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const margin = 12;
      const desiredBottom = viewportHeight - keyboardHeight - margin;

      if (elRect.bottom > desiredBottom) {
        // need to scroll down by the difference
        const diff = elRect.bottom - desiredBottom;
        if (this.content) {
          try {
            const scrollEl = await (this.content as any).getScrollElement?.();
            const currentScroll = scrollEl ? (scrollEl as any).scrollTop || 0 : 0;
            await (this.content as any).scrollToPoint?.(0, currentScroll + diff + margin, 300);
          } catch (err) {
            // fallback: native scrollIntoView
            try { this.focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
          }
        } else {
          try { this.focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
        }
      }
    } catch (err) {
      console.debug('handleKeyboardShown error', err);
    }
  }

  async toggleKeyboard() {
    this.keyboardSimulated = !this.keyboardSimulated;
    console.log('Keyboard simulated:', this.keyboardSimulated);
    // Toggle class on body for more reliable global styling
    if (this.keyboardSimulated) {
      document.body.classList.add('keyboard-simulated');
      this.ensureGlobalOverlay(true);
      await this.setContentPadding(320);
    } else {
      document.body.classList.remove('keyboard-simulated');
      this.ensureGlobalOverlay(false);
      await this.setContentPadding(0);
    }
    // Ensure overlay is visible
    const overlay = document.querySelector('.keyboard-overlay') as HTMLElement | null;
    if (overlay) {
      overlay.style.display = this.keyboardSimulated ? 'block' : 'none';
    }
  }

  private ensureGlobalOverlay(show: boolean) {
    let overlay = document.querySelector('.keyboard-overlay-global') as HTMLElement | null;
    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'keyboard-overlay-global';
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'block';
    } else {
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  private async setContentPadding(px: number) {
    // set CSS variable on host ion-content (fallback)
    const contentHost = document.querySelector('ion-content') as HTMLElement | null;
    if (contentHost) {
      contentHost.style.setProperty('--padding-bottom', `${px}px`);
    }

    // If we have a ViewChild reference, set padding on the actual scroll element and force resize
    if (this.content) {
      try {
        const scrollEl = await (this.content as any).getScrollElement?.();
        if (scrollEl && scrollEl instanceof HTMLElement) {
          (scrollEl as HTMLElement).style.paddingBottom = `${px}px`;
        }
        // Force ion-content to recompute sizes (use any-cast because typings may not include resize)
        try { (this.content as any).resize?.(); } catch (e) { console.debug('content.resize() failed', e); }
      } catch (err) {
        console.debug('setContentPadding: could not access scroll element', err);
      }
    }
  }

  // Scroll focused input into view (use on ionFocus)
  async scrollToInput(ev: any) {
    try {
      // small delay to allow DOM/layout to settle after focus
      await new Promise(res => setTimeout(res, 80));
      const keyboardHeight = 320; // should match simulator height

      // Find the closest container (ion-item or ion-input host)
      let inputHost: HTMLElement | null = null;
      if (ev && ev.target) {
        // ev.target can be the native input inside ion-input
        const maybeInput = ev.target as HTMLElement;
        inputHost = maybeInput.closest('ion-item') || maybeInput.closest('ion-input') as HTMLElement | null;
      }

      if (!inputHost) {
        return;
      }

      // If we have ion-content, compute scroll using its scroll element
      if (this.content) {
        try {
          const scrollEl = await (this.content as any).getScrollElement?.();
          if (scrollEl && scrollEl instanceof HTMLElement) {
            const hostRect = (scrollEl as HTMLElement).getBoundingClientRect();
            const elRect = inputHost.getBoundingClientRect();

            // position of element relative to scroll container
            const elTopRelative = elRect.top - hostRect.top + (scrollEl as any).scrollTop;
            const elBottomRelative = elTopRelative + elRect.height;

            // Visible area height when keyboard is open
            const visibleHeight = hostRect.height - (this.keyboardSimulated ? keyboardHeight : 0);

            // If element bottom would be hidden by keyboard, scroll so it's above keyboard with slight margin
            const margin = 12;
            if (elBottomRelative > (scrollEl as any).scrollTop + visibleHeight) {
              const targetScroll = elBottomRelative - visibleHeight + margin;
              await (this.content as any).scrollToPoint?.(0, targetScroll, 300);
            } else if (elTopRelative < (scrollEl as any).scrollTop) {
              // If element is above current scroll, bring it into view
              const targetScroll = Math.max(elTopRelative - margin, 0);
              await (this.content as any).scrollToPoint?.(0, targetScroll, 200);
            }
          }
        } catch (err) {
          console.debug('scrollToInput: could not scroll via IonContent', err);
          // fallback to native scrollIntoView
          try { inputHost.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
        }
      } else {
        // No ion-content ref, fallback
        try { inputHost.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.debug('scrollToInput: error', err);
    }
  }



  agregarItem() {
    if (!this.nuevoNombre || !this.nuevoNombre.trim() || !this.nuevoMonto) return;
    const nuevo: Items = {
      id: Date.now(),
      name: this.nuevoNombre.trim(),
      price: Number(this.nuevoMonto),
      participant: undefined
    };
    this.items.push(nuevo);
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
    this.nuevoNombre = '';
    this.nuevoMonto = null;
  }

  eliminarItem(index: number) {
    this.items.splice(index, 1);
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
  }

  async procesarImagen(event: any) {
    this.ocrCargando = true;
    this.ocrError = '';
    try {
      const file = event.target.files[0];
      if (!file) return;

      var reader = new FileReader();

      reader.onload =this._handleReaderLoaded.bind(this);

      reader.readAsBinaryString(file);
    
    }
    catch (err: any) {
      console.error(err);
      this.ocrError = 'Error procesando la imagen.';
    }
  }

  _handleReaderLoaded(readerEvt: any) {
      var binaryString = readerEvt.target.result;
      this.base64textString= btoa(binaryString);
            this.callGeminiWithImage(this.base64textString,
      "Identifica los items de la boleta:\n\n" +
      "Extrae los items en formato JSON, donde cada item tiene 'name', 'cantidad' y 'price'. " +
      "Si no hay cantidad, asume 1. Si no puedes identificar items, responde con un array vacío. " +
      "Identifica el total de la boleta: " +
      "Identifica el monto de la propina si es que existe " +
      "Los items que tengan cantidad mayor a 1 deben ser considerados como múltiples items en la respuesta , es decir todo el monto debe ser distribuido entre los items correspondientes y quedar todos en cantidad 1" +
      "Revisa si el valor total coincide con la suma de los items y/o de la propina, si no cuadra deja la variable cuadratura en false, pero si calza dejalo en true " +
      "Ejemplo de respuesta:\n{" +
      "\"total\": 4500," +
      "\"propina\": 500," +
      "\"cuadratura\": true," +
      "\"items\": [" +
      "[{\"name\": \"Item1\", \"cantidad\": 2, \"price\": 3000}, {\"name\": \"Item2\", \"cantidad\": 1, \"price\": 1500}]" +
      "]}" +
      ")").then(responseText => {
        responseText = responseText.replace(/(\r\n|\n|\r)/gm, "")
        .replace('```json', '')
        .replace('```', '')
        .trim();

        var responseJson = JSON.parse(responseText);
        console.log('Respuesta de Gemini:', responseJson);


         if (this.evento) {
          this.evento.items = [...responseJson.items];
          this.data.saveEvents();
          this.ocrCargando = false;
          this.ngOnInit();
        }
      });

  }



  async callGeminiWithImage(base64: string, prompt: string): Promise<string> {
  // Leer la API key de Gemini desde environment
  const apiKey = environment.geminiApiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',  // o el tipo correcto (image/png, etc.)
                data: base64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const json = await response.json();
    // La respuesta tiene “candidates” u otro formato, dependerá del modelo usado
    // Por simplicidad, supongamos que la respuesta tiene algo como json.candidates[0].text
    if (json.candidates && json.candidates.length > 0) {
      //console.log('Respuesta de Gemini:', json.candidates[0].content.parts[0].text);
      return json.candidates[0].content.parts[0].text;
    } else if (json.text) {
      return json.text;
    } else {
      throw new Error('Respuesta inesperada de Gemini: ' + JSON.stringify(json));
    }
  }



  asignarParticipante(index: number, participante: string) {
    this.items[index].participant = participante;
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
  }
}
