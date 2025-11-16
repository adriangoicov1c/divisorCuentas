import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from './storage.service';

class MockStorage {
  private store: Record<string, any> = {};
  async create() { return this; }
  async get(key: string) { return this.store[key] || null; }
  async set(key: string, value: any) { this.store[key] = value; }
}

describe('StorageService', () => {
  let service: StorageService;
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    service = new StorageService(mockStorage as any);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should get and set events', async () => {
    const events = [{ id: 1, name: 'Test' }];
    await service.setEvents(events);
    const result = await service.getEvents();
    expect(result).toEqual(events);
  });
});