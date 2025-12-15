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
