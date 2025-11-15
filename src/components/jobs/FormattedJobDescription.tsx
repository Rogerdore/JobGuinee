import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface FormattingStyle {
  fontWeight?: string;
  textTransform?: string;
  fontSize?: string;
  color?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  lineHeight?: string;
  listStyleType?: string;
}

interface FormattingConfig {
  heading_level_1_style: FormattingStyle;
  heading_level_2_style: FormattingStyle;
  heading_level_3_style: FormattingStyle;
  text_style: FormattingStyle;
  list_style: FormattingStyle;
}

const defaultConfig: FormattingConfig = {
  heading_level_1_style: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '1.5rem',
    color: '#0E2F56',
    marginTop: '1.5rem',
    marginBottom: '1rem',
  },
  heading_level_2_style: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '1.25rem',
    color: '#FF8C00',
    marginTop: '1.25rem',
    marginBottom: '0.75rem',
  },
  heading_level_3_style: {
    fontWeight: '600',
    textTransform: 'capitalize',
    fontSize: '1.1rem',
    color: '#0E2F56',
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
  text_style: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  list_style: {
    marginLeft: '1.5rem',
    marginBottom: '0.5rem',
    listStyleType: 'disc',
  },
};

export default function FormattedJobDescription({ description }: { description: string }) {
  const [config, setConfig] = useState<FormattingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('job_description_formatting')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setConfig({
        heading_level_1_style: data.heading_level_1_style,
        heading_level_2_style: data.heading_level_2_style,
        heading_level_3_style: data.heading_level_3_style,
        text_style: data.text_style,
        list_style: data.list_style,
      });
    }
    setLoading(false);
  };

  const renderLine = (line: string, index: number) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} style={config.heading_level_1_style}>
          {line.replace('# ', '')}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} style={config.heading_level_2_style}>
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} style={config.heading_level_3_style}>
          {line.replace('### ', '')}
        </h3>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={index} style={config.list_style}>
          {line.replace('- ', '')}
        </li>
      );
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={index} style={{ ...config.text_style, fontWeight: 'bold' }}>
          {line.replace(/\*\*/g, '')}
        </p>
      );
    }
    if (line.trim() === '') {
      return <div key={index} style={{ height: '0.5rem' }} />;
    }
    return (
      <p key={index} style={config.text_style}>
        {line.split('**').map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i}>{part}</strong>;
          }
          return part;
        })}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  const lines = description.split('\n');
  let inList = false;
  const elements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('- ')) {
      if (!inList) {
        inList = true;
        const listItems: JSX.Element[] = [];
        let currentIndex = index;
        while (currentIndex < lines.length && lines[currentIndex].startsWith('- ')) {
          listItems.push(
            <li key={currentIndex} style={config.list_style}>
              {lines[currentIndex].replace('- ', '')}
            </li>
          );
          currentIndex++;
        }
        elements.push(
          <ul key={`list-${index}`} style={config.list_style}>
            {listItems}
          </ul>
        );
      }
    } else {
      inList = false;
      if (!lines[index - 1]?.startsWith('- ') || !line.startsWith('- ')) {
        elements.push(renderLine(line, index));
      }
    }
  });

  return <div className="formatted-description">{elements}</div>;
}
