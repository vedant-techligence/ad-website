import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

function RobotsMap({ robots = [] }) {
  const validRobots = robots.filter((r) => r.currentLocation?.lat && r.currentLocation?.lng);
  const center = validRobots.length
    ? [validRobots[0].currentLocation.lat, validRobots[0].currentLocation.lng]
    : [28.6139, 77.209];

  return (
    <div className="h-[360px] overflow-hidden rounded-[24px] border border-slate-200">
      <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validRobots.map((robot) => (
          <CircleMarker
            key={robot.id}
            center={[robot.currentLocation.lat, robot.currentLocation.lng]}
            pathOptions={{
              color: robot.status === "active" ? "#0f766e" : robot.status === "charging" ? "#f97316" : "#475569",
              fillColor: robot.status === "active" ? "#14b8a6" : robot.status === "charging" ? "#fb923c" : "#64748b",
              fillOpacity: 0.85,
            }}
            radius={12}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{robot.name}</p>
                <p className="text-xs text-slate-600">{robot.city}</p>
                <p className="text-xs text-slate-600">Impressions today: {robot.todayImpressions}</p>
                <p className="text-xs text-slate-600">Battery: {robot.batteryLevel}%</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default RobotsMap;
