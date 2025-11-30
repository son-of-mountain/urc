import {getConnecterUser, triggerNotConnected} from "../lib/session";
import { Redis } from '@upstash/redis';
import { sql } from '@vercel/postgres';
const PushNotifications = require("@pusher/push-notifications-server");

const redis = Redis.fromEnv();

export default async (request, response) => {
    try {
        const user = await getConnecterUser(request);
        if (user === undefined || user === null) {
            console.log("Not connected");
            triggerNotConnected(response);
            return;
        }

        if (request.method === 'POST') {
            const body = await request.json();
            // expected body: {type: 'user'|'room', targetId, content}
            const {type, targetId, content} = body;
            if (!type || !targetId || !content) {
                return response.status(400).json({code: 'BAD_REQUEST', message: 'Missing fields'});
            }

            let key;
            if (type === 'user') {
                const id1 = Number(user.id || user.id);
                const id2 = Number(targetId);
                const a = Math.min(id1, id2);
                const b = Math.max(id1, id2);
                key = `messages:user:${a}:${b}`;
            } else {
                key = `messages:room:${targetId}`;
            }

            const msg = {from: user.id, username: user.username, content: content, ts: new Date().toISOString()};
            await redis.lpush(key, JSON.stringify(msg));
            // keep messages for 24h
            await redis.expire(key, 24 * 3600);

            // send push if pusher configured and type is user
            try {
                if (process.env.PUSHER_INSTANCE_ID && process.env.PUSHER_SECRET_KEY && type === 'user') {
                    // fetch target external id from postgres
                    const {rowCount, rows} = await sql`select external_id from users where user_id = ${targetId}`;
                    if (rowCount === 1) {
                        const targetExternal = rows[0].external_id;
                        const beamsClient = new PushNotifications({
                            instanceId: process.env.PUSHER_INSTANCE_ID,
                            secretKey: process.env.PUSHER_SECRET_KEY,
                        });
                        await beamsClient.publishToUsers([targetExternal], {
                            web: {
                                notification: {
                                    title: user.username,
                                    body: content,
                                    ico: "https://www.univ-brest.fr/themes/custom/ubo_parent/favicon.ico",
                                    deep_link: "",
                                },
                                data: {from: user.id}
                            }
                        });
                    }
                }
            } catch (e) {
                console.log('Push error', e);
            }

            return response.send('OK');
        } else if (request.method === 'GET') {
            // read query params to identify conversation
            const url = new URL(request.url);
            const type = url.searchParams.get('type');
            const targetId = url.searchParams.get('targetId');
            if (!type || !targetId) {
                return response.status(400).json({code: 'BAD_REQUEST', message: 'Missing query params'});
            }
            let key;
            if (type === 'user') {
                const id1 = Number(user.id || user.id);
                const id2 = Number(targetId);
                const a = Math.min(id1, id2);
                const b = Math.max(id1, id2);
                key = `messages:user:${a}:${b}`;
            } else {
                key = `messages:room:${targetId}`;
            }

            // return last 100 messages
            const values = await redis.lrange(key, 0, 100);
            const messages = (values || []).map(v => {
                try { return JSON.parse(v); } catch (e) { return v; }
            }).reverse();
            return response.json(messages);
        } else {
            return response.status(405).json({code: 'METHOD_NOT_ALLOWED'});
        }

    } catch (error) {
        console.log(error);
        response.status(500).json(error);
    }
};
