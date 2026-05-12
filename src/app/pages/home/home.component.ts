import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { FeedDisplayItem } from '../../shared/models/feed-item.model';
import { FeedDataService } from '../../core/services/feed-data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  feedItems$: Observable<FeedDisplayItem[]>;

  constructor(private feedData: FeedDataService) {
    this.feedItems$ = this.feedData.getAllFeedItems();
  }

  trackByLink(_index: number, item: FeedDisplayItem): string {
    return item.link;
  }
}
