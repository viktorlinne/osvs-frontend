import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export type ManualLocationValue = { lat: number; lng: number } | null;

type Props = {
  value: ManualLocationValue;
  onChange: (value: { lat: number; lng: number }) => void;
  disabled?: boolean;
};

const SWEDEN_CENTER: [number, number] = [62.0, 15.0];

const pickerIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#16a34a;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function RecenterMap({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);

  return null;
}

function ClickCapture({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (value: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      if (disabled) return;
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export function ManualLocationPicker({ value, onChange, disabled = false }: Props) {
  const lat = value ? value.lat : SWEDEN_CENTER[0];
  const lng = value ? value.lng : SWEDEN_CENTER[1];
  const center: [number, number] = [lat, lng];
  const zoom = value ? 13 : 5;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "320px", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap lat={lat} lng={lng} zoom={zoom} />
      <ClickCapture disabled={disabled} onSelect={onChange} />

      {value ? (
        <Marker
          position={[value.lat, value.lng]}
          icon={pickerIcon}
          draggable={!disabled}
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const point = marker.getLatLng();
              onChange({ lat: point.lat, lng: point.lng });
            },
          }}
        />
      ) : null}
    </MapContainer>
  );
}

export default ManualLocationPicker;
