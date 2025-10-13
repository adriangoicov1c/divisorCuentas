import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf,  CommonModule } from '@angular/common';
import { ClpCurrencyPipe } from '../pipes/clp-currency.pipe';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { IonSpinner } from '@ionic/angular/standalone';
import { IonText } from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataService, Evento, Items } from '../services/data.service';
import {  BoletaParseResult } from '../../utils/boleta-parser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonInput, 
    FormsModule, NgForOf, RouterModule,  CommonModule, ClpCurrencyPipe,
    IonText, IonSpinner
  ]
})
export class ItemsPage implements OnInit {
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
