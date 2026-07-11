/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface MapMarker {
  id: string;
  name?: string;
  lat: number;
  lng: number;
  status?: 'active' | 'stopped' | 'offline' | string;
  iconType?: 'employee' | 'geofence' | 'stop' | 'current';
  label?: string;
  color?: string;
}

interface MapGeofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  status: 'Active' | 'Inactive';
}

interface MapMockProps {
  markers?: MapMarker[];
  paths?: { lat: number; lng: number }[];
  geofences?: MapGeofence[];
  selectedMarkerId?: string | null;
  activeRouteIndex?: number | null; // index inside the paths to animate replay
  onMarkerClick?: (id: string) => void;
  heightClass?: string;
  isSatellite?: boolean;
}

export default function MapMock({
  markers = [],
  paths = [],
  geofences = [],
  selectedMarkerId = null,
  activeRouteIndex = null,
  onMarkerClick,
  heightClass = "h-[450px]",
  isSatellite = false
}: MapMockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const pathLayerRef = useRef<L.Polyline | null>(null);
  const trailLayerRef = useRef<L.Polyline | null>(null);
  const geofencesGroupRef = useRef<L.FeatureGroup | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS dynamically
  useEffect(() => {
    const cssId = 'leaflet-css-injection';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    setLeafletLoaded(true);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current) return;

    const defaultCenter: L.LatLngExpression = [28.6139, 77.2090]; // Delhi NCR
    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 11,
      zoomControl: true,
      attributionControl: false
    });

    const tileUrl = isSatellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);
    const geofencesGroup = L.featureGroup().addTo(map);

    mapRef.current = map;
    markersGroupRef.current = markersGroup;
    geofencesGroupRef.current = geofencesGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletLoaded, isSatellite]);

  // Sync Geofences
  useEffect(() => {
    const map = mapRef.current;
    const group = geofencesGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    geofences.forEach(gf => {
      if (!gf.lat || !gf.lng) return;

      const isActive = gf.status === 'Active';
      const color = isActive ? '#10b981' : '#94a3b8';

      const circle = L.circle([gf.lat, gf.lng], {
        radius: gf.radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: isActive ? undefined : '4, 4'
      });

      circle.bindTooltip(`<strong>Geofence:</strong> ${gf.name}<br/>Radius: ${gf.radius}m<br/>Status: ${gf.status}`, {
        permanent: false,
        direction: 'top'
      });

      group.addLayer(circle);
    });
  }, [geofences, leafletLoaded]);

  // Sync Path Coordinates & Active Replay Trails
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pathLayerRef.current) {
      pathLayerRef.current.remove();
      pathLayerRef.current = null;
    }
    if (trailLayerRef.current) {
      trailLayerRef.current.remove();
      trailLayerRef.current = null;
    }

    if (!paths || paths.length === 0) return;

    const latLngs = paths.map(p => L.latLng(p.lat, p.lng));

    const basePolyline = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.4,
      dashArray: '5, 8'
    }).addTo(map);
    pathLayerRef.current = basePolyline;

    if (paths.length > 1) {
      map.fitBounds(basePolyline.getBounds(), { padding: [40, 40] });
    }

    if (activeRouteIndex !== null && activeRouteIndex >= 0) {
      const activeSegment = latLngs.slice(0, activeRouteIndex + 1);
      if (activeSegment.length > 0) {
        const trailPolyline = L.polyline(activeSegment, {
          color: '#10b981',
          weight: 5,
          opacity: 0.95
        }).addTo(map);
        trailLayerRef.current = trailPolyline;
      }
    }
  }, [paths, activeRouteIndex, leafletLoaded]);

  // Sync Markers
  useEffect(() => {
    const map = mapRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    let fitBoundsList: L.LatLng[] = [];

    markers.forEach(marker => {
      if (!marker.lat || !marker.lng) return;

      const isSelected = selectedMarkerId === marker.id;
      const statusColors: Record<string, string> = {
        active: 'bg-emerald-500 ring-emerald-400',
        stopped: 'bg-amber-500 ring-amber-400',
        offline: 'bg-rose-500 ring-rose-400',
      };
      const statusColorClass = statusColors[marker.status || 'offline'] || 'bg-blue-500 ring-blue-400';
      const labelText = marker.label || marker.name || 'Worker';

      const customIconHtml = `
        <div id="marker-${marker.id}" class="relative flex flex-col items-center transition-all duration-300">
          <div class="relative flex items-center justify-center">
            ${marker.status === 'active' ? `<div class="absolute w-7 h-7 bg-emerald-500/30 rounded-full animate-ping"></div>` : ''}
            <div class="h-6 w-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-extrabold text-[10px] ${statusColorClass} transition-transform ${isSelected ? 'scale-125 border-emerald-300 ring-4' : 'hover:scale-110'}">
              ${labelText.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div class="absolute top-7 bg-slate-900 border border-slate-700 text-white font-bold text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm pointer-events-none ${isSelected ? 'scale-110 bg-emerald-950 font-black border-emerald-600' : 'opacity-85'}">
            ${labelText}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customIconHtml,
        className: 'custom-leaflet-div-icon',
        iconSize: [24, 40],
        iconAnchor: [12, 12]
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: customIcon
      });

      leafletMarker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(marker.id);
        }
      });

      group.addLayer(leafletMarker);
      fitBoundsList.push(L.latLng(marker.lat, marker.lng));
    });

    if (fitBoundsList.length > 0 && selectedMarkerId === null && paths.length === 0) {
      const bounds = L.latLngBounds(fitBoundsList);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (selectedMarkerId) {
      const activeMarker = markers.find(m => m.id === selectedMarkerId);
      if (activeMarker && activeMarker.lat && activeMarker.lng) {
        map.setView([activeMarker.lat, activeMarker.lng], 14, { animate: true });
      }
    }
  }, [markers, selectedMarkerId, paths, onMarkerClick, leafletLoaded]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
      <div 
        ref={containerRef} 
        className={`w-full ${heightClass} z-10`}
      />
      
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-slate-600 font-bold pointer-events-none uppercase tracking-wider shadow-md border border-slate-200 flex items-center gap-1.5 font-sans">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Leaflet • OpenStreetMap Live Core ({isSatellite ? 'SATELLITE' : 'VECTOR'})</span>
      </div>

      {paths && paths.length > 1 && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-md text-[11px] font-bold text-slate-700 border border-slate-200 pointer-events-none">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-[ping_1.5s_infinite]" />
          <span>Active Route Playback Trace Ready</span>
        </div>
      )}
    </div>
  );
}