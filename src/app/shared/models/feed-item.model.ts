/** 统一的 feed 列表显示项（由各类型索引派生） */
export interface FeedDisplayItem {
  date: string;
  type: 'resume' | 'article';
  title: string;
  link: string;
  excerpt?: string;                      // 文章简介（HTML）
  tags?: string[];                       // 文章标签
}

/** data/articles.json 中每条记录的结构 */
export interface ArticleIndex {
  date: string;
  title: string;
  excerpt?: string;
  tags?: string[];  // e.g. ["AI", "编程"]
  file: string; // e.g. "assets/content/articles/my-article.md"
}

/** data/resume.json 中每条记录的结构 */
export interface ResumeIndex {
  date: string;
  title: string;
  excerpt?: string;
  tags?: string[];  // e.g. ["AI", "编程"]
  file: string; // e.g. "assets/content/resume/resume.md"
  link?: string; // e.g. "assets/resume/resume.pdf"
}

