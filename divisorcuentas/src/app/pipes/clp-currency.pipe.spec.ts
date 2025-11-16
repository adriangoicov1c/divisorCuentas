import { ClpCurrencyPipe } from './clp-currency.pipe';

describe('ClpCurrencyPipe', () => {
  const pipe = new ClpCurrencyPipe();

  it('should format number as CLP currency', () => {
    expect(pipe.transform(123456)).toBe('$123.456');
    expect(pipe.transform('7890')).toBe('$7.890');
  });

  it('should return empty string for null/undefined', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(pipe.transform('abc')).toBe('');
  });
});