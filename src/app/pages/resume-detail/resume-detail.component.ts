import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';
import { FeedDataService } from '../../core/services/feed-data.service';
import { MarkdownRenderService } from '../../core/services/markdown-render.service';
import { ResumeIndex } from '../../shared/models/feed-item.model';
import { LoadingState } from '../../shared/models/loading-state.model';

interface ResumeViewModel {
  meta: ResumeIndex;
  html: SafeHtml;
}

@Component({
  selector: 'app-resume-detail',
  templateUrl: './resume-detail.component.html',
  styleUrls: ['./resume-detail.component.css']
})
export class ResumeDetailComponent implements OnInit {
  state$: Observable<LoadingState<ResumeViewModel>>;

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
        return this.feedData.getResumeBySlug(id).pipe(
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
    this.router.navigate(['/resume'], { queryParams: { tags: tag } });
  }
}
