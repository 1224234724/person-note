const skills = ['JavaScript', 'React', 'Node.js', 'MySQL', 'HTML/CSS'];

export default function About() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">关于我</h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-900 to-gray-600 text-white flex items-center justify-center text-3xl font-bold shrink-0">
          我
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-900">博主昵称</h2>
          <p className="text-sm text-gray-400 mt-0.5">前端开发学习者 / 终身学习者</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            你好，欢迎来到我的个人博客！这里记录我的学习笔记、技术总结和生活随笔。
            相信输出是最好的输入，写下来才能真正想明白。
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        <h2 className="font-semibold text-gray-900 mb-3">技术栈</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* About this blog */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 markdown-body">
        <h2>关于这个博客</h2>
        <ul>
          <li>前端：React + Vite + Tailwind CSS</li>
          <li>后端：Node.js + Express + JWT</li>
          <li>数据库：MySQL</li>
        </ul>
        <p>这个博客从零开始自主开发，从数据库设计到页面渲染全程自己实现。</p>

        <h2>联系方式</h2>
        <ul>
          <li>GitHub：（填上你的链接）</li>
          <li>邮箱：（填上你的邮箱）</li>
        </ul>
      </div>
    </div>
  );
}
