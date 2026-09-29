"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Navigation2 } from "lucide-react";

type Props = {
  pickup: string;
  drop: string;
  onChange: (p: string, d: string) => void;
  onDistance: (d: number) => void;
};

function FitBounds({ p1, p2 }: { p1: [number, number]; p2: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitBounds([p1, p2], {
      padding: [72, 72],
      maxZoom: 15,
      animate: true,
      duration: 1,
    });
  }, [p1, p2, map]);
  return null;
}

const pickUpIcon = new L.DivIcon({
  className: "",
  iconSize: [90, 58],
  iconAnchor: [45, 58],
  html: `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      filter:drop-shadow(0 6px 18px rgba(0,0,0,0.22));
    ">
      <div style="
        background:#0a0a0a;
        color:#fff;
        padding:4px 7px;
        border-radius:4px;
        font-size:10px;
        font-weight:800;
        letter-spacing:0.14rem;
        text-transform:uppercase;
        white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        box-shadow:0 2px 12px rgba(0,0,0,0.25);
      ">
        PICKUP
      </div>

      <div style="
        width:2px;
        height:10px;
        background:#0a0a0a;
        opacity:0.4;
      "></div>

      <div style="
        width:13px;
        height:13px;
        background:#0a0a0a;
        border-radius:50%;
        border:3px solid #fff;
        box-shadow:
          0 0 0 2px rgba(0,0,0,0.15),
          0 3px 10px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
});

const dropIcon = new L.DivIcon({
  className: "",
  iconSize: [90, 58],
  iconAnchor: [45, 58],
  html: `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      filter:drop-shadow(0 6px 18px rgba(0,0,0,0.22));
    ">
      <div style="
        background:#0a0a0a;
        color:#fff;
        padding:4px 7px;
        border-radius:4px;
        font-size:10px;
        font-weight:800;
        letter-spacing:0.14rem;
        text-transform:uppercase;
        white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        box-shadow:0 2px 12px rgba(0,0,0,0.25);
      ">
        DROP
      </div>

      <div style="
        width:2px;
        height:10px;
        background:#0a0a0a;
        opacity:0.4;
      "></div>

      <div style="
        width:13px;
        height:13px;
        background:#0a0a0a;
        border-radius:50%;
        border:3px solid #fff;
        box-shadow:
          0 0 0 2px rgba(0,0,0,0.15),
          0 3px 10px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
});

function SearchMap({ pickup, drop, onChange, onDistance }: Props) {
  const [p1, setP1] = useState<[number, number]>();
  const [p2, setP2] = useState<[number, number]>();
  const [route, setRoute] = useState<[number, number][]>();
  const [km, setKm] = useState<number | null>(0);
  const [ready, setReady] = useState(false);
  const geoCoding = async (q: string): Promise<[number, number] | null> => {
    try {
      const { data } = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=en`,
      );
      if (!data.features.length) return null;
      const [lon, lat] = data.features[0].geometry.coordinates;
      return [lat, lon];
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const reverseGeocoding = async (lat: number, lon: number) => {
    try {
      const { data } = await axios.get(
        `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`,
      );
      if (!data.features.length) return null;
      const p = data.features[0].properties;
      return [p.name, p.street, p.country, p.city, p.state]
        .filter(Boolean)
        .join(", ");
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const loadRoute = async (p: [number, number], d: [number, number]) => {
    try {
      const { data } = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${p[1]},${p[0]};${d[1]},${d[0]}?overview=full&geometries=geojson`,    
      );
      if (!data.routes.length) return;

      setRoute(
        data.routes[0].geometry.coordinates.map(([lon, lat]: number[]) => [
          lat,
          lon,
        ]),
      );

      const distKM = +(data.routes[0].distance / 1000).toFixed(2);
      setKm(distKM);
      onDistance(distKM);
    } catch (error) {
      console.log(error);
    }
  };

  const dragPickup = async (lat: number, lon: number) => {
    const addr = await reverseGeocoding(lat, lon);
    setP1([lat, lon]);
    if (p2) {
      await loadRoute([lat, lon], p2);
    }
    onChange(addr!, drop);
  };

  const dragDrop = async (lat: number, lon: number) => {
    const addr = await reverseGeocoding(lat, lon);
    setP2([lat, lon]);
    if (p1) {
      await loadRoute(p1, [lat, lon]);
    }
    onChange(pickup, addr!);
  };

  useEffect(() => {
    setReady(true);
    if (pickup && drop) {
      (async () => {
        const a = await geoCoding(pickup);
        const b = await geoCoding(drop);
        if (!a || !b) return;

        await loadRoute(a, b);
        setP1(a);
        setP2(b);
      })();
    }
  }, [pickup, drop]);

  return (
    <div className="relative w-full h-full bg-zinc-100">
      <MapContainer
        center={p1 ?? [19.076, 72.8777]}
        zoom={13}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com">"CARTO"</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {p1 && p2 && <FitBounds p1={p1} p2={p2} />}
        {p1 && (
          <Marker
            position={p1}
            icon={pickUpIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target.getLatLng();
                dragPickup(m.lat, m.lng);
              },
            }}
          />
        )}
        {p2 && (
          <Marker
            position={p2}
            icon={dropIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target.getLatLng();
                dragDrop(m.lat, m.lng);
              },
            }}
          />
        )}

        {route && route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: "#0a0a0a",
              weight: 4,
              lineCap: "round",
              lineJoin: "round",
            }}
            weight={5}
            opacity={0.5}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      <AnimatePresence>
        {!ready && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 z-[999] bg-white/90 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative w-14 h-14 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900"
              />

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-transparent border-t-zinc-300"
              />
              <MapPin size={15} className="text-zinc-900" />
            </div>
            <div className="text-center">
              <p className="text-zinc-900 text-xs font-black tracking-[0.22em] uppercase">
                Loading Map
              </p>
              <p className="text-zinc-400 text-[10px] font-medium tracking-wider mt-0.5">
                Ploating your route
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && km !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 left-4 z-[500] flex items-center gap-2 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl shadow-lg"
          >
            <Navigation2 className="text-zinc-900" size={13} />
            <span className="text-zinc-900 text-xs font-bold">{km} km</span>
            <span className="w-px h-3 bg-zinc-200" />
            <span>~{Math.max(3, Math.round((km / 25) * 60))} min</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchMap;
