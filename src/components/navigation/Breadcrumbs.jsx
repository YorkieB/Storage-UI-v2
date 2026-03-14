import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ path, onNavigate, darkMode }) => (
  <div className={`flex items-center space-x-2 text-sm overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
    <button
      onClick={() => onNavigate(null)}
      className={`px-2 py-1 rounded transition-colors flex items-center ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
    >
      <Home className="w-4 h-4 mr-1" />
      Home
    </button>
    {path.map((folder, index) => (
      <React.Fragment key={folder.id}>
        <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
        <button
          onClick={() => onNavigate(folder)}
          className={`px-2 py-1 rounded transition-colors max-w-[150px] truncate ${
            index === path.length - 1
              ? `font-semibold pointer-events-none ${darkMode ? 'text-white' : 'text-gray-900'}`
              : `${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`
          }`}
        >
          {folder.name}
        </button>
      </React.Fragment>
    ))}
  </div>
);

export default Breadcrumbs;
