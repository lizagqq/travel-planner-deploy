import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ onAddPoint }) => {
  const [markers, setMarkers] = useState([]);

  // Центр карты, Кавказ
  const center = [43.5, 43.0];
  const zoom = 8;

  // Новые более близкие границы Кавказа
  const bounds = [
    [42.5, 40.0], // Южный угол (широта, долгота)
    [44.5, 46.0], // Северный угол (широта, долгота)
  ];

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const newMarker = {
          id: Date.now(),
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };
        setMarkers([...markers, newMarker]);
        onAddPoint(newMarker);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      bounds={bounds} // Ограничение карты на Кавказ
      maxBoundsViscosity={1.0} // Сделать ограничение жестким
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} />
      ))}
    </MapContainer>
  );
};

export default MapComponent;
