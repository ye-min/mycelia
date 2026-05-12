import { Component } from '@angular/core';

interface PdfEntry {
  id: number;
  file: File;
  pageCount: number | null;
}

@Component({
  selector: 'app-pdf-merger',
  templateUrl: './pdf-merger.component.html',
  styleUrls: ['./pdf-merger.component.css']
})
export class PdfMergerComponent {
  entries: PdfEntry[] = [];
  isDraggingOver = false;
  isMerging = false;
  errorMsg = '';
  private idCounter = 0;

  // ── File input ──────────────────────────────────────────────────────────

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(): void {
    this.isDraggingOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDraggingOver = false;
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type === 'application/pdf');
    this.addFiles(files);
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(f => f.type === 'application/pdf');
    this.addFiles(files);
    input.value = '';
  }

  private async addFiles(files: File[]): Promise<void> {
    this.errorMsg = '';
    for (const file of files) {
      const id = ++this.idCounter;
      const entry: PdfEntry = { id, file, pageCount: null };
      this.entries.push(entry);
      try {
        const { PDFDocument } = await import('pdf-lib');
        const buf = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        entry.pageCount = pdf.getPageCount();
      } catch {
        entry.pageCount = -1;
      }
    }
  }

  remove(id: number): void {
    this.entries = this.entries.filter(e => e.id !== id);
  }

  // ── List drag-to-reorder ─────────────────────────────────────────────────

  dragSrcId: number | null = null;

  onItemDragStart(e: DragEvent, id: number): void {
    this.dragSrcId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  onItemDragOver(e: DragEvent, id: number): void {
    e.preventDefault();
    if (this.dragSrcId === null || this.dragSrcId === id) return;
    const srcIdx = this.entries.findIndex(en => en.id === this.dragSrcId);
    const dstIdx = this.entries.findIndex(en => en.id === id);
    if (srcIdx === -1 || dstIdx === -1) return;
    const reordered = [...this.entries];
    const [item] = reordered.splice(srcIdx, 1);
    reordered.splice(dstIdx, 0, item);
    this.entries = reordered;
  }

  onItemDragEnd(): void {
    this.dragSrcId = null;
  }

  moveUp(idx: number): void {
    if (idx === 0) return;
    [this.entries[idx - 1], this.entries[idx]] = [this.entries[idx], this.entries[idx - 1]];
  }

  moveDown(idx: number): void {
    if (idx === this.entries.length - 1) return;
    [this.entries[idx], this.entries[idx + 1]] = [this.entries[idx + 1], this.entries[idx]];
  }

  // ── Merge ────────────────────────────────────────────────────────────────

  get totalPages(): number {
    return this.entries.reduce((sum, e) => sum + (e.pageCount && e.pageCount > 0 ? e.pageCount : 0), 0);
  }

  async merge(): Promise<void> {
    if (this.entries.length < 2) return;
    this.isMerging = true;
    this.errorMsg = '';
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const entry of this.entries) {
        const buf = await entry.file.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.errorMsg = '合并失败，请检查文件是否为有效 PDF';
    } finally {
      this.isMerging = false;
    }
  }
}
