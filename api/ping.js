import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const result = { 
        postgres: { ok: false, error: null }, 
        redis: { ok: false, error: null, url: process.env.KV_REST_API_URL || 'MISSING' },
        manual: { ok: false, status: null, error: null },
        envCheck: {
            url: process.env.KV_REST_API_URL ? 'Present' : 'Missing',
            token: process.env.KV_REST_API_TOKEN ? 'Present' : 'Missing'
        }
    };
    // Test Postgres
    try {
        const client = await db.connect();
        // simple quick query
        const { rowCount } = await client.sql`select 1 as ok`;
        if (rowCount >= 0) result.postgres.ok = true;
    } catch (e) {
        result.postgres.error = String(e.message || e);
    }

    // Test Redis via client
    try {
        const redis = new Redis({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
        await redis.get('__ping_check__');
        result.redis.ok = true;
    } catch (e) {
        result.redis.error = String(e.message || e);
    }

    // Manual fetch test (helps diagnose network vs client lib)
    try {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            const pingUrl = process.env.KV_REST_API_URL + '/ping';
            const resp = await fetch(pingUrl, {
                headers: { 'Authorization': 'Bearer ' + process.env.KV_REST_API_TOKEN }
            });
            result.manual.status = resp.status;
            if (resp.ok) {
                result.manual.ok = true;
            } else {
                result.manual.error = 'HTTP ' + resp.status;
            }
        } else {
            result.manual.error = 'Missing KV_REST_API_URL or KV_REST_API_TOKEN';
        }
    } catch (e) {
        result.manual.error = String(e.message || e);
    }

    return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });
}
