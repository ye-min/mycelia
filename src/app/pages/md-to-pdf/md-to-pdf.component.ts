import { Component, ElementRef, ViewChild } from '@angular/core';
import { marked } from 'marked';

@Component({
  selector: 'app-md-to-pdf',
  templateUrl: './md-to-pdf.component.html',
  styleUrls: ['./md-to-pdf.component.css']
})
export class MdToPdfComponent {
  @ViewChild('previewEl') previewEl!: ElementRef<HTMLDivElement>;

  markdownInput = '';
  isDragging = false;
  fileName = '';
  errorMsg = '';
  activeTab: 'edit' | 'preview' = 'edit';

  get renderedHtml(): string {
    if (!this.markdownInput.trim()) return '';
    return marked(this.markdownInput) as string;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.readFile(file);
    input.value = '';
  }

  private readFile(file: File): void {
    if (!file.name.endsWith('.md') && file.type !== 'text/markdown' && file.type !== 'text/plain') {
      this.errorMsg = '请上传 .md 或 .txt 文件';
      return;
    }
    this.errorMsg = '';
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.markdownInput = (e.target?.result as string) ?? '';
      this.activeTab = 'preview';
    };
    reader.readAsText(file, 'utf-8');
  }

  exportPdf(): void {
    const html = marked(this.markdownInput) as string;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>${this.fileName || 'document'}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a1a;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 40px;
  }
  h1 { font-size: 2em; margin: 1.2em 0 0.5em; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; margin: 1em 0 0.4em; border-bottom: 1px solid #e8e8e8; padding-bottom: 0.2em; }
  h3 { font-size: 1.2em; margin: 0.9em 0 0.3em; }
  h4, h5, h6 { margin: 0.8em 0 0.3em; }
  p { margin: 0.6em 0; }
  a { color: #4a6fa5; }
  code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.88em;
    background: #f3f3f3;
    padding: 0.15em 0.35em;
    border-radius: 3px;
  }
  pre {
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 4px;
    padding: 1em 1.2em;
    overflow-x: auto;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    margin: 0.8em 0;
    padding: 0.4em 1em;
    border-left: 3px solid #d0d0d0;
    color: #555;
  }
  table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
  th, td { border: 1px solid #d0d0d0; padding: 0.5em 0.8em; }
  th { background: #f5f5f5; font-weight: 600; }
  ul, ol { padding-left: 1.6em; margin: 0.5em 0; }
  li { margin: 0.25em 0; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.5em 0; }
  img { max-width: 100%; }
  @media print {
    body { padding: 0; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>${html}</body>
</html>`);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  clear(): void {
    this.markdownInput = '';
    this.fileName = '';
    this.errorMsg = '';
    this.activeTab = 'edit';
  }
}
