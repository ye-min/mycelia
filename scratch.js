import { marked } from 'marked';
const html = marked.parse('你触及了**“信息质量”**与**“引力质量”**之间最前沿的逻辑冲突。');
console.log(html);
