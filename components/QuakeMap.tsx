"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Quake } from "@/lib/types";

const INDONESIA_CENTER: [number, number] = [-2.5, 118];

function severityOf(magnitude: number): "high" | "medium" | "low" {
  if (magnitude >= 6) return "high";
  if (magnitude >= 5) return "medium";
  return "low";
}

function markerSize(magnitude: number): number {
  return Math.min(Math.max(18 + (magnitude - 4.5) * 7, 18), 46);
}

function buildIcon(quake: Quake): L.DivIcon {
  const size = markerSize(quake.magnitude);
  return L.divIcon({
    className: "",
    html: `<div class="quake-marker" data-severity="${severityOf(quake.magnitude)}" style="width:${size}px;height:${size}px">${
      quake.magnitude.toFixed(1)
    }</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * Peta sebaran gempa. Harus dirender di sisi client — dipakai lewat
 * next/dynamic dengan ssr:false karena Leaflet membutuhkan window.
 */
export default function QuakeMap({ quakes }: { quakes: Quake[] }) {
  if (quakes.length === 0) {
    return (
      <div className="grid h-72 place-items-center rounded-xl border border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Tidak ada lokasi gempa untuk ditampilkan.
      </div>
    );
  }

  return (
    <MapContainer
      center={INDONESIA_CENTER}
      zoom={5}
      scrollWheelZoom={false}
      className="h-[420px] w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {quakes.map((quake, index) => (
        <Marker
          key={`${quake.datetime}-${index}`}
          position={[quake.latitude, quake.longitude]}
          icon={buildIcon(quake)}
        >
          <Popup>
            <b>M{quake.magnitude.toFixed(1)}</b> — kedalaman {quake.depthKm} km
            <br />
            {quake.wilayah}
            <br />
            <small>{quake.datetime || "waktu tidak tersedia"} (WIB)</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
