import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Outlet } from "react-router";

import { useColorMode } from "~/color-mode";

export default function AppShell() {
  const { setPreference, resolvedMode } = useColorMode();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <MenuBookOutlinedIcon color="primary" sx={{ mr: 1 }} />
          <Typography component={Link} to="/" variant="h6" sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}>
            LearningDB (CRUD)
          </Typography>
          <Button component={Link} to="/" color="inherit" size="small">
            Home
          </Button>
          <Button component={Link} to="/data-entry" color="inherit" size="small">
            Data entry
          </Button>
          <Button component={Link} to="/import-wizard" color="inherit" size="small">
            Import wizard
          </Button>
          <IconButton
            size="small"
            aria-label="toggle color mode"
            onClick={() => setPreference(resolvedMode === "light" ? "dark" : "light")}
            sx={{ ml: 1 }}
          >
            {resolvedMode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
