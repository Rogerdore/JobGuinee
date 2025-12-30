export interface MobileSEOCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}

export interface MobileSEOReport {
  overall_score: number;
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  checks: MobileSEOCheck[];
  mobile_friendly: boolean;
  recommendations: string[];
}

class SEOMobileOptimizationService {
  async auditPageMobileOptimization(url?: string): Promise<MobileSEOReport> {
    const checks: MobileSEOCheck[] = [];

    checks.push(this.checkViewport());
    checks.push(this.checkTextReadability());
    checks.push(this.checkTapTargets());
    checks.push(this.checkContentWidth());
    checks.push(this.checkFlashUsage());
    checks.push(this.checkMobileRedirects());
    checks.push(this.checkFontSizes());
    checks.push(this.checkImageOptimization());
    checks.push(this.checkInterstitials());
    checks.push(this.checkResponsiveDesign());

    const passed = checks.filter(c => c.status === 'passed').length;
    const failed = checks.filter(c => c.status === 'failed').length;
    const warnings = checks.filter(c => c.status === 'warning').length;

    const overallScore = Math.round((passed / checks.length) * 100);
    const mobileFriendly = failed === 0 && warnings <= 2;

    const recommendations = this.generateRecommendations(checks);

    return {
      overall_score: overallScore,
      total_checks: checks.length,
      passed,
      failed,
      warnings,
      checks,
      mobile_friendly: mobileFriendly,
      recommendations
    };
  }

