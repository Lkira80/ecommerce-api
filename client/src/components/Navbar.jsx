import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav>
      <Link to="/">Home</Link> |{" "}
      <Link to="/products">Products</Link> |{" "}
      {user && <Link to="/cart">Cart</Link>} |{" "}
      {user && <Link to="/orders">Orders</Link>}

      {user ? (
        <>
          {" | "}
          <span>Welcome {user.name}</span>
          {" | "}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          {" | "}
          <Link to="/login">Login</Link>
          {" | "}
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;


