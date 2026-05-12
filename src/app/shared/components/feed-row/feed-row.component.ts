import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';
import { FeedDisplayItem } from '../../models/feed-item.model';
import { MarkdownRenderService } from '../../../core/services/markdown-render.service';

@Component({
  selector: 'app-feed-row',
  templateUrl: './feed-row.component.html',
  styleUrls: ['./feed-row.component.css']
})
export class FeedRowComponent implements OnInit, OnDestroy {
  @Input() item!: FeedDisplayItem;

  activeTags = new Set<string>();
  private sub?: Subscription;

  constructor(
    private renderService: MarkdownRenderService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.sub = this.route.queryParamMap.subscribe(params => {
      const tagsParam = params.get('tags') || params.get('tag');
      if (tagsParam) {
        this.activeTags = new Set(tagsParam.split(','));
      } else {
        this.activeTags.clear();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  renderMarkdown(content: string | undefined): SafeHtml {
    return this.renderService.render(content);
  }

  navigateToTag(tag: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const tree = this.router.parseUrl(this.router.url);
    const path = tree.root.children['primary']?.segments.map(s => s.path).join('/') || '';
    const targetPath = this.item.type;

    if (path === targetPath) {
      const params = tree.queryParams;
      const tagsParam = params['tags'] || params['tag'];
      let currentSet = new Set<string>(tagsParam ? tagsParam.split(',') : []);

      if (currentSet.has(tag)) {
        currentSet.delete(tag);
      } else {
        currentSet.add(tag);
      }

      const queryParams: any = { tag: null };
      if (currentSet.size > 0) {
        queryParams['tags'] = Array.from(currentSet).join(',');
      } else {
        queryParams['tags'] = null;
      }
      this.router.navigate([`/${targetPath}`], { queryParams, queryParamsHandling: 'merge' });
    } else {
      this.router.navigate([`/${targetPath}`], { queryParams: { tags: tag } });
    }
  }

  navigateToType(type: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const route = `/${type}`;
    this.router.navigate([route]);
  }
}
