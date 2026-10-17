import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
