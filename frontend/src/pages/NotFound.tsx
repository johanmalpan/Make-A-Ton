import React from 'react';
import { NavigationPath } from '../types';
import { Home, AlertCircle } from 'lucide-react';

interface NotFoundProps {
  onNavigate: (path: NavigationPath) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 font-heading">404 - Page Not Found</h1>
      <p className="text-slate-500 text-sm max-w-md mt-2 mb-6">
        The requested subscription ledger or billing resource does not exist or may have been moved.
      </p>
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#101D2D] hover:bg-[#18293e] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
      >
        <Home className="w-4 h-4" />
        Return to Overview Dashboard
      </button>
    </div>
  );
};
