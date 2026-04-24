import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import * as React from "react";

import type { Route } from "./+types/import-wizard";
import { clearDraft, loadDraft, saveDraft } from "~/import-wizard/draft-storage";
import { WizardFields } from "~/import-wizard/WizardFields";
import type { WizardStep } from "~/import-wizard/types";
import {
  buildInsertPayload,
  extractPkInt,
  resolveImportTables,
  type ResolvedTables,
} from "~/import-wizard/table-utils";
import type { Column } from "~/services/api";
import { getTableColumns, insertRecord } from "~/services/api";
import { formatApiError } from "~/utils/formatApiError";

const STEP_LABELS = ["Activity log", "Activity output", "Kit count"] as const;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Import wizard — LearningDB" },
    { name: "description", content: "Multi-step ACTIVITY_LOG → ACTIVITY_OUTPUT → KIT_COUNT" },
  ];
}

export default function ImportWizardRoute() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [tables, setTables] = React.useState<ResolvedTables | null>(null);
  const [colsLog, setColsLog] = React.useState<Column[]>([]);
  const [colsOut, setColsOut] = React.useState<Column[]>([]);
  const [colsKit, setColsKit] = React.useState<Column[]>([]);

  const [step, setStep] = React.useState<WizardStep>(1);
  const [actiLogId, setActiLogId] = React.useState<number | null>(null);
  const [aoId, setAoId] = React.useState<number | null>(null);
  const [logValues, setLogValues] = React.useState<Record<string, unknown>>({});
  const [outputValues, setOutputValues] = React.useState<Record<string, unknown>>({});
  const [kitValues, setKitValues] = React.useState<Record<string, unknown>>({});

  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await resolveImportTables();
        if (cancelled) {
          return;
        }
        setTables(t);
        const [log, out, kit] = await Promise.all([
          getTableColumns(t.log),
          getTableColumns(t.output),
          getTableColumns(t.kit),
        ]);
        if (cancelled) {
          return;
        }
        setColsLog(log.data.columns);
        setColsOut(out.data.columns);
        setColsKit(kit.data.columns);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load schema");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const d = loadDraft();
    if (!d) {
      return;
    }
    setStep(d.step);
    setActiLogId(d.actiLogId);
    setAoId(d.aoId);
    setLogValues(d.logValues);
    setOutputValues(d.outputValues);
    setKitValues(d.kitValues);
  }, []);

  const persistDraft = React.useCallback(() => {
    saveDraft({
      version: 1,
      step,
      actiLogId,
      aoId,
      logValues,
      outputValues,
      kitValues,
    });
  }, [step, actiLogId, aoId, logValues, outputValues, kitValues]);

  const onSaveDraft = () => {
    persistDraft();
    setSuccessMsg("Draft saved in this browser (session).");
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const changeLog = (name: string, value: unknown) => {
    setLogValues((prev) => ({ ...prev, [name]: value }));
  };
  const changeOut = (name: string, value: unknown) => {
    setOutputValues((prev) => ({ ...prev, [name]: value }));
  };
  const changeKit = (name: string, value: unknown) => {
    setKitValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleStep1Next = async () => {
    if (!tables) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const payload = buildInsertPayload(colsLog, logValues);
      const { data } = await insertRecord(tables.log, payload);
      const id = extractPkInt(data.primary_key, ["ACTI_LOG_ID", "acti_log_id"]);
      if (id == null) {
        throw new Error(
          "Insert succeeded but API did not return ACTI_LOG_ID. Ensure backend returns primary_key for inserts.",
        );
      }
      setActiLogId(id);
      setStep(2);
      saveDraft({
        version: 1,
        step: 2,
        actiLogId: id,
        aoId,
        logValues,
        outputValues,
        kitValues,
      });
    } catch (e) {
      setError(formatApiError(e) || "Step 1 failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStep2Next = async () => {
    if (!tables || actiLogId == null) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const payload = buildInsertPayload(colsOut, outputValues, { ACTI_LOG_ID: actiLogId });
      const { data } = await insertRecord(tables.output, payload);
      const id = extractPkInt(data.primary_key, ["AO_ID", "ao_id"]);
      if (id == null) {
        throw new Error("Insert succeeded but API did not return AO_ID.");
      }
      setAoId(id);
      setStep(3);
      saveDraft({
        version: 1,
        step: 3,
        actiLogId,
        aoId: id,
        logValues,
        outputValues,
        kitValues,
      });
    } catch (e) {
      setError(formatApiError(e) || "Step 2 failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStep3Finish = async () => {
    if (!tables || aoId == null) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const payload = buildInsertPayload(colsKit, kitValues, { AO_ID: aoId });
      await insertRecord(tables.kit, payload);
      clearDraft();
      setSuccessMsg("Import complete. Kit count saved.");
      setStep(1);
      setActiLogId(null);
      setAoId(null);
      setLogValues({});
      setOutputValues({});
      setKitValues({});
    } catch (e) {
      setError(formatApiError(e) || "Step 3 failed");
    } finally {
      setBusy(false);
    }
  };

  const omitLog = React.useMemo(() => new Set<string>(), []);
  const omitOut = React.useMemo(() => {
    const s = new Set<string>(["ACTI_LOG_ID"]);
    return s;
  }, []);
  const omitKit = React.useMemo(() => new Set<string>(["AO_ID"]), []);

  const activeStepIndex = step - 1;

  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", sans-serif',
        bgcolor: "#f9f9f9",
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        minHeight: "70vh",
      }}
    >
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#005dac" }}>
          Import data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Step 1: activity log → save draft anytime → step 2: activity output → step 3: kit count. Foreign keys are
          filled automatically from this session (no manual IDs).
        </Typography>
      </Stack>

      <Stepper
        activeStep={activeStepIndex}
        alternativeLabel={!isMobile}
        orientation={isMobile ? "vertical" : "horizontal"}
        sx={{ mb: 3 }}
      >
        {STEP_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {successMsg ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: "#ffffff", borderRadius: 2 }}>
        {step === 1 ? (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Activity log
            </Typography>
            <WizardFields columns={colsLog} values={logValues} onChange={changeLog} omit={omitLog} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
              <Button startIcon={<SaveIcon />} variant="outlined" onClick={onSaveDraft} disabled={busy}>
                Save draft
              </Button>
              <Button variant="contained" onClick={handleStep1Next} disabled={busy || !tables}>
                Save log and continue
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {step === 2 ? (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Activity output
            </Typography>
            <Alert severity="info" variant="outlined">
              Linked to the activity log from step 1 in this session. You do not need to enter{" "}
              <code>ACTI_LOG_ID</code>.
            </Alert>
            <WizardFields columns={colsOut} values={outputValues} onChange={changeOut} omit={omitOut} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
              <Button onClick={() => setStep(1)} disabled={busy}>
                Back
              </Button>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button startIcon={<SaveIcon />} variant="outlined" onClick={onSaveDraft} disabled={busy}>
                  Save draft
                </Button>
                <Button variant="contained" onClick={handleStep2Next} disabled={busy}>
                  Save output and continue
                </Button>
              </Stack>
            </Stack>
          </Stack>
        ) : null}

        {step === 3 ? (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Kit count (performance)
            </Typography>
            <Alert severity="info" variant="outlined">
              Linked to activity output in this session (hidden <code>AO_ID</code>).
            </Alert>
            <WizardFields columns={colsKit} values={kitValues} onChange={changeKit} omit={omitKit} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
              <Button onClick={() => setStep(2)} disabled={busy}>
                Back
              </Button>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button startIcon={<SaveIcon />} variant="outlined" onClick={onSaveDraft} disabled={busy}>
                  Save draft
                </Button>
                <Button
                  startIcon={<CloudUploadIcon />}
                  variant="contained"
                  onClick={handleStep3Finish}
                  disabled={busy}
                >
                  Finish import
                </Button>
              </Stack>
            </Stack>
          </Stack>
        ) : null}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        UI reference: <code>design/import-wizard-reference/</code> (Stitch export). Layout adapts for mobile and
        desktop.
      </Typography>
    </Box>
  );
}
