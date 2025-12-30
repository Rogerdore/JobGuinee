import { supabase } from '../lib/supabase';

export interface SchemaData {
  id: string;
  schema_type: string;
  entity_type: string;
  entity_id?: string;
  schema_json: any;
  is_active: boolean;
}

class SchemaService {
  async getSchemas(entityType?: string, entityId?: string): Promise<SchemaData[]> {
    try {
      let query = supabase
        .from('seo_schemas')
        .select('*')
        .eq('is_active', true);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching schemas:', error);
      return [];
    }
  }

  async setSchema(schema: Partial<SchemaData>): Promise<boolean> {
    try {
      if (!schema.schema_type || !schema.entity_type || !schema.schema_json) {
        throw new Error('schema_type, entity_type, and schema_json are required');
      }

      const { data: existing } = await supabase
        .from('seo_schemas')
        .select('id')
        .eq('schema_type', schema.schema_type)
        .eq('entity_type', schema.entity_type)
        .eq('entity_id', schema.entity_id || null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('seo_schemas')
          .update({ ...schema, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_schemas')
          .insert([schema]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error setting schema:', error);
      return false;
    }
  }

  generateJobPostingSchema(job: any) {
    const companyName = job.companies?.name || job.company_name || 'Entreprise';
    const location = job.location || 'Guinée';
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      'title': job.title,
      'description': job.description || job.title,
      'datePosted': job.created_at,
      'validThrough': job.deadline || job.application_deadline,
      'employmentType': this.mapContractType(job.contract_type),
      'hiringOrganization': {
        '@type': 'Organization',
        'name': companyName,
        'sameAs': job.companies?.website || job.company_website,
        'logo': job.companies?.logo_url || job.company_logo_url
      },
      'jobLocation': {
        '@type': 'Place',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': location,
          'addressCountry': 'GN'
        }
      },
      'baseSalary': job.salary_min && job.salary_max ? {
        '@type': 'MonetaryAmount',
        'currency': 'GNF',
        'value': {
          '@type': 'QuantitativeValue',
          'minValue': job.salary_min,
          'maxValue': job.salary_max,
          'unitText': 'MONTH'
        }
      } : undefined,
      'qualifications': job.requirements,
      'responsibilities': job.responsibilities,
      'skills': job.keywords?.join(', '),
      'experienceRequirements': job.experience_level,
      'educationRequirements': job.education_level || job.diploma_required,
      'url': `${siteUrl}/job-detail/${job.id}`
    };
  }

  generatePersonSchema(profile: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': profile.full_name || 'Candidat JobGuinée',
      'jobTitle': profile.title || profile.desired_position,
      'description': profile.bio || profile.ai_generated_summary,
      'url': `${siteUrl}/profile/${profile.id}`,
      'worksFor': profile.current_company ? {
        '@type': 'Organization',
        'name': profile.current_company
      } : undefined,
      'alumniOf': profile.education ? profile.education.map((edu: any) => ({
        '@type': 'EducationalOrganization',
        'name': edu.school || edu.institution
      })) : undefined,
      'knowsAbout': profile.skills || [],
      'address': profile.location || profile.city ? {
        '@type': 'PostalAddress',
        'addressLocality': profile.city || profile.location,
        'addressCountry': 'GN'
      } : undefined
    };
  }

  generateCourseSchema(formation: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': formation.title,
      'description': formation.description,
      'provider': {
        '@type': 'Organization',
        'name': formation.provider || 'JobGuinée'
      },
      'courseCode': formation.id,
      'educationalLevel': formation.level,
      'timeRequired': formation.duration,
      'hasCourseInstance': {
        '@type': 'CourseInstance',
        'courseMode': 'online',
        'courseWorkload': formation.duration
      },
      'offers': formation.price ? {
        '@type': 'Offer',
        'price': formation.price,
        'priceCurrency': 'GNF',
        'availability': 'https://schema.org/InStock'
      } : undefined,
      'url': `${siteUrl}/formations#${formation.id}`
    };
  }

