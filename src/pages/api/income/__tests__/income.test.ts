import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../income';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase');

describe('/api/income', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock, end: vi.fn() }));

    req = {
      method: 'GET',
      body: {},
    };

    res = {
      status: statusMock,
      json: jsonMock,
      setHeader: vi.fn(),
    };
  });

  describe('GET /api/income', () => {
    it('should return all income entries', async () => {
      const mockData = [
        {
          id: '1',
          date: '2025-12-01',
          platform: 'amazon_flex',
          custom_platform_name: null,
          block_start_time: '2025-12-01T10:00:00Z',
          block_end_time: '2025-12-01T14:00:00Z',
          block_length: 240,
          amount: 100,
          notes: '',
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            platform: 'amazon_flex',
            customPlatformName: null, // Check camelCase conversion
          }),
        ])
      );
    });

    it('should handle database errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        }),
      } as any);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Database connection failed'
      });
    });
  });

  describe('POST /api/income', () => {
    beforeEach(() => {
      req.method = 'POST';
    });

    it('should create a new income entry', async () => {
      req.body = {
        date: '2025-12-01',
        platform: 'amazon_flex',
        blockStartTime: '2025-12-01T10:00:00Z',
        blockEndTime: '2025-12-01T14:00:00Z',
        blockLength: 240,
        amount: 100,
      };

      const mockCreated = {
        id: 'new-id',
        date: '2025-12-01',
        platform: 'amazon_flex',
        custom_platform_name: null,
        block_start_time: '2025-12-01T10:00:00Z',
        block_end_time: '2025-12-01T14:00:00Z',
        block_length: 240,
        amount: 100,
        notes: '',
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [mockCreated],
            error: null
          }),
        }),
      } as any);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-id',
          platform: 'amazon_flex',
        })
      );
    });

    it('should reject invalid data with validation error', async () => {
      req.body = {
        date: 'invalid-date',
        platform: 'amazon_flex',
        amount: -100, // Invalid: negative amount
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
        })
      );
    });

    it('should require amount field', async () => {
      req.body = {
        date: '2025-12-01',
        platform: 'amazon_flex',
        // Missing required 'amount' field
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('Method not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      req.method = 'DELETE';
      const endMock = vi.fn();
      res.status = vi.fn(() => ({ end: endMock })) as any;

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST']);
    });
  });
});
