import type { Route } from "./+types/home";
import Layout from "~/components/Layout";
import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import OutputIcon from '@mui/icons-material/Output';
import ListIcon from '@mui/icons-material/List';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB - Bancie Database" },
    { name: "description", content: "LearningDB Web Application" },
  ];
}

const features = [
  { title: 'Import Data', description: 'Insert records into any table', icon: <AddCircleIcon sx={{ fontSize: 40 }} />, path: '/import', color: '#1976d2' },
  { title: 'Current Activity Log', description: 'View current activity logs', icon: <AssignmentIcon sx={{ fontSize: 40 }} />, path: '/activity-log', color: '#2e7d32' },
  { title: 'Current Activity Output', description: 'View activity outputs', icon: <OutputIcon sx={{ fontSize: 40 }} />, path: '/activity-output', color: '#ed6c02' },
  { title: 'Activity List', description: 'View all activities', icon: <ListIcon sx={{ fontSize: 40 }} />, path: '/activity-list', color: '#9c27b0' },
  { title: 'Update Data', description: 'Update probabilities & status', icon: <EditIcon sx={{ fontSize: 40 }} />, path: '/update', color: '#d32f2f' },
  { title: 'View Activities', description: 'View Bayes probabilities', icon: <VisibilityIcon sx={{ fontSize: 40 }} />, path: '/view', color: '#0288d1' },
  { title: 'Run Bayes', description: 'Run Bayesian analysis', icon: <CalculateIcon sx={{ fontSize: 40 }} />, path: '/bayes', color: '#7b1fa2' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to LearningDB
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your daily tracking and Bayesian analysis dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea onClick={() => navigate(feature.path)} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: feature.color, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
