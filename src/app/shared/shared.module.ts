import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FeedRowComponent } from './components/feed-row/feed-row.component';

@NgModule({
  declarations: [FeedRowComponent],
  imports: [CommonModule, RouterModule],
  exports: [FeedRowComponent]
})
export class SharedModule { }
