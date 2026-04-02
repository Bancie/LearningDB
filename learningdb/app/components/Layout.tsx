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
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { DrawerProps } from "@mui/material";
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
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router";
import { useColorMode } from "~/color-mode";

const desktopDrawerWidth = 280;
const mobileBottomNavHeight = 68;

export type NavItem = {
  text: string;
  icon: React.ReactNode;
  path: string;
};

export const menuItems: NavItem[] = [
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

export type ChatFirstSidebarContext = {
  collapsed: boolean;
  isMobile: boolean;
  /** Closes the temporary drawer on small screens (no-op on desktop). */
  closeMobileDrawer: () => void;
};

interface LayoutProps {
  children: React.ReactNode;
  mode?: "default" | "chatFirst";
  /** When set (e.g. AI workspace), logo click runs this instead of only navigating to `/`. */
  onBrandClick?: () => void;
  sidebarHistoryContent?:
    | React.ReactNode
    | ((context: ChatFirstSidebarContext) => React.ReactNode);
  sidebarToolsContent?:
    | React.ReactNode
    | ((context: ChatFirstSidebarContext) => React.ReactNode);
}

export default function Layout({
  children,
  mode = "default",
  onBrandClick,
  sidebarHistoryContent,
  sidebarToolsContent,
}: LayoutProps) {
  const theme = useTheme();
  const { preference: colorSchemePreference, setPreference: setColorSchemePreference } =
    useColorMode();
  const [themeMenuAnchor, setThemeMenuAnchor] = React.useState<null | HTMLElement>(null);
  const themeMenuOpen = Boolean(themeMenuAnchor);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const navigate = useNavigate();
  const location = useLocation();
  const [desktopOpen, setDesktopOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isChatFirst = mode === "chatFirst";

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const mobileNavValue = mobilePrimaryItems.includes(location.pathname)
    ? location.pathname
    : "more";

  const sidebarWidth = desktopOpen ? desktopDrawerWidth : 88;
  const drawerVariant: DrawerProps["variant"] = isMobile ? "temporary" : "permanent";
  const isSidebarCollapsed = !desktopOpen && !isMobile;

  const closeMobileDrawer = React.useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const renderSidebarSection = (
    content: React.ReactNode | ((context: ChatFirstSidebarContext) => React.ReactNode) | undefined
  ) => {
    if (!content) {
      return null;
    }
    if (typeof content === "function") {
      return content({ collapsed: isSidebarCollapsed, isMobile, closeMobileDrawer });
    }
    return content;
  };

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
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 72 },
            position: "relative",
            zIndex: (z) => z.zIndex.drawer + 2,
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            type="button"
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen((prev) => !prev);
              } else {
                setDesktopOpen((prev) => !prev);
              }
            }}
            sx={{ mr: 1.5, flexShrink: 0 }}
            aria-label={isMobile ? "Toggle navigation menu" : desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isMobile ? mobileMenuOpen : desktopOpen}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            onClick={() => {
              if (onBrandClick) {
                onBrandClick();
                if (isMobile) {
                  setMobileMenuOpen(false);
                }
              } else {
                handleNavigate("/");
              }
            }}
            sx={{
              cursor: "pointer",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              component="img"
              src="/learningdblogo.png"
              alt="LearningDB"
              sx={{ height: 32, width: "auto", display: "block" }}
            />
            <Box
              component="span"
              sx={{
                ml: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              LearningDB
            </Box>
          </Typography>
          <Box sx={{ flexGrow: 1, minWidth: 0 }} />
          <IconButton
            color="inherit"
            edge="end"
            type="button"
            onClick={(e) => setThemeMenuAnchor(e.currentTarget)}
            aria-label="Theme: light, dark, or system"
            aria-haspopup="true"
            aria-expanded={themeMenuOpen ? "true" : "false"}
            id="theme-menu-button"
          >
            {colorSchemePreference === "system" ? (
              <BrightnessAutoIcon />
            ) : colorSchemePreference === "light" ? (
              <LightModeIcon />
            ) : (
              <DarkModeIcon />
            )}
          </IconButton>
          <Menu
            anchorEl={themeMenuAnchor}
            open={themeMenuOpen}
            onClose={() => setThemeMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ list: { "aria-labelledby": "theme-menu-button", dense: true } }}
          >
            <MenuItem
              selected={colorSchemePreference === "light"}
              onClick={() => {
                setColorSchemePreference("light");
                setThemeMenuAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LightModeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Light</ListItemText>
            </MenuItem>
            <MenuItem
              selected={colorSchemePreference === "dark"}
              onClick={() => {
                setColorSchemePreference("dark");
                setThemeMenuAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <DarkModeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Dark</ListItemText>
            </MenuItem>
            <MenuItem
              selected={colorSchemePreference === "system"}
              onClick={() => {
                setColorSchemePreference("system");
                setThemeMenuAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <BrightnessAutoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>System</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor={isChatFirst ? "left" : "bottom"}
        variant={drawerVariant}
        open={isMobile ? mobileMenuOpen : true}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display:
            isChatFirst || !isMobile
              ? "block"
              : {
                  xs: "block",
                  md: "none",
                },
          width: !isMobile ? sidebarWidth : undefined,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? (isChatFirst ? "calc(100vw * 2 / 3)" : "100vw") : sidebarWidth,
            mt: isMobile && !isChatFirst ? 0 : "72px",
            height: isMobile && !isChatFirst ? "auto" : "calc(100% - 72px)",
            transition: !isMobile
              ? theme.transitions.create("width", {
                  duration: theme.transitions.duration.standard,
                })
              : undefined,
            borderRight: "none",
            ...(isChatFirst
              ? {
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: "15px",
                  borderBottomRightRadius: "15px",
                  borderBottomLeftRadius: 0,
                }
              : {
                  borderTopLeftRadius: isMobile ? 20 : 0,
                  borderTopRightRadius: isMobile ? 20 : 0,
                }),
            overflowX: "hidden",
            px: isChatFirst ? (isSidebarCollapsed ? 0.5 : 1.2) : 1,
            py: isChatFirst ? (isSidebarCollapsed ? 0.75 : 1) : 1.5,
            background: (t) =>
              t.palette.mode === "dark"
                ? "linear-gradient(180deg, #151d28 0%, #0f1419 100%)"
                : "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
          },
        }}
      >
        {isChatFirst ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                flex: isSidebarCollapsed ? "0 0 auto" : "1 1 auto",
                minHeight: 0,
                overflowY: isSidebarCollapsed ? "visible" : "auto",
                px: 0.2,
              }}
            >
              {renderSidebarSection(sidebarHistoryContent)}
            </Box>
            <Box sx={{ flexShrink: 0, pt: isSidebarCollapsed ? 0.5 : 1 }}>
              {!isSidebarCollapsed && <Divider sx={{ mb: 1 }} />}
              {renderSidebarSection(sidebarToolsContent)}
            </Box>
          </Box>
        ) : (
          <>
            {isMobile && (
              <>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle1">All features</Typography>
                </Box>
                <Divider />
              </>
            )}
            <List sx={{ pt: 0.5 }}>
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.path}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    minHeight: 50,
                    justifyContent: !isMobile && desktopOpen ? "initial" : "center",
                    borderRadius: 2,
                    mb: 0.4,
                    mx: isMobile ? 1 : 0,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: !isMobile && desktopOpen ? 2 : "auto",
                      justifyContent: "center",
                      color: "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: isMobile || desktopOpen ? 1 : 0,
                      transition: "opacity 150ms ease",
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </>
        )}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isChatFirst ? { md: `calc(100% - ${sidebarWidth}px)` } : "100%",
          pt: { xs: "76px", md: "92px" },
          pb: isChatFirst ? { xs: 1, md: 2 } : { xs: `${mobileBottomNavHeight + 20}px`, md: 4 },
          px: { xs: 1.25, sm: 2, md: 3 },
        }}
      >
        {children}
      </Box>

      {isMobile && !isChatFirst && (
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
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 10px 28px rgba(0, 0, 0, 0.45)"
                : "0 10px 28px rgba(15, 23, 42, 0.18)",
            border: (t) => `1px solid ${alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.35 : 0.12)}`,
            zIndex: theme.zIndex.appBar + 1,
            backgroundColor: (t) => alpha(t.palette.background.paper, 0.95),
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
