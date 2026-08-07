const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    user: null,
    logging: false,
    claiming: false,
  },

  onShow() {
    this.setData({ user: app.globalData.user });
  },

  // 微信云托管 callContainer 自动注入 X-WX-OPENID，后端据此识别/注册用户
  async login() {
    if (this.data.logging) return;
    this.setData({ logging: true });
    try {
      const res = await api.post('/api/auth/wx-login');
      wx.setStorageSync('token', res.token);
      app.globalData.user = {
        username: res.username,
        nickname: res.nickname,
        avatar: res.avatar,
        is_admin: res.is_admin,
      };
      this.setData({ user: app.globalData.user, logging: false });
      wx.showToast({ title: '登录成功' });
    } catch (err) {
      this.setData({ logging: false });
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  // 第一个登录的用户可以认领管理员（仅限系统尚无管理员时）
  async claimAdmin() {
    if (this.data.claiming) return;
    this.setData({ claiming: true });
    try {
      const res = await api.post('/api/auth/claim-admin');
      wx.setStorageSync('token', res.token);
      app.globalData.user = { ...app.globalData.user, is_admin: 1 };
      this.setData({ user: app.globalData.user, claiming: false });
      wx.showToast({ title: '已成为管理员' });
    } catch (err) {
      this.setData({ claiming: false });
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          app.globalData.user = null;
          this.setData({ user: null });
        }
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '❖ 我的博客 ❖ 记录学习、技术与生活',
      path: '/pages/index/index',
    };
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },
});
