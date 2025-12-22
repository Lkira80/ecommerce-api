import { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function OAuthSuccess() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      login(token);
      setTimeout(() => navigate("/products"), 500);
    } else {
      navigate("/login");
    }
  }, []);

  return <p>Redirecting...</p>;
}

export default OAuthSuccess;
