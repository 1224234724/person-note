const api = require('../../utils/api');

Page({
  data: {
    messages: [],
    nickname: '',
    content: '',
    sending: false,
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    try {
      const messages = await api.get('/api/messages');
      this.setData({
        messages: messages.map((m) => ({
          ...m,
          date: (m.created_at || '').slice(0, 16).replace('T', ' '),
        })),
      });
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  async send() {
    const { nickname, content, sending } = this.data;
    if (sending) return;
    if (!nickname.trim() || !content.trim()) {
      return wx.showToast({ title: '昵称和留言不能为空', icon: 'none' });
    }
    this.setData({ sending: true });
    try {
      await api.post('/api/messages', { nickname: nickname.trim(), content: content.trim() });
      this.setData({ content: '', sending: false });
      wx.showToast({ title: '留言成功' });
      this.load();
    } catch (err) {
      this.setData({ sending: false });
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: '✦ 留言板 ✦ 来留句话吧～',
      path: '/pages/messages/messages',
    };
  },
});
