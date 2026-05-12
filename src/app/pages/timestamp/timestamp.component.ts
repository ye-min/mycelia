import { Component, OnInit, OnDestroy } from '@angular/core';

interface ConvertResult {
  local: string;
  utc: string;
  seconds: string;
  millis: string;
}

@Component({
  selector: 'app-timestamp',
  templateUrl: './timestamp.component.html',
  styleUrls: ['./timestamp.component.css']
})
export class TimestampComponent implements OnInit, OnDestroy {
  // ── Live clock ───────────────────────────────────────────────────────────
  now = new Date();
  private ticker?: ReturnType<typeof setInterval>;

  get localStr(): string  { return this.formatLocal(this.now); }
  get utcStr(): string    { return this.formatUtc(this.now); }
  get seconds(): string   { return Math.floor(this.now.getTime() / 1000).toString(); }
  get millis(): string    { return this.now.getTime().toString(); }

  // ── Converter ────────────────────────────────────────────────────────────
  tsInput = '';
  dtInput = '';
  tsResult: ConvertResult | null = null;
  dtResult: ConvertResult | null = null;
  tsError = '';
  dtError = '';
  tsCopied: keyof ConvertResult | '' = '';
  dtCopied: keyof ConvertResult | '' = '';

  ngOnInit(): void {
    this.ticker = setInterval(() => { this.now = new Date(); }, 1000);
    this.dtInput = this.toDatetimeLocal(new Date());
  }

  ngOnDestroy(): void {
    clearInterval(this.ticker);
  }

  // ── Timestamp → datetime ─────────────────────────────────────────────────
  convertTs(): void {
    this.tsError = '';
    this.tsResult = null;
    const raw = this.tsInput.trim();
    if (!raw) return;
    if (!/^\d+$/.test(raw)) { this.tsError = '请输入纯数字时间戳'; return; }

    let ms = parseInt(raw, 10);
    // 10 位 → 秒级，13 位 → 毫秒级，其他按长度判断
    if (raw.length <= 10) ms *= 1000;

    const d = new Date(ms);
    if (isNaN(d.getTime())) { this.tsError = '无效的时间戳'; return; }

    this.tsResult = {
      local:   this.formatLocal(d),
      utc:     this.formatUtc(d),
      seconds: Math.floor(ms / 1000).toString(),
      millis:  ms.toString()
    };
  }

  // ── Datetime → timestamp ─────────────────────────────────────────────────
  convertDt(): void {
    this.dtError = '';
    this.dtResult = null;
    const raw = this.dtInput.trim();
    if (!raw) return;

    const d = new Date(raw);
    if (isNaN(d.getTime())) { this.dtError = '无法解析的时间格式'; return; }

    const ms = d.getTime();
    this.dtResult = {
      local:   this.formatLocal(d),
      utc:     this.formatUtc(d),
      seconds: Math.floor(ms / 1000).toString(),
      millis:  ms.toString()
    };
  }

  // ── Copy helpers ─────────────────────────────────────────────────────────
  copyTs(field: keyof ConvertResult): void {
    if (!this.tsResult) return;
    navigator.clipboard.writeText(this.tsResult[field]).then(() => {
      this.tsCopied = field;
      setTimeout(() => (this.tsCopied = ''), 1500);
    });
  }

  copyDt(field: keyof ConvertResult): void {
    if (!this.dtResult) return;
    navigator.clipboard.writeText(this.dtResult[field]).then(() => {
      this.dtCopied = field;
      setTimeout(() => (this.dtCopied = ''), 1500);
    });
  }

  copyLive(value: string, which: 'sec' | 'ms'): void {
    navigator.clipboard.writeText(value).then(() => {
      this.liveCopied = which;
      setTimeout(() => (this.liveCopied = ''), 1500);
    });
  }

  liveCopied: 'sec' | 'ms' | '' = '';

  useNowForTs(): void {
    this.tsInput = this.millis;
    this.convertTs();
  }

  // ── Formatters ───────────────────────────────────────────────────────────
  private pad(n: number): string { return n.toString().padStart(2, '0'); }

  private formatLocal(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth()+1)}-${this.pad(d.getDate())} `
         + `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}:${this.pad(d.getSeconds())}`;
  }

  private formatUtc(d: Date): string {
    return `${d.getUTCFullYear()}-${this.pad(d.getUTCMonth()+1)}-${this.pad(d.getUTCDate())} `
         + `${this.pad(d.getUTCHours())}:${this.pad(d.getUTCMinutes())}:${this.pad(d.getUTCSeconds())} UTC`;
  }

  private toDatetimeLocal(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth()+1)}-${this.pad(d.getDate())}`
         + `T${this.pad(d.getHours())}:${this.pad(d.getMinutes())}:${this.pad(d.getSeconds())}`;
  }
}
