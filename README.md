# 个人博客系统（Person Note）

一个前后端分离的个人博客，包含前台展示、后台内容管理与自动化部署流水线，已上线运行于阿里云服务器。

- 仓库地址：[Gitee](https://gitee.com/wangyu-0312/person-note) / [GitHub](https://github.com/1224234724/person-note)

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19、Vite 6、Tailwind CSS 4、react-router-dom 7、react-markdown / remark-gfm / rehype-highlight |
| 后端 | Node.js、Express、mysql2、JWT、bcryptjs、Multer |
| 数据库 | MySQL 8.0 |
| 部署 | Docker、Docker Compose、Nginx、GitHub Actions、Docker Hub |

## 项目描述（简历版）

**个人博客系统（前后端分离 + Docker 容器化部署 + CI/CD 自动化）**

独立设计并开发的全栈个人博客系统，包含前台展示、后台内容管理与自动化部署流水线，已上线运行于阿里云服务器。

### 核心工作与成果

- **前台开发**：基于 React 实现文章列表、Markdown 渲染（支持代码高亮 / GFM 表格）、TOC 目录导航、评论与留言板；使用 Canvas 实现粒子网络、樱花爆裂、鼠标星轨等动画特效，支持暗色模式全站切换
- **后端开发**：基于 Node.js + Express + MySQL 设计 RESTful API，实现 JWT 无状态鉴权、bcrypt 密码加密、文章 / 评论 / 留言 CRUD、阅读量与点赞统计；设计 key-value 结构的站点配置表，实现全站文案后台动态配置、免发布即时生效
- **文件服务**：基于 Multer 实现图片上传（Markdown 编辑器集成）与 PDF 简历上传 / 在线预览 / 下载，包含文件类型校验、大小限制与旧文件自动清理
- **容器化部署**：编写多阶段 Dockerfile（Node 构建 + Nginx 托管反代）与 Docker Compose 编排（Nginx / Node / MySQL 三服务），通过数据卷持久化数据库与上传文件，健康检查保障服务依赖顺序
- **CI/CD 流水线**：基于 GitHub Actions 搭建自动化发布流程——代码推送自动触发镜像构建、推送 Docker Hub、打包传输至服务器并滚动更新，单次发布约 3 分钟，实现提交即上线
- **网络问题攻坚**：针对国内服务器无法直连 Docker Hub、公共镜像加速器不代理个人镜像的问题，设计「Runner 构建打包 + SCP 直传 + 容器内导入」的部署方案，打通自动化上线最后一公里

### 精简版

- 独立开发前后端分离博客：React 实现 Markdown 渲染、TOC、暗色模式与 Canvas 动画特效；Node.js / Express 提供 RESTful API，JWT 鉴权、站点配置动态化、文件上传与简历在线预览
- Docker Compose 编排 Nginx / Node / MySQL 三服务容器化部署，多阶段构建镜像，数据卷持久化
- 搭建 GitHub Actions CI/CD 流水线，实现「推送代码 → 自动构建 → 自动部署上线」，单次发布约 3 分钟
- 针对国内网络环境设计镜像 SCP 直传方案，解决服务器无法拉取 Docker Hub 镜像的问题

## 主要功能

- 文章管理：Markdown 编辑器（工具栏 + 分栏实时预览 + 草稿自动保存 + 图片上传）、难度分级、封面图、阅读 / 点赞统计
- 互动：评论、弹幕式评论、留言板
- 站点配置：昵称 / 标语 / 打字机文案 / 地点 / 职业 / 求职状态等全部存库，后台修改即时生效
- 简历：后台上传 PDF，首页弹窗预览（iframe）+ 下载
- 视觉：粒子网络、点击樱花爆裂、鼠标星轨、樱花飘落、流光文字、玻璃拟态、暗色模式

## 部署架构

```
浏览器 :80 → Nginx(client) ──静态文件──→ 前端页面
                  ├── /api/*     → server:3001 (Node)
                  └── /uploads/* → server:3001 (图片/简历)
                                      └── mysql:3306
```

### CI/CD 流程

```
git push master → 同步 Gitee + GitHub
→ GitHub Actions 构建镜像 → 推送 Docker Hub
→ docker save 打 tar 包 → SCP 传到服务器
→ docker load → docker compose up -d 上线
```

### 服务器要求

- 已安装 Docker 与 Compose 插件
- `/opt/blog` 目录放置 `docker-compose.yml` 与 `.env`（参考 `.env.example`）
- `/etc/docker/daemon.json` 配置阿里云专属镜像加速器（mysql 等官方镜像走加速器拉取）

## 本地开发

```bash
# 后端（需本地 MySQL，默认 root/root）
cd server
npm install
npm run dev        # http://localhost:3001

# 前端
cd client
npm install
npm run dev        # http://localhost:5173，/api 与 /uploads 自动代理到后端
```

## 数据备份

```bash
docker compose exec -T mysql mysqldump -uroot -p"$DB_PASSWORD" person_note_blog > backup.sql
```
