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
import { Camera,  CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../environments/environment';
import { ActionSheetController } from '@ionic/angular/standalone';

import { AzureOpenAI } from 'openai';

// Read Azure/OpenAI config from environment
const azureEndpoint = environment.azure?.endpoint ?? '';
const azureApiKey = environment.azure?.apiKey ?? '';
const azureModel = environment.azure?.model ?? '';
const azureDeployment = environment.azure?.deployment ?? '';
const azureApiVersion = environment.azure?.apiVersion ?? '2024-04-01-preview';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [ IonModal,
    IonHeader, IonToolbar, IonTitle, IonContent,  IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput,
    FormsModule, NgForOf, RouterModule, CommonModule, ClpCurrencyPipe, IonFab, IonFabButton, IonFooter,
    IonText, IonSpinner]
})
export class ItemsPage implements OnInit {

  @ViewChild(IonContent) content?: IonContent;
  public nombreItem: string | null = null;
  public valorItem: number | null = null;
  showModal: boolean = false;
  openModal: boolean = false;
  public indexItemEdit: number | null = null;
  image: string | undefined = '';
  //constructor(private camera: Camera) { }
  recognizedText: string = '';
  private actionSheet = inject(ActionSheetController);
  

  

    /**
     * Abre la cámara o la galería según la elección.
     * choice: 'camera' | 'gallery' — si es undefined se usa CAMERA por defecto
     */
    async abrirCamaraOGaleria(choice:number) {
      try {
        // Usar Capacitor Camera si est├í disponible
        // Si choice no est├í definido, usamos CameraSource.Prompt para que
        // el sistema muestre la opci├│n nativa (C├ímara / Galer├¡a)
        const source = choice === 1 ? CameraSource.Camera : (choice === 2 ? CameraSource.Photos : CameraSource.Prompt);
        const photo = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.DataUrl, source });
        if (photo && photo.dataUrl) {
          const base64 = photo.dataUrl.split(',')[1];
          await this.procesarImagenBase64(base64);
          return;
        }
      } catch (err) {
        // si falla, caeremos a fallback web
        console.warn('Camera error or not available, fallback to file input', err);
      }

      // Fallback web: disparar input file
      const input = document.getElementById('ocrInput') as HTMLInputElement;
      if (input) input.click();
      else this.ocrError = 'No se encontr├│ el input para subir imagen.';
    }
    


    /*
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
      } catch (err) {
        this.ocrError = 'No se pudo obtener la imagen (Cordova).';
      }
    } else {
      // Web
      const input = document.getElementById('ocrInput') as HTMLInputElement;
      if (input) input.click();
      else this.ocrError = 'No se encontr├│ el input para subir imagen.';
    }*/



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

  
    /**
     * Procesa la imagen recibida desde el input (navegador)
     * Si no se pasa `event`, decide seg├║n entorno:
     * - En navegador: dispara el input `#ocrInput`
     * - En dispositivo m├│vil (Cordova): solicita al usuario si desea C├ímara o Galer├¡a y abre la correspondiente
     */
    async procesarImagen(event?: any) {
      this.ocrError = '';

      // Si se recibi├│ el event del input file, procesarlo
      if (event && event.target && event.target.files) {
        this.ocrCargando = true;
        try {
          const file = event.target.files[0];
          if (!file) {
            this.ocrCargando = false;
            return;
          }

          const reader = new FileReader();
          reader.onload = (readerEvt: any) => {
            const binaryString = readerEvt.target.result;
            const base64 = btoa(binaryString);
            this.procesarImagenBase64(base64);
          };
          reader.readAsBinaryString(file);
        }
        catch (err: any) {
          console.error(err);
          this.ocrError = 'Error procesando la imagen.';
          this.ocrCargando = false;
        }
        return;
      }

      // Si no hay event: decidir seg├║n entorno
      const isCordova = !!((window as any).cordova);
      if (isCordova) {
        // Mostrar Action Sheet nativo con iconos (C├ímara / Galer├¡a)
        try {
          const sheet = await this.actionSheet.create({
            header: 'Selecciona fuente',
            buttons: [
              {
                text: 'C├ímara',
                icon: 'camera',
                handler: async () => {
                  await this.abrirCamaraOGaleria(1);
                }
              },
              {
                text: 'Galer├¡a',
                icon: 'images',
                  handler: async () => {
                    await this.abrirCamaraOGaleria(2);
                }
              },
              {
                text: 'Cancelar',
                icon: 'close',
                role: 'cancel'
              }
            ]
          });
          await sheet.present();
        } catch (err) {
          console.error(err);
          this.ocrError = 'No se pudo abrir la opci├│n de fuente.';
        }
      } else {
        // En navegador, disparar el input file
        const input = document.getElementById('ocrInput') as HTMLInputElement;
        if (input) input.click();
        else this.ocrError = 'No se encontr├│ el input para subir imagen.';
      }
    }

    /** Procesa una imagen ya en base64 (sin prefijo data:), llama al LLM y normaliza respuesta */
    async procesarImagenBase64(base64: string) {
      this.base64textString = base64;
      this.ocrCargando = true;
      this.ocrError = '';

      const options = { endpoint: azureEndpoint, apiKey: azureApiKey, deployment: azureDeployment, apiVersion: azureApiVersion, dangerouslyAllowBrowser: true}
      
          const client = new AzureOpenAI(options);
      

      const response = await client.chat.completions.create({
          messages: [
      
      
            
            { 
              role:"user", 
              content:  [{
                type: "text",
                text : "Identifica los items de la boleta:\n\n" +
                        "Extrae los items en formato JSON, donde cada item tiene 'name', 'cantidad' y 'price'. " +
                        "Si no hay cantidad, asume 1. Si no puedes identificar items, responde con un array vac├¡o. " +
                        "Identifica el total de la boleta: " +
                        "Identifica el monto de la propina si es que existe " +
                        "Los items que tengan cantidad mayor a 1 deben ser considerados como m├║ltiples items en la respuesta , es decir todo el monto debe ser distribuido entre los items correspondientes y quedar todos en cantidad 1" +
                        "Revisa si el valor total coincide con la suma de los items y/o de la propina, si no cuadra deja la variable cuadratura en false, pero si calza dejalo en true " +
                        "Ejemplo de respuesta:\n{" +
                          "\"total\": 4500," +
                          "\"propina\": 500," +
                          "\"cuadratura\": true," +
                          "\"items\": [" +
                          "[{\"name\": \"Item1\", \"cantidad\": 2, \"price\": 3000}, {\"name\": \"Item2\", \"cantidad\": 1, \"price\": 1500}]" +
                        "]}"},
                       {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`
                    //url: "https://media-cdn.tripadvisor.com/media/photo-s/12/a9/a1/f3/boleta-sin-la-propina.jpg"
                  }
                }]
          },
            
            
          ],
          max_completion_tokens : 16384,
            model: azureModel
          });
        
        console.log(response.choices[0].message.content);

        let responseJson: any;
        try {
          responseJson = JSON.parse(response.choices[0].message!.content!);
        } catch (e) {
          const match = response.choices[0].message!.content!.match(/\{.*\}/);
          if (match) responseJson = JSON.parse(match[0]);
          else throw new Error('Formato de respuesta inv├ílido');
        }

        if (!responseJson.items || !Array.isArray(responseJson.items)) {
          throw new Error('La respuesta no contiene un array de items v├ílido');
        }
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
        
      
      /*
      const prompt = "Identifica los items de la boleta:\n\n" +
        "Extrae los items en formato JSON, donde cada item tiene 'name', 'cantidad' y 'price'. " +
        "Si no hay cantidad, asume 1. Si no puedes identificar items, responde con un array vac├¡o. " +
        "Identifica el total de la boleta: " +
        "Identifica el monto de la propina si es que existe " +
        "Los items que tengan cantidad mayor a 1 deben ser considerados como m├║ltiples items en la respuesta , es decir todo el monto debe ser distribuido entre los items correspondientes y quedar todos en cantidad 1" +
        "Revisa si el valor total coincide con la suma de los items y/o de la propina, si no cuadra deja la variable cuadratura en false, pero si calza dejalo en true ";
      try {
        const responseText = await this.callGeminiWithImage(base64, prompt);
        let text = responseText.replace(/(\r\n|\n|\r)/gm, "").replace('```json', '').replace('```', '').trim();
        let responseJson: any;
        try {
          responseJson = JSON.parse(text);
        } catch (e) {
          const match = text.match(/\{.*\}/);
          if (match) responseJson = JSON.parse(match[0]);
          else throw new Error('Formato de respuesta inv├ílido');
        }
        if (!responseJson.items || !Array.isArray(responseJson.items)) {
          throw new Error('La respuesta no contiene un array de items v├ílido');
        }
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
      }*/
    }
  /*
  _handleReaderLoaded(readerEvt: any) {
    var binaryString = readerEvt.target.result;
    this.base64textString = btoa(binaryString);
    this.ocrCargando = true;
    this.ocrError = '';
    this.callGeminiWithImage(this.base64textString,
      "Identifica los items de la boleta:\n\n" +
      "Extrae los items en formato JSON, donde cada item tiene 'name', 'cantidad' y 'price'. " +
      "Si no hay cantidad, asume 1. Si no puedes identificar items, responde con un array vac├¡o. " +
      "Identifica el total de la boleta: " +
      "Identifica el monto de la propina si es que existe " +
      "Los items que tengan cantidad mayor a 1 deben ser considerados como m├║ltiples items en la respuesta , es decir todo el monto debe ser distribuido entre los items correspondientes y quedar todos en cantidad 1" +
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
        // Asegurar que la respuesta sea un objeto JSON v├ílido
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {
          // Intentar extraer solo el objeto JSON si hay texto extra
          const match = responseText.match(/\{.*\}/);
          if (match) {
            responseJson = JSON.parse(match[0]);
          } else {
            throw new Error('Formato de respuesta inv├ílido');
          }
        }
        // Validar que items sea un array
        if (!responseJson.items || !Array.isArray(responseJson.items)) {
          throw new Error('La respuesta no contiene un array de items v├ílido');
        }
        // Normalizar items para visualizaci├│n
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

  }*/


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
    // La respuesta tiene ÔÇ£candidatesÔÇØ u otro formato, depender├í del modelo usado
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
