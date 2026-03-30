import * as React from "react";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import OutputIcon from "@mui/icons-material/Output";
import ListIcon from "@mui/icons-material/List";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalculateIcon from "@mui/icons-material/Calculate";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useLocation, useNavigate } from "react-router";

const desktopDrawerWidth = 280;
const mobileBottomNavHeight = 68;

const menuItems = [
  { text: "Home", icon: <HomeIcon />, path: "/" },
  { text: "Import Data", icon: <AddCircleIcon />, path: "/import" },
  { text: "Current Activity Log", icon: <AssignmentIcon />, path: "/activity-log" },
  { text: "Current Activity Output", icon: <OutputIcon />, path: "/activity-output" },
  { text: "Activity List", icon: <ListIcon />, path: "/activity-list" },
  { text: "Update Data", icon: <EditIcon />, path: "/update" },
  { text: "View Activities", icon: <VisibilityIcon />, path: "/view" },
  { text: "Run Bayes", icon: <CalculateIcon />, path: "/bayes" },
];

const mobilePrimaryItems = ["/", "/import", "/activity-list", "/update"];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const [desktopOpen, setDesktopOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const mobileNavValue = mobilePrimaryItems.includes(location.pathname)
    ? location.pathname
    : "more";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", backgroundColor: "background.default" }}>
      <AppBar
        position="fixed"
        color="primary"
        sx={{
          zIndex: (z) => z.zIndex.drawer + 1,
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => (isMobile ? setMobileMenuOpen(true) : setDesktopOpen((prev) => !prev))}
            sx={{ mr: 1.5 }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            onClick={() => handleNavigate("/")}
            sx={{
              cursor: "pointer",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            LearningDB - Bancie Database
          </Typography>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer
          variant="permanent"
          open={desktopOpen}
          sx={{
            width: desktopOpen ? desktopDrawerWidth : 84,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: desktopOpen ? desktopDrawerWidth : 84,
              transition: theme.transitions.create("width", {
                duration: theme.transitions.duration.standard,
              }),
              mt: "72px",
              height: "calc(100% - 72px)",
              borderRight: "1px solid rgba(15, 23, 42, 0.08)",
              overflowX: "hidden",
              px: 1,
              py: 1.5,
              background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
            },
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  minHeight: 50,
                  justifyContent: desktopOpen ? "initial" : "center",
                  borderRadius: 2,
                  mb: 0.4,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: desktopOpen ? 2 : "auto",
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: desktopOpen ? 1 : 0,
                    transition: "opacity 150ms ease",
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      <Drawer
        anchor="bottom"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            pb: 1.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">All features</Typography>
        </Box>
        <Divider />
        <List sx={{ pt: 0.5 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{ borderRadius: 2, mx: 1, my: 0.4 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          pt: { xs: "76px", md: "92px" },
          pb: { xs: `${mobileBottomNavHeight + 20}px`, md: 4 },
          px: { xs: 1.25, sm: 2, md: 3 },
        }}
      >
        {children}
      </Box>

      {isMobile && (
        <BottomNavigation
          value={mobileNavValue}
          showLabels
          onChange={(_, value: string) => {
            if (value === "more") {
              setMobileMenuOpen(true);
              return;
            }
            handleNavigate(value);
          }}
          sx={{
            position: "fixed",
            left: 10,
            right: 10,
            bottom: 10,
            height: mobileBottomNavHeight,
            borderRadius: 4,
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.18)",
            border: "1px solid rgba(11, 110, 230, 0.12)",
            zIndex: theme.zIndex.appBar + 1,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <BottomNavigationAction label="Home" value="/" icon={<HomeIcon />} />
          <BottomNavigationAction label="Import" value="/import" icon={<AddCircleIcon />} />
          <BottomNavigationAction label="Activities" value="/activity-list" icon={<ListIcon />} />
          <BottomNavigationAction label="Update" value="/update" icon={<EditIcon />} />
          <BottomNavigationAction label="More" value="more" icon={<MoreHorizIcon />} />
        </BottomNavigation>
      )}
    </Box>
  );
}
