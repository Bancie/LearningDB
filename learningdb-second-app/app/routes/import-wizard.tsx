import * as React from "react";

import type { Route } from "./+types/import-wizard";
import { useAuth } from "~/auth/session";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ActivityPickerDialog } from "~/import-wizard/ActivityPickerDialog";
import { clearServerDraft, loadServerDraft, saveServerDraft } from "~/import-wizard/draft-storage";
import { WizardFields } from "~/import-wizard/WizardFields";
import {
  buildInsertPayload,
  extractPkInt,
  isWizardMetadataComplete,
  resolveImportTables,
  type ResolvedTables,
} from "~/import-wizard/table-utils";
import type { ImportDraftV1, WizardStep } from "~/import-wizard/types";
import type { Column } from "~/services/api";
import { getTableColumns, insertRecord } from "~/services/api";
import { useHistoryRefresh } from "~/history/history-refresh-context";
import { formatApiError } from "~/utils/formatApiError";
import { cn } from "~/lib/cn";

/** Wizard card footers: shared hover / press affordances (all breakpoints). */
const wizardFooterPrimary = cn(
  "border-2 border-transparent shadow-md transition-all duration-200 ease-out [transition-property:transform,box-shadow]",
  "hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-white/25",
  "active:translate-y-0 active:scale-[0.98]",
  "disabled:hover:translate-y-0 disabled:hover:shadow-md",
);
const wizardFooterSecondary = cn(
  "!border-2 !border-[var(--color-primary)]/40 !bg-[var(--color-surface-lowest)]",
  "shadow-sm transition-all duration-200 ease-out",
  "hover:-translate-y-0.5 hover:shadow-md hover:!border-[var(--color-primary)]",
  "hover:!bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface-lowest))] active:scale-[0.98] disabled:hover:translate-y-0",
);
const wizardFooterGhost = cn(
  "transition-all duration-200",
  "hover:-translate-y-0.5 hover:bg-[var(--color-surface-container)]/90",
  "active:translate-y-0 active:scale-[0.98]",
);

type StepDef = { id: WizardStep; title: string; subtitle: string };
type ConfirmAction = "discard" | "next-step1" | "next-step2" | "finish";

const STEPS: StepDef[] = [
  { id: 1, title: "ActivityLog", subtitle: "Metadata & Context" },
  { id: 2, title: "ActivityOutput", subtitle: "Core Results" },
  { id: 3, title: "KitCount", subtitle: "Task-specific Data" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Import wizard — LearningDB" },
    { name: "description", content: "Multi-step ACTIVITY_LOG → ACTIVITY_OUTPUT → KIT_COUNT" },
  ];
}

