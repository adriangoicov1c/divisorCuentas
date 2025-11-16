
import { describe, it, expect, beforeEach } from 'vitest';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let page: HomePage;
  beforeEach(() => {
    page = new HomePage();
  });

  it('should create', () => {
    expect(page).toBeTruthy();
  });
});
