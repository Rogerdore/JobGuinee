import { supabase } from '../lib/supabase';

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CMSSection {
  id: string;
  page_id: string;
  title: string;
  content: string;
  order_index: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  page_id?: string;
  parent_id?: string;
  order_index: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

class CMSService {
  async getPages() {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CMSPage[];
  }

  async getPage(id: string) {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CMSPage;
  }

  async getPageBySlug(slug: string) {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) throw error;
    return data as CMSPage;
  }

  async createPage(page: Partial<CMSPage>) {
    const { data, error } = await supabase
      .from('cms_pages')
      .insert(page)
      .select()
      .single();

    if (error) throw error;
    return data as CMSPage;
  }

  async updatePage(id: string, page: Partial<CMSPage>) {
    const { data, error } = await supabase
      .from('cms_pages')
      .update(page)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CMSPage;
  }

  async deletePage(id: string) {
    const { error } = await supabase
      .from('cms_pages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getSections(pageId: string) {
    const { data, error } = await supabase
      .from('cms_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data as CMSSection[];
  }

  async createSection(section: Partial<CMSSection>) {
    const { data, error } = await supabase
      .from('cms_sections')
      .insert(section)
      .select()
      .single();

    if (error) throw error;
    return data as CMSSection;
  }

  async updateSection(id: string, section: Partial<CMSSection>) {
    const { data, error } = await supabase
      .from('cms_sections')
      .update(section)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CMSSection;
  }

  async deleteSection(id: string) {
    const { error } = await supabase
      .from('cms_sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getNavigationItems() {
    const { data, error } = await supabase
      .from('cms_navigation')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data as NavigationItem[];
  }

  async createNavigationItem(item: Partial<NavigationItem>) {
    const { data, error } = await supabase
      .from('cms_navigation')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as NavigationItem;
  }

  async updateNavigationItem(id: string, item: Partial<NavigationItem>) {
    const { data, error } = await supabase
      .from('cms_navigation')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as NavigationItem;
  }

  async deleteNavigationItem(id: string) {
    const { error } = await supabase
      .from('cms_navigation')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateNavigationOrder(items: { id: string; order_index: number }[]) {
    for (const item of items) {
      await supabase
        .from('cms_navigation')
        .update({ order_index: item.order_index })
        .eq('id', item.id);
    }
  }

  async updateSectionOrder(sections: { id: string; order_index: number }[]) {
    for (const section of sections) {
      await supabase
        .from('cms_sections')
        .update({ order_index: section.order_index })
        .eq('id', section.id);
    }
  }
}

const cmsService = new CMSService();
export default cmsService;
