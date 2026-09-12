import { useState } from "react";
import { login } from "../services/api";

interface LoginProps {
  onLogin: (data: any) => void;
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("manager@test.com");
  const [password, setPassword] = useState("Test1234");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setError("");

      const data = await login(email, password);

      onLogin(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Client Project Dashboard</h1>

        <p>Sign in to continue</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;