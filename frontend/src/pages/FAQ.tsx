import React, { useState } from 'react';
import { FAQItem } from '../components/FAQItem';

export const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-4': true,
    'faq-5': true,
    'faq-6': true,
    'faq-7': true,
  });

  const handleToggle = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqData = [
    {
      id: 'faq-1',
      question: 'What is SmartStock.AI?',
      answer: 'SmartStock.AI is an AI-powered inventory management software built specifically for Indian retailers. It automates stock tracking, demand forecasting, and reordering for spare parts shops, hardware stores, electrical retailers, and more.',
    },
    {
      id: 'faq-2',
      question: 'How does AI barcode scanning work?',
      answer: 'Simply scan any product barcode using your phone camera. Our AI instantly identifies the product and auto-fills brand name, MRP, category, and specifications — saving you hours of manual data entry.',
    },
    {
      id: 'faq-3',
      question: 'Which industries does SmartStock.AI support?',
      answer: 'SmartStock.AI is designed for mobile spare parts shops, laptop accessories stores, electrical supply dealers, hardware & plumbing stores, automotive parts retailers, tool dealers, CCTV equipment stores, and ecommerce sellers across India.',
    },
    {
      id: 'faq-4',
      question: 'Does SmartStock.AI work on mobile phones?',
      answer: 'Yes! SmartStock.AI is fully cloud-based and works on any smartphone, tablet, or computer. You can manage your inventory from anywhere — at the shop counter, warehouse, or on the go.',
    },
    {
      id: 'faq-5',
      question: 'How much does SmartStock.AI cost?',
      answer: 'SmartStock.AI offers a forever-free plan for up to 50 products. Paid plans start at ₹499/month (Starter, up to 500 products). The Pro plan at ₹1,999/month includes advanced AI features, invoice scanning, and demand forecasting. No credit card required to get started.',
    },
    {
      id: 'faq-6',
      question: 'Can I get WhatsApp alerts for low stock?',
      answer: 'Yes! SmartStock.AI sends automatic WhatsApp notifications when any product drops below your set reorder level. You can also reorder from suppliers directly via WhatsApp with pre-filled product details.',
    },
    {
      id: 'faq-7',
      question: 'Is my data safe with SmartStock.AI?',
      answer: 'Absolutely. We use bank-grade encryption, automatic cloud backups, and enterprise-level security. Your inventory data is stored on secure servers with 99.9% uptime guarantee.',
    },
    {
      id: 'faq-8',
      question: 'How long does setup take?',
      answer: 'Most retailers are up and running within 5 minutes. Simply sign up, scan your first products, and you\'re ready. We also offer free onboarding assistance for larger inventories.',
    },
  ];

  return (
    <div className="bg-[#F5F7FA] text-[#191919] py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[800px] mx-auto space-y-12">
        
        {/* Centered Title */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#191919] tracking-tight">
            Frequently Asked Questions
          </h1>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqData.map((item) => (
            <FAQItem
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
              isOpen={!!openItems[item.id]}
              onToggle={handleToggle}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
