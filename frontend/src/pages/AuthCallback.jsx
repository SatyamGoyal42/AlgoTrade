import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { finishLogin } = useAuth();

  useEffect(() => {
    const hash = location.hash.startsWith("#") ? location.hash.substring(1) : location.hash;
    const params = new URLSearchParams(hash);
    const stateParam = params.get("state");

    if (!stateParam) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const payload = JSON.parse(stateParam);
      finishLogin(payload);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to parse auth callback payload", error);
      navigate("/login", { replace: true });
    }
  }, [finishLogin, location.hash, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-8 rounded shadow text-gray-700">
        Completing sign in...
      </div>
    </div>
  );
};

export default AuthCallback;

