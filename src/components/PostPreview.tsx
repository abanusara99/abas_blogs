// components/PostPreview.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PostPreviewProps {
  content: string;
}

export function PostPreview({ content }: PostPreviewProps) {
  return (
    <div className="post-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>

      <style jsx>{`
        .post-preview a {
          text-decoration: underline !important;
          font-weight: bold !important;
          color: black !important;
        }
      `}</style>
    </div>
  );
}