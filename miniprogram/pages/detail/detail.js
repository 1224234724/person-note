const api = require('../../utils/api');
const markedLib = require('../../utils/marked.js');
const marked = markedLib.marked || markedLib;

Page({
  data: {
    post: null,
    html: '',
    liked: false,
  },

  onLoad({ id }) {
    this._id = id;
    // 检查本地点赞状态
    const likedPosts = wx.getStorageSync('likedPosts') || {};
    api
      .get(`/api/posts/${id}`)
      .then((post) => {
        api.post(`/api/posts/${id}/view`).catch(() => {});
        this.setData({
          post: { ...post, date: (post.created_at || '').slice(0, 10) },
          html: marked.parse(post.content || ''),
          liked: !!likedPosts[id],
        });
        wx.setNavigationBarTitle({ title: post.title });
      })
      .catch((err) => wx.showToast({ title: err.message, icon: 'none' }));
  },

  async toggleLike() {
    const likedPosts = wx.getStorageSync('likedPosts') || {};
    const id = this._id;
    if (likedPosts[id]) {
      wx.showToast({ title: '已经点赞过啦 ❤️', icon: 'none' });
      return;
    }
    try {
      const res = await api.post(`/api/posts/${id}/like`);
      likedPosts[id] = true;
      wx.setStorageSync('likedPosts', likedPosts);
      this.setData({ liked: true, 'post.likes': res.likes });
      wx.showToast({ title: '点赞 +1 ✨', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  onShareAppMessage() {
    const post = this.data.post;
    return {
      title: post ? `✦ ${post.title}` : '文章详情',
      path: post ? `/pages/detail/detail?id=${post.id}` : '/pages/index/index',
    };
  },
});
