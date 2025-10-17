import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface JourneyPoint {
  neighborhood?: string;
  district?: string;
  city: string;
  country: string;
  coordinates: [number, number];
  date: string;
  owner: {
    username: string;
    displayName: string;
  };
  formattedLocation: string;
}

interface BookJourneyMapProps {
  journeyPoints: JourneyPoint[];
  className?: string;
}

const BookJourneyMap: React.FC<BookJourneyMapProps> = ({ journeyPoints, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Use real journey points from props
    const points: JourneyPoint[] = [...journeyPoints];

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [46, 2],
      zoom: 5,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Add CartoDB Voyager tiles (English labels with blue oceans)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Custom marker icons
    const createMarkerIcon = (index: number, isCurrent: boolean) => {
      const color = isCurrent ? '#dc2626' : '#2563eb';
      const size = isCurrent ? 35 : 30;
      
      // Create marker element safely
      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
      `;
      markerDiv.textContent = (index + 1).toString();
      
      // Add pulse animation style if current
      if (isCurrent) {
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `;
        document.head.appendChild(style);
      }
      
      return L.divIcon({
        html: markerDiv.outerHTML,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
    };

    // Intelligent marker placement and path rendering
    const markers: L.Marker[] = [];

    // Helper to create a stable key for coordinates (avoids floating errors)
    const coordKey = (c: [number, number]) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`;

    // Group points by exact coordinates (same city)
    const groups = new Map<string, { base: [number, number]; points: { point: JourneyPoint; index: number }[] }>();
    points.forEach((p, idx) => {
      const key = coordKey(p.coordinates);
      const group = groups.get(key) || { base: p.coordinates, points: [] };
      group.points.push({ point: p, index: idx });
      groups.set(key, group);
    });

    // Intelligent cluster positioning for any number of markers in the same location
    const getClusterPositions = (base: [number, number], count: number): [number, number][] => {
      if (count <= 1) return [base];
      
      const results: [number, number][] = [];
      
      // Very tight clustering - markers should almost touch when zoomed in
      if (count <= 4) {
        // Linear arrangement for small groups
        const spacing = 0.0008; // Very small spacing
        const startOffset = -(count - 1) * spacing / 2;
        for (let i = 0; i < count; i++) {
          const offset = startOffset + i * spacing;
          results.push([base[0] + offset, base[1] + offset * 0.7]);
        }
      } else if (count <= 12) {
        // Compact grid arrangement for medium groups
        const spacing = 0.0006;
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const startRow = -(rows - 1) * spacing / 2;
        const startCol = -(cols - 1) * spacing / 2;
        
        for (let i = 0; i < count; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const lat = base[0] + startRow + row * spacing;
          const lng = base[1] + (startCol + col * spacing) / Math.cos((base[0] * Math.PI) / 180);
          results.push([lat, lng]);
        }
      } else {
        // Multi-ring circular arrangement for large groups
        const baseRadius = 0.0005;
        let currentIndex = 0;
        
        // Place first marker at center
        if (currentIndex < count) {
          results.push(base);
          currentIndex++;
        }
        
        // Add concentric rings
        let ring = 1;
        while (currentIndex < count) {
          const radius = baseRadius * ring;
          const markersInRing = Math.min(6 * ring, count - currentIndex); // 6 markers per ring unit
          
          for (let i = 0; i < markersInRing && currentIndex < count; i++) {
            const angle = (2 * Math.PI * i) / markersInRing;
            const dLat = radius * Math.cos(angle);
            const dLng = (radius * Math.sin(angle)) / Math.cos((base[0] * Math.PI) / 180);
            results.push([base[0] + dLat, base[1] + dLng]);
            currentIndex++;
          }
          ring++;
        }
      }
      
      return results;
    };

    // Place markers using intelligent clustering with highest numbers on top
    const allPositionedPoints: Array<{ point: JourneyPoint; index: number; displayPosition: [number, number] }> = [];
    const markerPositions: [number, number][] = []; // Track actual positioned coordinates in chronological order
    
    // Process each group and assign cluster positions with highest numbers in prominent positions
    groups.forEach((group, key) => {
      const clusterPositions = getClusterPositions(group.base, group.points.length);
      
      if (group.points.length === 1) {
        // Single point - use base coordinates
        const pointData = group.points[0];
        const position = group.base;
        allPositionedPoints.push({
          point: pointData.point,
          index: pointData.index,
          displayPosition: position
        });
        markerPositions[pointData.index] = position;
      } else {
        // Multiple points - assign positions with highest number getting most prominent spot
        const sortedGroupPoints = [...group.points].sort((a, b) => a.index - b.index);
        const highestNumberPoint = sortedGroupPoints[sortedGroupPoints.length - 1];
        const otherPoints = sortedGroupPoints.slice(0, -1);
        
        // Place highest numbered point at the first (most prominent) position
        allPositionedPoints.push({
          point: highestNumberPoint.point,
          index: highestNumberPoint.index,
          displayPosition: clusterPositions[0]
        });
        markerPositions[highestNumberPoint.index] = clusterPositions[0];
        
        // Place other points in remaining positions
        otherPoints.forEach((pointData, posIndex) => {
          const position = clusterPositions[posIndex + 1];
          allPositionedPoints.push({
            point: pointData.point,
            index: pointData.index,
            displayPosition: position
          });
          markerPositions[pointData.index] = position;
        });
      }
    });

    // Add markers to map in order that ensures proper layering (lowest to highest within each group)
    // Sort by index to maintain proper z-order
    const sortedForLayering = [...allPositionedPoints].sort((a, b) => a.index - b.index);
    
    sortedForLayering.forEach(({ point, index, displayPosition }) => {
      const isCurrent = index === points.length - 1;
      const marker = L.marker(displayPosition, {
        icon: createMarkerIcon(index, isCurrent)
      }).addTo(map);

      // Create popup content safely using DOM methods
      const popupContent = document.createElement('div');
      popupContent.style.cssText = 'padding: 12px; min-width: 200px; text-align: center;';
      
      const title = document.createElement('h3');
      title.style.cssText = 'margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1f2937;';
      title.textContent = point.formattedLocation;
      
      const ownerDiv = document.createElement('div');
      ownerDiv.style.marginBottom = '8px';
      
      const ownerLabel = document.createElement('strong');
      ownerLabel.style.color = '#374151';
      ownerLabel.textContent = 'Owner: ';
      
      const ownerLink = document.createElement('a');
      ownerLink.href = `/profile/${point.owner.username}`;
      ownerLink.style.cssText = 'color: #2563eb; text-decoration: none; font-weight: 500;';
      ownerLink.textContent = point.owner.displayName;
      
      ownerDiv.appendChild(ownerLabel);
      ownerDiv.appendChild(ownerLink);
      
      const dateDiv = document.createElement('div');
      dateDiv.style.cssText = `color: #6b7280; font-size: 14px; margin-bottom: ${isCurrent ? '8px' : '0'};`;
      dateDiv.textContent = `Since: ${new Date(point.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`;
      
      popupContent.appendChild(title);
      popupContent.appendChild(ownerDiv);
      popupContent.appendChild(dateDiv);
      
      if (isCurrent) {
        const currentBadge = document.createElement('div');
        currentBadge.style.cssText = `
          background: #fef2f2;
          color: #dc2626;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
        `;
        currentBadge.textContent = '📍 Current Location';
        popupContent.appendChild(currentBadge);
      }

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      markers.push(marker);
    });

    // Build journey path using actual marker positions in chronological order
    if (markerPositions.length > 1) {
      const journeyPath = L.polyline(markerPositions, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
        dashArray: '15, 10',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // Fit map to show all markers with padding
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [journeyPoints]);

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border border-border shadow-lg relative z-0"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default BookJourneyMap;