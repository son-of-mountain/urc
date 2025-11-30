import {CustomError} from "../model/CustomError";

export function signupUser(user: {username: string, email: string, password: string}, onResult: (r:any)=>void, onError: (e:CustomError)=>void) {
    fetch('/api/signup', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(user)
    }).then(async response => {
        const contentType = response.headers.get('content-type') || '';
        if (response.ok) {
            if (contentType.includes('application/json')) {
                const result = await response.json();
                onResult(result);
            } else {
                const text = await response.text();
                onError({message: `Server returned non-JSON response: ${text.substring(0,200)}`} as CustomError);
            }
        } else {
            if (contentType.includes('application/json')) {
                const err = await response.json();
                onError(err);
            } else {
                const text = await response.text();
                onError({message: `Server error: ${text.substring(0,200)}`} as CustomError);
            }
        }
    }).catch(e => onError({message: String(e)} as CustomError));
}

export default signupUser;
