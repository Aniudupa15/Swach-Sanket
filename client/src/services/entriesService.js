<<<<<<< HEAD
import api from "./api";

// 🧩 GET /api/entries?dateKey=YYYY-MM-DD
export const getEntryByDate = async (dateKey) => {
  try {
    const res = await api.get(`/api/entries?dateKey=${dateKey}`);
    return res.data.entry || { dateKey, data: {} };
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    throw error;
  }
=======
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
});

// 🧩 GET /api/entries?dateKey=YYYY-MM-DD
export const getEntryByDate = async (dateKey) => {
  const res = await axios.get(`${API_BASE}api/entries?dateKey=${dateKey}`, {
    headers: getAuthHeaders(),
  });
  return res.data.entry || { dateKey, data: {} };
>>>>>>> d078685db948fbf793c5b85b249f81e55f7e2658
};

// 🧩 PUT /api/entries/:dateKey
export const upsertEntry = async (dateKey, data) => {
<<<<<<< HEAD
  try {
    const res = await api.put(`/api/entries/${dateKey}`, { data });
    return res.data.entry;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    throw error;
  }
=======
  const res = await axios.put(
    `${API_BASE}/api/entries/${dateKey}`,
    { data },
    { headers: getAuthHeaders() }
  );
  return res.data.entry;
>>>>>>> d078685db948fbf793c5b85b249f81e55f7e2658
};

// 🧩 DELETE /api/entries/:dateKey
export const deleteEntryByDate = async (dateKey) => {
<<<<<<< HEAD
  try {
    const res = await api.delete(`/api/entries/${dateKey}`);
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    throw error;
  }
=======
  const res = await axios.delete(`${API_BASE}api/entries/${dateKey}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
>>>>>>> d078685db948fbf793c5b85b249f81e55f7e2658
};

// 🧩 GET /api/entries/history?limit=30
export const getEntriesHistory = async (limit = 30) => {
<<<<<<< HEAD
  try {
    const res = await api.get(`/api/entries/history?limit=${limit}`);
    return res.data.entries || [];
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    throw error;
  }
=======
  const res = await axios.get(`${API_BASE}api/entries/history?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return res.data.entries || [];
>>>>>>> d078685db948fbf793c5b85b249f81e55f7e2658
};
