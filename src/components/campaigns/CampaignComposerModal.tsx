"use client";

import * as React from "react";
import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, CopyPlus } from "lucide-react";
import { Modal } from "@/components/feedback/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { MultiSelect, type MultiSelectOption } from "@/components/forms/MultiSelect";
import { DatePicker } from "@/components/forms/DatePicker";
import { TimePicker } from "@/components/forms/TimePicker";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/campaign-ui";
import {
  createCampaign,
  updateCampaign,
  fetchCampaignDetailAction,
  type CreateCampaignInput,
  type CampaignQuestionInput,
  type CampaignOptionInput,
} from "@/server/actions/campaigns";
import type { SegmentRulePickOption } from "@/server/queries/org-segments";
import {
  CAMPAIGN_TYPES,
  type CampaignType,
  type CampaignQuestionKind,
} from "@/db/schema";
import type { TimeValue } from "@/lib/date-utils";

// ─── helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `tmp_${Math.random().toString(36).slice(2)}`;
}

/** Midnight local — calendar column alignment for DatePicker. */
function calendarDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function extractTimeValue(d: Date): TimeValue {
  return {
    hours:   d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
  };
}

/** Build a timestamp from a calendar day + wall-clock slice. */
function combineDayAndTime(day: Date, t: TimeValue): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    t.hours,
    t.minutes,
    t.seconds ?? 0,
    0,
  );
}

function mergePickedCalendarDayPreserveTime(previous: Date, picked: Date): Date {
  return combineDayAndTime(picked, extractTimeValue(previous));
}

function applyTimeToInstant(instant: Date, t: TimeValue): Date {
  return combineDayAndTime(calendarDayLocal(instant), t);
}

function freshRange(): { startAt: Date; endAt: Date } {
  const startAt = new Date();
  const endAt   = new Date(startAt.getTime() + 1000 * 60 * 60 * 24 * 14); // +14 days
  return { startAt, endAt };
}

interface LocalOption {
  key: string;
  label: string;
  value: string;
  isCorrect?: boolean;
}

interface LocalQuestion {
  key:           string;
  question:      string;
  type:          CampaignQuestionKind;
  sortOrderSeed: number;
  options:       LocalOption[];
}

function emptyOption(): LocalOption {
  return { key: uid(), label: "", value: "", isCorrect: false };
}

