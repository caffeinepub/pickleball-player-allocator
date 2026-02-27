import React, { useState, useEffect, useRef } from 'react';
import { Search, User, MessageCircle, X } from 'lucide-react';
import { useSearchPlayers } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function PlayerSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useSearchPlayers(debouncedSearch);

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewProfile = (principalId: string) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate({ to: '/player/$principalId', params: { principalId } });
  };

  const handleMessage = (principalId: string) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate({ to: '/messages/$principalId', params: { principalId } });
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => debouncedSearch.trim().length > 0 && setIsOpen(true)}
          className="pl-8 pr-7 h-8 text-sm bg-background/80 border-border/60 focus:border-primary/60 rounded-full"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[260px]">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No players found
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-border/50">
              {results.map((player) => (
                <li
                  key={player.id.toString()}
                  className="px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {player.name}
                        </p>
                        {player.mobileNumber && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{player.mobileNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewProfile(player.id.toString())}
                        title="View Profile"
                      >
                        <User className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMessage(player.id.toString())}
                        title="Message"
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
