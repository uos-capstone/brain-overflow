import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [role, setRole] = useState<'DOCTOR' | 'PATIENT'>('PATIENT');
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleCheckEmail = () => {
        if (!validateEmail(email)) {
            setEmailError('유효한 이메일 형식이 아닙니다.');
            return;
        }

        const dummyUsedEmails = ['test@example.com', 'admin@site.com'];
        if (dummyUsedEmails.includes(email.toLowerCase())) {
            setEmailError('이미 사용 중인 이메일입니다.');
            setEmailChecked(false);
        } else {
            setEmailError('');
            setEmailChecked(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailChecked) {
            alert('이메일 중복 확인을 해주세요.');
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: email,
                    password: password,
                    nickname: nickname,
                    role: role,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || '회원가입 실패');
            }

            alert('회원가입 완료!');
            navigate('/login');
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center px-4 text-white">
            <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
            <div className="w-full max-w-md bg-black/60 p-8 rounded-2xl shadow-2xl border border-gray-700 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block mb-1 text-sm">Email (ID)</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg bg-[#2c2c2c] text-white"
                                placeholder="your@email.com"
                            />
                            <button
                                type="button"
                                onClick={handleCheckEmail}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm"
                            >
                                Check Duplicate
                            </button>
                        </div>
                        {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block mb-1 text-sm">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-[#2c2c2c] text-white"
                        />
                    </div>

                    {/* Nickname */}
                    <div>
                        <label className="block mb-1 text-sm">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-[#2c2c2c] text-white"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block mb-1 text-sm">Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as 'DOCTOR' | 'PATIENT')}
                            className="w-full px-4 py-2 rounded-lg bg-[#2c2c2c] text-white"
                        >
                            <option value="DOCTOR">Doctor</option>
                            <option value="PATIENT">Patient</option>
                        </select>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')} className="text-blue-400 hover:underline">
                        Log In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;