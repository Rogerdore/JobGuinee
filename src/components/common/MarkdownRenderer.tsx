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
    let htmlContent = sanitizedContent;

    htmlContent = htmlContent.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 700; color: #111827;">$1</strong>');
    htmlContent = htmlContent.replace(/\*([^*]+)\*/g, '<em style="font-style: italic; color: #1f2937;">$1</em>');

    htmlContent = htmlContent
      .replace(/<p>/gi, '<p style="color: #374151; line-height: 1.75; margin-bottom: 1rem; font-size: 1rem;">')
      .replace(/<p\s+/gi, '<p style="color: #374151; line-height: 1.75; margin-bottom: 1rem; font-size: 1rem;" ')
      .replace(/<h1>/gi, '<h1 style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-top: 1.5rem; margin-bottom: 1rem;">')
      .replace(/<h2>/gi, '<h2 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin-top: 1.25rem; margin-bottom: 0.75rem;">')
      .replace(/<h3>/gi, '<h3 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-top: 1rem; margin-bottom: 0.5rem;">')
      .replace(/<h4>/gi, '<h4 style="font-size: 1.125rem; font-weight: 700; color: #111827; margin-top: 0.75rem; margin-bottom: 0.5rem;">')
      .replace(/<h5>/gi, '<h5 style="font-size: 1rem; font-weight: 700; color: #111827; margin-top: 0.5rem; margin-bottom: 0.25rem;">')
      .replace(/<ul>/gi, '<ul style="list-style-type: disc; list-style-position: inside; margin-bottom: 1rem; color: #374151; margin-left: 1rem;">')
      .replace(/<ol>/gi, '<ol style="list-style-type: decimal; list-style-position: inside; margin-bottom: 1rem; color: #374151; margin-left: 1rem;">')
      .replace(/<li>/gi, '<li style="margin-left: 1rem; color: #374151; margin-bottom: 0.5rem; line-height: 1.75;">')
      .replace(/<strong>/gi, '<strong style="font-weight: 700; color: #111827;">')
      .replace(/<b>/gi, '<b style="font-weight: 700; color: #111827;">')
      .replace(/<em>/gi, '<em style="font-style: italic; color: #1f2937;">')
      .replace(/<i>/gi, '<i style="font-style: italic; color: #1f2937;">')
      .replace(/<blockquote>/gi, '<blockquote style="border-left: 4px solid #0E2F56; padding-left: 1rem; font-style: italic; color: #374151; margin: 1rem 0; background-color: #f9fafb; padding-top: 0.5rem; padding-bottom: 0.5rem;">')
      .replace(/<table>/gi, '<table style="min-width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin: 1rem 0;">')
      .replace(/<thead>/gi, '<thead style="background-color: #f3f4f6;">')
      .replace(/<th>/gi, '<th style="border: 1px solid #d1d5db; padding: 0.75rem 1rem; font-weight: 700; text-align: left; color: #111827;">')
      .replace(/<td>/gi, '<td style="border: 1px solid #d1d5db; padding: 0.75rem 1rem; color: #374151;">')
      .replace(/<div>/gi, '<div style="margin-bottom: 1rem;">')
      .replace(/<span>/gi, '<span style="color: inherit;">');

    htmlContent = htmlContent.replace(/<a\s+/gi, (match) => {
      if (!match.includes('style=')) {
        return '<a style="color: #0E2F56; text-decoration: underline; font-weight: 500;" target="_blank" rel="noopener noreferrer" ';
      }
      return match;
    });

    htmlContent = htmlContent.replace(/<img\s+([^>]*)>/gi, (match, attrs) => {
      const hasStyle = /style\s*=/i.test(attrs);

      const style = 'display: block; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin: 1.5rem 0; border: 1px solid #e5e7eb;';

      if (!hasStyle) {
        return `<img ${attrs} style="${style}">`;
      } else {
        return match.replace(/style="([^"]*)"/i, (m, existingStyle) => {
          return `style="${style} ${existingStyle}"`;
        });
      }
    });

    htmlContent = htmlContent.replace(/<a[^>]*href="([^"]*\.pdf)"[^>]*>([^<]*)<\/a>/gi,
      '<div style="margin: 1.5rem 0; padding: 1rem; background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px;"><a href="$1" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 8px; color: #0E2F56; font-weight: 600; text-decoration: none;"><svg style="width: 24px; height: 24px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"/></svg><span>📄 Télécharger: $2</span></a></div>'
    );

    htmlContent = htmlContent.replace(/<br\s*\/?>/gi, '<br style="margin: 0.5rem 0;">');

    return (
      <div
        className={`prose prose-blue max-w-none ${className}`}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: '1.75',
          fontSize: '1rem',
          color: '#374151'
        }}
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
