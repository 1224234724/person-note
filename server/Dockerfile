FROM node:20-alpine

WORKDIR /app

COPY . .

# 若代码包里已带 node_modules（云托管代码包部署）则跳过安装；
# 否则走 npm ci（阿里云 CI/CD 从 git 构建时走这条路）
RUN if [ ! -d node_modules ]; then \
      npm config set registry https://registry.npmmirror.com \
      && npm ci --omit=dev; \
    fi

EXPOSE 3001
CMD ["node", "src/index.js"]
