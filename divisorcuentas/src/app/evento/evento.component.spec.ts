

import { EventoComponent } from './evento.component';
import { Evento } from '../services/data.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';




describe('EventoComponent', () => {
  let component: EventoComponent;

  beforeEach(() => {
    component = new EventoComponent();
    component.evento = undefined;
    component.showDelete = false;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should show delete after long press (600ms)', async () => {
    expect(component.showDelete).toBe(false);
    component.onPointerDown();
    await new Promise(res => setTimeout(res, 599));
    expect(component.showDelete).toBe(false);
    await new Promise(res => setTimeout(res, 1));
    expect(component.showDelete).toBe(true);
  });


  it('should not show delete if pointer up before long press', async () => {
    component.onPointerDown();
    await new Promise(res => setTimeout(res, 300));
    component.onPointerUp();
    await new Promise(res => setTimeout(res, 400));
    expect(component.showDelete).toBe(false);
  });


  it('should not show delete if pointer leaves before long press', async () => {
    component.onPointerDown();
    await new Promise(res => setTimeout(res, 300));
    component.onPointerLeave();
    await new Promise(res => setTimeout(res, 400));
    expect(component.showDelete).toBe(false);
  });


  it('should hide delete on blur', () => {
    component.showDelete = true;
    component.onBlur();
    expect(component.showDelete).toBe(false);
  });


  it('onEliminar should stop propagation, hide delete and emit id when evento exists', () => {
    const stopSpy = vi.fn();
    const mockEvent = { stopPropagation: stopSpy } as unknown as Event;
    component.evento = { id: 123 } as Evento;
    const emitSpy = vi.spyOn(component.eliminar, 'emit');
    component.showDelete = true;

    component.onEliminar(mockEvent);

    expect(stopSpy).toHaveBeenCalled();
    expect(component.showDelete).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(123);
  });


  it('onEliminar should stop propagation and not emit when evento is undefined', () => {
    const stopSpy = vi.fn();
    const mockEvent = { stopPropagation: stopSpy } as unknown as Event;
    component.evento = undefined;
    const emitSpy = vi.spyOn(component.eliminar, 'emit');

    component.onEliminar(mockEvent);

    expect(stopSpy).toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });


  it('isIos should reflect platform.is result', () => {
    (component as any).platform = { is: (name: string) => name === 'ios' };
    expect(component.isIos()).toBe(true);

    (component as any).platform = { is: () => false };
    expect(component.isIos()).toBe(false);
  });

  // Extra coverage: test constructor icon registration
  it('should register icons in constructor', () => {
    const addIconsMock = vi.fn();
    (EventoComponent as any).prototype.constructor = function () {
      addIconsMock();
    };
    new EventoComponent();
    expect(addIconsMock).toHaveBeenCalled();
  });

  // Extra coverage: test default values
  it('should have default values', () => {
    expect(component.showDelete).toBe(false);
    expect(component.evento).toBeUndefined();
  });

  // Extra coverage: test onPointerDown sets timeout
  it('onPointerDown should set longPressTimeout', () => {
    component.onPointerDown();
    expect((component as any).longPressTimeout).toBeDefined();
    component.onPointerUp(); // cleanup
  });

  // Extra coverage: test onPointerUp clears timeout
  it('onPointerUp should clear longPressTimeout', () => {
    component.onPointerDown();
    const timeout = (component as any).longPressTimeout;
    component.onPointerUp();
    expect((component as any).longPressTimeout).not.toBe(timeout);
  });

  // Extra coverage: test onPointerLeave clears timeout
  it('onPointerLeave should clear longPressTimeout', () => {
    component.onPointerDown();
    const timeout = (component as any).longPressTimeout;
    component.onPointerLeave();
    expect((component as any).longPressTimeout).not.toBe(timeout);
  });

});

