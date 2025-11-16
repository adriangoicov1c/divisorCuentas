import { ViewEventoPage } from './view-evento.page';
describe('ViewEventoPage', () => {
  let page: ViewEventoPage;
  beforeEach(() => {
    page = new ViewEventoPage();
    page.evento = {
      id: 1,
      title: 'Test',
      date: '2025-11-16',
      incluyePropina: false,
      participants: [
        { name: 'Ana', montoApagar: 0, pagado: false },
        { name: 'Luis', montoApagar: 0, pagado: false }
      ],
      items: [
        { id: 1, name: 'A', price: 100, participant: ['Ana'] },
        { id: 2, name: 'B', price: 200, participant: ['Luis'] }
      ]
    };
    page.incluyePropina = false;
  });

  it('should create', () => {
    expect(page).toBeTruthy();
  });

  it('should calculate subtotal', () => {
    expect(page.subtotal()).toBe(300);
  });

  it('should calculate propina', () => {
    expect(page.propina()).toBe(30);
  });

  it('should calculate total', () => {
    expect(page.total()).toBe(300);
    page.incluyePropina = true;
    expect(page.total()).toBe(330);
  });

  it('should calculate total por participante', () => {
    expect(page.getTotalPorParticipante(page.evento.participants[0])).toBe(100);
    expect(page.getTotalPorParticipante(page.evento.participants[1])).toBe(200);
  });

  it('should calculate total asignado', () => {
    page.evento.participants[0].montoApagar = 100;
    page.evento.participants[1].montoApagar = 200;
    expect(page.totalAsignado()).toBe(300);
  });
});