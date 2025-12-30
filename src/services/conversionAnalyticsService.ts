import { supabase } from '../lib/supabase';

export interface ConversionEvent {
  event_type: 'modal_view' | 'modal_interaction' | 'modal_conversion' | 'modal_dismiss';
  modal_type: 'auth_required' | 'application_success' | 'diffusion_proposal' | 'profile_completion';
  user_id?: string;
  session_id: string;
  context?: Record<string, any>;
  action?: string;
  timestamp: string;
}

export interface ConversionMetrics {
  modal_type: string;
  total_views: number;
  total_conversions: number;
  total_dismissals: number;
  conversion_rate: number;
  avg_time_to_action: number;
  popular_actions: Array<{ action: string; count: number }>;
}

class ConversionAnalyticsService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  async trackModalView(
    modalType: ConversionEvent['modal_type'],
    userId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('conversion_events').insert({
        event_type: 'modal_view',
        modal_type: modalType,
        user_id: userId,
        session_id: this.sessionId,
        context: context || {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.debug('Analytics tracking error:', error);
    }
  }

  async trackModalInteraction(
    modalType: ConversionEvent['modal_type'],
    action: string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('conversion_events').insert({
        event_type: 'modal_interaction',
        modal_type: modalType,
        user_id: userId,
        session_id: this.sessionId,
        action,
        context: context || {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.debug('Analytics tracking error:', error);
    }
  }

  async trackModalConversion(
    modalType: ConversionEvent['modal_type'],
    action: string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('conversion_events').insert({
        event_type: 'modal_conversion',
        modal_type: modalType,
        user_id: userId,
        session_id: this.sessionId,
        action,
        context: context || {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.debug('Analytics tracking error:', error);
    }
  }

  async trackModalDismiss(
    modalType: ConversionEvent['modal_type'],
    userId?: string,
    timeSpent?: number,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('conversion_events').insert({
        event_type: 'modal_dismiss',
        modal_type: modalType,
        user_id: userId,
        session_id: this.sessionId,
        context: { ...context, time_spent_seconds: timeSpent },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.debug('Analytics tracking error:', error);
    }
  }

  async getConversionMetrics(
    modalType: ConversionEvent['modal_type'],
    dateFrom?: string,
    dateTo?: string
  ): Promise<ConversionMetrics | null> {
    try {
      let query = supabase
        .from('conversion_events')
        .select('*')
        .eq('modal_type', modalType);

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom);
      }
      if (dateTo) {
        query = query.lte('timestamp', dateTo);
      }

      const { data, error } = await query;

      if (error || !data) {
        return null;
      }

      const views = data.filter((e) => e.event_type === 'modal_view').length;
      const conversions = data.filter((e) => e.event_type === 'modal_conversion').length;
      const dismissals = data.filter((e) => e.event_type === 'modal_dismiss').length;

      const actionCounts: Record<string, number> = {};
      data
        .filter((e) => e.action)
        .forEach((e) => {
          actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
        });

      const popularActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

      return {
        modal_type: modalType,
        total_views: views,
        total_conversions: conversions,
        total_dismissals: dismissals,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        avg_time_to_action: 0,
        popular_actions: popularActions,
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      return null;
    }
  }

  async getAbandonmentFunnel(): Promise<Array<{ step: string; users: number; dropoff_rate: number }>> {
    try {
      const { data } = await supabase
        .from('conversion_events')
        .select('event_type, session_id')
        .order('timestamp', { ascending: true });

      if (!data) return [];

      const sessionSteps: Record<string, Set<string>> = {};

      data.forEach((event) => {
        if (!sessionSteps[event.session_id]) {
          sessionSteps[event.session_id] = new Set();
        }
        sessionSteps[event.session_id].add(event.event_type);
      });

      const steps = ['modal_view', 'modal_interaction', 'modal_conversion'];
      const funnel = steps.map((step, index) => {
        const usersAtStep = Object.values(sessionSteps).filter((s) => s.has(step)).length;
        const previousUsers = index > 0
          ? Object.values(sessionSteps).filter((s) => s.has(steps[index - 1])).length
          : usersAtStep;
        const dropoffRate = previousUsers > 0
          ? ((previousUsers - usersAtStep) / previousUsers) * 100
          : 0;

        return {
          step,
          users: usersAtStep,
          dropoff_rate: Math.round(dropoffRate * 100) / 100,
        };
      });

      return funnel;
    } catch (error) {
      console.error('Error getting abandonment funnel:', error);
      return [];
    }
  }

  async getUserJourney(userId: string): Promise<ConversionEvent[]> {
    try {
      const { data } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Error getting user journey:', error);
      return [];
    }
  }
}

export const conversionAnalyticsService = new ConversionAnalyticsService();
