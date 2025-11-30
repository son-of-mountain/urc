import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './user/Login';
import Signup from './user/Signup';
import Messages from './pages/Messages';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSession } from './store/authSlice';

function App() {
  const dispatch = useDispatch();

  // Load session from sessionStorage on app init
  useEffect(() => {
    const session = sessionStorage.getItem('session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        dispatch(setSession(parsed));
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/messages" element={<Messages/>} />
        <Route path="/messages/:userId" element={<Messages/>} />
        <Route path="/" element={<Login/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
