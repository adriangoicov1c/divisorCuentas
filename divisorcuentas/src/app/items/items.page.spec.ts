import { ItemsPage } from './items.page';
describe('ItemsPage', () => {
  let page: ItemsPage;
  beforeEach(() => {
    page = new ItemsPage({} as any);
    page.evento = { items: [], participants: [], id: 1, title: '', date: '', incluyePropina: false } as any;
    page.items = [];
  });

  it('should create', () => {
    expect(page).toBeTruthy();
  });

  it('should add item', () => {
    page.nombreItem = 'Test';
    page.valorItem = 100;
    page.agregarItem();
    expect(page.items.length).toBe(1);
    expect(page.items[0].name).toBe('Test');
    expect(page.items[0].price).toBe(100);
  });

  it('should edit item', () => {
    page.items = [{ id: 1, name: 'A', price: 10, participant: [] }];
    page.indexItemEdit = 0;
    page.nombreItem = 'B';
    page.valorItem = 20;
    page.agregarItem();
    expect(page.items[0].name).toBe('B');
    expect(page.items[0].price).toBe(20);
  });

  it('should delete item', () => {
    page.items = [{ id: 1, name: 'A', price: 10, participant: [] }];
    page.evento.items = [...page.items];
    page.eliminarItem(0);
    expect(page.items.length).toBe(0);
  });

  it('should assign participant', () => {
    page.items = [{ id: 1, name: 'A', price: 10, participant: [] }];
    page.evento.items = [...page.items];
    page.asignarParticipante(0, 'Ana');
    expect(page.items[0].participant).toContain('Ana');
  });
});