import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./../util/auth";
import { connectStomp } from "./../util/socket";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { token, userId } = await login(username, password);

      connectStomp(
        token,
        userId,
        () => {
          onLogin();
          navigate("/generator");
        },
        (error) => {
          console.error("❌ STOMP 연결 실패:", error);
        }
      );
    } catch (err) {
      const errorElem = document.getElementById("loginError");
      if (errorElem) {
        errorElem.textContent =
          "로그인에 실패했습니다. 아이디/비밀번호를 확인하세요.";
      }
      console.error(err);
    }
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
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#2c2c2c] text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          Don't have an account?{" "}
          <button
            className="text-blue-400 hover:underline ml-1"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
        </div>
      </div>
      <div id="loginError" className="text-red-500 mt-4 text-sm" />
    </div>
  );
};

export default LoginPage;
