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
        <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-10 tracking-wide drop-shadow">
                BrainOverflow
            </h1>

            <div className="w-full max-w-sm bg-black/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#2c2c2c] text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#2c2c2c] text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition"
                    >
                        Log In
                    </button>
                </form>

                <div className="text-center mt-6 text-sm text-gray-400">
                    Don't have an account?{' '}
                    <button
                        className="text-blue-400 hover:underline ml-1"
                        onClick={() => navigate('/signup')}
                    >
                        Sign up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;