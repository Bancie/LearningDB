import type { Route } from "./+types/home";
import Layout from "~/components/Layout";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import OutputIcon from "@mui/icons-material/Output";
import ListIcon from "@mui/icons-material/List";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalculateIcon from "@mui/icons-material/Calculate";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB - Bancie Database" },
    { name: "description", content: "LearningDB Web Application" },
  ];
}

const features = [
  {
    title: "Import Data",
    description: "Insert records into any table",
    icon: <AddCircleIcon sx={{ fontSize: 34 }} />,
    path: "/import",
    color: "#0b6ee6",
    tag: "Data Input",
  },
  {
    title: "Current Activity Log",
    description: "View current activity logs",
    icon: <AssignmentIcon sx={{ fontSize: 34 }} />,
    path: "/activity-log",
    color: "#1b8a4b",
    tag: "Monitoring",
  },
  {
    title: "Current Activity Output",
    description: "View latest activity outputs",
    icon: <OutputIcon sx={{ fontSize: 34 }} />,
    path: "/activity-output",
    color: "#d17a00",
    tag: "Monitoring",
  },
  {
    title: "Activity List",
    description: "Search and filter all activities",
    icon: <ListIcon sx={{ fontSize: 34 }} />,
    path: "/activity-list",
    color: "#6f42c1",
    tag: "Explore",
  },
  {
    title: "Update Data",
    description: "Update probabilities and status",
    icon: <EditIcon sx={{ fontSize: 34 }} />,
    path: "/update",
    color: "#c62828",
    tag: "Actions",
  },
  {
    title: "View Activities",
    description: "Inspect Bayes probabilities",
    icon: <VisibilityIcon sx={{ fontSize: 34 }} />,
    path: "/view",
    color: "#006e90",
    tag: "Insights",
  },
  {
    title: "Run Bayes",
    description: "Run Bayesian analysis engine",
    icon: <CalculateIcon sx={{ fontSize: 34 }} />,
    path: "/bayes",
    color: "#7a2cbf",
    tag: "Insights",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Layout>
      <Box
        sx={{
          borderRadius: 4,
          px: { xs: 2, sm: 3.5 },
          py: { xs: 2.5, sm: 3.5 },
          mb: 2.5,
          color: "white",
          background:
            "linear-gradient(135deg, rgba(6,70,173,1) 0%, rgba(11,110,230,1) 52%, rgba(82,139,255,1) 100%)",
          boxShadow: "0 16px 34px rgba(11,110,230,0.35)",
        }}
      >
        <Stack spacing={1}>
          <Chip
            label="Mobile-first dashboard"
            color="default"
            sx={{
              width: "fit-content",
              bgcolor: "rgba(255,255,255,0.18)",
              color: "white",
              fontWeight: 600,
            }}
          />
          <Typography variant={isMobile ? "h5" : "h4"}>Welcome to LearningDB</Typography>
          <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 680 }}>
            Daily tracking and Bayesian analysis in a focused, touch-friendly workspace.
          </Typography>
        </Stack>
      </Box>

      <Grid container spacing={{ xs: 1.2, sm: 1.8, md: 2.2 }}>
        {features.map((feature) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea onClick={() => navigate(feature.path)} sx={{ height: "100%" }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, display: "grid", gap: 1.2 }}>
                  <Box sx={{ color: feature.color, display: "flex", alignItems: "center", gap: 1 }}>
                    {feature.icon}
                    <Chip
                      label={feature.tag}
                      size="small"
                      sx={{
                        bgcolor: `${feature.color}1a`,
                        color: feature.color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="h6">{feature.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                    {feature.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", color: "primary.main", mt: 0.2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mr: 0.4 }}>
                      Open
                    </Typography>
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
