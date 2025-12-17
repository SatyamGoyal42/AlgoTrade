import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = location.state?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white rounded shadow-lg p-10 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Cash F.K</h1>
        <p className="text-gray-600 mb-8">
          Sign in with your Google account to access your personalized strategies and data.
        </p>
        <button
          onClick={login}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;

