import React, { useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import 'highlight.js/styles/github-dark.css';

interface MarkdownMessageProps {
  content: string;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
          <span className="text-xs font-mono text-muted-foreground">{language}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className="bg-black/30 px-1.5 py-0.5 rounded-md text-sm font-mono text-indigo-300" {...props}>
      {children}
    </code>
  );
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  const components: Components = {
    code: CodeBlock as any,
  };

  return (
    <div className="
      text-[15px] leading-relaxed text-foreground/90 
      [&>p]:mb-4 [&>p:last-child]:mb-0 
      [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6
      [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5
      [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4
      [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1
      [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-1
      [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground
      [&>a]:text-indigo-400 [&>a]:underline [&>a:hover]:text-indigo-300
      [&>table]:w-full [&>table]:border-collapse [&>table]:my-4 [&>table]:text-sm
      [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-white/10 [&>table>thead>tr>th]:bg-white/5 [&>table>thead>tr>th]:px-4 [&>table>thead>tr>th]:py-2 [&>table>thead>tr>th]:text-left
      [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-white/10 [&>table>tbody>tr>td]:px-4 [&>table>tbody>tr>td]:py-2
    ">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
