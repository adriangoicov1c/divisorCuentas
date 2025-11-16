

import { DataService } from './data.service';

// Mock para StorageService
class MockStorageService {
  getEvents() { return Promise.resolve([]); }
  setEvents(events: any[]) { return Promise.resolve(); }
}

describe('DataService', () => {
  it('should be created', () => {
    const service = new DataService(new MockStorageService() as any);
    expect(service).toBeTruthy();
  });
});
