// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
//   Play,
//   Square,
//   Navigation,
//   Home,
//   Locate,
//   Compass,
//   LogOut,
// } from "lucide-react";
// import { useI18n } from "../i18n/I18nProvider";

// /* ================= ROUTES ================= */
// const ROUTES = [
//   {
//     id: 1,
//     name: "Route A - Northern Panchayats",
//     area: "Yelahanka, Hesaraghatta, Jala Hobli",
//     color: "#3b82f6",
//     panchayats: [
//       { "id": 301, "name": "Ganjimutt GP", "address": "Ganjimutt / Suralpady area, Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 12.9693, "lng": 74.9380 },
//       { "id": 302, "name": "Badagayedapadavu GP", "address": "Badagayedapadavu, Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 13.005966, "lng": 74.973719 },
//       { "id": 303, "name": "Gurupura (Mooluru) GP", "address": "Gurupura / Mooluru Gram Panchayat area, Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 12.938828, "lng": 74.931107 },
//       { "id": 304, "name": "Aikala GP", "address": "Aikala village, Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 13.06323, "lng": 74.87995 },
//       { "id": 305, "name": "Bellairu / Padupanambur (covers Bellairu)", "address": "Bellairu village (Padupanambur GP area), Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 13.06005, "lng": 74.80367 },
//       { "id": 306, "name": "Adyar GP (rural Adyar area)", "address": "Adyar locality (Mangaluru taluk outskirts), Dakshina Kannada, Karnataka", "lat": 12.86913, "lng": 74.92234 },
//       { "id": 307, "name": "Kaikamba / Kandavara (served by Ganjimutt/Kandavara GPs)", "address": "Kaikamba / Kandavara area, Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 12.96070, "lng": 74.93320 },
//       { "id": 308, "name": "Yedapadav / Badagayedapadav GP", "address": "Yedapadav (Badagayedapadav), Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 13.00843, "lng": 74.97134 },
//       { "id": 309, "name": "Harekala / Harekala-Narayanpur GP area", "address": "Harekala area, Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 13.0490, "lng": 74.8190 },
//       { "id": 310, "name": "Badagaulipady / Ganjimata GP area", "address": "Badagaulipady (Ganjimata area), Mangaluru Taluk, Dakshina Kannada, Karnataka", "lat": 13.02, "lng": 74.89 },
//       { "id": 311, "name": "Kinnigoli / nearby panchayat (example: Kinnigoli GP area)", "address": "Kinnigoli area (near Mangalore–Moodabidri road), Dakshina Kannada, Karnataka", "lat": 13.0315, "lng": 74.9720 },
//       { "id": 312, "name": "Mulki-block GP (example: Mulki / nearby Gram Panchayat)", "address": "Mulki / nearby Gram Panchayat area, Dakshina Kannada, Karnataka", "lat": 13.1120, "lng": 74.7720 }
//     ],
//   },
// ];

// /* ================= CSS ================= */
// if (!document.getElementById("leaflet-css")) {
//   const css = document.createElement("link");
//   css.id = "leaflet-css";
//   css.rel = "stylesheet";
//   css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
//   document.head.appendChild(css);
// }
// if (!document.getElementById("leaflet-routing-css")) {
//   const css = document.createElement("link");
//   css.id = "leaflet-routing-css";
//   css.rel = "stylesheet";
//   css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.css";
//   document.head.appendChild(css);
// }

// /* ================= MAIN COMPONENT ================= */
// export default function DriverDashboard() {
//   const { t } = useI18n();
//   const [status, setStatus] = useState("idle");
//   const [selectedRoute, setSelectedRoute] = useState(null);
//   const [currentPanchayatIndex, setCurrentPanchayatIndex] = useState(0);
//   const [leafletLoaded, setLeafletLoaded] = useState(false);
//   const [showMap, setShowMap] = useState(true);
//   const [userLocation, setUserLocation] = useState(null);
//   const [speed, setSpeed] = useState(0);
//   const [heading, setHeading] = useState(null);
//   const [distanceToNext, setDistanceToNext] = useState(null);

//   const mapRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const routingControlRef = useRef(null);

