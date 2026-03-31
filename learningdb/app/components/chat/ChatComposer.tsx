import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Button, Stack, TextField } from "@mui/material";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Nhap yeu cau...",
}: ChatComposerProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={8}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void onSend();
          }
        }}
      />
      <Button
        variant="contained"
        onClick={() => void onSend()}
        disabled={disabled}
        startIcon={<SendRoundedIcon />}
      >
        Send
      </Button>
    </Stack>
  );
}
