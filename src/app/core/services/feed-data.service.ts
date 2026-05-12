import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  FeedDisplayItem,
  ArticleIndex,
  ResumeIndex
} from '../../shared/models/feed-item.model';

@Injectable({ providedIn: 'root' })
export class FeedDataService {
  constructor(private http: HttpClient) { }

  getResumes(): Observable<ResumeIndex[]> {
    return this.http.get<ResumeIndex[]>('data/resume.json');
  }

  getArticles(): Observable<ArticleIndex[]> {
    return this.http.get<ArticleIndex[]>('data/articles.json');
  }

  /** 全部内容合并后按日期倒序，用于首页 feed */
  getAllFeedItems(): Observable<FeedDisplayItem[]> {
    return combineLatest([
      this.getResumes(),
      this.getArticles(),
    ]).pipe(
      map(([resumes, articles]) => {
        const items: FeedDisplayItem[] = [
          ...resumes.map((a) => ({
            date: a.date,
            type: 'resume' as const,
            title: a.title,
            link: `/resume/${this.slugFromFile(a.file)}`,
            excerpt: a.excerpt,
            tags: a.tags,
          })),
          ...articles.map((a) => ({
            date: a.date,
            type: 'article' as const,
            title: a.title,
            link: `/article/${this.slugFromFile(a.file)}`,
            excerpt: a.excerpt,
            tags: a.tags,
          })),
        ];
        return items.sort((a, b) => b.date.localeCompare(a.date));
      })
    );
  }

  getResumeFeedItems(): Observable<FeedDisplayItem[]> {
    return this.getResumes().pipe(
      map((resumes) =>
        resumes.map((a) => ({
          date: a.date,
          type: 'resume' as const,
          title: a.title,
          link: `/resume/${this.slugFromFile(a.file)}`,
          excerpt: a.excerpt,
          tags: a.tags,
        }))
      )
    );
  }

  getArticleFeedItems(): Observable<FeedDisplayItem[]> {
    return this.getArticles().pipe(
      map((articles) =>
        articles.map((a) => ({
          date: a.date,
          type: 'article' as const,
          title: a.title,
          link: `/article/${this.slugFromFile(a.file)}`,
          excerpt: a.excerpt,
          tags: a.tags,
        }))
      )
    );
  }

  /** 根据 slug 加载文章元数据 + Markdown 内容 */
  getArticleBySlug(slug: string): Observable<{ meta: ArticleIndex; content: string }> {
    return this.getArticles().pipe(
      switchMap((articles) => {
        const meta = articles.find((a) => this.slugFromFile(a.file) === slug);
        if (!meta) {
          throw new Error(`Article not found: ${slug}`);
        }
        return this.http
          .get(meta.file, { responseType: 'text' })
          .pipe(map((content) => ({ meta, content })));
      })
    );
  }

  /** 根据 slug 加载文章元数据 + Markdown 内容 */
  getResumeBySlug(slug: string): Observable<{ meta: ResumeIndex; content: string }> {
    return this.getResumes().pipe(
      switchMap((resumes) => {
        const meta = resumes.find((a) => this.slugFromFile(a.file) === slug);
        if (!meta) {
          throw new Error(`Resume not found: ${slug}`);
        }
        return this.http
          .get(meta.file, { responseType: 'text' })
          .pipe(map((content) => ({ meta, content })));
      })
    );
  }

  /** 读取当天的每日词条，无匹配时取最后一条 */
  getDailyWord(): Observable<string> {
    return this.http.get<{ date: string; word: string }[]>('data/daily-words.json').pipe(
      map(entries => {
        const today = new Date().toISOString().slice(0, 10);
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        const past = sorted.filter(e => e.date <= today);
        return past.length > 0
          ? past[past.length - 1].word
          : sorted[sorted.length - 1].word;
      })
    );
  }

  private slugFromFile(file: string): string {
    return file
      .replace('assets/content/articles/', '')
      .replace('assets/content/resume/', '')
      .replace('.md', '');
  }
}
