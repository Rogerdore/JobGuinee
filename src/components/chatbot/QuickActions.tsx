import React from 'react';
import {
  FileText,
  Briefcase,
  Coins,
  LayoutDashboard,
  MessageCircle,
  User,
  Settings,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { QuickAction } from '../../services/chatbotService';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Briefcase,
  Coins,
  LayoutDashboard,
  MessageCircle,
  User,
  Settings,
  HelpCircle
};

export default function QuickActions({ actions, onAction }: QuickActionsProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions rapides</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || MessageCircle;

          return (
            <button
              key={action.id}
              onClick={() => onAction(action)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl hover:from-cyan-100 hover:to-blue-100 hover:border-cyan-300 hover:shadow-md hover:scale-105 transition-all duration-300 text-left group"
              style={{
                animation: `fadeInUp 0.4s ease-out ${actions.indexOf(action) * 0.1}s both`
              }}
            >
              <div className="p-2 bg-white rounded-lg group-hover:bg-cyan-50 transition-colors shadow-sm">
                <Icon className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate group-hover:text-cyan-900 transition-colors">{action.label}</p>
                {action.description && (
                  <p className="text-xs text-slate-500 truncate group-hover:text-cyan-700 transition-colors">{action.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
