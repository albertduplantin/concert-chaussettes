"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Music } from "lucide-react";

interface Groupe {
  id: string;
  nom: string;
  ville: string | null;
  latitude: number | null;
  longitude: number | null;
  thumbnailUrl: string | null;
  genres: { id: string; nom: string }[];
}

interface GroupesMapProps {
  groupes: Groupe[];
}

// Custom marker icon
const createCustomIcon = (thumbnailUrl: string | null) => {
  if (thumbnailUrl) {
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid #f97316;
          background: url(${thumbnailUrl}) center/cover;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid #f97316;
        background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

export function GroupesMap({ groupes }: GroupesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create map centered on France
    const map = L.map(mapRef.current, {
      center: [46.603354, 1.888334], // Center of France
      zoom: 6,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add markers for each groupe
    const markers: L.Marker[] = [];

    groupes.forEach((groupe) => {
      if (groupe.latitude && groupe.longitude) {
        const marker = L.marker([groupe.latitude, groupe.longitude], {
          icon: createCustomIcon(groupe.thumbnailUrl),
        });

        // Create popup content
        const genresHtml = groupe.genres
          .slice(0, 3)
          .map((g) => `<span style="
            background: rgba(255,255,255,0.1);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: rgba(255,255,255,0.8);
          ">${g.nom}</span>`)
          .join(" ");

        const popupContent = `
          <div style="
            min-width: 200px;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <a href="/groupes/${groupe.id}" style="
              display: block;
              text-decoration: none;
              color: inherit;
            ">
              <h3 style="
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
                color: white;
              ">${groupe.nom}</h3>
              ${groupe.ville ? `
                <p style="
                  margin: 0 0 8px 0;
                  font-size: 13px;
                  color: rgba(255,255,255,0.7);
                ">${groupe.ville}</p>
              ` : ""}
              ${genresHtml ? `
                <div style="
                  display: flex;
                  flex-wrap: wrap;
                  gap: 4px;
                  margin-bottom: 8px;
                ">${genresHtml}</div>
              ` : ""}
              <span style="
                color: #f97316;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                Voir le profil →
              </span>
            </a>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: "dark-popup",
          closeButton: true,
        });

        marker.addTo(map);
        markers.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Add custom CSS for dark popup
    const style = document.createElement("style");
    style.textContent = `
      .dark-popup .leaflet-popup-content-wrapper {
        background: rgba(17, 24, 39, 0.95);
        color: white;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      }
      .dark-popup .leaflet-popup-tip {
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .dark-popup .leaflet-popup-close-button {
        color: rgba(255, 255, 255, 0.6);
      }
      .dark-popup .leaflet-popup-close-button:hover {
        color: white;
      }
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      style.remove();
    };
  }, [groupes]);

  if (groupes.length === 0) {
    return (
      <div className="w-full h-[500px] bg-white/5 rounded-xl flex flex-col items-center justify-center border border-white/10">
        <Music className="h-12 w-12 text-white/40 mb-4" />
        <p className="text-white/60">Aucun groupe avec localisation</p>
        <p className="text-sm text-white/40 mt-1">
          Les groupes doivent renseigner leur ville pour apparaitre sur la carte
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-xl overflow-hidden border border-white/10"
        style={{ background: "#111827" }}
      />
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/70">
        {groupes.length} groupe{groupes.length !== 1 ? "s" : ""} sur la carte
      </div>
    </div>
  );
}
