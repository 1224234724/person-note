const api = require('../../utils/api');

Page({
  data: {
    posts: [],
    loading: true,
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    try {
      const posts = await api.get('/api/posts');
      this.setData({
        posts: posts
          .map((p) => ({ ...p, date: (p.created_at || '').slice(0, 10) })),
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  onShareAppMessage() {
    return {
      title: '✦ 我的博客 ✦ 记录学习、技术与生活',
      path: '/pages/index/index',
    };
  },
});
