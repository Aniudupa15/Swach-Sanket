// routes/weightLedger.routes.js
const express = require('express');
const router = express.Router();
const WeightLedger = require('../models/WeightLedger');
const User = require('../models/User');

/**
 * GET /api/weightledgers/by-panchayat
 * Fetch all weight ledgers with dryWasteStored and group by panchayat with dryWasteCapacity
 */
router.get('/weightledgers/by-panchayat', async (req, res) => {
  try {
    // Step 1: Fetch all weight ledgers with dryWasteStored
    const weightLedgers = await WeightLedger.find({}, { 
      userId: 1, 
      dryWasteStored: 1,
      date: 1,
      createdAt: 1
    });

    if (!weightLedgers || weightLedgers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No weight ledgers found'
      });
    }

    // Step 2: Extract unique user IDs from weight ledgers
    const userIds = [...new Set(weightLedgers.map(ledger => ledger.userId))];

    // Step 3: Fetch users with panchayat and dryWasteCapacity
    const users = await User.find(
      { _id: { $in: userIds } },
      { 
        _id: 1, 
        panchayat: 1, 
        dryWasteCapacity: 1,
        name: 1 
      }
    );

    // Step 4: Create a user map for quick lookup
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = {
        panchayat: user.panchayat || 'Unknown',
        dryWasteCapacity: user.dryWasteCapacity || 0,
        name: user.name
      };
      return acc;
    }, {});

    // Step 5: Map weight ledgers to panchayats
    const panchayatData = {};

    weightLedgers.forEach(ledger => {
      const userId = ledger.userId.toString();
      const userData = userMap[userId];
      
      if (!userData) return;

      const panchayat = userData.panchayat;

      if (!panchayatData[panchayat]) {
        panchayatData[panchayat] = {
          panchayat: panchayat,
          totalDryWasteStored: 0,
          totalDryWasteCapacity: 0,
          totalEntries: 0,
          userCapacities: new Set(),
          ledgers: []
        };
      }

      panchayatData[panchayat].totalDryWasteStored += ledger.dryWasteStored || 0;
      panchayatData[panchayat].totalEntries += 1;
      
      // Track unique user capacities to sum them correctly
      panchayatData[panchayat].userCapacities.add(
        JSON.stringify({ userId, capacity: userData.dryWasteCapacity })
      );

      panchayatData[panchayat].ledgers.push({
        dryWasteStored: ledger.dryWasteStored,
        date: ledger.date || ledger.createdAt,
        userName: userData.name,
        userDryWasteCapacity: userData.dryWasteCapacity
      });
    });

    // Step 6: Convert to array and calculate totals
    const result = Object.values(panchayatData).map(data => {
      // Sum unique user capacities
      const uniqueCapacities = Array.from(data.userCapacities).map(
        str => JSON.parse(str).capacity
      );
      const totalCapacity = uniqueCapacities.reduce((sum, cap) => sum + cap, 0);

      return {
        panchayat: data.panchayat,
        totalDryWasteStored: data.totalDryWasteStored,
        totalDryWasteCapacity: totalCapacity,
        capacityUtilization: totalCapacity > 0 
          ? ((data.totalDryWasteStored / totalCapacity) * 100).toFixed(2) + '%'
          : '0%',
        totalEntries: data.totalEntries,
        uniqueUserCount: data.userCapacities.size,
        ledgers: data.ledgers
      };
    });

    // Step 7: Return response
    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error('Error fetching weight ledgers by panchayat:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/weightledgers/by-panchayat/:panchayatName
 * Fetch weight ledgers for a specific panchayat
 */
router.get('/weightledgers/by-panchayat/:panchayatName', async (req, res) => {
  try {
    const { panchayatName } = req.params;

    // Step 1: Find users belonging to the panchayat
    const users = await User.find(
      { panchayat: panchayatName },
      { 
        _id: 1, 
        name: 1, 
        panchayat: 1,
        dryWasteCapacity: 1 
      }
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No users found for panchayat: ${panchayatName}`
      });
    }

    const userIds = users.map(user => user._id);

    // Step 2: Fetch weight ledgers for these users
    const weightLedgers = await WeightLedger.find(
      { userId: { $in: userIds } },
      { 
        userId: 1, 
        dryWasteStored: 1,
        date: 1,
        createdAt: 1
      }
    );

    if (!weightLedgers || weightLedgers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No weight ledgers found for panchayat: ${panchayatName}`
      });
    }

    // Step 3: Create user map
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = {
        name: user.name,
        dryWasteCapacity: user.dryWasteCapacity || 0
      };
      return acc;
    }, {});

    // Step 4: Calculate aggregates
    const totalDryWasteStored = weightLedgers.reduce(
      (sum, ledger) => sum + (ledger.dryWasteStored || 0), 
      0
    );

    const totalDryWasteCapacity = users.reduce(
      (sum, user) => sum + (user.dryWasteCapacity || 0), 
      0
    );

    // Step 5: Map ledgers with user data
    const ledgersWithUserData = weightLedgers.map(ledger => ({
      dryWasteStored: ledger.dryWasteStored,
      date: ledger.date || ledger.createdAt,
      userName: userMap[ledger.userId.toString()]?.name,
      userDryWasteCapacity: userMap[ledger.userId.toString()]?.dryWasteCapacity
    }));

    // Step 6: Return response
    return res.status(200).json({
      success: true,
      panchayat: panchayatName,
      uniqueUserCount: users.length,
      totalEntries: weightLedgers.length,
      totalDryWasteStored: totalDryWasteStored,
      totalDryWasteCapacity: totalDryWasteCapacity,
      capacityUtilization: totalDryWasteCapacity > 0 
        ? ((totalDryWasteStored / totalDryWasteCapacity) * 100).toFixed(2) + '%'
        : '0%',
      data: ledgersWithUserData
    });

  } catch (error) {
    console.error('Error fetching weight ledgers for panchayat:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;



// ==========================================
// Example Model Schemas (Updated)
// ==========================================

// models/WeightLedger.js
/*
const mongoose = require('mongoose');

const weightLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dryWasteStored: {
    type: Number,
    required: true,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WeightLedger', weightLedgerSchema);
*/

// models/User.js
/*
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  panchayat: {
    type: String,
    required: true
  },
  dryWasteCapacity: {
    type: Number,
    required: true,
    default: 0
  },
  email: String,
  phone: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
*/