  generateArticleSchema(post: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': post.title,
      'description': post.excerpt || post.description,
      'image': post.image_url,
      'datePublished': post.published_at || post.created_at,
      'dateModified': post.updated_at,
      'author': {
        '@type': 'Person',
        'name': post.author_name || 'JobGuinée'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'JobGuinée',
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteUrl}/logo.png`
        }
      },
      'url': `${siteUrl}/blog/${post.slug || post.id}`
    };
  }

  generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    };
  }

  generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
  }

  generateLocalBusinessSchema(company: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': company.name,
      'description': company.description,
      'image': company.logo_url,
      'url': company.website || `${siteUrl}/company/${company.id}`,
      'telephone': company.phone,
      'email': company.email,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': company.address,
        'addressLocality': company.city || 'Conakry',
        'addressRegion': company.region || 'Conakry',
        'addressCountry': 'GN'
      },
      'geo': company.latitude && company.longitude ? {
        '@type': 'GeoCoordinates',
        'latitude': company.latitude,
        'longitude': company.longitude
      } : undefined,
      'openingHoursSpecification': company.opening_hours ? {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'opens': '08:00',
        'closes': '17:00'
      } : undefined,
      'priceRange': company.price_range,
      'aggregateRating': company.rating ? {
        '@type': 'AggregateRating',
        'ratingValue': company.rating,
        'reviewCount': company.review_count || 0,
        'bestRating': 5,
        'worstRating': 1
      } : undefined
    };
  }

  generateEmployerAggregateRatingSchema(company: any, ratings: any) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': company.name,
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': ratings.average_rating,
        'reviewCount': ratings.total_reviews,
        'bestRating': 5,
        'worstRating': 1
      },
      'review': ratings.reviews?.map((review: any) => ({
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': review.author_name || 'Anonymous'
        },
        'datePublished': review.created_at,
        'reviewBody': review.text,
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': review.rating,
          'bestRating': 5,
          'worstRating': 1
        }
      }))
    };
  }

  generateAggregateOfferSchema(job: any) {
    if (!job.salary_min || !job.salary_max) return undefined;

    return {
      '@context': 'https://schema.org',
      '@type': 'AggregateOffer',
      'priceCurrency': 'GNF',
      'lowPrice': job.salary_min,
      'highPrice': job.salary_max,
      'offerCount': 1,
      'availability': 'https://schema.org/InStock',
      'priceSpecification': {
        '@type': 'UnitPriceSpecification',
        'price': (job.salary_min + job.salary_max) / 2,
        'priceCurrency': 'GNF',
        'unitText': 'MONTH'
      }
    };
  }

  generateVideoObjectSchema(video: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': video.title,
      'description': video.description,
      'thumbnailUrl': video.thumbnail_url,
      'uploadDate': video.upload_date || video.created_at,
      'duration': video.duration,
      'contentUrl': video.url,
      'embedUrl': video.embed_url,
      'interactionStatistic': {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/WatchAction',
        'userInteractionCount': video.view_count || 0
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'JobGuinée',
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteUrl}/logo.png`
        }
      }
    };
  }

  generateEventSchema(event: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': event.title,
      'description': event.description,
      'startDate': event.start_date,
      'endDate': event.end_date,
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': event.is_online ?
        'https://schema.org/OnlineEventAttendanceMode' :
        'https://schema.org/OfflineEventAttendanceMode',
      'location': event.is_online ? {
        '@type': 'VirtualLocation',
        'url': event.online_url
      } : {
        '@type': 'Place',
        'name': event.venue_name,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': event.address,
          'addressLocality': event.city || 'Conakry',
          'addressCountry': 'GN'
        }
      },
      'image': event.image_url,
      'organizer': {
        '@type': 'Organization',
        'name': event.organizer || 'JobGuinée',
        'url': siteUrl
      },
      'offers': event.price || event.is_paid ? {
        '@type': 'Offer',
        'price': event.price || 0,
        'priceCurrency': 'GNF',
        'availability': 'https://schema.org/InStock',
        'url': `${siteUrl}/events/${event.id}`,
        'validFrom': event.registration_start_date
      } : {
        '@type': 'Offer',
        'price': 0,
        'priceCurrency': 'GNF',
        'availability': 'https://schema.org/InStock',
        'url': `${siteUrl}/events/${event.id}`
      }
    };
  }

  generateProductSchema(product: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description,
      'image': product.image_url,
      'brand': {
        '@type': 'Brand',
        'name': 'JobGuinée'
      },
      'offers': {
        '@type': 'Offer',
        'price': product.price,
        'priceCurrency': 'GNF',
        'availability': product.in_stock ?
          'https://schema.org/InStock' :
          'https://schema.org/OutOfStock',
        'url': `${siteUrl}/products/${product.id}`,
        'seller': {
          '@type': 'Organization',
          'name': 'JobGuinée'
        }
      },
      'aggregateRating': product.rating ? {
        '@type': 'AggregateRating',
        'ratingValue': product.rating,
        'reviewCount': product.review_count || 0,
        'bestRating': 5,
        'worstRating': 1
      } : undefined,
      'review': product.reviews?.map((review: any) => ({
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': review.author_name
        },
        'datePublished': review.created_at,
        'reviewBody': review.text,
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': review.rating,
          'bestRating': 5,
          'worstRating': 1
        }
      }))
    };
  }

  generateReviewSchema(review: any, itemReviewed: any) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Review',
      'author': {
        '@type': 'Person',
        'name': review.author_name || 'Anonymous'
      },
      'datePublished': review.created_at,
      'reviewBody': review.text,
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': review.rating,
        'bestRating': 5,
        'worstRating': 1
      },
      'itemReviewed': {
        '@type': itemReviewed.type || 'Organization',
        'name': itemReviewed.name
      }
    };
  }

  generateNewsArticleSchema(article: any) {
    const siteUrl = 'https://jobguinee.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': article.title,
      'description': article.excerpt || article.description,
      'image': article.image_url,
      'datePublished': article.published_at,
      'dateModified': article.updated_at,
      'author': {
        '@type': 'Person',
        'name': article.author_name || 'JobGuinée'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'JobGuinée',
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteUrl}/logo.png`
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `${siteUrl}/news/${article.slug || article.id}`
      },
      'articleSection': article.category,
      'keywords': article.tags?.join(', ')
    };
  }

  injectSchemas(schemas: SchemaData[]) {
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    schemas.forEach(schema => {
      if (schema.is_active && schema.schema_json) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema.schema_json);
        document.head.appendChild(script);
      }
    });
  }

  private mapContractType(contractType?: string): string {
    const mapping: Record<string, string> = {
      'CDI': 'FULL_TIME',
      'CDD': 'TEMPORARY',
      'Stage': 'INTERN',
      'Freelance': 'CONTRACTOR',
      'Temps partiel': 'PART_TIME'
    };

    return mapping[contractType || ''] || 'FULL_TIME';
  }
}

export const schemaService = new SchemaService();
