import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Token on Storage on Init
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Decodify token
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ id: payload.id, name: payload.name, email: payload.email });
    }
  }, []);

  // Login
  const login = (token) => {
    localStorage.setItem("token", token);
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser({ id: payload.id, name: payload.name, email: payload.email });
    navigate("/products");
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
