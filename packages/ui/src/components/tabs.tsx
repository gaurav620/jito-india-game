import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Casino Pill Tabs
 * Recreates the pill button switcher observed in the reference modal dialogs.
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-6 py-2 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-150 border-2 select-none ${
              isActive
                ? 'bg-gradient-to-b from-[#A5D6A7] via-[#2E7D32] to-[#1B5E20] text-white border-[#FFE57F] shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-105'
                : 'bg-gradient-to-b from-[#C8E6C9] via-[#81C784] to-[#4CAF50] text-[#1A3018] border-[#A5D6A7] hover:brightness-105 opacity-80'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
