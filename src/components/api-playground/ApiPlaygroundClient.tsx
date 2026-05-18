"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, RotateCcw, Terminal } from "lucide-react";
import { Textarea } from "@/components/forms/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Inline, Stack, Surface } from "@/components/ui/primitives";
import { FanExperiencePreviewPanel } from "@/components/api-playground/FanExperiencePreviewPanel";
import type { DemoFanExperienceResponse } from "@/lib/demo-fan-api-contract";
import { fadeUpProps } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

function makeLoginDefault(organizationId: string) {
  return JSON.stringify(
    {
      email:          "demo@bigfana.com",
      organizationId,
    },
    null,
    2,
  );
}

const RESPOND_DEFAULT = `{
  "campaignId": "<campaign-id>",
  "answers": [
    {
      "questionId": "<question-id>",
      "optionId": "<option-id>"
    }
  ]
}`;

function isExperiencePayload(data: unknown): data is DemoFanExperienceResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.fan === "object" &&
    d.fan !== null &&
    Array.isArray(d.campaigns) &&
    Array.isArray(d.experiences) &&
    Array.isArray(d.sponsors)
  );
}

async function safeParseJson(text: string): Promise<unknown> {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _parseError: true, raw: text };
  }
}

interface EndpointShellProps {
  method:       "POST" | "GET";
  path:         string;
  title:        string;
  description:  string;
  exampleLabel: string;
  exampleBody:  string;
  children?:    React.ReactNode;
}

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  const variant = method === "GET" ? "info" : "brand";
  return (
    <Badge variant={variant} className="font-mono text-[10px] tracking-wide">
      {method}
    </Badge>
  );
}

function JsonPanel({
  label,
  value,
  loading,
  error,
  emptyHint,
}: {
  label:      string;
  value:      string;
  loading?:   boolean;
  error?:     string | null;
  emptyHint?: string;
}) {
  return (
    <Surface variant="inset" radius="lg" className="flex flex-col min-h-[220px] border border-white/[0.06] overflow-hidden">
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">{label}</span>
        {loading && <Loader2 size={14} className="animate-spin text-[#8888AA]" />}
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3 relative">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="err"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-amber-400/95 leading-relaxed"
            >
              {error}
            </motion.p>
          ) : (
            <motion.pre
              key="txt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "text-[11px] font-mono text-[#C8C8DD] whitespace-pre-wrap break-all leading-relaxed",
                !value && "text-[#55556A]",
              )}
            >
              {value || emptyHint || "—"}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </Surface>
  );
}

function EndpointShell({
  method,
  path,
  title,
  description,
  exampleLabel,
  exampleBody,
  children,
}: EndpointShellProps) {
  return (
    <motion.div {...fadeUpProps(0.06)}>
      <Card className="overflow-hidden border border-white/[0.07] bg-[#0D0D14]/90">
        <div className="p-5 border-b border-white/[0.06] space-y-3">
          <Inline gap={3} align="center" wrap>
            <MethodBadge method={method} />
            <code className="text-[11px] font-mono text-[#8888AA]">{path}</code>
          </Inline>
          <div>
            <h2 className="text-base font-bold text-[#F0F0F8]">{title}</h2>
            <p className="text-xs text-[#55556A] mt-1 leading-relaxed">{description}</p>
          </div>
          <Surface variant="inset" radius="lg" className="p-3 border border-white/[0.05]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A] mb-2">
              {exampleLabel}
            </p>
            <pre className="text-[10px] font-mono text-[#8888AA] whitespace-pre-wrap leading-relaxed">
              {exampleBody}
            </pre>
          </Surface>
        </div>
        <div className="p-5">{children}</div>
      </Card>
    </motion.div>
  );
}

