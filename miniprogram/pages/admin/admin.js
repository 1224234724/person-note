const api = require('../../utils/api');

Page({
  data: {
    stats: null,
    messages: [],
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    try {
      const [stats, messages] = await Promise.all([api.get('/api/stats'), api.get('/api/messages')]);
      this.setData({
        stats,
        messages: messages.slice(0, 50).map((m) => ({
          ...m,
          date: (m.created_at || '').slice(0, 16).replace('T', ' '),
        })),
      });
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  deleteMsg(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除这条留言？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.del(`/api/messages/${id}`);
          wx.showToast({ title: '已删除' });
          this.load();
        } catch (err) {
          wx.showToast({ title: err.message, icon: 'none' });
        }
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '🛡 管理后台',
      path: '/pages/admin/admin',
    };
  },
});
