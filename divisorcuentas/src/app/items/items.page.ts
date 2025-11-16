import { Component, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput, IonFooter, IonFab, IonFabButton, IonCardHeader, IonCardContent, IonCardTitle, IonCard, IonModal, IonNote } from '@ionic/angular/standalone';
import { IonSpinner } from '@ionic/angular/standalone';
import { IonText } from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataService, Evento, Items } from '../services/data.service';
import { BoletaParseResult } from '../../utils/boleta-parser';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [ IonModal,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput,
    FormsModule, NgForOf, RouterModule, CommonModule, ClpCurrencyPipe, IonFab, IonFabButton, IonFooter,
    IonText, IonSpinner]
})
export class ItemsPage implements OnInit {
  // Dev-only keyboard simulator

  @ViewChild(IonContent) content?: IonContent;
  private keyboardListenerShow: any = null;
  private keyboardListenerHide: any = null;
  private focusedElement: HTMLElement | null = null;
  private windowKeyboardShowHandler: any = null;
  private windowKeyboardHideHandler: any = null;
  public nombreItem: string | null = null;
  public valorItem: number | null = null;
  showModal: boolean = false;
  public indexItemEdit: number | null = null;
  constructor(private camera: Camera) { }
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

  }









  agregarItem() {
    if (this.indexItemEdit !== null) {
      // Editando item existente
      const item = this.items[this.indexItemEdit];
      if (!this.nombreItem || !this.nombreItem.trim() || !this.valorItem) return;
      item.name = this.nombreItem.trim();
      item.price = Number(this.valorItem);
    }
    else {
      if (!this.nombreItem || !this.nombreItem.trim() || !this.valorItem) return;
        const nuevo: Items = {
          id: Date.now(),
          name: this.nombreItem!.trim(),
          price: Number(this.valorItem),
          participant: []
        };
        this.items.push(nuevo);
        }
    
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
    this.nombreItem = null;
    this.valorItem = null;
    this.indexItemEdit = null;
    this.closeModal();
  }

  eliminarItem(index: number) {
    this.items.splice(index, 1);
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
  }

  editarItem(index: number) {
    this.indexItemEdit = index;
    this.openAddModal();
    const item = this.items[index];
    this.nombreItem = item.name;
    this.valorItem = item.price;
    
    
  /*
    if (!item || !this.nombreItem || !this.nombreItem.trim() || !this.valorItem) return;
    item.name = this.nombreItem.trim();
    item.price = Number(this.valorItem);
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }-*/
    
  }

  async procesarImagen(event: any) {
    this.ocrCargando = true;
    this.ocrError = '';
    try {
      const file = event.target.files[0];
      if (!file) return;

      var reader = new FileReader();

      reader.onload = this._handleReaderLoaded.bind(this);

      reader.readAsBinaryString(file);

    }
    catch (err: any) {
      console.error(err);
      this.ocrError = 'Error procesando la imagen.';
    }
  }

  _handleReaderLoaded(readerEvt: any) {
    var binaryString = readerEvt.target.result;
    this.base64textString = btoa(binaryString);
    this.ocrCargando = true;
    this.ocrError = '';
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
      "]}"
    ).then(responseText => {
      try {
        responseText = responseText.replace(/(\r\n|\n|\r)/gm, "")
          .replace('```json', '')
          .replace('```', '')
          .trim();
        // Asegurar que la respuesta sea un objeto JSON válido
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {
          // Intentar extraer solo el objeto JSON si hay texto extra
          const match = responseText.match(/\{.*\}/);
          if (match) {
            responseJson = JSON.parse(match[0]);
          } else {
            throw new Error('Formato de respuesta inválido');
          }
        }
        // Validar que items sea un array
        if (!responseJson.items || !Array.isArray(responseJson.items)) {
          throw new Error('La respuesta no contiene un array de items válido');
        }
        // Normalizar items para visualización
        const items = responseJson.items.map((item: any) => ({
          name: item.name || '',
          price: Number(item.price) || 0,
          cantidad: item.cantidad ? Number(item.cantidad) : 1,
          participant: item.participant || []
        }));
        if (this.evento) {
          this.evento.items = [...items];
          this.data.saveEvents();
          this.ocrCargando = false;
          this.ngOnInit();
        }
      } catch (err: any) {
        this.ocrError = 'Error procesando la respuesta de Gemini: ' + (err.message || err);
        this.ocrCargando = false;
      }
    }).catch(err => {
      this.ocrError = 'Error en la solicitud a Gemini: ' + (err.message || err);
      this.ocrCargando = false;
    });

  }


  openAddModal() {
    this.showModal = true;
  }



  closeModal() {
    this.showModal = false;
    this.nuevoNombre = '';
    this.valorItem = null;
  }



  async callGeminiWithImage(base64: string, prompt: string): Promise<string> {
    // Leer la API key de Gemini desde environment
    //const apiKey = environment.geminiApiKey;
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
    this.items[index].participant.push(participante);
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
  }
}
