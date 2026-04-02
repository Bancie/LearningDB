import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { motion } from "framer-motion";
import { Button, Stack, TextField, useTheme } from "@mui/material";

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
  const theme = useTheme();
  const isIntro = mode === "intro";

  const chatBarBorder =
    theme.palette.mode === "light"
      ? "1px solid rgba(148, 163, 184, 0.28)"
      : "1px solid rgba(255, 255, 255, 0.12)";
  /** Chat mode: single elevation token (workspace preview). */
  const chatModeShadow = "0px 4px 12px 0px rgba(0, 0, 0, 0.15)";

  /** Reset global MuiOutlinedInput theme so the field sits inside the composer bar, not as a second card. */
  const outlinedReset = {
    borderRadius: isIntro ? "10px" : "12px",
    bgcolor: "transparent",
    boxShadow: "none",
    transition: theme.transitions.create(["background-color"], {
      duration: theme.transitions.duration.shorter,
    }),
    "&:hover": {
      bgcolor: "action.hover",
      boxShadow: "none",
    },
    "&.Mui-focused": {
      bgcolor: "transparent",
      boxShadow: "none",
    },
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused fieldset": { border: "none" },
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
  };

  return (
    <motion.div
      layout
      layoutId={motionLayoutId}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: isIntro ? "center" : "flex-end",
          p: isIntro ? 1 : 1,
          borderRadius: isIntro ? "50px" : "15px",
          bgcolor: "background.paper",
          boxShadow: isIntro
            ? "0 10px 28px rgba(15, 23, 42, 0.12)"
            : chatModeShadow,
          border: isIntro
            ? "1px solid rgba(148, 163, 184, 0.28)"
            : chatBarBorder,
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
            flex: 1,
            minWidth: 0,
            "& .MuiOutlinedInput-root": outlinedReset,
          }}
        />
        <Button
          variant="contained"
          onClick={() => void onSend()}
          disabled={disabled}
          startIcon={<SendRoundedIcon />}
          sx={{
            height: 40,
            flexShrink: 0,
            minWidth: isIntro ? 108 : undefined,
            borderRadius: isIntro ? "40px" : "12px",
          }}
        >
          Send
        </Button>
      </Stack>
    </motion.div>
  );
}
