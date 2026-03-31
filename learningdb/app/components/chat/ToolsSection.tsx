import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import type { NavItem } from "~/components/Layout";

type ToolsSectionProps = {
  items: NavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
};

export default function ToolsSection({
  items,
  activePath,
  onNavigate,
  collapsed = false,
}: ToolsSectionProps) {
  return (
    <Box sx={{ px: 0.2 }}>
      {!collapsed && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 0.8 }}>
          Tools
        </Typography>
      )}
      <List sx={{ p: 0.5 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            selected={activePath === item.path}
            onClick={() => onNavigate(item.path)}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              mb: 0.3,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: "inherit" }}>
              {item.icon}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={item.text} />}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
