import request from 'supertest';
import express from 'express';
import health from '../src/routes/health';

describe('Health endpoints', () =>
{
    const app = express();
    app.use('/api/health', health);

    it('GET /api/health/live returns ok', async () =>
    {
        const res = await request(app).get('/api/health/live');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
    });
});
