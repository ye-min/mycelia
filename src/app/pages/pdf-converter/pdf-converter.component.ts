import { Component } from '@angular/core';

interface TextItem {
  str: string;
  height: number;
  transform: number[];
}

@Component({
  selector: 'app-pdf-converter',
  templateUrl: './pdf-converter.component.html',
  styleUrls: ['./pdf-converter.component.css']
})
export class PdfConverterComponent {
  isDragging = false;
  isProcessing = false;
  fileName = '';
  markdownOutput = '';
  copied = false;
  errorMsg = '';

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
    if (file) this.processFile(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
  }

  private async processFile(file: File): Promise<void> {
    if (file.type !== 'application/pdf') {
      this.errorMsg = '请上传 PDF 文件';
      return;
    }
    this.errorMsg = '';
    this.fileName = file.name;
    this.isProcessing = true;
    this.markdownOutput = '';

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const lines: string[] = [];

      const fontSizes: number[] = [];
      const allPageItems: TextItem[][] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as TextItem[];
        allPageItems.push(items);
        items.forEach(item => {
          if (item.height > 0) fontSizes.push(item.height);
        });
      }

      const headingThresholds = this.detectHeadingThresholds(fontSizes);

      for (let i = 0; i < allPageItems.length; i++) {
        if (i > 0) lines.push('\n---\n');
        lines.push(...this.pageToMarkdown(allPageItems[i], headingThresholds));
      }

      this.markdownOutput = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    } catch (err) {
      this.errorMsg = '解析失败，请确认文件为有效的文字型 PDF';
    } finally {
      this.isProcessing = false;
    }
  }

  private detectHeadingThresholds(sizes: number[]): number[] {
    if (sizes.length === 0) return [];
    const freq = new Map<number, number>();
    sizes.forEach(s => freq.set(Math.round(s * 10) / 10, (freq.get(Math.round(s * 10) / 10) ?? 0) + 1));
    const bodySize = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const candidates = [...freq.keys()].filter(s => s > bodySize * 1.1).sort((a, b) => b - a);
    return candidates.slice(0, 3);
  }

  private pageToMarkdown(items: TextItem[], headingThresholds: number[]): string[] {
    const lines: string[] = [];
    let currentLine = '';
    let lastY = -1;
    const Y_THRESHOLD = 2;

    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const size = Math.round(item.height * 10) / 10;

      if (lastY !== -1 && Math.abs(y - lastY) > Y_THRESHOLD) {
        if (currentLine.trim()) {
          lines.push(this.applyHeading(currentLine.trim(), size, headingThresholds));
        }
        currentLine = item.str;
      } else {
        currentLine += (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
      }
      lastY = y;
    }

    if (currentLine.trim()) {
      const lastSize = items.length > 0 ? Math.round(items[items.length - 1].height * 10) / 10 : 0;
      lines.push(this.applyHeading(currentLine.trim(), lastSize, headingThresholds));
    }

    return lines;
  }

  private applyHeading(text: string, size: number, thresholds: number[]): string {
    const idx = thresholds.findIndex(t => size >= t * 0.95);
    if (idx === 0) return `# ${text}`;
    if (idx === 1) return `## ${text}`;
    if (idx === 2) return `### ${text}`;
    return text;
  }

  async copyToClipboard(): Promise<void> {
    await navigator.clipboard.writeText(this.markdownOutput);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  downloadMarkdown(): void {
    const baseName = this.fileName.replace(/\.pdf$/i, '') || 'output';
    const blob = new Blob([this.markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  reset(): void {
    this.markdownOutput = '';
    this.fileName = '';
    this.errorMsg = '';
    this.copied = false;
  }
}
