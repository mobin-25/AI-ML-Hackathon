import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isHovered?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  isHovered = false,
}) => {
  return (
    <div
      className={`bg-white border rounded-2xl p-6 sm:p-7 transition-all duration-200 flex flex-col justify-start h-full cursor-default ${
        isHovered
          ? 'border-[#FF642D] shadow-md -translate-y-1'
          : 'border-[#E5E7EB] hover:border-[#FF642D] hover:shadow-md hover:-translate-y-1'
      }`}
    >
      {/* Icon in pale-orange rounded square container */}
      <div className="w-12 h-12 rounded-xl bg-[#FFF1EB] flex items-center justify-center text-[#FF642D] mb-5 shrink-0 transition-colors">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>

      {/* Title */}
      <h3 className="text-[17px] font-bold text-[#191919] mb-2.5 leading-snug">
        {title}
      </h3>

      {/* Description */}
      <p className="text-[14px] text-[#667085] leading-relaxed">
        {description}
      </p>
    </div>
  );
};
