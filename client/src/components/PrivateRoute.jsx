import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";


function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);

  const isTokenValid = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  return user && isTokenValid() ? children : <Navigate to="/login" />;
}

export default PrivateRoute;