export default function ImportWizardRoute() {
  const { user } = useAuth();
  const { bump: bumpHistory } = useHistoryRefresh();
  const [tables, setTables] = React.useState<ResolvedTables | null>(null);
  const [colsLog, setColsLog] = React.useState<Column[]>([]);
  const [colsOut, setColsOut] = React.useState<Column[]>([]);
  const [colsKit, setColsKit] = React.useState<Column[]>([]);

  const [step, setStep] = React.useState<WizardStep>(1);
  const [actiLogId, setActiLogId] = React.useState<number | null>(null);
  const [aoId, setAoId] = React.useState<number | null>(null);
  const [logValues, setLogValues] = React.useState<Record<string, unknown>>({});
  const [outputValues, setOutputValues] = React.useState<Record<string, unknown>>({});
  const [kitRows, setKitRows] = React.useState<Array<Record<string, unknown>>>([{}]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickedActivityLabel, setPickedActivityLabel] = React.useState<string>("");
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction | null>(null);
  const [draftSavedFlash, setDraftSavedFlash] = React.useState(false);
  const draftSavedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await resolveImportTables();
        if (cancelled) return;
        setTables(t);
        const [log, out, kit] = await Promise.all([
          getTableColumns(t.log),
          getTableColumns(t.output),
          getTableColumns(t.kit),
        ]);
        if (cancelled) return;
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
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await loadServerDraft();
        if (cancelled || !d) return;
        setStep(d.step);
        setActiLogId(d.actiLogId);
        setAoId(d.aoId);
        setLogValues(d.logValues);
        setOutputValues(d.outputValues);
        setKitRows(d.kitRows.length ? d.kitRows : [{}]);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e) || "Failed to load saved draft");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  React.useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4500);
    return () => clearTimeout(t);
  }, [error]);

  const selectedActivityId =
    typeof logValues.ACTIVITY_ID === "number"
      ? logValues.ACTIVITY_ID
      : typeof logValues.ACTIVITY_ID === "string" && /^\d+$/.test(logValues.ACTIVITY_ID)
        ? Number(logValues.ACTIVITY_ID)
        : null;

  const omitLog = React.useMemo(() => new Set<string>(["USER_ID", "ACTIVITY_ID"]), []);
  const omitOut = React.useMemo(() => new Set<string>(["ACTI_LOG_ID"]), []);
  const omitKit = React.useMemo(() => new Set<string>(["AO_ID"]), []);

  const canProceedStep1 = React.useMemo(
    () =>
      tables != null &&
      colsLog.length > 0 &&
      selectedActivityId != null &&
      isWizardMetadataComplete(colsLog, logValues, omitLog),
    [tables, colsLog, logValues, omitLog, selectedActivityId],
  );

  const canProceedStep2 = React.useMemo(
    () =>
      tables != null &&
      actiLogId != null &&
      colsOut.length > 0 &&
      isWizardMetadataComplete(colsOut, outputValues, omitOut),
    [tables, actiLogId, colsOut, outputValues, omitOut],
  );

  const canProceedStep3 = React.useMemo(
    () =>
      tables != null &&
      aoId != null &&
      colsKit.length > 0 &&
      kitRows.length > 0 &&
      kitRows.every((row) => isWizardMetadataComplete(colsKit, row, omitKit)),
    [tables, aoId, colsKit, kitRows, omitKit],
  );

  const onSaveDraft = React.useCallback(async () => {
    if (!user) {
      setError("Sign in to save your draft to your account.");
      return;
    }
    setError(null);
    const payload: ImportDraftV1 = {
      version: 1,
      step,
      actiLogId,
      aoId,
      logValues,
      outputValues,
      kitRows,
    };
    try {
      await saveServerDraft(payload);
      if (draftSavedTimerRef.current) clearTimeout(draftSavedTimerRef.current);
      setDraftSavedFlash(true);
      draftSavedTimerRef.current = setTimeout(() => {
        setDraftSavedFlash(false);
        draftSavedTimerRef.current = null;
      }, 2800);
    } catch (e) {
      setError(formatApiError(e) || "Failed to save draft");
    }
  }, [user, step, actiLogId, aoId, logValues, outputValues, kitRows]);

  React.useEffect(
    () => () => {
      if (draftSavedTimerRef.current) clearTimeout(draftSavedTimerRef.current);
    },
    [],
  );

  const onDiscardDraft = React.useCallback(async () => {
    if (user) {
      try {
        await clearServerDraft();
      } catch (e) {
        setError(formatApiError(e) || "Failed to clear draft on server");
        return;
      }
    }
    setStep(1);
    setActiLogId(null);
    setAoId(null);
    setLogValues({});
    setOutputValues({});
    setKitRows([{}]);
    setPickedActivityLabel("");
    setError(null);
    setSuccessMsg("Draft discarded. Wizard reset.");
    setTimeout(() => setSuccessMsg(null), 2200);
  }, [user]);

  const onDiscardDraftWithConfirm = React.useCallback(() => {
    setConfirmAction("discard");
  }, []);

  const changeLog = (name: string, value: unknown) => setLogValues((prev) => ({ ...prev, [name]: value }));
  const changeOut = (name: string, value: unknown) => setOutputValues((prev) => ({ ...prev, [name]: value }));
  const changeKitRow = (idx: number, name: string, value: unknown) =>
    setKitRows((prev) => prev.map((row, i) => (i === idx ? { ...row, [name]: value } : row)));

  const handleStep1Next = async () => {
    if (!tables || !user) return;
    if (selectedActivityId == null) {
      setError("Please choose an activity before continuing.");
      return;
    }
    if (!isWizardMetadataComplete(colsLog, logValues, omitLog)) {
      setError("Please complete all activity log fields before continuing.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const payload = buildInsertPayload(colsLog, logValues, {
        USER_ID: user.user_id,
        ACTIVITY_ID: selectedActivityId,
      });
      const { data } = await insertRecord(tables.log, payload);
      const id = extractPkInt(data.primary_key, ["ACTI_LOG_ID", "acti_log_id"]);
      if (id == null) throw new Error("Insert succeeded but API did not return ACTI_LOG_ID.");
      setActiLogId(id);
      setStep(2);
      await saveServerDraft({
        version: 1,
        step: 2,
        actiLogId: id,
        aoId,
        logValues,
        outputValues,
        kitRows,
      });
    } catch (e) {
      setError(formatApiError(e) || "Step 1 failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStep2Next = async () => {
    if (!tables || actiLogId == null || !user) return;
    if (!isWizardMetadataComplete(colsOut, outputValues, omitOut)) {
      setError("Please complete all activity output fields before continuing.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const payload = buildInsertPayload(colsOut, outputValues, { ACTI_LOG_ID: actiLogId });
      const { data } = await insertRecord(tables.output, payload);
      const id = extractPkInt(data.primary_key, ["AO_ID", "ao_id"]);
      if (id == null) throw new Error("Insert succeeded but API did not return AO_ID.");
      setAoId(id);
      setStep(3);
      await saveServerDraft({
        version: 1,
        step: 3,
        actiLogId,
        aoId: id,
        logValues,
        outputValues,
        kitRows,
      });
    } catch (e) {
      setError(formatApiError(e) || "Step 2 failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStep3Finish = async () => {
    if (!tables || aoId == null) return;
    if (kitRows.length === 0) {
      setError("Please add at least one kit count row.");
      return;
    }
    if (!kitRows.every((row) => isWizardMetadataComplete(colsKit, row, omitKit))) {
      setError("Please complete all fields in every kit count row before finishing.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      for (let i = 0; i < kitRows.length; i += 1) {
        const row = kitRows[i];
        try {
          const payload = buildInsertPayload(colsKit, row, { AO_ID: aoId });
          await insertRecord(tables.kit, payload);
        } catch (err) {
          throw new Error(`Kit row #${i + 1} failed: ${formatApiError(err)}`);
        }
      }
      if (user) {
        try {
          await clearServerDraft();
        } catch (e) {
          setError(formatApiError(e) || "Import saved but failed to clear draft on server");
        }
      }
      setSuccessMsg("Import complete. Kit count rows saved.");
      setTimeout(() => setSuccessMsg(null), 5000);
      setStep(1);
      setActiLogId(null);
      setAoId(null);
      setLogValues({});
      setOutputValues({});
      setKitRows([{}]);
      setPickedActivityLabel("");
      bumpHistory();
    } catch (e) {
      setError(formatApiError(e) || "Step 3 failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStep3FinishWithConfirm = () => {
    if (!canProceedStep3) {
      setError("Please complete all fields in every kit count row before finishing.");
      return;
    }
    setConfirmAction("finish");
  };

  const onStep1NextWithConfirm = React.useCallback(() => {
    if (selectedActivityId == null) {
      setError("Please choose an activity before continuing.");
      return;
    }
    if (!isWizardMetadataComplete(colsLog, logValues, omitLog)) {
      setError("Please complete all activity log fields before continuing.");
      return;
    }
    setConfirmAction("next-step1");
  }, [colsLog, logValues, omitLog, selectedActivityId]);

  const onStep2NextWithConfirm = React.useCallback(() => {
    if (!isWizardMetadataComplete(colsOut, outputValues, omitOut)) {
      setError("Please complete all activity output fields before continuing.");
      return;
    }
    setConfirmAction("next-step2");
  }, [colsOut, outputValues, omitOut]);

  const confirmTitleMap: Record<ConfirmAction, string> = {
    discard: "Discard",
    "next-step1": "Continue to Output Details",
    "next-step2": "Continue to Kit Count",
    finish: "Finish Import",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    discard: "Discard saved draft and reset the wizard?",
    "next-step1": "Proceed to Step 2 and submit ActivityLog data?",
    "next-step2": "Proceed to Step 3 and submit ActivityOutput data?",
    finish: "Finish import and submit all kit count rows?",
  };

  const onConfirmAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "discard") {
      await onDiscardDraft();
      return;
    }
    if (action === "next-step1") {
      await handleStep1Next();
      return;
    }
    if (action === "next-step2") {
      await handleStep2Next();
      return;
    }
    await handleStep3Finish();
  };

  const goToStep = (target: WizardStep) => {
    if (target === 1) {
      setStep(1);
      return;
    }
    if (target === 2) {
      if (actiLogId == null) {
        setError("Complete step 1 and create the ActivityLog before opening step 2.");
        return;
      }
      setStep(2);
      return;
    }
    if (actiLogId == null || aoId == null) {
      setError("Complete steps 1 and 2 before opening step 3.");
      return;
    }
    setStep(3);
  };

  const navigateStepper = (target: WizardStep) => {
    if (busy) return;
    if (target === step) return;
    if (target < step) {
      goToStep(target);
      return;
    }
    if (step === 1) {
      if (target === 2) {
        if (actiLogId == null) {
          if (!canProceedStep1) {
            setError("Please complete all activity log fields and choose an activity before continuing.");
            return;
          }
          onStep1NextWithConfirm();
        } else setStep(2);
        return;
      }
      if (target === 3) {
        if (actiLogId == null) {
          if (!canProceedStep1) {
            setError("Please complete all activity log fields and choose an activity before continuing.");
            return;
          }
          onStep1NextWithConfirm();
        } else if (aoId == null) {
          if (!canProceedStep2) {
            setError("Please complete all activity output fields before continuing.");
            return;
          }
          onStep2NextWithConfirm();
        } else setStep(3);
        return;
      }
    }
    if (step === 2 && target === 3) {
      if (aoId == null) {
        if (!canProceedStep2) {
          setError("Please complete all activity output fields before continuing.");
          return;
        }
        onStep2NextWithConfirm();
      } else setStep(3);
    }
  };

  return (
    <div className="stitch-page-bg min-h-[70vh] rounded-lg p-4 md:p-8">
      <ActivityPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(activity) => {
          const nextId = Number(activity.ACTIVITY_ID);
          changeLog("ACTIVITY_ID", nextId);
          setPickedActivityLabel(
            activity.ACT_NAME
              ? `${activity.ACT_NAME} (ID: ${nextId})`
              : `Activity ID ${nextId}`,
          );
        }}
      />

      <header className="mb-6 space-y-3">
        <nav className="flex items-center gap-2 text-label-md text-[var(--color-on-surface-variant)]">
          <span>Console</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-[var(--color-primary)]">Import Wizard</span>
        </nav>
        <div className="space-y-2">
          <h1 className="text-headline-sm">Logging your data</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)]">
            Step 1 ActivityLog → Step 2 ActivityOutput → Step 3 KitCount. USER_ID auto-fills from your account.
          </p>
        </div>
      </header>

      {error || draftSavedFlash || successMsg ? (
        <div
          className="pointer-events-auto fixed bottom-4 left-4 z-[90] flex max-w-md flex-col gap-2"
          role="status"
        >
          {error ? (
            <div className="shadow-lg">
              <Alert variant="error" className="mb-0">
                {error}
              </Alert>
            </div>
          ) : null}
          {draftSavedFlash ? (
            <div className="shadow-lg">
              <Alert variant="success" className="mb-0">
                Draft saved to your account.
              </Alert>
            </div>
          ) : null}
          {successMsg ? (
            <div className="shadow-lg">
              <Alert variant="success" className="mb-0">
                {successMsg}
              </Alert>
            </div>
          ) : null}
        </div>
      ) : null}
      {confirmAction ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-outline-variant)]/40 bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-ambient)]">
            <h3 className="mb-2 text-title-md">{confirmTitleMap[confirmAction]}</h3>
            <p className="mb-5 text-body-md text-[var(--color-on-surface-variant)]">{confirmMessageMap[confirmAction]}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant={
                  confirmAction === "discard"
                    ? "danger"
                    : confirmAction === "finish"
                      ? "success"
                      : "default"
                }
                onClick={() => void onConfirmAction()}
              >
                Confirm
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-5xl space-y-6">
        <div className="stitch-liquid-wizard-stepper sticky top-20 z-20 mx-3 mb-3 p-4 md:mx-5 md:p-5">
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:grid md:grid-cols-3 md:gap-3">
            {STEPS.map((s) => {
              const active = step === s.id;
              const completed = step > s.id;
              return (
                <div
                  key={s.id}
                  className="flex min-w-0 flex-1 justify-center md:block md:max-w-full md:w-full md:flex-none"
                >
                  <button
                    type="button"
                    aria-label={`${s.title}. ${s.subtitle}`}
                    disabled={
                      busy ||
                      (step === 1 && !canProceedStep1 && s.id > step) ||
                      (step === 2 && aoId == null && !canProceedStep2 && s.id > step)
                    }
                    onClick={() => navigateStepper(s.id)}
                    className="group flex w-full min-w-0 max-w-full items-center justify-center gap-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 enabled:cursor-pointer disabled:pointer-events-none disabled:opacity-50 md:items-start md:justify-start md:gap-3 md:text-left"
                  >
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-label-md font-bold",
                        "transition-[transform,box-shadow] duration-200 ease-out will-change-transform",
                        "group-hover:scale-105 group-hover:shadow-md group-active:scale-95 group-active:duration-100",
                        active
                          ? "bg-[var(--color-primary)] text-white"
                          : completed
                            ? "bg-[var(--color-primary-container)] text-white"
                            : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] group-hover:ring-2 group-hover:ring-[var(--color-outline-variant)]/60",
                      ].join(" ")}
                    >
                      {s.id}
                    </div>
                    <div className="hidden min-w-0 md:block">
                      <p
                        className={
                          active
                            ? "text-label-md font-semibold text-[var(--color-primary)]"
                            : "text-label-md font-semibold"
                        }
                      >
                        {s.title}
                      </p>
                      <p className="text-[0.78rem] text-[var(--color-on-surface-variant)]">{s.subtitle}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 ? (
            <Card className="p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-primary)]">settings_input_component</span>
                <h2 className="text-title-md">ActivityLog Metadata</h2>
              </div>

              <div className="mb-6 rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/30 bg-[var(--color-surface-low)] p-4">
                <p className="mb-2 text-label-md text-[var(--color-on-surface-variant)]">Selected activity</p>
                <p className="mb-3 text-body-md">{pickedActivityLabel || (selectedActivityId != null ? `Activity ID ${selectedActivityId}` : "No activity selected")}</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPickerOpen(true)}
                  className="min-w-[9.5rem] border-2 !border-[var(--color-primary)]/50 !bg-[var(--color-surface-lowest)] !text-[var(--color-primary)] shadow-sm transition-all duration-200 ease-out [transition-property:transform,box-shadow,background-color,border-color] hover:-translate-y-0.5 hover:!border-[var(--color-primary)] hover:!bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface-lowest))] hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                >
                  {selectedActivityId != null ? "Change activity" : "Choose activity"}
                </Button>
              </div>

              <WizardFields
                columns={colsLog}
                values={logValues}
                onChange={changeLog}
                omit={omitLog}
                gridClassName="grid grid-cols-1 gap-y-6 gap-x-5 md:grid-cols-2"
              />
              <div className="mt-8 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:justify-end">
                <Button className={wizardFooterGhost} variant="ghost" onClick={onDiscardDraftWithConfirm} disabled={busy}>
                  Discard
                </Button>
                <Button className={wizardFooterSecondary} variant="secondary" onClick={onSaveDraft} disabled={busy}>
                  Save Draft
                </Button>
                <Button className={wizardFooterPrimary} onClick={onStep1NextWithConfirm} disabled={busy || !canProceedStep1}>
                  Next
                </Button>
              </div>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card className="p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-primary)]">output</span>
                <h2 className="text-title-md">ActivityOutput</h2>
              </div>
              <Alert className="mb-4">
                Linked to ActivityLog from step 1. You do not need to enter <code>ACTI_LOG_ID</code>.
              </Alert>
              <WizardFields columns={colsOut} values={outputValues} onChange={changeOut} omit={omitOut} />
              <div className="mt-8 flex flex-col gap-2 md:hidden">
                <Button className={wizardFooterPrimary} onClick={onStep2NextWithConfirm} disabled={busy || !canProceedStep2}>
                  Next
                </Button>
                <Button className={wizardFooterSecondary} variant="secondary" onClick={onSaveDraft} disabled={busy}>
                  Save Draft
                </Button>
                <Button className={wizardFooterGhost} variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                  Back
                </Button>
                <Button className={wizardFooterGhost} variant="ghost" onClick={onDiscardDraftWithConfirm} disabled={busy}>
                  Discard
                </Button>
              </div>
              <div className="mt-8 hidden flex-col justify-between gap-2 sm:flex-row md:flex">
                <Button className={wizardFooterGhost} variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                  Back
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className={wizardFooterGhost} variant="ghost" onClick={onDiscardDraftWithConfirm} disabled={busy}>
                    Discard
                  </Button>
                  <Button className={wizardFooterSecondary} variant="secondary" onClick={onSaveDraft} disabled={busy}>
                    Save Draft
                  </Button>
                  <Button className={wizardFooterPrimary} onClick={onStep2NextWithConfirm} disabled={busy || !canProceedStep2}>
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card className="p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">query_stats</span>
                  <h2 className="text-title-md">KitCount</h2>
                </div>
                <Button type="button" variant="secondary" onClick={() => setKitRows((prev) => [...prev, {}])}>
                  + Add kit count
                </Button>
              </div>
              <Alert className="mb-4">
                Linked to ActivityOutput in this session. You do not need to enter <code>AO_ID</code>.
              </Alert>

              <div className="space-y-4">
                {kitRows.map((row, idx) => (
                  <div key={idx} className="rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/25 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-label-md text-[var(--color-on-surface-variant)]">Kit row #{idx + 1}</p>
                      {kitRows.length > 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setKitRows((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <WizardFields columns={colsKit} values={row} onChange={(name, value) => changeKitRow(idx, name, value)} omit={omitKit} />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-2 md:hidden">
                <Button className={wizardFooterPrimary} onClick={handleStep3FinishWithConfirm} disabled={busy || !canProceedStep3}>
                  Finish Import
                </Button>
                <Button className={wizardFooterSecondary} variant="secondary" onClick={onSaveDraft} disabled={busy}>
                  Save Draft
                </Button>
                <Button className={wizardFooterGhost} variant="ghost" onClick={() => setStep(2)} disabled={busy}>
                  Back
                </Button>
                <Button className={wizardFooterGhost} variant="ghost" onClick={onDiscardDraftWithConfirm} disabled={busy}>
                  Discard
                </Button>
              </div>
              <div className="mt-8 hidden flex-col justify-between gap-2 sm:flex-row md:flex">
                <Button className={wizardFooterGhost} variant="ghost" onClick={() => setStep(2)} disabled={busy}>
                  Back
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className={wizardFooterGhost} variant="ghost" onClick={onDiscardDraftWithConfirm} disabled={busy}>
                    Discard
                  </Button>
                  <Button className={wizardFooterSecondary} variant="secondary" onClick={onSaveDraft} disabled={busy}>
                    Save Draft
                  </Button>
                  <Button className={wizardFooterPrimary} onClick={handleStep3FinishWithConfirm} disabled={busy || !canProceedStep3}>
                    Finish Import
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
