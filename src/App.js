import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Login } from './user/Login';
import Signup from './user/Signup';

function App() {
  return (
    <BrowserRouter>
      <div style={{padding:10}}>
        <nav>
          <Link to="/login">Login</Link> | <Link to="/signup">Signup</Link>
        </nav>
      </div>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/" element={<Login/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
