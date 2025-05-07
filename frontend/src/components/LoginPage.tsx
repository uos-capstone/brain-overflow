import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 간단한 로그인 로직 (실제 앱에서는 인증 API 호출)
        // if (username === 'admin' && password === '1234') {
            onLogin();
            navigate('/generator');
        // } else {
        //     alert('Invalid credentials');
        // }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>Login</h1>
            <form onSubmit={handleSubmit} style={{ display: 'inline-block' }}>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" /><br />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" /><br />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;