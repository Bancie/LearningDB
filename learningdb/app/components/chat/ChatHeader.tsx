import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useId, useMemo, useState, type ReactNode } from "react";
import type { ProviderCatalogItem } from "~/services/orchestrator";

type ChatHeaderProps = {
  userId: string;
  onUserIdChange: (value: string) => void;
  provider: string;
  model: string;
  providers: ProviderCatalogItem[];
  models: ProviderCatalogItem["models"];
  bootstrapped: boolean;
  isBootstrapping: boolean;
  isSavingPreference: boolean;
  onBootstrap: () => Promise<void>;
  onProviderChange: (event: SelectChangeEvent) => Promise<void>;
  onModelChange: (event: SelectChangeEvent) => Promise<void>;
  /** Rendered after provider/model caption, immediately before the chat options icon. */
  beforeChatOptions?: ReactNode;
};

export default function ChatHeader({
  userId,
  onUserIdChange,
  provider,
  model,
  providers,
  models,
  bootstrapped,
  isBootstrapping,
  isSavingPreference,
  onBootstrap,
  onProviderChange,
  onModelChange,
  beforeChatOptions,
}: ChatHeaderProps) {
  const popoverId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const [providerMenuAnchorEl, setProviderMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const providerMenuOpen = Boolean(providerMenuAnchorEl);
  const [modelMenuAnchorEl, setModelMenuAnchorEl] = useState<HTMLElement | null>(null);
  const modelMenuOpen = Boolean(modelMenuAnchorEl);
  const [hoveredProviderId, setHoveredProviderId] = useState<string | null>(null);

  const providerLabel = useMemo(
    () => providers.find((item) => item.id === provider)?.label ?? provider,
    [providers, provider]
  );
  const modelLabel = useMemo(() => models.find((item) => item.id === model)?.label ?? model, [models, model]);

  const hoveredProvider = useMemo(
    () => (hoveredProviderId ? providers.find((item) => item.id === hoveredProviderId) : undefined),
    [providers, hoveredProviderId]
  );

  const toSelectChangeEvent = (value: string) =>
    ({ target: { value } } as unknown as SelectChangeEvent);

  const closeProviderMenus = () => {
    setProviderMenuAnchorEl(null);
    setModelMenuAnchorEl(null);
    setHoveredProviderId(null);
  };

  const handlePickModel = async (nextProviderId: string, nextModelId: string) => {
    await onProviderChange(toSelectChangeEvent(nextProviderId));
    await onModelChange(toSelectChangeEvent(nextModelId));
    closeProviderMenus();
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: { xs: "none", sm: "block" },
            maxWidth: 360,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {providerLabel} · {modelLabel}
        </Typography>
        {beforeChatOptions}
        <IconButton
          size="small"
          aria-label="Chat options"
          aria-controls={open ? popoverId : undefined}
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <TuneRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Popover
        id={open ? popoverId : undefined}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { width: { xs: 320, sm: 420 }, px: 1.25, py: 1.875, borderRadius: 2 } },
        }}
      >
        <Stack spacing={1}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              label="User ID"
              type="number"
              value={userId}
              onChange={(event) => onUserIdChange(event.target.value)}
              sx={{ minWidth: { sm: 128 } }}
            />
            <Button
              variant="contained"
              onClick={() => void onBootstrap()}
              disabled={isBootstrapping}
              sx={{ whiteSpace: "nowrap", borderRadius: "17px" }}
            >
              {isBootstrapping ? "Connecting..." : "Connect"}
            </Button>
            {isSavingPreference && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Chip label="Saving..." size="small" />
              </Box>
            )}
          </Stack>

          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Provider
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={(e) => setProviderMenuAnchorEl(e.currentTarget)}
                disabled={!bootstrapped}
                sx={{
                  justifyContent: "space-between",
                  textTransform: "none",
                  borderRadius: "20px",
                }}
                endIcon={<ChevronRightRoundedIcon sx={{ opacity: 0.7 }} />}
              >
                <Box
                  component="span"
                  sx={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                  }}
                >
                  {providerLabel} · {modelLabel}
                </Box>
              </Button>

              <Menu
                open={providerMenuOpen}
                anchorEl={providerMenuAnchorEl}
                onClose={closeProviderMenus}
                MenuListProps={{ dense: true }}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{ paper: { sx: { minWidth: 240 } } }}
              >
                {providers.map((item) => (
                  <MenuItem
                    key={item.id}
                    disabled={!item.available}
                    selected={item.id === provider}
                    onMouseEnter={(e) => {
                      setHoveredProviderId(item.id);
                      setModelMenuAnchorEl(e.currentTarget);
                    }}
                    onClick={(e) => {
                      setHoveredProviderId(item.id);
                      setModelMenuAnchorEl(e.currentTarget);
                    }}
                    sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
                  >
                    <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label} {item.available ? "" : "(missing API key)"}
                    </Box>
                    <ChevronRightRoundedIcon fontSize="small" sx={{ opacity: 0.6 }} />
                  </MenuItem>
                ))}
              </Menu>

              <Menu
                open={modelMenuOpen && Boolean(hoveredProvider)}
                anchorEl={modelMenuAnchorEl}
                onClose={closeProviderMenus}
                MenuListProps={{
                  dense: true,
                  onMouseLeave: () => {
                    // Allow moving back to provider menu without instantly closing everything.
                    setModelMenuAnchorEl(null);
                    setHoveredProviderId(null);
                  },
                }}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{ paper: { sx: { minWidth: 260 } } }}
              >
                {(hoveredProvider?.models ?? []).map((m) => (
                  <MenuItem
                    key={m.id}
                    disabled={!m.available || !hoveredProvider?.available}
                    selected={hoveredProvider?.id === provider && m.id === model}
                    onClick={() => void handlePickModel(hoveredProvider!.id, m.id)}
                  >
                    {m.label} {m.available ? "" : "(unavailable)"}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
