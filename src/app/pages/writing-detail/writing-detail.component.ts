import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';
import { FeedDataService } from '../../core/services/feed-data.service';
import { MarkdownRenderService } from '../../core/services/markdown-render.service';
import { WritingIndex } from '../../shared/models/feed-item.model';
import { LoadingState } from '../../shared/models/loading-state.model';

interface ArticleViewModel {
  meta: WritingIndex;
  html: SafeHtml;
}

@Component({
  selector: 'app-writing-detail',
  templateUrl: './writing-detail.component.html',
  styleUrls: ['./writing-detail.component.css']
})
export class WritingDetailComponent implements OnInit {
  state$: Observable<LoadingState<ArticleViewModel>>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feedData: FeedDataService,
    private renderService: MarkdownRenderService
  ) {
    this.state$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => {
        if (!id) return of({ loading: false, data: null });
        return this.feedData.getArticleBySlug(id).pipe(
          map(({ meta, content }) => ({
            loading: false,
            data: { meta, html: this.renderService.render(content) }
          })),
          catchError(() => of({ loading: false, data: null }))
        ).pipe(startWith({ loading: true }));
      })
    );
  }

  ngOnInit(): void {}

  navigateToTag(tag: string): void {
    this.router.navigate(['/writing'], { queryParams: { tags: tag } });
  }
}
