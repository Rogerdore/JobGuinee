import ReactMarkdown from 'react-markdown';
import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content || content.trim() === '') {
    return (
      <div className={`text-gray-500 italic ${className}`}>
        Aucune description disponible
      </div>
    );
  }

  const sanitizedContent = useMemo(() => {
    let cleaned = content;

    cleaned = cleaned.replace(/<img[^>]*src="data:image\/[^"]*"[^>]*>/gi, (match) => {
      const sizeInKB = match.length / 1024;
      if (sizeInKB > 800) {
        return '';
      }
      return match;
    });

    cleaned = cleaned.replace(/<p><br><\/p>/gi, '\n');
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

    return cleaned;
  }, [content]);

  const isHTML = /<[a-z][\s\S]*>/i.test(sanitizedContent);

  if (isHTML) {
    const htmlContent = sanitizedContent
      .replace(/<p>/gi, '<p class="text-gray-700 leading-relaxed mb-4">')
      .replace(/<h1>/gi, '<h1 class="text-3xl font-bold text-gray-900 mt-6 mb-4">')
      .replace(/<h2>/gi, '<h2 class="text-2xl font-bold text-gray-900 mt-5 mb-3">')
      .replace(/<h3>/gi, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">')
      .replace(/<ul>/gi, '<ul class="list-disc list-inside space-y-2 mb-4 text-gray-700 ml-4">')
      .replace(/<ol>/gi, '<ol class="list-decimal list-inside space-y-2 mb-4 text-gray-700 ml-4">')
      .replace(/<li>/gi, '<li class="ml-4">')
      .replace(/<strong>/gi, '<strong class="font-bold text-gray-900">')
      .replace(/<em>/gi, '<em class="italic text-gray-800">')
      .replace(/<a /gi, '<a class="text-[#0E2F56] hover:text-[#1a4275] underline font-medium" target="_blank" rel="noopener noreferrer" ')
      .replace(/<img /gi, '<img class="max-w-full h-auto rounded-lg shadow-md my-4" ');

    return (
      <div
        className={`prose prose-blue max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <div className={`prose prose-blue max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-900 mt-5 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-4">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">
              {children}
            </em>
          ),
          code: ({ children }) => (
            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#0E2F56] pl-4 italic text-gray-700 my-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0E2F56] hover:text-[#1a4275] underline font-medium"
            >
              {children}
            </a>
          ),
        }}
        disallowedElements={['script', 'iframe', 'object', 'embed', 'style']}
        unwrapDisallowed
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
