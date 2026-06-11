"use client";

import L from "leaflet";
import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { StadiumModal } from "@/components/map/stadium-modal";
import type { Match, Stadium } from "@/lib/types";

const stadiumIcon = L.divIcon({
  className: "",
  html: '<div class="stadium-pin">🏟️</div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export function StadiumMap({
  stadiums,
  matches,
}: {
  stadiums: Stadium[];
  matches: Match[];
}) {
  const [selected, setSelected] = useState<Stadium | null>(null);

  return (
    <div className="overflow-hidden rounded-[8px] border border-white/15">
      <MapContainer
        center={[34.5, -98.5]}
        zoom={3}
        minZoom={3}
        scrollWheelZoom
        className="h-[620px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stadiums.map((stadium) => (
          <Marker
            key={stadium.id}
            position={[stadium.lat, stadium.lng]}
            icon={stadiumIcon}
            eventHandlers={{ click: () => setSelected(stadium) }}
          >
            <Popup>
              <strong>{stadium.name}</strong>
              <br />
              {stadium.city}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {selected && (
        <StadiumModal
          stadium={selected}
          matches={matches.filter((match) => match.stadium.id === selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
