import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as marked from 'marked';

@Injectable({
  providedIn: 'root'
})
export class MarkdownRenderService {

  constructor(private sanitizer: DomSanitizer) { }

  /**
   * Renders markdown content with CJK fix and KaTeX math support.
   */
  render(content: string | undefined): SafeHtml {
    if (!content) return '';

    // 1. Fix for CJK punctuation + markdown symbols
    let processed = content
      .replace(/([^\x00-\xff])([\*_]{1,2})/g, '$1\u200b$2')
      .replace(/([\*_]{1,2})([^\x00-\xff])/g, '$1\u200b$2');

    // 2. Simple LaTeX support ($...$ and $$...$$) using placeholders
    const mathBlocks: string[] = [];
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
      const idx = mathBlocks.length;
      mathBlocks.push((window as any).katex.renderToString(tex, { displayMode: true, throwOnError: false }));
      return `:::MATH_BLOCK_${idx}:::`;
    });
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
      const idx = mathBlocks.length;
      mathBlocks.push((window as any).katex.renderToString(tex, { displayMode: false, throwOnError: false }));
      return `:::MATH_BLOCK_${idx}:::`;
    });

    // 3. Parse Markdown
    let html = marked.parse(processed) as string;

    // 4. Restore Math
    html = html.replace(/:::MATH_BLOCK_(\d+):::/g, (match, idx) => mathBlocks[parseInt(idx)]);

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
