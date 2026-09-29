"use client";
import { getSocket } from "@/lib/soket";
import React, { useEffect, useRef } from "react";

function GeoUpdater({ userId }: { userId: string }) {
  const socketRef = useRef<any | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!navigator.geolocation) return;
    socketRef.current = getSocket();
    socketRef.current.emit("identify", userId);

    const watcher = navigator.geolocation.watchPosition(
      ({ coords }) => {   
        if (!socketRef.current) return;
        socketRef.current.emit("update-location", {
          userId,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      (error) => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
      },
    );
    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [userId]);
  return null;
}

export default GeoUpdater;
