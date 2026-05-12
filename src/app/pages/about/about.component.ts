import { Component } from '@angular/core';
import packageInfo from '../../../../package.json';
import { buildTimestamp } from '../../build-info';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  version = packageInfo.version;
  buildTime = buildTimestamp;
}
