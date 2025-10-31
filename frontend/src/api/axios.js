import axios from "axios";

// Use relative URL - works with Vite dev proxy and nginx proxy in Docker
const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;