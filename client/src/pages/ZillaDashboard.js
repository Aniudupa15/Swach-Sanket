import React from "react";
import { Typography, Grid, Paper } from "@mui/material";

export default function ZillaDashboard() {
  return (
    <div style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>
        🏛️ Zilla Panchayat Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} style={{ padding: 16 }}>
            <Typography variant="h6">Total Drivers</Typography>
            <Typography variant="h4">12</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} style={{ padding: 16 }}>
            <Typography variant="h6">Zones Covered</Typography>
            <Typography variant="h4">5</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} style={{ padding: 16 }}>
            <Typography variant="h6">Total Collections</Typography>
            <Typography variant="h4">238</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={3} style={{ padding: 16 }}>
            <Typography variant="h6">Pending Zones</Typography>
            <Typography variant="h4">1</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
