# 部署指南：GitHub Pages + 自定义域名

## 概览

```
本地代码 → push 到 GitHub → Actions 自动构建 → 发布到 gh-pages 分支 → GitHub Pages 对外服务
                                                                              ↑
                                                              自定义域名 DNS 指向此处
```

---

## 第一步：创建 GitHub 仓库

1. 登录 GitHub，点击右上角 **+** → **New repository**
2. 填写仓库名（如 `mycelia`），选择 **Public**（GitHub Pages 免费版需要公开仓库）
3. **不要**勾选 Initialize README，直接点 **Create repository**

---

## 第二步：推送本地代码

在项目根目录执行：

```bash
git init
git add .
git commit -m "init"
git branch -M master
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin master
```

> 如果本地已有 git 仓库，跳过 `git init`，直接 add remote 和 push。

---

## 第三步：配置 GitHub Actions 自动部署

在项目根目录创建以下文件：

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v4

      - name: Setup Node.js 🔧
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install and Build 🔧
        run: |
          npm install
          npm run build -- --configuration production --base-href /<仓库名>/
          cp dist/<仓库名>/index.html dist/<仓库名>/404.html

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist/<仓库名>
          branch: gh-pages
```

> **为什么需要 404.html？**
> Angular 使用 HTML5 路由，直接访问 `/writing/tju` 时 GitHub Pages 找不到对应文件会返回 404。
> 把 `index.html` 复制为 `404.html` 后，GitHub Pages 对所有未知路径返回这个文件，Angular Router 接管并正确渲染。

将该文件推送到 GitHub：

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
git push
```

推送后 Actions 会自动触发，在 **Actions** 标签页可以看到构建进度，首次约 2~3 分钟。

---

## 第四步：开启 GitHub Pages

1. 进入仓库 → **Settings** → **Pages**
2. **Source** 选择 **Deploy from a branch**
3. **Branch** 选择 `gh-pages`，目录选 `/ (root)`
4. 点击 **Save**

等待约 1 分钟，页面会显示访问地址：`https://<用户名>.github.io/<仓库名>`

---

## 第五步：绑定自定义域名

### 5.1 确定域名类型

| 类型 | 示例 | 推荐场景 |
|------|------|---------|
| 根域名（Apex） | `example.com` | 主站 |
| 子域名 | `www.example.com` / `blog.example.com` | 灵活，推荐 |

### 5.2 添加 DNS 记录

在你的域名注册商/DNS 服务商的控制台操作：

**使用子域名（推荐，如 `www.example.com`）：**

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | `www` | `<你的GitHub用户名>.github.io` |

**使用根域名（`example.com`）：**

需要同时添加 A 记录和 AAAA 记录（IPv6）：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

> DNS 记录生效通常需要几分钟到几小时，取决于服务商。

### 5.3 在 GitHub 填写自定义域名

1. 仓库 → **Settings** → **Pages**
2. **Custom domain** 填入你的域名（如 `www.example.com`）
3. 点击 **Save**，GitHub 会自动验证 DNS

### 5.4 修改 workflow 以支持自定义域名

绑定自定义域名后，`--base-href` 需要改回 `/`（因为域名根路径就是网站根路径），并通过 `cname` 参数让 deploy action 自动写入 `CNAME` 文件：

编辑 `.github/workflows/deploy.yml`，找到 `Install and Build` 和 `Deploy` 步骤，做如下修改：

```yaml
      - name: Install and Build 🔧
        run: |
          npm install
          npm run build -- --configuration production --base-href /   # ← 改回 /
          cp dist/<仓库名>/index.html dist/<仓库名>/404.html

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist/<仓库名>
          branch: gh-pages
          cname: your-domain.com   # ← 填入你的自定义域名
```

推送后重新触发构建即可。

> **为什么需要同时改 `base-href`？**
> 使用 `github.io/<仓库名>` 访问时，Angular 的所有资源请求以 `/<仓库名>/` 为根，所以 base-href 要带仓库名。
> 切换到自定义域名后，网站直接部署在域名根路径，base-href 改回 `/` 即可。

### 5.5 开启 HTTPS

DNS 验证通过后，仓库 Settings → Pages 勾选 **Enforce HTTPS**（GitHub 自动申请并续期 Let's Encrypt 证书）。

---

## 日常更新流程

之后每次更新内容（改 JSON、加照片、改代码）只需：

```bash
git add .
git commit -m "描述改动"
git push
```

Actions 自动构建部署，约 2 分钟后网站更新。

---

## 常见问题

**Q: Actions 构建失败怎么排查？**
仓库 → Actions → 点击失败的 workflow → 展开报错步骤查看日志。最常见原因是 `npm ci` 依赖问题或 TypeScript 编译错误。

**Q: 自定义域名配置后变回 github.io 地址？**
每次 deploy 后 CNAME 文件会被覆盖，确保 workflow 中有 Write CNAME 步骤，且写的域名正确。

**Q: 直接访问某个路由（如 `/writing/tju`）返回 404？**
确认 workflow 中有 `cp index.html 404.html` 这一步，重新触发构建。
