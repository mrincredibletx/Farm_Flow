'use client';

import React, { useState } from 'react';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import { searchLocation } from '@/lib/api';
import { SearchResult } from '@/lib/types';

interface SearchBarProps {
  onSelectLocation: (lat: number, lng: number, name: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await searchLocation(query);
      setResults(res);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    onSelectLocation(lat, lng, item.display_name);
    setQuery(item.display_name.split(',')[0]);
    setIsOpen(false);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full z-30">
      <form onSubmit={handleSearch} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length === 0) setIsOpen(false);
          }}
          placeholder="Search location..."
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2.5 pl-8 sm:pl-10 pr-7 sm:pr-10 text-xs sm:text-sm glass-input rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3.5 text-cyan-400" />
        
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute right-2.5 sm:right-3 text-cyan-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 sm:right-3 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        ) : null}
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass-panel-elevated rounded-xl overflow-hidden shadow-2xl py-1 z-50 max-h-60 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-start gap-2.5 transition-colors border-b border-white/5 last:border-none"
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-cyan-400 shrink-0" />
              <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

