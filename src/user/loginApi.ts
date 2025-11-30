import {Session, SessionCallback, ErrorCallback, User} from "../model/common";
import {CustomError} from "../model/CustomError";

export function loginUser(user: User, onResult: SessionCallback, onError: ErrorCallback) {
    fetch("/api/login",
        {
            method: "POST", // ou 'PUT'
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        })
        .then(async (response) => {
            const contentType = response.headers.get('content-type') || '';
            if (response.ok) {
                if (contentType.includes('application/json')) {
                    const session = await response.json() as Session;
                    sessionStorage.setItem('token', session.token);
                    sessionStorage.setItem('externalId', session.externalId);
                    sessionStorage.setItem('username', session.username || "");
                    if (session.id) {
                        sessionStorage.setItem('id', String(session.id));
                    }
                    onResult(session)
                } else {
                    const text = await response.text();
                    onError({message: `Server returned non-JSON response: ${text.substring(0,200)}`} as CustomError);
                }
            } else {
                if (contentType.includes('application/json')) {
                    const error = await response.json() as CustomError;
                    onError(error);
                } else {
                    const text = await response.text();
                    onError({message: `Server error: ${text.substring(0,200)}`} as CustomError);
                }
            }
        }, onError);
}