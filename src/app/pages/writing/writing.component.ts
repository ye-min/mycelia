import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeedDisplayItem } from '../../shared/models/feed-item.model';
import { FeedDataService } from '../../core/services/feed-data.service';

@Component({
  selector: 'app-writing',
  templateUrl: './writing.component.html',
  styleUrls: ['./writing.component.css']
})
export class WritingComponent implements OnInit {
  private allItems$: Observable<FeedDisplayItem[]>;

  selectedTags$ = new BehaviorSubject<Set<string>>(new Set());
  allTags$: Observable<string[]>;
  feedItems$: Observable<FeedDisplayItem[]>;

  constructor(private feedData: FeedDataService, private route: ActivatedRoute, private router: Router) {
    this.allItems$ = this.feedData.getWritingFeedItems();

    this.allTags$ = this.allItems$.pipe(
      map(items => {
        const seen = new Set<string>();
        items.forEach(item => (item.tags ?? []).forEach(t => seen.add(t)));
        return Array.from(seen);
      })
    );

    this.feedItems$ = combineLatest([this.allItems$, this.selectedTags$]).pipe(
      map(([items, selected]) => {
        if (selected.size === 0) return items;
        return items.filter(item =>
          (item.tags ?? []).some(t => selected.has(t))
        );
      })
    );
  }

  ngOnInit(): void {
    // 监听 query param，使 URL 成为过滤状态的唯一信源
    this.route.queryParamMap.subscribe(params => {
      const tagsParam = params.get('tags') || params.get('tag');
      if (tagsParam) {
        this.selectedTags$.next(new Set(tagsParam.split(',')));
      } else {
        this.selectedTags$.next(new Set());
      }
    });
  }

  toggleTag(tag: string): void {
    const current = new Set(this.selectedTags$.value);
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
    this.updateUrl(current);
  }

  isSelected(tag: string): boolean {
    return this.selectedTags$.value.has(tag);
  }

  clearTags(): void {
    this.updateUrl(new Set());
  }

  private updateUrl(tags: Set<string>): void {
    const queryParams: any = { tag: null }; // 清除旧版单数 tag 参
    if (tags.size > 0) {
      queryParams.tags = Array.from(tags).join(',');
    } else {
      queryParams.tags = null;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  trackByLink(_index: number, item: FeedDisplayItem): string {
    return item.link;
  }
}
