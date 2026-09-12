import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || ""
  );

  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const handleLogin = (data: any) => {
    localStorage.setItem(
      "accessToken",
      data.accessToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setToken(data.accessToken);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      token={token}
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default App;