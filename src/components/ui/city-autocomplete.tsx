"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

interface CityResult {
  nom: string;
  code: string; // Code postal
  codeDepartement: string;
  codeRegion: string;
  departement?: { code: string; nom: string };
  region?: { code: string; nom: string };
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (city: {
    ville: string;
    codePostal: string;
    departement: string;
    region: string;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une ville...",
  disabled = false,
  className,
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search cities when value changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Use the French geo API
        const response = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(value)}&fields=nom,code,codeDepartement,codeRegion,departement,region&boost=population&limit=8`
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } catch (error) {
        console.error("City search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  function handleSelect(city: CityResult) {
    onChange(city.nom);
    setIsOpen(false);

    if (onSelect) {
      // Get postal code - use the first one from the commune
      fetchPostalCode(city.code).then((codePostal) => {
        onSelect({
          ville: city.nom,
          codePostal: codePostal || "",
          departement: city.departement?.nom || "",
          region: city.region?.nom || "",
        });
      });
    }
  }

  async function fetchPostalCode(communeCode: string): Promise<string> {
    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes/${communeCode}?fields=codesPostaux`
      );
      if (response.ok) {
        const data = await response.json();
        return data.codesPostaux?.[0] || "";
      }
    } catch {
      // Ignore errors
    }
    return "";
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((city, index) => (
            <button
              key={`${city.code}-${index}`}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3 border-b last:border-0"
              onClick={() => handleSelect(city)}
            >
              <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{city.nom}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {city.departement?.nom || `Dép. ${city.codeDepartement}`}
                  {city.region?.nom && `, ${city.region.nom}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