function emptyQuestion(kind: CampaignQuestionKind, index: number): LocalQuestion {
  return {
    key: uid(),
    question: "",
    type: kind,
    sortOrderSeed: index,
    options: [emptyOption(), emptyOption()],
  };
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CampaignComposerModalProps {
  open:            boolean;
  mode:            "create" | "edit";
  /** Required when editing */
  campaignId:      string | null;
  segmentOptions:  SegmentRulePickOption[];
  onClose:         () => void;
  onSuccess:       () => void;
}

export function CampaignComposerModal({
  open,
  mode,
  campaignId,
  segmentOptions,
  onClose,
  onSuccess,
}: CampaignComposerModalProps) {
  const [pending, startTransition] = useTransition();
  const [loadingDraft, setLoadingDraft] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [title, setTitle]                       = useState("");
  const [description, setDescription]         = useState("");
  const [campaignType, setCampaignType]        = useState<CampaignType>("poll");
  const [pointsReward, setPointsReward]         = useState(50);

  const [startAt, setStartAt] = useState<Date>(() => freshRange().startAt);
  const [endAt, setEndAt]       = useState<Date>(() => freshRange().endAt);

  const [segmentIds, setSegmentIds]       = useState<string[]>([]);
  const [questions, setQuestions]         = useState<LocalQuestion[]>([emptyQuestion("multiple_choice", 0)]);

  const msItems: MultiSelectOption[] = segmentOptions.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- modal bootstrap / server hydrate */
    if (!open) return;

    setError(null);

    if (mode === "create") {
      const r = freshRange();
      setTitle("");
      setDescription("");
      setCampaignType("poll");
      setPointsReward(50);
      setStartAt(r.startAt);
      setEndAt(r.endAt);
      setSegmentIds([]);
      setQuestions([emptyQuestion("multiple_choice", 0)]);
      return;
    }

    if (mode !== "edit" || !campaignId) return;

    setLoadingDraft(true);
    fetchCampaignDetailAction(campaignId)
      .then((res) => {
        if (!res.success || !campaignId) {
          setError("No pudimos cargar la campaña para editarla.");
          return;
        }

        const c = res.detail;
        setTitle(c.title);
        setDescription(c.description ?? "");
        setCampaignType(c.type as CampaignType);
        setPointsReward(c.pointsReward ?? 0);
        setStartAt(new Date(c.startsAt));
        setEndAt(new Date(c.endsAt));

        if (
          c.segmentRules
          && typeof c.segmentRules === "object"
          && "mode" in c.segmentRules
          && c.segmentRules.mode === "segments"
          && Array.isArray(c.segmentRules.segmentRuleIds)
        ) {
          setSegmentIds(c.segmentRules.segmentRuleIds as string[]);
        } else {
          setSegmentIds([]);
        }

        const mappedQs: LocalQuestion[] = res.detail.questions.map((q, i) => ({
          key: uid(),
          question: q.question,
          type: q.type as CampaignQuestionKind,
          sortOrderSeed: i,
          options:
            q.type === "multiple_choice"
              ? q.options.map((o) => ({
                  key: uid(),
                  label: o.label,
                  value: o.value,
                  isCorrect: o.isCorrect ?? false,
                }))
              : [],
        }));

        setQuestions(mappedQs.length ? mappedQs : [emptyQuestion("multiple_choice", 0)]);
      })
      .catch(() => setError("Error al cargar la campaña."))
      .finally(() => setLoadingDraft(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, mode, campaignId]);

  /** Clear trivia correctness when flipping away */
  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- keep client draft consistent with modality */
    if (campaignType === "trivia") return;
    setQuestions((qs) =>
      qs.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o, isCorrect: false })),
      })),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [campaignType]);

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion("multiple_choice", qs.length)]);
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) =>
      qs.length <= 1 ? qs : qs.filter((_, i) => i !== idx),
    );
  }

  function patchQuestion(idx: number, patch: Partial<LocalQuestion>) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== idx) return q;

        let nextOpts = q.options;

        /* MC → texto: wipe options server-side validated */
        if (patch.type === "short_text") {
          nextOpts = [];
        }
        /* texto → mc: hydrate defaults */
        if (patch.type === "multiple_choice" && q.type !== "multiple_choice") {
          nextOpts = [emptyOption(), emptyOption()];
        }

        return { ...q, ...patch, options: patch.options ?? nextOpts };
      }),
    );
  }

  function addOption(qIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, emptyOption()] } : q)),
    );
  }

  function patchOption(qIdx: number, oIdx: number, patch: Partial<LocalOption>) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((opt, j) =>
          j === oIdx ? { ...opt, ...patch } : opt,
        );
        return { ...q, options };
      }),
    );
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOpts = q.options.filter((_, j) => j !== oIdx);
        return { ...q, options: nextOpts.length < 2 ? q.options : nextOpts };
      }),
    );
  }

  /** Mark single correct option inside trivia prompts */
  function markCorrect(questionKey: string, optionKey: string) {
    setQuestions((qs) =>
      qs.map((q) => ({
        ...q,
        options: q.options.map((o) =>
          q.key !== questionKey
            ? o
            : ({
                ...o,
                isCorrect: o.key === optionKey ? true : false,
              }),
        ),
      })),
    );
  }

  function buildPayload(): CreateCampaignInput {
    if (
      Number.isNaN(startAt.getTime())
      || Number.isNaN(endAt.getTime())
    ) {
      throw new Error("Revisá el formato de fechas.");
    }
    if (endAt <= startAt) {
      throw new Error("La fecha de cierre debe ser posterior al inicio.");
    }

    const startsAtIso = startAt.toISOString();
    const endsAtIso   = endAt.toISOString();

    const qsPayload: CampaignQuestionInput[] = questions.map((q, qi) => {
      const sortedOpts =
        q.type === "multiple_choice"
          ? q.options.filter((o) => o.label.trim() || o.value.trim())
          : [];

      const mappedOpts: CampaignOptionInput[] =
        q.type === "multiple_choice"
          ? sortedOpts.map((opt, ox) => ({
              label:     opt.label.trim(),
              value:     opt.value.trim() || `${ox}`,
              sortOrder: ox,
              isCorrect: campaignType === "trivia" ? opt.isCorrect === true : null,
            }))
          : [];

      const base: CampaignQuestionInput = {
        question: q.question.trim(),
        type:     q.type,
        sortOrder: q.sortOrderSeed ?? qi,
        options:
          q.type === "multiple_choice"
            ? mappedOpts
            : [], // validated server-side empty for short_text
      };

      return base;
    });

    return {
      title:          title.trim(),
      description,
      type:           campaignType,
      pointsReward,
      startsAtIso,
      endsAtIso,
      segmentRuleIds: segmentIds,
      questions:      qsPayload,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = buildPayload();

        if (mode === "create") {
          const created = await createCampaign(payload);
          if (!created.success) {
            setError(created.error);
            return;
          }
          onSuccess();
          onClose();
          return;
        }

        if (!campaignId) return;

        const updated = await updateCampaign({ ...payload, id: campaignId });
        if (!updated.success) {
          setError(updated.error);
          return;
        }
        onSuccess();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal.");
      }
    });
  }

  const typeSelectOptions = [...CAMPAIGN_TYPES].map((t) => ({
    value: t,
    label: CAMPAIGN_TYPE_LABELS[t],
  }));

  const titleLabel = mode === "create" ? "Nueva campaña" : "Editar campaña";

  const busy = pending || loadingDraft;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={titleLabel}
      subtitle="Motor de engagement — demo interna para el panel del club."
      size="xl"
      footer={
        <>
          <Button intent="ghost" size="sm" type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button intent="primary" size="sm" type="submit" form="campaign-composer-form" disabled={busy}>
            {busy ? "Guardando…" : mode === "create" ? "Crear campaña" : "Guardar cambios"}
          </Button>
        </>
      }
    >
      {loadingDraft && mode === "edit" ? (
        <div className="text-xs text-[#55556A] py-16 text-center">Cargando estructura…</div>
      ) : (
        <form id="campaign-composer-form" className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <p className="text-xs text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                Título
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Votación figura oficial" />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                Descripción
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contextualizá rápidamente el objetivo y la audiencia esperada."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                Tipo
              </label>
              <Select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value as CampaignType)}
                options={typeSelectOptions}
                wrapperClassName="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                Puntos recompensa
              </label>
              <Input
                type="number"
                min={0}
                value={String(pointsReward)}
                onChange={(e) =>
                  setPointsReward(Math.max(0, Number.parseInt(e.target.value || "0", 10)))
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                Inicia
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <DatePicker
                  size="sm"
                  label="Fecha"
                  placeholder="Elegí fecha…"
                  displayFormat="dd/MM/yyyy"
                  value={startAt}
                  maxDate={calendarDayLocal(endAt)}
                  onChange={(d) => {
                    if (!d) return;
                    setStartAt((prev) => mergePickedCalendarDayPreserveTime(prev, d));
                  }}
                  wrapperClassName="flex-1 min-w-0"
                />
                <TimePicker
                  size="sm"
                  is24
                  label="Hora"
                  placeholder="Hora inicio…"
                  value={extractTimeValue(startAt)}
                  onChange={(t) => setStartAt(applyTimeToInstant(startAt, t))}
                  wrapperClassName="flex-1 min-w-[140px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                Finaliza
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <DatePicker
                  size="sm"
                  label="Fecha"
                  placeholder="Elegí fecha…"
                  displayFormat="dd/MM/yyyy"
                  value={endAt}
                  minDate={calendarDayLocal(startAt)}
                  onChange={(d) => {
                    if (!d) return;
                    setEndAt((prev) => mergePickedCalendarDayPreserveTime(prev, d));
                  }}
                  wrapperClassName="flex-1 min-w-0"
                />
                <TimePicker
                  size="sm"
                  is24
                  label="Hora"
                  placeholder="Hora fin…"
                  value={extractTimeValue(endAt)}
                  onChange={(t) => setEndAt(applyTimeToInstant(endAt, t))}
                  wrapperClassName="flex-1 min-w-[140px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
              Audiencia (segmentación EIL)
            </label>
            <MultiSelect
              value={segmentIds}
              onChange={setSegmentIds}
              options={msItems}
              placeholder="Todos los fans (vacío)"
              size="md"
            />
            <p className="text-[10px] text-[#55556A]">
              Si no seleccionás segmentos la campaña se considera abierta (`mode=all`).
            </p>
          </div>

          <div className="border-t border-white/[0.05] pt-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#F0F0F8] uppercase tracking-wide">Preguntas</p>
              <Button
                intent="secondary"
                size="sm"
                type="button"
                leftIcon={<Plus size={12} />}
                onClick={addQuestion}
              >
                Añadir pregunta
              </Button>
            </div>

            {questions.map((q, qi) => (
              <div
                key={q.key}
                className="rounded-2xl border border-white/[0.06] bg-[#12121A]/80 px-5 py-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide">
                      Pregunta {qi + 1}
                    </label>
                    <Input
                      value={q.question}
                      onChange={(e) => patchQuestion(qi, { question: e.target.value })}
                      placeholder={campaignType === "trivia" ? "La consigna de la trivia" : "Ej. ¿Quién fue la figura?"}
                    />
                  </div>
                  <div className="w-44 space-y-1">
                    <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide pb-2 block">
                      Formato
                    </label>
                    <Select
                      value={q.type}
                      onChange={(e) =>
                        patchQuestion(qi, { type: e.target.value as CampaignQuestionKind })
                      }
                      options={[
                        { value: "multiple_choice", label: "Opción múltiple" },
                        { value: "short_text",        label: "Texto abierto" },
                      ]}
                      wrapperClassName="w-full"
                      size="sm"
                    />
                  </div>

                  <Button
                    intent="ghost"
                    size="icon-sm"
                    type="button"
                    aria-label="Eliminar pregunta"
                    disabled={questions.length <= 1}
                    onClick={() => removeQuestion(qi)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                {q.type === "multiple_choice" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#55556A]">
                      <CopyPlus size={12} /> Opciones
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div
                          key={opt.key}
                          className="flex flex-wrap items-start gap-2 rounded-xl bg-white/[0.02] border border-white/[0.03] px-3 py-2"
                        >
                          <div className="flex flex-1 gap-2 min-w-0 flex-wrap md:flex-nowrap">
                            <Input
                              className="min-w-[120px]"
                              placeholder="Etiqueta"
                              value={opt.label}
                              onChange={(e) => patchOption(qi, oi, { label: e.target.value })}
                            />
                            <Input
                              className="min-w-[100px]"
                              placeholder="valor interno"
                              value={opt.value}
                              onChange={(e) => patchOption(qi, oi, { value: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-3 ml-auto shrink-0">
                            {campaignType === "trivia" && (
                              <label className="flex items-center gap-2 text-[10px] text-[#8888AA]">
                                <input
                                  type="radio"
                                  checked={!!opt.isCorrect}
                                  name={`corr_${q.key}`}
                                  value={opt.key}
                                  onChange={() => markCorrect(q.key, opt.key)}
                                />
                                Correcta
                              </label>
                            )}
                            <Button
                              intent="ghost"
                              size="icon-sm"
                              type="button"
                              aria-label="Quitar opción"
                              disabled={q.options.length <= 2}
                              onClick={() => removeOption(qi, oi)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      intent="secondary"
                      size="sm"
                      type="button"
                      leftIcon={<Plus size={12} />}
                      onClick={() => addOption(qi)}
                    >
                      Agregar opción
                    </Button>
                  </div>
                )}

                {q.type === "short_text" && (
                  <p className="text-[10px] text-[#55556A]">
                    Los fans ingresarán texto libre. Ideal para surveys narrativos.
                  </p>
                )}
              </div>
            ))}
          </div>
        </form>
      )}
    </Modal>
  );
}
