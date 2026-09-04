import { GstService } from '../gst.service';
import { GST_THRESHOLDS } from '@fhc/shared';

describe('GstService', () => {
  let service: GstService;

  beforeEach(() => {
    service = new GstService();
  });

  it('should use 40L threshold for Goods seller in MH (general)', () => {
    const result = service.computeGstProximity(BigInt(20_00_000_00), 'goods_seller', 'MH');
    expect(result.proximityPercentage).toBe(50);
  });

  it('should use 20L threshold for Service creator in DL (general)', () => {
    const result = service.computeGstProximity(BigInt(10_00_000_00), 'service_creator', 'DL');
    expect(result.proximityPercentage).toBe(50);
  });

  it('should use 10L threshold for Freelancer in MN (special category)', () => {
    const result = service.computeGstProximity(BigInt(5_00_000_00), 'freelancer', 'MN');
    expect(result.proximityPercentage).toBe(50);
  });

  it('should use 20L threshold for Goods seller in MZ (special category)', () => {
    const result = service.computeGstProximity(BigInt(10_00_000_00), 'goods_seller', 'MZ');
    expect(result.proximityPercentage).toBe(50);
  });

  it('should use service provider threshold for Mixed type', () => {
    const result = service.computeGstProximity(BigInt(10_00_000_00), 'mixed', 'MH');
    expect(result.proximityPercentage).toBe(50);
  });

  describe('Proximity tiers', () => {
    it('should be safe at 50%', () => {
      const result = service.computeGstProximity(BigInt(10_00_000_00), 'service_creator', 'MH');
      expect(result.tier).toBe('safe');
    });

    it('should be watch at 65%', () => {
      const result = service.computeGstProximity(BigInt(13_00_000_00), 'service_creator', 'MH');
      expect(result.tier).toBe('watch');
    });

    it('should be warning at 85%', () => {
      const result = service.computeGstProximity(BigInt(17_00_000_00), 'service_creator', 'MH');
      expect(result.tier).toBe('warning');
    });

    it('should be critical at 96%', () => {
      const result = service.computeGstProximity(BigInt(19_20_000_00), 'service_creator', 'MH');
      expect(result.tier).toBe('critical');
    });

    it('should be crossed at 105%', () => {
      const result = service.computeGstProximity(BigInt(21_00_000_00), 'service_creator', 'MH');
      expect(result.tier).toBe('crossed');
    });
  });

  it('should calculate projected cross date', () => {
    const result = service.computeGstProximity(BigInt(10_00_000_00), 'service_creator', 'MH'); // 10L out of 20L (12m rolling)
    expect(result.projectedCrossDate).not.toBeNull();
    // It's extrapolating 12 more months
    const dt = new Date(result.projectedCrossDate as string);
    const now = new Date();
    const diffMonths = (dt.getFullYear() - now.getFullYear()) * 12 + dt.getMonth() - now.getMonth();
    expect(Math.abs(diffMonths - 12)).toBeLessThanOrEqual(1); // roughly 12 months in future
  });
});
