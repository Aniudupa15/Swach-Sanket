// import express from "express";
// import User from "../models/secondary/User.js";
// import WeightLedger from "../models/secondary/WeightLedger.js";

// const router = express.Router();

// router.get("/panchayat-weightledgers/summary", async (req, res) => {
//   try {
//     const ledgers = await WeightLedger.find({});
//     const users = await User.find({});

//     if (!ledgers.length || !users.length) {
//       return res.status(404).json({ success: false, message: "No data found" });
//     }

//     const userMap = new Map(users.map(u => [u._id.toString(), u]));
//     const panchayatSummary = {};

//     for (const ledger of ledgers) {
//       const user = userMap.get(ledger.userId);
//       if (!user) continue;

//       const p = user.panchayat;
//       if (!panchayatSummary[p]) {
//         panchayatSummary[p] = { panchayat: p, totalDryWasteStored: 0, totalDryWasteCapacity: 0 };
//       }
//       panchayatSummary[p].totalDryWasteStored += ledger.dryWasteStored || 0;
//       panchayatSummary[p].totalDryWasteCapacity += user.dryWasteCapacity || 0;
//     }

//     res.json({
//       success: true,
//       count: Object.keys(panchayatSummary).length,
//       data: Object.values(panchayatSummary),
//     });
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// export default router;


import express from "express";
import User from "../models/secondary/User.js";
import WeightLedger from "../models/secondary/WeightLedger.js";

const router = express.Router();

// Helper: Extract coordinates from Google Maps URL
const extractCoordinates = async (url) => {
  if (!url) return { lat: null, lng: null };

  try {
    // If URL already contains "@lat,lng"
    const matchAt = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (matchAt) return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };

    // If URL contains "?q=lat,lng"
    const matchQ = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (matchQ) return { lat: parseFloat(matchQ[1]), lng: parseFloat(matchQ[2]) };

    // Expand shortened Google Maps link (goo.gl or maps.app.goo.gl)
    if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      const finalUrl = response.url;
      const match = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    return { lat: null, lng: null };
  } catch (err) {
    console.error("Failed to extract coordinates:", err.message);
    return { lat: null, lng: null };
  }
};

router.get("/panchayat-weightledgers/summary", async (req, res) => {
  try {
    const ledgers = await WeightLedger.find({});
    const users = await User.find({});

    if (!ledgers.length || !users.length) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const panchayatSummary = {};

    for (const ledger of ledgers) {
      const user = userMap.get(ledger.userId);
      if (!user) continue;

      const p = user.panchayat;
      if (!panchayatSummary[p]) {
        panchayatSummary[p] = {
          panchayat: p,
          totalDryWasteStored: 0,
          totalDryWasteCapacity: 0,
          shedLocations: [],
        };
      }

      panchayatSummary[p].totalDryWasteStored += ledger.dryWasteStored || 0;
      panchayatSummary[p].totalDryWasteCapacity += user.dryWasteCapacity || 0;

      // Extract and include shedLocation coordinates
      if (user.shedLocation) {
        const coords = await extractCoordinates(user.shedLocation);
        panchayatSummary[p].shedLocations.push({
          name: user.supervisorName || user.name || "Unknown",
          link: user.shedLocation,
          latitude: coords.lat,
          longitude: coords.lng,
        });
      }
    }

    // Convert map to array and send response
    res.json({
      success: true,
      count: Object.keys(panchayatSummary).length,
      data: Object.values(panchayatSummary),
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
