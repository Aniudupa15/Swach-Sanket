import React, { useState } from "react";
import { Typography, Button, Paper, Stack, List, ListItem } from "@mui/material";

export default function DriverDashboard() {
  const [collecting, setCollecting] = useState(false);
  const [houses, setHouses] = useState([]);

  const startCollection = () => setCollecting(true);
  const stopCollection = () => setCollecting(false);
  const markHouse = () => {
    const newHouse = { id: houses.length + 1, time: new Date().toLocaleTimeString() };
    setHouses([...houses, newHouse]);
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>
        🚛 MRF Driver Dashboard
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        {!collecting ? (
          <Button variant="contained" color="success" onClick={startCollection}>
            Start Collection
          </Button>
        ) : (
          <Button variant="contained" color="error" onClick={stopCollection}>
            Stop Collection
          </Button>
        )}
        {collecting && (
          <Button variant="contained" color="primary" onClick={markHouse}>
            Mark House
          </Button>
        )}
      </Stack>

      <Paper elevation={3} style={{ padding: 16 }}>
        <Typography variant="h6" gutterBottom>
          Visited Houses
        </Typography>
        {houses.length === 0 ? (
          <Typography color="text.secondary">No houses marked yet.</Typography>
        ) : (
          <List>
            {houses.map((house) => (
              <ListItem key={house.id}>
                House #{house.id} — {house.time}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </div>
  );
}
