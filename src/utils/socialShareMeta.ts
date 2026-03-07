/**
 * Utility for generating Open Graph and Social Media meta tags
 * Used for Facebook, LinkedIn, Twitter previews
 */
import { generateJobCardDescription } from './jobNormalization';

export interface ShareMetaData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export const updateSocialMetaTags = (data: ShareMetaData) => {
  const baseUrl = window.location.origin;
  const url = data.url || window.location.href;
  const siteName = data.siteName || 'JobGuinée';
  const type = data.type || 'website';

  // Remove existing meta tags
  const existingTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
  existingTags.forEach(tag => tag.remove());

  // Open Graph meta tags (Facebook, LinkedIn)
  const ogTags = [
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.description },
    { property: 'og:url', content: url },
  ];

  if (data.image) {
    ogTags.push(
      { property: 'og:image', content: data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: data.title }
    );
  }

  // Twitter Card meta tags
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: data.title },
    { name: 'twitter:description', content: data.description },
    { name: 'twitter:url', content: url },
  ];

  if (data.image) {
    twitterTags.push({
      name: 'twitter:image',
      content: data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`
    });
  }

  // Append Open Graph tags
  ogTags.forEach(tag => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', tag.property);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });

  // Append Twitter tags
  twitterTags.forEach(tag => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', tag.name);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });

  // Update canonical link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = url;

  // Update page title
  document.title = `${data.title} - ${siteName}`;
};

export const generateJobShareMeta = (job: {
  id: string;
  title: string;
  description?: string;
  location?: string;
  contract_type?: string;
  sector?: string;
  experience_level?: string;
  keywords?: string[];
  companies?: { name: string; logo_url?: string };
  og_image_url?: string;
  featured_image_url?: string;
  company_logo_url?: string;
  company_name?: string;
}): ShareMetaData => {
  const baseUrl = window.location.origin;
  const company = job.company_name || job.companies?.name || '';

  const description = generateJobCardDescription({
    title: job.title,
    location: job.location,
    experience_level: job.experience_level,
    sector: job.sector,
    keywords: job.keywords,
    company_name: company,
  });

  const image = job.og_image_url
    || job.featured_image_url
    || job.company_logo_url
    || job.companies?.logo_url
    || `${baseUrl}/logo_jobguinee.png`;

  return {
    title: company ? `${job.title} – ${company}` : job.title,
    description,
    image: image.startsWith('http') ? image : `${baseUrl}${image}`,
    url: `${baseUrl}/share/${job.id}`,
    type: 'article',
  };
};

export const shareFacebookJob = (job: {
  id: string;
  title: string;
  description?: string;
  location?: string;
  contract_type?: string;
  companies?: { name: string };
}) => {
  const url = `${window.location.origin}/job/${job.id}`;
  const text = `${job.title} - ${job.companies?.name}\n📍 ${job.location}\n💼 ${job.contract_type}`;

  // Facebook share dialog
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
};

export const shareLinkedInJob = (job: {
  id: string;
  title: string;
  description?: string;
}) => {
  const url = `${window.location.origin}/job/${job.id}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedInUrl, '_blank', 'width=600,height=400');
};

export const shareTwitterJob = (job: {
  id: string;
  title: string;
  location?: string;
  contract_type?: string;
  companies?: { name: string };
}) => {
  const url = `${window.location.origin}/job/${job.id}`;
  const text = `${job.title} - ${job.companies?.name} 📍 ${job.location} 💼 ${job.contract_type}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
};

export const shareWhatsAppJob = (job: {
  id: string;
  title: string;
  location?: string;
  contract_type?: string;
  companies?: { name: string };
}) => {
  const url = `${window.location.origin}/job/${job.id}`;
  const text = `*${job.title}*\n\n🏢 ${job.companies?.name}\n📍 ${job.location}\n💼 ${job.contract_type}\n\nPostulez maintenant sur JobGuinée:\n${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, '_blank');
};
