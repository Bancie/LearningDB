import type { Route } from "./+types/home";
import Layout from "~/components/Layout";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import OutputIcon from "@mui/icons-material/Output";
import ListIcon from "@mui/icons-material/List";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalculateIcon from "@mui/icons-material/Calculate";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  getChatPreference,
  getProviders,
  putChatPreference,
  sendChatMessage,
  type ChatHistoryMessage,
  type ProviderCatalogItem,
} from "~/services/orchestrator";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB - AI Workspace" },
    { name: "description", content: "AI-first LearningDB assistant workspace" },
  ];
}

type UiMessage = {
  role: "user" | "assistant";
  content: string;
};

const quickActions = [
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [userId, setUserId] = useState("1");
  const [providers, setProviders] = useState<ProviderCatalogItem[]>([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content:
        "Xin chao! Toi la tro ly AI cua LearningDB. Ban co the yeu cau xem activity list, view Bayes, current logs, hoac run Bayes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const selectedProvider = useMemo(
    () => providers.find((item) => item.id === provider),
    [providers, provider]
  );
  const models = selectedProvider?.models ?? [];

  const bootstrap = async () => {
    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("User ID khong hop le.");
      return;
    }
    setError("");
    setIsBootstrapping(true);
    try {
      const [providerRes, preferenceRes] = await Promise.all([
        getProviders(),
        getChatPreference(parsedUserId),
      ]);
      const providerData = providerRes.data;
      setProviders(providerData);

      const preferred = preferenceRes.data;
      if (preferred) {
        setProvider(preferred.provider);
        setModel(preferred.model);
      } else {
        const firstProvider = providerData.find((item) => item.available) ?? providerData[0];
        const firstModel = firstProvider?.models.find((item) => item.available) ?? firstProvider?.models[0];
        if (firstProvider?.id) {
          setProvider(firstProvider.id);
        }
        if (firstModel?.id) {
          setModel(firstModel.id);
        }
      }
      setBootstrapped(true);
    } catch (err) {
      console.error(err);
      setError("Khong tai duoc provider/model hoac preference.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const savePreference = async (nextProvider: string, nextModel: string) => {
    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      return;
    }
    setIsSavingPreference(true);
    try {
      await putChatPreference(parsedUserId, nextProvider, nextModel);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Khong luu duoc preference provider/model.");
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleProviderChange = async (event: SelectChangeEvent) => {
    const nextProvider = event.target.value;
    setProvider(nextProvider);
    const nextProviderEntry = providers.find((item) => item.id === nextProvider);
    const fallbackModel =
      nextProviderEntry?.models.find((item) => item.available)?.id ??
      nextProviderEntry?.models[0]?.id ??
      "";
    setModel(fallbackModel);
    if (fallbackModel) {
      await savePreference(nextProvider, fallbackModel);
    }
  };

  const handleModelChange = async (event: SelectChangeEvent) => {
    const nextModel = event.target.value;
    setModel(nextModel);
    await savePreference(provider, nextModel);
  };

  const sendMessage = async () => {
    const parsedUserId = Number(userId);
    if (!bootstrapped) {
      setError("Hay ket noi AI workspace truoc khi chat.");
      return;
    }
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("User ID khong hop le.");
      return;
    }
    if (!input.trim()) {
      return;
    }

    const userMessage: UiMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setError("");

    try {
      const history: ChatHistoryMessage[] = messages.map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const response = await sendChatMessage({
        user_id: parsedUserId,
        message: userMessage.content,
        history,
        provider,
        model,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer,
        },
      ]);
      setProvider(response.data.resolved_provider);
      setModel(response.data.resolved_model);
    } catch (err) {
      console.error(err);
      setError("Chatbot tam thoi khong phan hoi duoc. Vui long thu lai.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "He thong dang gap su co khi goi provider/model hoac backend. Ban thu lai sau.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    void bootstrap();
    // Intentionally bootstrap once for AI-first entry experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <Stack spacing={2}>
        <Paper
          sx={{
            borderRadius: 4,
            px: { xs: 2, sm: 3.5 },
            py: { xs: 2.5, sm: 3.5 },
            color: "white",
            background:
              "linear-gradient(135deg, rgba(6,70,173,1) 0%, rgba(11,110,230,1) 52%, rgba(82,139,255,1) 100%)",
            boxShadow: "0 16px 34px rgba(11,110,230,0.35)",
          }}
        >
          <Stack spacing={1}>
            <Chip
              label="AI-first workspace"
              sx={{
                width: "fit-content",
                bgcolor: "rgba(255,255,255,0.18)",
                color: "white",
                fontWeight: 600,
              }}
            />
            <Typography variant={isMobile ? "h5" : "h4"}>
              LearningDB AI Copilot
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.92 }}>
              Chon provider/model, luu preference theo user, va chat de thao tac du lieu khong can nhap tay tung man hinh.
            </Typography>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    label="User ID"
                    type="number"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    sx={{ minWidth: { sm: 120 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={bootstrap}
                    disabled={isBootstrapping}
                  >
                    {isBootstrapping ? "Connecting..." : "Connect AI Workspace"}
                  </Button>
                  {isSavingPreference && (
                    <Chip label="Saving preference..." size="small" />
                  )}
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Select
                    fullWidth
                    value={provider}
                    onChange={handleProviderChange}
                    disabled={!bootstrapped}
                  >
                    {providers.map((item) => (
                      <MenuItem key={item.id} value={item.id} disabled={!item.available}>
                        {item.label} {item.available ? "" : "(missing API key)"}
                      </MenuItem>
                    ))}
                  </Select>
                  <Select
                    fullWidth
                    value={model}
                    onChange={handleModelChange}
                    disabled={!bootstrapped}
                  >
                    {models.map((item) => (
                      <MenuItem key={item.id} value={item.id} disabled={!item.available}>
                        {item.label} {item.available ? "" : "(unavailable)"}
                      </MenuItem>
                    ))}
                  </Select>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    height: { xs: 360, md: 420 },
                    overflowY: "auto",
                    bgcolor: "#f8faff",
                  }}
                >
                  <Stack spacing={1.2}>
                    {messages.map((message, index) => (
                      <Box
                        key={`${message.role}-${index}`}
                        sx={{
                          alignSelf:
                            message.role === "user" ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          borderRadius: 2,
                          px: 1.25,
                          py: 1,
                          bgcolor:
                            message.role === "user"
                              ? "primary.main"
                              : "background.paper",
                          color:
                            message.role === "user" ? "primary.contrastText" : "text.primary",
                          border:
                            message.role === "assistant"
                              ? "1px solid rgba(15, 23, 42, 0.08)"
                              : "none",
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {message.content}
                        </Typography>
                      </Box>
                    ))}
                    {isSending && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          AI dang suy nghi...
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>

                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    placeholder="Nhap yeu cau, vi du: hien thi activity list cua user nay"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => void sendMessage()}
                    disabled={!bootstrapped || isSending}
                    startIcon={<SendRoundedIcon />}
                  >
                    Send
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
              <Stack spacing={1.2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SmartToyRoundedIcon color="primary" />
                  <Typography variant="h6">Quick Actions</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Truy cap nhanh cac tinh nang dashboard khi can thao tac chi tiet.
                </Typography>
                <Divider />
                <Grid container spacing={1}>
                  {quickActions.map((feature) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 12 }} key={feature.title}>
                      <Card variant="outlined">
                        <CardActionArea onClick={() => navigate(feature.path)}>
                          <CardContent
                            sx={{ p: { xs: 1.5, sm: 2 }, display: "grid", gap: 0.8 }}
                          >
                            <Box
                              sx={{
                                color: feature.color,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
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
                            <Typography variant="subtitle1">{feature.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {feature.description}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                color: "primary.main",
                              }}
                            >
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
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Layout>
  );
}
