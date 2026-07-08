import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Using dark theme

interface MarkdownMessageProps {
  content: string;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="
      text-[15px] leading-relaxed text-foreground/90 
      [&>p]:mb-4 [&>p:last-child]:mb-0 
      [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6
      [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5
      [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4
      [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1
      [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-1
      [&>pre]:bg-black/40 [&>pre]:rounded-xl [&>pre]:p-4 [&>pre]:my-4 [&>pre]:overflow-x-auto [&>pre]:border [&>pre]:border-white/10
      [&>pre>code]:bg-transparent [&>pre>code]:p-0
      [&>code]:bg-black/30 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-sm [&>code]:font-mono [&>code]:text-indigo-300
      [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground
      [&>a]:text-indigo-400 [&>a]:underline [&>a:hover]:text-indigo-300
    ">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