//   const currentPanchayat = selectedRoute?.panchayats[currentPanchayatIndex];

//   /* Load Leaflet scripts */
//   useEffect(() => {
//     const loadScript = (src, id) =>
//       new Promise((resolve, reject) => {
//         if (document.getElementById(id)) return resolve();
//         const s = document.createElement("script");
//         s.id = id;
//         s.src = src;
//         s.onload = resolve;
//         s.onerror = reject;
//         document.body.appendChild(s);
//       });
//     (async () => {
//       await loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js", "leaflet-js");
//       await loadScript(
//         "https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js",
//         "leaflet-routing-js"
//       );
//       setLeafletLoaded(true);
//     })();
//   }, []);

//   /* GPS tracking */
//   useEffect(() => {
//     if (status !== "active") return;
//     if (!navigator.geolocation) return;

//     const watchId = navigator.geolocation.watchPosition(
//       (pos) => {
//         const { latitude, longitude, speed, heading } = pos.coords;
//         setUserLocation({ lat: latitude, lng: longitude });
//         setSpeed(speed ? (speed * 3.6).toFixed(1) : 0); // m/s → km/h
//         setHeading(heading ?? null);
//       },
//       (err) => console.error("Geo error:", err),
//       { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
//     );

//     return () => navigator.geolocation.clearWatch(watchId);
//   }, [status]);

//   /* Calculate distance between coordinates (stable reference for effects) */
//   const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
//     const R = 6371; // km
//     const dLat = ((lat2 - lat1) * Math.PI) / 180;
//     const dLon = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos((lat1 * Math.PI) / 180) *
//         Math.cos((lat2 * Math.PI) / 180) *
//         Math.sin(dLon / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   }, []);

//   /* Compute distance to next panchayat */
//   useEffect(() => {
//     if (userLocation && currentPanchayat) {
//       const dist = calculateDistance(
//         userLocation.lat,
//         userLocation.lng,
//         currentPanchayat.lat,
//         currentPanchayat.lng
//       );
//       setDistanceToNext(dist);
//     }
//   }, [userLocation, currentPanchayat, calculateDistance]);

//   /* Initialize map */
//   useEffect(() => {
//     if (!leafletLoaded || !mapRef.current || !selectedRoute || status !== "active" || !currentPanchayat) return;
//     const L = window.L;
//     if (!L) return;

//     if (!mapInstanceRef.current) {
//       const map = L.map(mapRef.current).setView([currentPanchayat.lat, currentPanchayat.lng], 13);
//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "© OpenStreetMap contributors",
//         maxZoom: 19,
//       }).addTo(map);
//       mapInstanceRef.current = map;
//     } else {
//       // keep map centered with current target if already created
//       mapInstanceRef.current.setView([currentPanchayat.lat, currentPanchayat.lng], 13);
//     }
//   }, [leafletLoaded, selectedRoute, status, currentPanchayat]);

//   /* Routing and markers */
//   useEffect(() => {
//     const L = window.L;
//     if (!L || !leafletLoaded || !selectedRoute || !currentPanchayat || !mapInstanceRef.current) return;
//     const map = mapInstanceRef.current;

//     // remove previous routing control if any
//     if (routingControlRef.current) {
//       try {
//         map.removeControl(routingControlRef.current);
//       } catch {
//         /* ignore */
//       }
//       routingControlRef.current = null;
//     }

//     // place marker for the current panchayat
//     const targetMarker = L.marker([currentPanchayat.lat, currentPanchayat.lng])
//       .addTo(map)
//       .bindPopup(currentPanchayat.name);

//     if (userLocation) {
//       routingControlRef.current = L.Routing.control({
//         waypoints: [
//           L.latLng(userLocation.lat, userLocation.lng),
//           L.latLng(currentPanchayat.lat, currentPanchayat.lng),
//         ],
//         router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
//         addWaypoints: false,
//         show: false,
//         lineOptions: { styles: [{ color: selectedRoute.color, weight: 5 }] },
//         createMarker: () => null,
//       }).addTo(map);
//     }

//     map.setView([currentPanchayat.lat, currentPanchayat.lng], 13);

