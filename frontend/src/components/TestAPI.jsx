import React, { useEffect, useState } from "react";
import api from "../api/axios";

const TestAPI = () => {
    const [message, setMessage] = useState("");
    useEffect(() => {
        api.get("/test")
        .then((response) => {
            setMessage(response.data.message);
        })
        .catch((error) => {
            console.error("There was an error connecting with backend!", error);
            setMessage("Error connecting to backend");
        });
    }, []);
    return (
        <div className="p-6 text-center">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Backend Connection Test</h2>
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  );

}

export default TestAPI;
