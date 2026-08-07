// 一次性脚本：把阿里云博客的图片迁移到微信云托管（保持文件名不变）
// 用法（在 server 目录下）：
//   $env:SOURCE_BASE="http://101.132.63.123"; $env:TARGET_BASE="https://xxx.tcloudbase.com"
//   $env:ADMIN_USER="xxx"; $env:ADMIN_PASSWORD="xxx"
//   node scripts/migrate-images.js
const SOURCE = process.env.SOURCE_BASE;
const TARGET = process.env.TARGET_BASE;
const USERNAME = process.env.ADMIN_USER;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!SOURCE || !TARGET || !USERNAME || !PASSWORD) {
  console.error('请先设置环境变量 SOURCE_BASE / TARGET_BASE / ADMIN_USER / ADMIN_PASSWORD');
  process.exit(1);
}

async function login(base) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`登录 ${base} 失败: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

console.log(`源站: ${SOURCE}\n目标: ${TARGET}`);
const [srcToken, dstToken] = await Promise.all([login(SOURCE), login(TARGET)]);
console.log('两边登录成功');

// 从文章正文、摘要、封面里提取所有 /uploads/ 文件引用
const posts = await (await fetch(`${SOURCE}/api/posts`, { headers: { Authorization: `Bearer ${srcToken}` } })).json();
const refs = new Set();
for (const p of posts) {
  for (const field of [p.content, p.summary, p.cover]) {
    for (const m of String(field || '').matchAll(/\/uploads\/[\w.-]+\.(?:png|jpe?g|gif|webp|svg|pdf)/gi)) {
      refs.add(m[0]);
    }
  }
}
console.log(`共发现 ${refs.size} 个文件引用`);

let ok = 0;
let fail = 0;
for (const ref of refs) {
  try {
    const buf = Buffer.from(await (await fetch(SOURCE + ref)).arrayBuffer());
    if (!buf.length) throw new Error('下载到空文件');
    const form = new FormData();
    form.append('file', new Blob([buf]), ref.split('/').pop());
    const up = await fetch(`${TARGET}/api/migrate-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dstToken}` },
      body: form,
    });
    if (!up.ok) throw new Error(`上传失败: ${up.status} ${await up.text()}`);
    ok++;
    console.log(`✅ ${ref}`);
  } catch (err) {
    fail++;
    console.error(`❌ ${ref}: ${err.message}`);
  }
}
console.log(`\n完成：成功 ${ok} 个，失败 ${fail} 个`);
