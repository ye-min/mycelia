# 内容数据结构规范

## 个人简历

`data/resumes.json` — 索引文件：
```json
[
  {
    "date": "2026-05-11",
    "title": "姓名",
    "file": "assets/content/resumes/resume1.md"
  }
]
```

Markdown 文件无需 frontmatter，直接正文内容，渲染到页面即可。

---

## 技术文章

`data/articles.json` — 索引文件：
```json
[
  {
    "date": "2024-03-15",
    "title": "文章标题",
    "file": "assets/content/articles/my-article.md"
  }
]
```

Markdown 文件无需 frontmatter，直接正文内容，渲染到页面即可。

---

## 导航书签

`data/bookmarks.json` — 索引文件：
```json
[
  {
    "category": "分类名",
    "links": [
      { "title": "网站名", "url": "https://example.com", "desc": "来源或简介" }
    ]
  }
]
```

- 每个对象为一个分类，页面按分类顺序渲染
- 新增分类直接追加对象；新增链接在对应分类的 `links` 数组中追加即可