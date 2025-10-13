export interface ItemBoleta {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface BoletaParseResult {
  items: ItemBoleta[];
  total: number;
  propina: number | null;
  sumaItems: number;
  validacion: boolean;
}


export function parseBoleta(texto: string): BoletaParseResult {

  console.log('Texto OCR:', texto);
  const items: ItemBoleta[] = [];
  let total = 0;
  let propina: number | null = null;
  const regexItemCantidad = /([A-ZÁÉÍÓÚÑa-záéíóúñ()\s]+?)\s+(\d+)\s+(\d{3,6})/g;
  const regexItemSinCantidad = /([A-ZÁÉÍÓÚÑa-záéíóúñ()\s]+?)\s+(\d{3,6})/g;
  const regexTotal = /Total Pagar.*?(\d{3,6})/i;
  const regexPropina = /Propina Sugerida.*?(\d{1,3}[\s]?\d{2,3})/i;

  // Buscar ítems con cantidad y precio
  let match;
  const usados: Set<string> = new Set();
  while ((match = regexItemCantidad.exec(texto)) !== null) {
    const key = `${match.index}`;
    usados.add(key);
    items.push({
      nombre: match[1].trim(),
      cantidad: parseInt(match[2]),
      precio: parseInt(match[3])
    });
  }

  // Buscar ítems con solo nombre y precio (cantidad=1)
  let match2: string[] | null;
  while ((match2 = regexItemSinCantidad.exec(texto)) !== null) {
    // Evitar duplicados (si ya fue capturado por la anterior)
    if (!items.some(item => item.precio === parseInt(match2![2]) && item.nombre === match2![1].trim())) {
      items.push({
        nombre: match2[1].trim(),
        cantidad: 1,
        precio: parseInt(match2[2])
      });
    }
  }

  // Buscar total
  const totalMatch = regexTotal.exec(texto);
  if (totalMatch) {
    total = parseInt(totalMatch[1].replace(/\s/g, ""));
  }

  // Buscar propina
  const propinaMatch = regexPropina.exec(texto);
  if (propinaMatch) {
    propina = parseInt(propinaMatch[1].replace(/\s/g, ""));
  }

  // Sumar los ítems
  const sumaItems = items.reduce((acc, item) => acc + item.precio, 0);
  const validacion = sumaItems === total;

  return { items, total, propina, sumaItems, validacion };
  return { items, total, propina, sumaItems, validacion };
}
