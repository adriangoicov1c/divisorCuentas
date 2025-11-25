import { Component, inject, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  /*
  const azureEndpoint = environment.azure?.endpoint ?? '';
  const azureApiKey = environment.azure?.apiKey ?? '';
  const azureModel = environment.azure?.model ?? '';
  const azureDeployment = environment.azure?.deployment ?? '';
  const azureApiVersion = environment.azure?.apiVersion ?? '2024-04-01-preview';


  const options = { endpoint: azureEndpoint, apiKey: azureApiKey, deployment: azureDeployment, apiVersion: azureApiVersion, dangerouslyAllowBrowser: true}
      
  const client = new AzureOpenAI(options);*/

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [ // Dependencias generales
    FormsModule, NgForOf, RouterModule, CommonModule, ClpCurrencyPipe,
    
    // Componentes de Ionic (¡Asegúrate que todos estén!)
    IonModal, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput,
    IonFab, IonFabButton, IonFooter, IonText, IonSpinner,
    
    // 🚨 FALTANTES
    IonList, IonCardHeader, IonCardContent, IonCardTitle, IonCard, IonNote]
})
export class ItemsPage implements OnInit {

  @ViewChild(IonContent) content?: IonContent;
  public nombreItem: string | null = null;
  public valorItem: number | null = null;
  showModal: boolean = false;
  openModal: boolean = false;
  public indexItemEdit: number | null = null;
  image: string | undefined = '';
  constructor() { }
  recognizedText: string = '';
  private actionSheet = inject(ActionSheetController);
  private cdr = inject(ChangeDetectorRef);
  


  

    /**
     * Abre la cámara o la galería según la elección.
     * choice: 'camera' | 'gallery' — si es undefined se usa CAMERA por defecto
     */
    async abrirCamaraOGaleria(choice:number) {
      try {
        // Usar Capacitor Camera si est├í disponible
        // Si choice no est├í definido, usamos CameraSource.Prompt para que
        // el sistema muestre la opci├│n nativa (C├ímara / Galer├¡a)
        const source = choice === 1 ? CameraSource.Camera : CameraSource.Photos ;
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

  private azureEndpoint: string = '';
  private azureApiKey: string = '';
  private azureModel: string = '';
  private azureDeployment: string = '';
  private azureApiVersion: string = '';
  private client: AzureOpenAI | null = null; //


  ngOnInit() {


    this.azureEndpoint = "https://adria-mi7zki2g-eastus2.cognitiveservices.azure.com/";
    this.azureApiKey = "6OZ1lONsrdQbIhTW2aSvz6iSXuoLlOvun3Pe34jeJZMF6hh6mIzQJQQJ99BKACHYHv6XJ3w3AAAAACOGFrqS";
    this.azureModel = "gpt-5.1-chat";
    this.azureDeployment = "gpt-5.1-chat";
    this.azureApiVersion = "2024-04-01-preview";
    // 2. Inicializa el cliente AHORA, no al cargar el archivo


    const options = { 
      endpoint: this.azureEndpoint, 
      apiKey: this.azureApiKey, 
      deployment: this.azureDeployment, 
      apiVersion: this.azureApiVersion, 
      dangerouslyAllowBrowser: true
    };

    this.client = new AzureOpenAI(options);
    
    const id = Number(this.route.snapshot.paramMap.get('eventoId'));
    
    const evento = this.data.getEventById(id);
    if (evento) {
      this.evento = evento;
      this.items = this.evento.items ?? [];
    } else {
      // Si no encuentra el evento, intentar recargar los eventos
      console.warn(`Evento con ID ${id} no encontrado. Intentando recargar...`);
      this.data.loadEvents().then(() => {
        const eventoRetry = this.data.getEventById(id);
        if (eventoRetry) {
          this.evento = eventoRetry;
          this.items = this.evento.items ?? [];
        } else {
          console.error(`Evento con ID ${id} no encontrado después de recargar`);
        }
      });
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

      
      

      const response = await this.client!.chat.completions.create({
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
            model: this.azureModel
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
        
        
    }


  openAddModal() {
    this.showModal = true;
    
  }



  closeModal() {
    this.showModal = false;
    this.nuevoNombre = '';
    this.valorItem = null;
    this.indexItemEdit = null;
    this.cdr.detectChanges();
  }





  asignarParticipante(index: number, participante: string) {
    this.items[index].participant.push(participante);
    if (this.evento) {
      this.evento.items = [...this.items];
      this.data.saveEvents();
    }
  }
}
