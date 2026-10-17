import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface IndustryCardProps {
  icon: LucideIcon;
  name: string;
  isHovered?: boolean;
}

export const IndustryCard: React.FC<IndustryCardProps> = ({
  icon: Icon,
  name,
  isHovered = false,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl p-6 sm:p-7 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center border ${
        isHovered
          ? 'border-[#FF642D] shadow-md ring-1 ring-[#FF642D]/20'
          : 'border-[#E5E7EB] hover:border-[#FF642D] hover:shadow-md'
      }`}
    >
      <div className="w-10 h-10 flex items-center justify-center text-[#FF642D] mb-3 shrink-0">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-[15px] font-bold text-[#191919] leading-snug">
        {name}
      </h3>
    </div>
  );
};