//     // cleanup marker when deps change
//     return () => {
//       try {
//         map.removeLayer(targetMarker);
//       } catch {
//         /* ignore */
//       }
//     };
//   }, [userLocation, currentPanchayatIndex, currentPanchayat, leafletLoaded, selectedRoute]);

//   /* Route controls */
//   const startRoute = (route) => {
//     setSelectedRoute(route);
//     setStatus("active");
//     setCurrentPanchayatIndex(0);
//   };

//   const resetRoute = () => {
//     setStatus("idle");
//     setSelectedRoute(null);
//     setCurrentPanchayatIndex(0);
//     if (mapInstanceRef.current) {
//       mapInstanceRef.current.remove();
//       mapInstanceRef.current = null;
//     }
//     routingControlRef.current = null;
//   };

//   /* Convert heading degrees to direction text */
//   const getDirection = (deg) => {
//     if (deg == null) return "N/A";
//     const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
//     return dirs[Math.round(deg / 45) % 8];
//   };

//   /* ================= UI ================= */
//   if (status === "idle") {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
//         <div className="max-w-5xl mx-auto">
//           <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-xl p-8 mb-8 flex justify-between items-center">
//             <div className="flex items-center gap-4">
//               <div className="bg-white/20 p-4 rounded-xl">
//                 <Navigation size={40} />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold">{t("driver.headerTitle")}</h1>
//                 <p className="text-green-100">{t("driver.headerSubtitle")}</p>
//               </div>
//             </div>

//             <button
//               onClick={() => {
//                 localStorage.removeItem("auth_token");
//                 window.location.href = "/";
//               }}
//               className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
//             >
//               <LogOut size={18} />
//               <span>{t("actions.logout")}</span>
//             </button>
//           </div>

