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
            {/* 프로젝트 이름 */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-10 tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                BrainOverflow
            </h1>

            {/* 로그인 카드 */}
            <div className="w-full max-w-sm bg-black/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full px-4 py-3 rounded-lg bg-[#2c2c2c] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[#2c2c2c]/90 transition"
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-lg bg-[#2c2c2c] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[#2c2c2c]/90 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-300"
                    >
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
