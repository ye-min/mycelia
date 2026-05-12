import { Component } from '@angular/core';

interface Tool {
  title: string;
  desc: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.css']
})
export class ToolsComponent {
  tools: Tool[] = [
    {
      title: 'PDF → Markdown',
      desc: '将 PDF 文档转换为 Markdown 格式，可复制或下载',
      path: '/pdf-converter',
      icon: 'pdf'
    },
    {
      title: 'PDF 合并',
      desc: '上传多个 PDF，拖拽调整顺序后合并为一个文件',
      path: '/pdf-merger',
      icon: 'merge'
    },
    {
      title: 'IP 查询',
      desc: '查看当前访问的 IP 地址与归属地、运营商信息',
      path: '/ip-info',
      icon: 'ip'
    },
    {
      title: '时间戳转换',
      desc: 'Unix 时间戳与可读时间互转，实时显示当前时间戳',
      path: '/timestamp',
      icon: 'clock'
    },
    {
      title: '哈希计算',
      desc: '计算 MD5 / SHA / SHA-3 / RIPEMD 哈希值，纯本地运算',
      path: '/hash-calc',
      icon: 'hash'
    },
    {
      title: 'Markdown → PDF',
      desc: '粘贴或上传 Markdown，预览后通过浏览器打印导出为 PDF',
      path: '/md-to-pdf',
      icon: 'md-pdf'
    }
  ];
}
