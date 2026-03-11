import axios from "axios";

export const api = axios.create({
  baseURL: "http://192.168.100.143:3000",
  withCredentials: true,
});
