import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface BookmarkLink {
  title: string;
  url: string;
  desc: string;
}

interface BookmarkCategory {
  category: string;
  links: BookmarkLink[];
}

interface ZoneClock {
  label: string;
  timeZone: string;
  time: string;
}

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  categories: BookmarkCategory[] = [];

  clocks: ZoneClock[] = [
    { label: 'LAX', timeZone: 'America/Los_Angeles', time: '' },
    { label: 'LON', timeZone: 'Europe/London', time: '' },
    { label: 'PEK', timeZone: 'Asia/Shanghai', time: '' }
  ];

  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<BookmarkCategory[]>('data/bookmarks.json').subscribe(data => {
      this.categories = data;
    });

    this.updateClocks();
    this.timerId = setInterval(() => this.updateClocks(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateClocks(): void {
    const now = new Date();
    for (const clock of this.clocks) {
      clock.time = new Intl.DateTimeFormat('en-GB', {
        timeZone: clock.timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(now);
    }
  }
}
