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

    cleaned = cleaned.replace(/<p><br><\/p>/gi, '\n');
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');

    return cleaned;
  }, [content]);

  const isHTML = /<[a-z][\s\S]*>/i.test(sanitizedContent);

  if (isHTML) {
    let htmlContent = sanitizedContent
      .replace(/<p>/gi, '<p class="text-gray-700 leading-relaxed mb-4">')
      .replace(/<h1>/gi, '<h1 class="text-3xl font-bold text-gray-900 mt-6 mb-4">')
      .replace(/<h2>/gi, '<h2 class="text-2xl font-bold text-gray-900 mt-5 mb-3">')
      .replace(/<h3>/gi, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">')
      .replace(/<h4>/gi, '<h4 class="text-lg font-bold text-gray-900 mt-3 mb-2">')
      .replace(/<h5>/gi, '<h5 class="text-base font-bold text-gray-900 mt-2 mb-1">')
      .replace(/<ul>/gi, '<ul class="list-disc list-inside space-y-2 mb-4 text-gray-700 ml-4">')
      .replace(/<ol>/gi, '<ol class="list-decimal list-inside space-y-2 mb-4 text-gray-700 ml-4">')
      .replace(/<li>/gi, '<li class="ml-4 text-gray-700">')
      .replace(/<strong>/gi, '<strong class="font-bold text-gray-900">')
      .replace(/<em>/gi, '<em class="italic text-gray-800">')
      .replace(/<blockquote>/gi, '<blockquote class="border-l-4 border-[#0E2F56] pl-4 italic text-gray-700 my-4 bg-gray-50 py-2">')
      .replace(/<table>/gi, '<table class="min-w-full border-collapse border border-gray-300 my-4">')
      .replace(/<thead>/gi, '<thead class="bg-gray-100">')
      .replace(/<th>/gi, '<th class="border border-gray-300 px-4 py-2 font-bold text-left">')
      .replace(/<td>/gi, '<td class="border border-gray-300 px-4 py-2">')
      .replace(/<a /gi, '<a class="text-[#0E2F56] hover:text-[#1a4275] underline font-medium" target="_blank" rel="noopener noreferrer" ');

    htmlContent = htmlContent.replace(/<img ([^>]*)>/gi, (match, attrs) => {
      if (!attrs.includes('style="') && !attrs.includes("style='")) {
        return match.replace('<img ', '<img style="max-width: 100%; height: auto; max-height: 600px; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin: 16px 0; border: 2px solid #e5e7eb;" ');
      }
      return match;
    });

    htmlContent = htmlContent.replace(/<a[^>]*href="([^"]*\.pdf)"[^>]*>([^<]*)<\/a>/gi,
      '<div style="margin: 16px 0; padding: 16px; background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px;"><a href="$1" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 8px; color: #0E2F56; font-weight: 600; text-decoration: none;"><svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/></svg><span>📄 $2</span></a></div>'
    );

    return (
      <div
        className={`prose prose-blue max-w-none ${className}`}
        style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
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
