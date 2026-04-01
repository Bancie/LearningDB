import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { motion } from "framer-motion";
import { Button, Stack, TextField } from "@mui/material";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  mode?: "intro" | "chat";
  motionLayoutId?: string;
};

export default function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Nhap yeu cau...",
  mode = "chat",
  motionLayoutId,
}: ChatComposerProps) {
  const isIntro = mode === "intro";

  return (
    <motion.div layout layoutId={motionLayoutId} transition={{ duration: 0.3, ease: "easeInOut" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "flex-end",
          p: isIntro ? 1 : 0,
          borderRadius: isIntro ? 4 : 0,
          bgcolor: isIntro ? "background.paper" : "transparent",
          boxShadow: isIntro ? "0 10px 28px rgba(15, 23, 42, 0.12)" : "none",
          border: isIntro ? "1px solid rgba(148, 163, 184, 0.28)" : "none",
        }}
      >
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
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: isIntro ? 3 : 1,
              bgcolor: "background.paper",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={() => void onSend()}
          disabled={disabled}
          startIcon={<SendRoundedIcon />}
          sx={{ height: 40, minWidth: isIntro ? 108 : undefined }}
        >
          Send
        </Button>
      </Stack>
    </motion.div>
  );
}
