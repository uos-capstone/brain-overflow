// 로그인
export async function login(
  username: string,
  password: string
): Promise<{ token: string; userId: string }> {
  const res = await fetch(
    "https://api-brain-overflow.unknownpgr.com/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }
  );

  if (!res.ok) throw new Error("인증 실패");

  const data = await res.json();
  return {
    token: data.data.token,
    userId: data.data.userId,
  };
}

// 회원가입
export interface SignupPayload {
  username: string;
  password: string;
  nickname: string;
  role: "DOCTOR" | "PATIENT";
}

export async function signup(data: SignupPayload): Promise<void> {
  const response = await fetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "회원가입 실패");
  }
}
