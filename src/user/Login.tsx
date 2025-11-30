import { useState } from "react";
import { loginUser } from "./loginApi";
import { Session } from "../model/common";
import { CustomError } from "../model/CustomError";
import { useDispatch } from 'react-redux';
import { setSession as setSessionAction } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

export function Login() {
    const [error, setError] = useState({} as CustomError);
    const [localSession, setLocalSession] = useState({} as Session);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const form = event.currentTarget;
        const data = new FormData(form);
        
        loginUser(
            { user_id: -1, username: data.get('login') as string, password: data.get('password') as string },
            (result: Session) => {
                console.log(result);
                setLocalSession(result);
                sessionStorage.setItem('token', result.token);
                sessionStorage.setItem('externalId', result.externalId || '');
                sessionStorage.setItem('username', result.username || "");
                dispatch(setSessionAction({ token: result.token, username: result.username, externalId: result.externalId, id: result.id }));
                form.reset();
                setError(new CustomError(""));
                setLoading(false);
                navigate('/messages');
            },
            (loginError: CustomError) => {
                console.log(loginError);
                setError(loginError);
                setLocalSession({} as Session);
                setLoading(false);
            }
        );
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo">💬</div>
                    <h1>URC Chat</h1>
                    <p>Connect with others instantly</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login">Username</label>
                        <input
                            id="login"
                            name="login"
                            type="text"
                            className="form-input"
                            placeholder="Enter your username"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error.message && <div className="error-message">{error.message}</div>}

                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <a href="/signup" className="link">Sign up here</a></p>
                </div>
            </div>

            <div className="auth-decorations">
                <div className="decoration decoration-1"></div>
                <div className="decoration decoration-2"></div>
                <div className="decoration decoration-3"></div>
            </div>
        </div>
    );
}