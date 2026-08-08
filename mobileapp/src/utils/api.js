import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 你的后端地址（阿里云服务器）
// 如果有域名就填域名，没有就填 http://服务器IP:3001
const BASE_URL = 'http://101.132.63.123:3001';

const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// 自动带 token
http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default {
  get: (path) => http.get(path).then((r) => r.data),
  post: (path, data) => http.post(path, data).then((r) => r.data),
  put: (path, data) => http.put(path, data).then((r) => r.data),
  del: (path) => http.delete(path).then((r) => r.data),
};
