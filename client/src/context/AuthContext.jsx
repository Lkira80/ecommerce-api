import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000; // timestamp in secs
      if (decoded.exp < now) {
        return null;
      }
      return decoded;
    } catch (err) {
      return null;
    }
  };

  // Token on Storage on Init
  useEffect(() => {
    const token = localStorage.getItem("token");
    const decoded = token ? validateToken(token) : null;
    if (decoded) {
      setUser({ id: decoded.id, name: decoded.name, email: decoded.email });
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const login = (token) => {
    const decoded = validateToken(token);
    if (!decoded) {
      logout();
      return;
    }
    localStorage.setItem("token", token);
    setUser({ id: decoded.id, name: decoded.name, email: decoded.email });
    navigate("/products");
  };

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
