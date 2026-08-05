import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request } from './api.js';

// 兜底默认值：接口未返回时页面依然有内容
export const SITE_DEFAULTS = {
  site_name: '我的博客',
  nickname: '博主',
  slogan: '记录学习、技术与生活',
  motto: '输出是最好的输入',
  identity: '前端开发学习者 / 终身学习者',
  intro: '你好，欢迎来到我的个人博客！',
  hero_title: '你好，欢迎来到我的博客 👋',
  hero_desc: '这里记录我的学习笔记、技术总结和生活随笔。',
  typing_words: '记录学习、技术与生活 ✦',
  gitee: '',
  email: '',
  location: '',
  job_title: '',
  job_status: '',
};

const SiteContext = createContext(SITE_DEFAULTS);

export function SiteProvider({ children }) {
  const [site, setSite] = useState(SITE_DEFAULTS);

  const load = useCallback(() => {
    return request('/site')
      .then((data) => setSite({ ...SITE_DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <SiteContext.Provider value={{ ...site, reloadSite: load }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
