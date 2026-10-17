import React from 'react';
import { Plus, X } from 'lucide-react';

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

export const FAQItem: React.FC<FAQItemProps> = ({
  id,
  question,
  answer,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden transition-all duration-200">
      <button
        type="button"
        id={`faq-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${id}`}
        onClick={() => onToggle(id)}
        className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
      >
        <span className="text-[16px] sm:text-[17px] font-bold text-[#191919] leading-snug">
          {question}
        </span>
        <div className="shrink-0 text-[#94A3B8] hover:text-[#191919] transition-colors p-1">
          {isOpen ? (
            <X className="w-4 h-4 stroke-[2.2]" />
          ) : (
            <Plus className="w-4 h-4 stroke-[2.2]" />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          id={`faq-answer-${id}`}
          role="region"
          aria-labelledby={`faq-btn-${id}`}
          className="px-6 sm:px-7 pb-7 -mt-1 text-[14px] sm:text-[14.5px] text-[#667085] leading-[1.65] animate-in fade-in duration-150"
        >
          {answer}
        </div>
      )}
    </div>
  );
};