export function ApiPlaygroundClient({
  defaultOrganizationId,
}: {
  defaultOrganizationId: string;
}) {
  const [loginBody, setLoginBody] = useState(() => makeLoginDefault(defaultOrganizationId));
  const [loginResponse, setLoginResponse] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [fanAccessToken, setFanAccessToken] = useState<string | null>(null);

  const [experienceResponse, setExperienceResponse] = useState("");
  const [experiencePreview, setExperiencePreview] =
    useState<DemoFanExperienceResponse | null>(null);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [experienceTab, setExperienceTab] = useState<"json" | "preview">("json");

  const [respondBody, setRespondBody] = useState(RESPOND_DEFAULT);
  const [respondResponse, setRespondResponse] = useState("");
  const [respondLoading, setRespondLoading] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);

  const runLogin = useCallback(async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(loginBody);
      } catch {
        setLoginError("JSON inválido en la solicitud.");
        setLoginLoading(false);
        return;
      }

      const res = await fetch("/api/demo/fan/login", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(parsed),
      });

      const raw = await res.text();
      const data = await safeParseJson(raw);

      setLoginResponse(JSON.stringify(data, null, 2));

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        setLoginError(msg);
      } else if (
        typeof data === "object" &&
        data !== null &&
        "token" in data &&
        typeof (data as { token?: unknown }).token === "string"
      ) {
        setFanAccessToken((data as { token: string }).token);
      }
    } catch {
      setLoginError("No se pudo completar la solicitud.");
      setLoginResponse("");
    } finally {
      setLoginLoading(false);
    }
  }, [loginBody]);

  const runExperience = useCallback(async () => {
    setExperienceLoading(true);
    setExperienceError(null);
    setExperiencePreview(null);

    if (!fanAccessToken) {
      setExperienceError(
        "Necesitás un token demo. Ejecutá Fan Login para obtener el Bearer.",
      );
      setExperienceLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/demo/fan/experience", {
        method:      "GET",
        credentials: "include",
        headers:     { Authorization: `Bearer ${fanAccessToken}` },
      });
      const raw = await res.text();
      const data = await safeParseJson(raw);

      setExperienceResponse(JSON.stringify(data, null, 2));

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        setExperienceError(msg);
        setExperiencePreview(null);
      } else if (isExperiencePayload(data)) {
        setExperiencePreview(data);
      } else {
        setExperiencePreview(null);
      }
    } catch {
      setExperienceError("No se pudo completar la solicitud.");
      setExperienceResponse("");
      setExperiencePreview(null);
    } finally {
      setExperienceLoading(false);
    }
  }, [fanAccessToken]);

  const runRespond = useCallback(async () => {
    setRespondLoading(true);
    setRespondError(null);
    try {
      if (!fanAccessToken) {
        setRespondError(
          "Necesitás un token demo. Ejecutá Fan Login primero.",
        );
        setRespondLoading(false);
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(respondBody);
      } catch {
        setRespondError("JSON inválido en la solicitud.");
        setRespondLoading(false);
        return;
      }

      const res = await fetch("/api/demo/fan/campaign/respond", {
        method:      "POST",
        credentials: "include",
        headers:     {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${fanAccessToken}`,
        },
        body: JSON.stringify(parsed),
      });

      const raw = await res.text();
      const data = await safeParseJson(raw);

      setRespondResponse(JSON.stringify(data, null, 2));

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        setRespondError(msg);
      }
    } catch {
      setRespondError("No se pudo completar la solicitud.");
      setRespondResponse("");
    } finally {
      setRespondLoading(false);
    }
  }, [respondBody, fanAccessToken]);

  return (
    <Stack gap={6}>
      <motion.div
        {...fadeUpProps(0)}
        className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
      >
        <Terminal size={18} className="text-[#FF2D55] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#F0F0F8]">Fan Experience API · demo interna</p>
          <p className="text-xs text-[#55556A] leading-relaxed">
            Login demo público por email + organizationId devuelve un token firmado; Fan Experience y Campaign Response
            requieren <code className="text-[#8888AA]">Authorization: Bearer</code>. El club actual prellená el{" "}
            <code className="text-[#8888AA]">organizationId</code> en el ejemplo.
          </p>
        </div>
      </motion.div>

      {/* Fan Login */}
      <EndpointShell
        method="POST"
        path="/api/demo/fan/login"
        title="Fan Login"
        description="Sin sesión de administrador: email + organizationId del club. Respuesta incluye token Bearer firmado (demo) con fanId y organizationId."
        exampleLabel="Ejemplo de solicitud"
        exampleBody={makeLoginDefault(defaultOrganizationId).trim()}
      >
        <Stack gap={4}>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A] mb-2 block">
              Cuerpo JSON
            </label>
            <Textarea
              value={loginBody}
              onChange={(e) => setLoginBody(e.target.value)}
              className="font-mono text-[11px] min-h-[140px] bg-[#0D0D14] border-white/[0.08]"
            />
          </div>
          <Inline gap={2}>
            <Button
              intent="primary"
              size="sm"
              leftIcon={loginLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              disabled={loginLoading}
              onClick={runLogin}
            >
              Ejecutar
            </Button>
            <Button
              intent="ghost"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => {
                setLoginBody(makeLoginDefault(defaultOrganizationId));
                setLoginResponse("");
                setLoginError(null);
                setFanAccessToken(null);
              }}
            >
              Reiniciar
            </Button>
          </Inline>
          <JsonPanel
            label="Respuesta"
            value={loginResponse}
            loading={loginLoading}
            error={loginError}
            emptyHint="La respuesta aparece aquí en JSON."
          />
        </Stack>
      </EndpointShell>

      {/* Fan Experience */}
      <EndpointShell
        method="GET"
        path="/api/demo/fan/experience"
        title="Fan Experience"
        description="Requiere encabezado Authorization: Bearer con el token devuelto por Fan Login. El fan se resuelve desde el token — org y fanId quedan alineados."
        exampleLabel="Encabezado requerido"
        exampleBody={`Authorization: Bearer <token>\nGET /api/demo/fan/experience`}
      >
        <Stack gap={4}>
          {fanAccessToken && (
            <Surface variant="base" radius="lg" className="p-3 border border-[#00D4A8]/15 bg-[#00D4A8]/[0.04]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A] mb-1">
                Token demo activo
              </p>
              <p className="text-[10px] font-mono text-[#C8C8DD] break-all line-clamp-2">
                {fanAccessToken.slice(0, 48)}…
              </p>
            </Surface>
          )}
          <Inline gap={2}>
            <Button
              intent="primary"
              size="sm"
              leftIcon={
                experienceLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />
              }
              disabled={experienceLoading}
              onClick={runExperience}
            >
              Ejecutar
            </Button>
            <Button
              intent="ghost"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => {
                setExperienceResponse("");
                setExperiencePreview(null);
                setExperienceError(null);
                setExperienceTab("json");
              }}
            >
              Reiniciar
            </Button>
          </Inline>

          <div className="xl:hidden space-y-4">
            <Tabs
              variant="line"
              size="sm"
              active={experienceTab}
              onChange={(id) => setExperienceTab(id as "json" | "preview")}
              items={[
                { id: "json", label: "JSON" },
                { id: "preview", label: "Vista previa" },
              ]}
            />
            <TabPanel id="json" active={experienceTab}>
              <JsonPanel
                label="Respuesta JSON"
                value={experienceResponse}
                loading={experienceLoading}
                error={experienceError}
                emptyHint="Ejecutá una solicitud válida para ver el payload."
              />
            </TabPanel>
            <TabPanel id="preview" active={experienceTab}>
              <FanExperiencePreviewPanel
                data={experiencePreview}
                emptyHint={
                  experienceError
                    ? "Corregí la solicitud para renderizar la vista previa."
                    : "Ejecutá Fan Experience para poblar la vista previa premium."
                }
              />
            </TabPanel>
          </div>

          <div className="hidden xl:grid xl:grid-cols-2 xl:gap-4 xl:items-start">
            <JsonPanel
              label="Respuesta JSON"
              value={experienceResponse}
              loading={experienceLoading}
              error={experienceError}
              emptyHint="Ejecutá una solicitud válida para ver el payload."
            />
            <FanExperiencePreviewPanel
              data={experiencePreview}
              emptyHint={
                experienceError
                  ? "Corregí la solicitud para renderizar la vista previa."
                  : "Ejecutá Fan Experience para poblar la vista previa premium."
              }
            />
          </div>
        </Stack>
      </EndpointShell>

      {/* Campaign respond */}
      <EndpointShell
        method="POST"
        path="/api/demo/fan/campaign/respond"
        title="Campaign Response"
        description="Participación demo (trivia, encuesta, predicción, etc.) usando el mismo pipeline que producción. Mismo Bearer que Fan Experience; fanId se toma del token (opcional en el cuerpo si coincide)."
        exampleLabel="Ejemplo de solicitud"
        exampleBody={RESPOND_DEFAULT.trim()}
      >
        <Stack gap={4}>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A] mb-2 block">
              Cuerpo JSON
            </label>
            <Textarea
              value={respondBody}
              onChange={(e) => setRespondBody(e.target.value)}
              className="font-mono text-[11px] min-h-[180px] bg-[#0D0D14] border-white/[0.08]"
            />
          </div>
          <Inline gap={2}>
            <Button
              intent="primary"
              size="sm"
              leftIcon={
                respondLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />
              }
              disabled={respondLoading}
              onClick={runRespond}
            >
              Ejecutar
            </Button>
            <Button
              intent="ghost"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => {
                setRespondBody(RESPOND_DEFAULT);
                setRespondResponse("");
                setRespondError(null);
              }}
            >
              Reiniciar
            </Button>
          </Inline>
          <JsonPanel
            label="Respuesta"
            value={respondResponse}
            loading={respondLoading}
            error={respondError}
            emptyHint="El resultado del pipeline aparece aquí."
          />
        </Stack>
      </EndpointShell>
    </Stack>
  );
}