//           <div className="grid md:grid-cols-2 gap-6">
//             {ROUTES.map((r) => (
//               <div
//                 key={r.id}
//                 className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
//               >
//                 <div
//                   className="p-6 text-white"
//                   style={{ background: `linear-gradient(135deg, ${r.color} 0%, ${r.color}cc 100%)` }}
//                 >
//                   <h2 className="text-2xl font-bold mb-1">{r.name}</h2>
//                   <p>{r.area}</p>
//                 </div>
//                 <div className="p-6">
//                   <div className="flex items-center gap-2 mb-4">
//                     <Home className="text-gray-500" size={18} />
//                     <span>{r.panchayats.length} {t("driver.panchayatsCount")}</span>
//                   </div>
//                   <button
//                     onClick={() => startRoute(r)}
//                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold flex justify-center gap-2 items-center"
//                   >
//                     <Play size={20} />
//                     {t("driver.startNav")}
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (status === "active") {
//     return (
//       <div className="min-h-screen bg-slate-50 p-4">
//         <div className="max-w-5xl mx-auto mb-6">
//           <div
//             className="rounded-2xl shadow-xl text-white p-4 flex justify-between items-center"
//             style={{ background: `linear-gradient(135deg, ${selectedRoute.color} 0%, ${selectedRoute.color}cc 100%)` }}
//           >
//             <h2 className="text-xl font-bold">{selectedRoute.name}</h2>
//             <button
//               onClick={resetRoute}
//               className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg flex items-center gap-2"
//             >
//               <Square size={16} /> {t("driver.stop")}
//             </button>
//           </div>
//         </div>

//         <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
//           <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between">
//             <h3 className="font-bold flex items-center gap-2">
//               <Navigation size={20} /> {t("driver.turnByTurn")}
//             </h3>
//             <button
//               onClick={() => setShowMap(!showMap)}
//               className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm"
//             >
//               {showMap ? t("driver.hide") : t("driver.show")}
//             </button>
//           </div>

//           {showMap && (
//             <div className="relative h-[600px] bg-gray-900">
//               {leafletLoaded ? (
//                 <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
//               ) : (
//                 <div className="h-full flex items-center justify-center text-white">
//                   <Locate size={48} className="animate-spin opacity-50" />
//                   <p>{t("driver.loadingMap")}</p>
//                 </div>
//               )}

//               {/* Overlay Info */}
//               {userLocation && currentPanchayat && (
//                 <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 flex justify-between items-center">
//                   <div>
//                     <div className="text-sm text-gray-500">{t("driver.currentSpeed")}</div>
//                     <div className="text-3xl font-bold text-blue-600">{speed} km/h</div>
//                   </div>
//                   <div className="text-center">
//                     <Compass
//                       size={36}
//                       className="mx-auto text-gray-700"
//                       style={{ transform: `rotate(${heading || 0}deg)`, transition: "transform 0.5s linear" }}
//                     />
//                     <div className="text-sm font-semibold text-gray-600">{getDirection(heading)}</div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-sm text-gray-500">{t("driver.nextStop")}</div>
//                     <div className="font-bold">{currentPanchayat.name}</div>
//                     {distanceToNext != null && (
//                       <div className="text-gray-600 text-sm">
//                         {distanceToNext < 1
//                           ? `${(distanceToNext * 1000).toFixed(0)} m`
//                           : `${distanceToNext.toFixed(2)} km`}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         <div className="text-center text-gray-600 font-semibold">
//           {distanceToNext !== null && currentPanchayat && (
//             <p>
//               {distanceToNext < 0.3
//                 ? `${t("driver.arrivingAt").replace("{name}", currentPanchayat.name)}`
//                 : heading !== null
//                 ? `${t("driver.headTowards").replace("{dir}", getDirection(heading)).replace("{name}", currentPanchayat.name)}`
//                 : `${t("driver.navigatingTowards").replace("{name}", currentPanchayat.name)}`}
//             </p>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return null;
// }



import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Square,
  Navigation,
  Home,
  Locate,
  Compass,
  LogOut,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

/* ================= PANCHAYAT MASTER DATA ================= */
const PANCHAYAT_LOCATIONS = {
  "Neermarga": { lat: 12.9150, lng: 74.8950, address: "Neermarga, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Pudu": { lat: 12.9850, lng: 74.8650, address: "Pudu, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Harekala": { lat: 13.0490, lng: 74.8190, address: "Harekala area, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Ullala": { lat: 12.8070, lng: 74.8570, address: "Ullala, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Ganjimutt GP": { lat: 12.9693, lng: 74.9380, address: "Ganjimutt / Suralpady area, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Badagayedapadavu GP": { lat: 13.005966, lng: 74.973719, address: "Badagayedapadavu, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Gurupura (Mooluru) GP": { lat: 12.938828, lng: 74.931107, address: "Gurupura / Mooluru Gram Panchayat area, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Aikala GP": { lat: 13.06323, lng: 74.87995, address: "Aikala village, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Bellairu / Padupanambur": { lat: 13.06005, lng: 74.80367, address: "Bellairu village (Padupanambur GP area), Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Adyar GP": { lat: 12.86913, lng: 74.92234, address: "Adyar locality (Mangaluru taluk outskirts), Dakshina Kannada, Karnataka" },
  "Kaikamba / Kandavara": { lat: 12.96070, lng: 74.93320, address: "Kaikamba / Kandavara area, Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Yedapadav / Badagayedapadav GP": { lat: 13.00843, lng: 74.97134, address: "Yedapadav (Badagayedapadav), Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Badagaulipady / Ganjimata GP": { lat: 13.02, lng: 74.89, address: "Badagaulipady (Ganjimata area), Mangaluru Taluk, Dakshina Kannada, Karnataka" },
  "Kinnigoli": { lat: 13.0315, lng: 74.9720, address: "Kinnigoli area (near Mangalore–Moodabidri road), Dakshina Kannada, Karnataka" },
  "Mulki": { lat: 13.1120, lng: 74.7720, address: "Mulki / nearby Gram Panchayat area, Dakshina Kannada, Karnataka" },
};

/* ================= CSS ================= */
if (!document.getElementById("leaflet-css")) {
  const css = document.createElement("link");
  css.id = "leaflet-css";
  css.rel = "stylesheet";
  css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(css);
}
if (!document.getElementById("leaflet-routing-css")) {
  const css = document.createElement("link");
  css.id = "leaflet-routing-css";
  css.rel = "stylesheet";
  css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.css";
  document.head.appendChild(css);
}

/* ================= MAIN COMPONENT ================= */
export default function DriverDashboard() {
  const [status, setStatus] = useState("idle");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentPanchayatIndex, setCurrentPanchayatIndex] = useState(0);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(null);
  const [distanceToNext, setDistanceToNext] = useState(null);
  const [capacityData, setCapacityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);

  const currentPanchayat = selectedRoute?.panchayats[currentPanchayatIndex];

  /* Fetch capacity data from API */
  useEffect(() => {
    const fetchCapacityData = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/";
const response = await fetch(`${API_BASE}api/panchayat-weightledgers/summary`);

        if (!response.ok) throw new Error('Failed to fetch capacity data');
        const result = await response.json();
        
        if (result.success && result.data) {
          setCapacityData(result.data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching capacity data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacityData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchCapacityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* Calculate capacity percentage */
  const getCapacityPercentage = (panchayatName) => {
    const data = capacityData.find(d => d.panchayat === panchayatName);
    if (!data || data.totalDryWasteCapacity === 0) return 0;
    return (data.totalDryWasteStored / data.totalDryWasteCapacity) * 100;
  };

  /* Check if panchayat needs collection (>80% capacity) */
  const needsCollection = (panchayatName) => {
    return getCapacityPercentage(panchayatName) >= 80;
  };

  /* Generate dynamic routes based on capacity */
  const generateDynamicRoutes = useCallback(() => {
  if (capacityData.length === 0) return [];

  const urgentPanchayats = capacityData
    .filter(d => needsCollection(d.panchayat))
    .map((d, idx) => {
      const location = PANCHAYAT_LOCATIONS[d.panchayat];
      return {
        id: 1000 + idx,
        name: d.panchayat,
        address: location?.address || `${d.panchayat}, Mangaluru Taluk`,
        lat: location?.lat || 12.9141,
        lng: location?.lng || 74.8560,
        stored: d.totalDryWasteStored,
        capacity: d.totalDryWasteCapacity,
        percentage: getCapacityPercentage(d.panchayat),
        urgent: true,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const otherPanchayats = capacityData
    .filter(d => !needsCollection(d.panchayat))
    .map((d, idx) => {
      const location = PANCHAYAT_LOCATIONS[d.panchayat];
      return {
        id: 2000 + idx,
        name: d.panchayat,
        address: location?.address || `${d.panchayat}, Mangaluru Taluk`,
        lat: location?.lat || 12.9141,
        lng: location?.lng || 74.8560,
        stored: d.totalDryWasteStored,
        capacity: d.totalDryWasteCapacity,
        percentage: getCapacityPercentage(d.panchayat),
        urgent: false,
      };
    });

  const allPanchayats = [...urgentPanchayats, ...otherPanchayats];
  if (allPanchayats.length === 0) return [];

  return [{
    id: 1,
    name: urgentPanchayats.length > 0
      ? "Priority Route - High Capacity Areas"
      : "Standard Collection Route",
    area: `${allPanchayats.length} Panchayats (${urgentPanchayats.length} urgent)`,
    color: urgentPanchayats.length > 0 ? "#dc2626" : "#3b82f6",
    panchayats: allPanchayats,
    urgentCount: urgentPanchayats.length,
  }];
}, [capacityData, getCapacityPercentage, needsCollection]);

  const ROUTES = generateDynamicRoutes();

  /* Load Leaflet scripts */
  useEffect(() => {
    const loadScript = (src, id) =>
      new Promise((resolve, reject) => {
        if (document.getElementById(id)) return resolve();
        const s = document.createElement("script");
        s.id = id;
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });
    (async () => {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js", "leaflet-js");
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js",
        "leaflet-routing-js"
      );
      setLeafletLoaded(true);
    })();
  }, []);

  /* GPS tracking */
  useEffect(() => {
    if (status !== "active") return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setSpeed(speed ? (speed * 3.6).toFixed(1) : 0);
        setHeading(heading ?? null);
      },
      (err) => console.error("Geo error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [status]);

  /* Calculate distance between coordinates */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  /* Compute distance to next panchayat */
  useEffect(() => {
    if (userLocation && currentPanchayat) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        currentPanchayat.lat,
        currentPanchayat.lng
      );
      setDistanceToNext(dist);
    }
  }, [userLocation, currentPanchayat, calculateDistance]);

  /* Initialize map */
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !selectedRoute || status !== "active" || !currentPanchayat) return;
    const L = window.L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([currentPanchayat.lat, currentPanchayat.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([currentPanchayat.lat, currentPanchayat.lng], 13);
    }
  }, [leafletLoaded, selectedRoute, status, currentPanchayat]);

  /* Routing and markers */
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletLoaded || !selectedRoute || !currentPanchayat || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch {}
      routingControlRef.current = null;
    }

    const markerColor = currentPanchayat.urgent ? 'red' : 'blue';
    const targetMarker = L.marker([currentPanchayat.lat, currentPanchayat.lng])
      .addTo(map)
      .bindPopup(`
        <strong>${currentPanchayat.name}</strong><br/>
        ${currentPanchayat.urgent ? '⚠️ URGENT - ' : ''}
        Capacity: ${currentPanchayat.percentage.toFixed(1)}%<br/>
        ${currentPanchayat.stored.toFixed(0)} / ${currentPanchayat.capacity} kg
      `);

    if (userLocation) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(currentPanchayat.lat, currentPanchayat.lng),
        ],
        router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
        addWaypoints: false,
        show: false,
        lineOptions: { styles: [{ color: currentPanchayat.urgent ? '#dc2626' : selectedRoute.color, weight: 5 }] },
        createMarker: () => null,
      }).addTo(map);
    }

    map.setView([currentPanchayat.lat, currentPanchayat.lng], 13);

    return () => {
      try {
        map.removeLayer(targetMarker);
      } catch {}
    };
  }, [userLocation, currentPanchayatIndex, currentPanchayat, leafletLoaded, selectedRoute]);

  /* Route controls */
  const startRoute = (route) => {
    setSelectedRoute(route);
    setStatus("active");
    setCurrentPanchayatIndex(0);
  };

  const resetRoute = () => {
    setStatus("idle");
    setSelectedRoute(null);
    setCurrentPanchayatIndex(0);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    routingControlRef.current = null;
  };

  const nextPanchayat = () => {
    if (currentPanchayatIndex < selectedRoute.panchayats.length - 1) {
      setCurrentPanchayatIndex(prev => prev + 1);
    } else {
      alert("Route completed!");
      resetRoute();
    }
  };

  /* Convert heading degrees to direction text */
  const getDirection = (deg) => {
    if (deg == null) return "N/A";
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  /* ================= UI ================= */
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-xl p-8 mb-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <Navigation size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Smart Driver Dashboard</h1>
                <p className="text-green-100">Capacity-Based Route Management</p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("auth_token");
                window.location.href = "/";
              }}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <Locate size={48} className="animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-gray-600">Loading capacity data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle size={20} />
                <span>Error loading data: {error}</span>
              </div>
            </div>
          )}

          {!loading && ROUTES.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <Home size={48} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Routes Available</h3>
              <p className="text-gray-600">No panchayats require collection at this time.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {ROUTES.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div
                  className="p-6 text-white relative"
                  style={{ background: `linear-gradient(135deg, ${r.color} 0%, ${r.color}cc 100%)` }}
                >
                  {r.urgentCount > 0 && (
                    <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-semibold">{r.urgentCount} Urgent</span>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mb-1">{r.name}</h2>
                  <p>{r.area}</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Home className="text-gray-500" size={18} />
                      <span>{r.panchayats.length} Panchayats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-gray-500" size={18} />
                      <span>
                        {r.panchayats.filter(p => p.urgent).length} at high capacity (&gt;80%)
                      </span>
                    </div>
                  </div>

                  {/* Show first 3 panchayats preview */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                    <div className="font-semibold text-gray-700 mb-2">Route Preview:</div>
                    {r.panchayats.slice(0, 3).map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center py-1">
                        <span className={p.urgent ? "text-red-600 font-semibold" : "text-gray-600"}>
                          {idx + 1}. {p.name} {p.urgent && "⚠️"}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {p.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                    {r.panchayats.length > 3 && (
                      <div className="text-gray-400 text-xs pt-1">
                        + {r.panchayats.length - 3} more stops
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => startRoute(r)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold flex justify-center gap-2 items-center"
                  >
                    <Play size={20} />
                    Start Navigation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-5xl mx-auto mb-6">
          <div
            className="rounded-2xl shadow-xl text-white p-4 flex justify-between items-center"
            style={{ background: `linear-gradient(135deg, ${selectedRoute.color} 0%, ${selectedRoute.color}cc 100%)` }}
          >
            <div>
              <h2 className="text-xl font-bold">{selectedRoute.name}</h2>
              <p className="text-sm opacity-90">
                Stop {currentPanchayatIndex + 1} of {selectedRoute.panchayats.length}
              </p>
            </div>
            <button
              onClick={resetRoute}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg flex items-center gap-2"
            >
              <Square size={16} /> Stop
            </button>
          </div>
        </div>

        {/* Current Panchayat Info Card */}
        {currentPanchayat && (
          <div className="max-w-5xl mx-auto mb-6">
            <div className={`rounded-xl shadow-lg p-6 ${currentPanchayat.urgent ? 'bg-red-50 border-2 border-red-300' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {currentPanchayat.urgent && <AlertTriangle className="text-red-600" size={24} />}
                    <h3 className="text-2xl font-bold text-gray-800">{currentPanchayat.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{currentPanchayat.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Capacity</div>
                  <div className={`text-3xl font-bold ${currentPanchayat.urgent ? 'text-red-600' : 'text-green-600'}`}>
                    {currentPanchayat.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{currentPanchayat.stored.toFixed(0)} kg stored</span>
                  <span>{currentPanchayat.capacity} kg capacity</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      currentPanchayat.percentage >= 80 ? 'bg-red-600' :
                      currentPanchayat.percentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(currentPanchayat.percentage, 100)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={nextPanchayat}
                disabled={distanceToNext && distanceToNext > 0.5}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  distanceToNext && distanceToNext > 0.5
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {distanceToNext && distanceToNext > 0.5
                  ? `Arrive at location to mark complete (${distanceToNext.toFixed(2)} km away)`
                  : 'Mark Complete & Continue to Next'}
              </button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Navigation size={20} /> Turn-by-Turn Navigation
            </h3>
            <button
              onClick={() => setShowMap(!showMap)}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm"
            >
              {showMap ? "Hide Map" : "Show Map"}
            </button>
          </div>

          {showMap && (
            <div className="relative h-[600px] bg-gray-900">
              {leafletLoaded ? (
                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
              ) : (
                <div className="h-full flex items-center justify-center text-white">
                  <Locate size={48} className="animate-spin opacity-50" />
                  <p>Loading Map...</p>
                </div>
              )}

              {userLocation && currentPanchayat && (
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Current Speed</div>
                    <div className="text-3xl font-bold text-blue-600">{speed} km/h</div>
                  </div>
                  <div className="text-center">
                    <Compass
                      size={36}
                      className="mx-auto text-gray-700"
                      style={{ transform: `rotate(${heading || 0}deg)`, transition: "transform 0.5s linear" }}
                    />
                    <div className="text-sm font-semibold text-gray-600">{getDirection(heading)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Next Stop</div>
                    <div className="font-bold">{currentPanchayat.name}</div>
                    {distanceToNext != null && (
                      <div className="text-gray-600 text-sm">
                        {distanceToNext < 1
                          ? `${(distanceToNext * 1000).toFixed(0)} m`
                          : `${distanceToNext.toFixed(2)} km`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-gray-600 font-semibold">
          {distanceToNext !== null && currentPanchayat && (
            <p>
              {distanceToNext < 0.3
                ? `Arriving at ${currentPanchayat.name}`
                : heading !== null
                ? `Head ${getDirection(heading)} towards ${currentPanchayat.name}`
                : `Navigating to ${currentPanchayat.name}`}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}