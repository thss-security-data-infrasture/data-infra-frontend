# 安全大脑数据底座前端

## 建议环境配置

1. nodejs 16.20.0
2. pnpm 8.2.0
3. vscode + volar 代码高亮
4. prettier 代码格式化（提交之前记得对代码进行格式化，可以装个 vscode 的 prettier 插件）

## 开发

运行以下命令，然后可以在 localhost:5173 看到效果：

```bash
pnpm run dev
```

修改代码后网页会同步更新，无须重启。

如果发现修改确实没有更新，可以先尝试刷新页面。

## 部署

运行以下命令，然后可以在 `dist/` 中看到打包好的前端代码：

```bash
pnpm run build
```

同时，本项目提供了 Dockerfile，可以直接使用 docker 进行部署。

示例如下，以下命令会将项目打包成一个名为 frontend:test 的镜像，并将其部署在服务器的 8080 端口：

```bash
docker build -t frontend:test .
docker run -d -p 8080:80 frontend:test
```
