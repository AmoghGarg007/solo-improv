import { useEffect } from "react";

function Login() {
  useEffect(() => {
    document.title = "Login | Connectify";
  }, []);
  return (
    <div className="login-page">

      <div className="login-card glass">

        <h2>Welcome Back</h2>
        <p className="login-subtext">
          Sign in to continue to Connectify
        </p>

        <form className="login-form">

          <input
            type="email"
            placeholder="Email"
          />

          <input
            type="password"
            placeholder="Password"
          />

          <button type="submit">
            Login
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;