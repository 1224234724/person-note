const api = require('./utils/api');

App({
  globalData: {
    user: null, // { username, nickname, avatar }
  },

  onLaunch() {
    wx.cloud.init({ env: api.ENV });
    // 已登录则静默恢复用户信息
    if (wx.getStorageSync('token')) {
      api
        .get('/api/auth/me')
        .then((user) => {
          this.globalData.user = user;
        })
        .catch(() => wx.removeStorageSync('token'));
    }
  },
});
