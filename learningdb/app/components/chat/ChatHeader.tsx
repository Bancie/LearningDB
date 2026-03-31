import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Stack,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";
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
}: ChatHeaderProps) {
  return (
    <Stack spacing={1.25}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          label="User ID"
          type="number"
          value={userId}
          onChange={(event) => onUserIdChange(event.target.value)}
          sx={{ minWidth: { sm: 118 } }}
        />
        <Button variant="contained" onClick={() => void onBootstrap()} disabled={isBootstrapping}>
          {isBootstrapping ? "Connecting..." : "Connect"}
        </Button>
        {isSavingPreference && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip label="Saving..." size="small" />
          </Box>
        )}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Select fullWidth value={provider} onChange={(event) => void onProviderChange(event)} disabled={!bootstrapped}>
          {providers.map((item) => (
            <MenuItem key={item.id} value={item.id} disabled={!item.available}>
              {item.label} {item.available ? "" : "(missing API key)"}
            </MenuItem>
          ))}
        </Select>
        <Select fullWidth value={model} onChange={(event) => void onModelChange(event)} disabled={!bootstrapped}>
          {models.map((item) => (
            <MenuItem key={item.id} value={item.id} disabled={!item.available}>
              {item.label} {item.available ? "" : "(unavailable)"}
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </Stack>
  );
}
