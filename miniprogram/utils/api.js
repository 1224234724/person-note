// 微信云托管环境 ID 与服务名
const ENV = 'prod-d8g4q0rcka88b4911';
const SERVICE = 'express-k1zs';

function request({ path, method = 'GET', data }) {
  const token = wx.getStorageSync('token');
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: ENV },
      path,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'X-WX-SERVICE': SERVICE,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        console.log('[api]', method, path, res.statusCode, res.data);
        if (res.statusCode >= 400) {
          reject(new Error((res.data && res.data.error) || `请求失败(${res.statusCode})`));
        } else {
          resolve(res.data);
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络错误')),
    });
  });
}

module.exports = {
  ENV,
  get: (path) => request({ path }),
  post: (path, data) => request({ path, method: 'POST', data }),
  put: (path, data) => request({ path, method: 'PUT', data }),
  del: (path) => request({ path, method: 'DELETE' }),
};
