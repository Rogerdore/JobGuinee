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
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{action.label}</p>
                {action.description && (
                  <p className="text-xs text-gray-500 truncate">{action.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