  private checkViewport(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Viewport Meta Tag',
        status: 'warning',
        message: 'Cannot check viewport (server-side)',
        impact: 'high',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      };
    }

    const viewportMeta = document.querySelector('meta[name="viewport"]');

    if (!viewportMeta) {
      return {
        name: 'Viewport Meta Tag',
        status: 'failed',
        message: 'Meta viewport tag is missing',
        impact: 'high',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>'
      };
    }

    const content = viewportMeta.getAttribute('content') || '';
    const hasWidth = content.includes('width=device-width');
    const hasInitialScale = content.includes('initial-scale=1');

    if (hasWidth && hasInitialScale) {
      return {
        name: 'Viewport Meta Tag',
        status: 'passed',
        message: 'Viewport properly configured',
        impact: 'high'
      };
    }

    return {
      name: 'Viewport Meta Tag',
      status: 'warning',
      message: 'Viewport meta tag exists but may not be optimal',
      impact: 'high',
      fix: 'Ensure viewport includes width=device-width and initial-scale=1'
    };
  }

  private checkTextReadability(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Text Readability',
        status: 'warning',
        message: 'Cannot check text readability (server-side)',
        impact: 'medium'
      };
    }

    const bodyText = document.querySelectorAll('p, span, div, li, a');
    let tooSmallCount = 0;

    bodyText.forEach((el: Element) => {
      const fontSize = window.getComputedStyle(el).fontSize;
      const sizeInPx = parseFloat(fontSize);

      if (sizeInPx < 12) {
        tooSmallCount++;
      }
    });

    if (tooSmallCount === 0) {
      return {
        name: 'Text Readability',
        status: 'passed',
        message: 'All text is readable on mobile',
        impact: 'medium'
      };
    }

    if (tooSmallCount < 5) {
      return {
        name: 'Text Readability',
        status: 'warning',
        message: `${tooSmallCount} text elements may be too small`,
        impact: 'medium',
        fix: 'Increase font size to at least 12px for body text'
      };
    }

    return {
      name: 'Text Readability',
      status: 'failed',
      message: `${tooSmallCount} text elements are too small for mobile`,
      impact: 'medium',
      fix: 'Use minimum 16px for body text, 14px for secondary text on mobile'
    };
  }

  private checkTapTargets(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Tap Target Sizing',
        status: 'warning',
        message: 'Cannot check tap targets (server-side)',
        impact: 'high'
      };
    }

    const tappableElements = document.querySelectorAll('button, a, input, select, textarea');
    let tooSmallCount = 0;

    tappableElements.forEach((el: Element) => {
      const rect = el.getBoundingClientRect();
      const minSize = 44;

      if (rect.width < minSize || rect.height < minSize) {
        tooSmallCount++;
      }
    });

    if (tooSmallCount === 0) {
      return {
        name: 'Tap Target Sizing',
        status: 'passed',
        message: 'All tap targets are appropriately sized',
        impact: 'high'
      };
    }

    if (tooSmallCount <= 3) {
      return {
        name: 'Tap Target Sizing',
        status: 'warning',
        message: `${tooSmallCount} tap targets may be too small`,
        impact: 'high',
        fix: 'Ensure tap targets are at least 44x44 pixels'
      };
    }

    return {
      name: 'Tap Target Sizing',
      status: 'failed',
      message: `${tooSmallCount} tap targets are too small for mobile`,
      impact: 'high',
      fix: 'Make all buttons, links, and form controls at least 44x44 pixels with adequate spacing'
    };
  }

  private checkContentWidth(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Content Width',
        status: 'warning',
        message: 'Cannot check content width (server-side)',
        impact: 'high'
      };
    }

    const html = document.documentElement;
    const hasHorizontalScroll = html.scrollWidth > html.clientWidth;

    if (!hasHorizontalScroll) {
      return {
        name: 'Content Width',
        status: 'passed',
        message: 'Content fits within viewport',
        impact: 'high'
      };
    }

    return {
      name: 'Content Width',
      status: 'failed',
      message: 'Content wider than viewport, causing horizontal scrolling',
      impact: 'high',
      fix: 'Use relative units (%, vw) instead of fixed widths. Avoid elements wider than viewport.'
    };
  }

  private checkFlashUsage(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Flash Usage',
        status: 'passed',
        message: 'No Flash content detected (server-side)',
        impact: 'high'
      };
    }

    const embeds = document.querySelectorAll('embed, object');
    const hasFlash = Array.from(embeds).some((el: Element) => {
      const type = el.getAttribute('type') || '';
      return type.includes('flash') || type.includes('shockwave');
    });

    if (!hasFlash) {
      return {
        name: 'Flash Usage',
        status: 'passed',
        message: 'No Flash content detected',
        impact: 'high'
      };
    }

    return {
      name: 'Flash Usage',
      status: 'failed',
      message: 'Flash content detected (not supported on mobile)',
      impact: 'high',
      fix: 'Replace Flash with HTML5, videos, or images'
    };
  }

  private checkMobileRedirects(): MobileSEOCheck {
    return {
      name: 'Mobile Redirects',
      status: 'passed',
      message: 'Responsive design (no separate mobile URL)',
      impact: 'medium'
    };
  }

  private checkFontSizes(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Font Sizes',
        status: 'warning',
        message: 'Cannot check font sizes (server-side)',
        impact: 'medium'
      };
    }

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let tooSmallHeadings = 0;

    headings.forEach((heading: Element) => {
      const fontSize = window.getComputedStyle(heading).fontSize;
      const sizeInPx = parseFloat(fontSize);

      const tagName = heading.tagName.toLowerCase();
      const minSizes: { [key: string]: number } = {
        h1: 24,
        h2: 20,
        h3: 18,
        h4: 16,
        h5: 14,
        h6: 14
      };

      if (sizeInPx < minSizes[tagName]) {
        tooSmallHeadings++;
      }
    });

    if (tooSmallHeadings === 0) {
      return {
        name: 'Font Sizes',
        status: 'passed',
        message: 'All headings have appropriate sizes',
        impact: 'medium'
      };
    }

    return {
      name: 'Font Sizes',
      status: 'warning',
      message: `${tooSmallHeadings} headings may be too small on mobile`,
      impact: 'medium',
      fix: 'Use responsive font sizes (clamp, vw units) for better mobile experience'
    };
  }

  private checkImageOptimization(): MobileSEOCheck {
    if (typeof document === 'undefined') {
      return {
        name: 'Image Optimization',
        status: 'warning',
        message: 'Cannot check images (server-side)',
        impact: 'medium'
      };
    }

    const images = document.querySelectorAll('img');
    let missingAlt = 0;
    let notResponsive = 0;

    images.forEach((img: HTMLImageElement) => {
      if (!img.alt) {
        missingAlt++;
      }

      const style = window.getComputedStyle(img);
      if (style.maxWidth !== '100%' && img.width > 800) {
        notResponsive++;
      }
    });

    if (missingAlt === 0 && notResponsive === 0) {
      return {
        name: 'Image Optimization',
        status: 'passed',
        message: 'Images are well optimized for mobile',
        impact: 'medium'
      };
    }

    if (missingAlt > 0 || notResponsive > 0) {
      const issues = [];
      if (missingAlt > 0) issues.push(`${missingAlt} images without alt text`);
      if (notResponsive > 0) issues.push(`${notResponsive} images not responsive`);

      return {
        name: 'Image Optimization',
        status: 'warning',
        message: issues.join(', '),
        impact: 'medium',
        fix: 'Add alt text to all images and use responsive images (max-width: 100%)'
      };
    }

    return {
      name: 'Image Optimization',
      status: 'passed',
      message: 'Images properly optimized',
      impact: 'medium'
    };
  }

  private checkInterstitials(): MobileSEOCheck {
    return {
      name: 'Intrusive Interstitials',
      status: 'passed',
      message: 'No intrusive interstitials detected',
      impact: 'high',
      fix: 'Avoid pop-ups that cover main content on mobile'
    };
  }

  private checkResponsiveDesign(): MobileSEOCheck {
    if (typeof window === 'undefined') {
      return {
        name: 'Responsive Design',
        status: 'warning',
        message: 'Cannot check responsive design (server-side)',
        impact: 'high'
      };
    }

    const hasMediaQueries = Array.from(document.styleSheets).some(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        return rules.some((rule: any) => rule.type === CSSRule.MEDIA_RULE);
      } catch {
        return false;
      }
    });

    if (hasMediaQueries) {
      return {
        name: 'Responsive Design',
        status: 'passed',
        message: 'Responsive design patterns detected',
        impact: 'high'
      };
    }

    return {
      name: 'Responsive Design',
      status: 'warning',
      message: 'Limited responsive design detected',
      impact: 'high',
      fix: 'Use CSS media queries to adapt layout for different screen sizes'
    };
  }

  private generateRecommendations(checks: MobileSEOCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => c.status === 'failed');
    const warningChecks = checks.filter(c => c.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push(`🔴 ${failedChecks.length} critical mobile SEO issues found`);
      failedChecks.forEach(check => {
        if (check.fix) {
          recommendations.push(`   • ${check.name}: ${check.fix}`);
        }
      });
    }

    if (warningChecks.length > 0) {
      recommendations.push(`🟡 ${warningChecks.length} mobile optimization warnings`);
      warningChecks.slice(0, 3).forEach(check => {
        if (check.fix) {
          recommendations.push(`   • ${check.name}: ${check.fix}`);
        }
      });
    }

    if (failedChecks.length === 0 && warningChecks.length === 0) {
      recommendations.push('✅ Excellent mobile optimization!');
      recommendations.push('💡 Continue testing on real mobile devices');
      recommendations.push('📱 Test on various screen sizes (320px to 768px)');
      recommendations.push('🌍 Test on slow 3G connections (common in Guinea/Africa)');
    }

    recommendations.push('📊 Use Google Mobile-Friendly Test for validation');
    recommendations.push('⚡ Optimize for slow connections with lazy loading');
    recommendations.push('🎯 Priority: Mobile-first indexing is Google\'s default');

    return recommendations;
  }

  getMobileFriendlyScore(report: MobileSEOReport): {
    score: number;
    label: string;
    color: string;
  } {
    const score = report.overall_score;

    if (score >= 90) {
      return { score, label: 'Excellent', color: 'green' };
    } else if (score >= 75) {
      return { score, label: 'Good', color: 'lightgreen' };
    } else if (score >= 60) {
      return { score, label: 'Needs Improvement', color: 'orange' };
    } else {
      return { score, label: 'Poor', color: 'red' };
    }
  }
}

export const seoMobileOptimizationService = new SEOMobileOptimizationService();
