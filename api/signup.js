import { db } from '@vercel/postgres';
import {arrayBufferToBase64, stringToArrayBuffer} from "../lib/base64";

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const {username, password, email} = await request.json();
        if (!username || !password || !email) {
            return new Response(JSON.stringify({code: 'BAD_REQUEST', message: 'Missing fields'}), {
                status: 400,
                headers: {'content-type': 'application/json'},
            });
        }

        const client = await db.connect();
        // check existing username or email
        const {rowCount: ucount} = await client.sql`select 1 from users where username = ${username}`;
        if (ucount > 0) {
            return new Response(JSON.stringify({code: 'CONFLICT', message: 'Username already exists'}), {
                status: 409,
                headers: {'content-type': 'application/json'},
            });
        }
        const {rowCount: ecount} = await client.sql`select 1 from users where email = ${email}`;
        if (ecount > 0) {
            return new Response(JSON.stringify({code: 'CONFLICT', message: 'Email already exists'}), {
                status: 409,
                headers: {'content-type': 'application/json'},
            });
        }

        // hash password using same scheme as login (SHA-256 of username+password)
        const hash = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hash);

        const externalId = crypto.randomUUID().toString();

        const {rowCount, rows} = await client.sql`
            insert into users (username, password, email, created_on, external_id)
            values (${username}, ${hashed64}, ${email}, now(), ${externalId}) returning user_id, username, email, external_id
        `;

        if (rowCount === 1) {
            const created = rows[0];
            return new Response(JSON.stringify({user_id: created.user_id, username: created.username, email: created.email, externalId: created.external_id}), {
                status: 201,
                headers: {'content-type': 'application/json'},
            });
        } else {
            return new Response(JSON.stringify({code: 'ERROR', message: 'Unable to create user'}), {
                status: 500,
                headers: {'content-type': 'application/json'},
            });
        }

    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({code: 'ERROR', message: String(error)}), {
            status: 500,
            headers: {'content-type': 'application/json'},
        });
    }
}
