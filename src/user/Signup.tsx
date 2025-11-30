import {useState} from "react";
import {useNavigate} from 'react-router-dom';
import {signupUser} from "./signupApi";
import {CustomError} from "../model/CustomError";

export function Signup() {
    const [error, setError] = useState({} as CustomError);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        signupUser({username: data.get('login') as string, email: data.get('email') as string, password: data.get('password') as string},
            (result: any) => {
                setMessage('Inscription réussie. Vous pouvez maintenant vous connecter.');
                setError({} as CustomError);
                form.reset();
                navigate('/login');
            }, (err: CustomError) => {
                setError(err);
                setMessage("");
            });
    };

    return (<>
        <form onSubmit={handleSubmit}>
            <input name="login" placeholder="login"/><br/>
            <input name="email" placeholder="email" type="email"/><br/>
            <input name="password" placeholder="password" type="password"/><br/>
            <button type="submit">Inscription</button>
        </form>
        { message && <div>{message}</div> }
        { error && error.message && <div>{error.message}</div> }
    </>);
}

export default Signup;
