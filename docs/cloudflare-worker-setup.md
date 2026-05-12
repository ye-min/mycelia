# Cloudflare Worker 部署指南

> 用于 `/ip-info` 工具的后端接口，返回访问者 IP 及归属地信息。

## 1. 注册账号

访问 [cloudflare.com](https://cloudflare.com) → 右上角 **Sign Up**

- 填写邮箱和密码
- 验证邮箱（收到确认邮件后点击链接）
- 不需要绑定信用卡，免费套餐直接可用

---

## 2. 创建 Worker

登录后进入 Dashboard：

1. 左侧菜单找到 **Workers & Pages**
2. 点击 **Create Application** → **Workers**
3. 选择 **Start with Hello World!**
4. 填写 Worker 名称，如 `ip-lookup`
5. 点击 **Deploy**（先部署默认代码，下一步再修改）

---

## 3. 编辑代码

部署完成后跳转到 Worker 详情页：

1. 点击 **Edit Code**
2. 把编辑器里的内容**全部替换**为：

```javascript
export default {
  async fetch(request) {
    const ip = request.headers.get('CF-Connecting-IP')
             || request.headers.get('X-Forwarded-For')
             || 'unknown';
    const cf = request.cf ?? {};

    return new Response(JSON.stringify({
      ip,
      country:   cf.country        ?? null,
      region:    cf.region         ?? null,
      city:      cf.city           ?? null,
      latitude:  cf.latitude       ?? null,
      longitude: cf.longitude      ?? null,
      timezone:  cf.timezone       ?? null,
      org:       cf.asOrganization ?? null,
      asn:       cf.asn            ?? null
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
```

3. 点击右上角 **Deploy** 保存

---

## 4. 获取接口地址

部署成功后页面会显示你的 Worker 地址，格式为：

```
https://ip-lookup.builder-yemin.workers.dev
```

在浏览器里直接打开这个地址，能看到 JSON 返回说明部署成功。

---

## 5. 填入项目

已配置于 `src/app/pages/ip-info/ip-info.component.ts`：

```typescript
const WORKER_URL = 'https://ip-lookup.builder-yemin.workers.dev';
```

---

## 免费套餐限制

| 指标 | 免费额度 |
|------|---------|
| 每日请求数 | 100,000 次 |
| CPU 时间 | 10ms / 次 |
| 脚本数量 | 100 个 |

个人网站完全够用。
