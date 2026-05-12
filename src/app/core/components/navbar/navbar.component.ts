import { Component, OnInit, OnDestroy } from '@angular/core';
import { FeedDataService } from '../../services/feed-data.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  word = '';
  private midnightTimer?: ReturnType<typeof setTimeout>;

  navLinks = [
    { label: 'Writing', path: '/writing' },
    { label: 'Resume', path: '/resume' }
  ];

  constructor(private feedData: FeedDataService) { }

  ngOnInit(): void {
    this.loadWord();
    this.scheduleMidnight();
  }

  ngOnDestroy(): void {
    clearTimeout(this.midnightTimer);
  }

  private loadWord(): void {
    this.feedData.getDailyWord().subscribe(w => this.word = w);
  }

  private scheduleMidnight(): void {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = midnight.getTime() - now.getTime();
    this.midnightTimer = setTimeout(() => {
      this.loadWord();
      this.scheduleMidnight();
    }, ms);
  }
}
