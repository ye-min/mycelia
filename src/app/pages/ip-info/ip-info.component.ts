import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// 与 Cloudflare Worker 返回的字段对应
interface IpData {
  ip:        string;
  country:   string | null;
  region:    string | null;
  city:      string | null;
  latitude:  number | string | null;
  longitude: number | string | null;
  timezone:  string | null;
  org:       string | null;
  asn:       number | null;
}

interface InfoRow {
  label: string;
  value: string;
}

// 部署 Cloudflare Worker 后替换此地址
const WORKER_URL = 'https://ip-lookup.builder-yemin.workers.dev';

@Component({
  selector: 'app-ip-info',
  templateUrl: './ip-info.component.html',
  styleUrls: ['./ip-info.component.css']
})
export class IpInfoComponent implements OnInit {
  state: 'loading' | 'done' | 'error' = 'loading';
  ip = '';
  rows: InfoRow[] = [];
  copied = false;
  errorMsg = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.errorMsg = '';
    this.http.get<IpData>(WORKER_URL).subscribe({
      next: (data) => {
        this.ip = data.ip;
        this.rows = this.buildRows(data);
        this.state = 'done';
      },
      error: () => {
        this.state = 'error';
        this.errorMsg = '请求失败，请稍后重试';
      }
    });
  }

  private buildRows(d: IpData): InfoRow[] {
    const rows: InfoRow[] = [];
    if (d.country)   rows.push({ label: '国家/地区', value: d.country });
    if (d.region)    rows.push({ label: '省/州',     value: d.region });
    if (d.city)      rows.push({ label: '城市',      value: d.city });
    if (d.latitude != null && d.longitude != null) {
      const lat = parseFloat(String(d.latitude));
      const lon = parseFloat(String(d.longitude));
      rows.push({ label: '坐标', value: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
    }
    if (d.timezone)  rows.push({ label: '时区',   value: d.timezone });
    if (d.org)       rows.push({ label: '运营商', value: d.org });
    if (d.asn)       rows.push({ label: 'ASN',    value: `AS${d.asn}` });
    return rows;
  }

  copyIp(): void {
    navigator.clipboard.writeText(this.ip).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  openMap(): void {
    const row = this.rows.find(r => r.label === '坐标');
    if (!row) return;
    const [lat, lon] = row.value.split(',').map(s => s.trim());
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=12`, '_blank', 'noopener');
  }

  get hasCoords(): boolean {
    return this.rows.some(r => r.label === '坐标');
  }
}
