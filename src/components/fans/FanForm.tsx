"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/forms/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/feedback/Modal";
import { createFan, updateFan } from "@/server/actions/fans";
import type { Fan } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FanFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** When provided, the form operates in edit mode. */
  fan?: Fan;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  city: string;
  country: string;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "",
  city: "",
  country: "",
};

const GENDER_OPTIONS = [
  { value: "masculino",   label: "Masculino" },
  { value: "femenino",    label: "Femenino" },
  { value: "otro",        label: "Otro" },
  { value: "prefiero_no", label: "Prefiero no decir" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FanForm({ open, onClose, onSuccess, fan }: FanFormProps) {
  const isEdit = !!fan;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(() =>
    fan
      ? {
          firstName: fan.firstName ?? "",
          lastName:  fan.lastName  ?? "",
          email:     fan.email     ?? "",
          phone:     fan.phone     ?? "",
          birthDate: fan.birthDate ?? "",
          gender:    fan.gender    ?? "",
          city:      fan.city      ?? "",
          country:   fan.country   ?? "",
        }
      : EMPTY_FORM,
  );

  function handleClose() {
    if (isPending) return;
    setError(null);
    onClose();
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateFan({
            id: fan!.id,
            firstName: form.firstName.trim(),
            lastName:  form.lastName.trim(),
            email:     form.email     || undefined,
            phone:     form.phone     || undefined,
            birthDate: form.birthDate || undefined,
            gender:    form.gender    || undefined,
            city:      form.city      || undefined,
            country:   form.country   || undefined,
          })
        : await createFan({
            firstName: form.firstName.trim(),
            lastName:  form.lastName.trim(),
            email:     form.email     || undefined,
            phone:     form.phone     || undefined,
            birthDate: form.birthDate || undefined,
            gender:    form.gender    || undefined,
            city:      form.city      || undefined,
            country:   form.country   || undefined,
          });

      if (result.success) {
        setForm(EMPTY_FORM);
        setError(null);
        onSuccess();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar fan" : "Nuevo fan"}
      subtitle={
        isEdit
          ? "Actualiza los datos del fan. Se encolará una sincronización EEP."
          : "Completa los datos. El fan quedará en estado activo con sincronización EEP pendiente."
      }
      size="lg"
      footer={
        <>
          <Button intent="ghost" size="sm" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            intent="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending
              ? isEdit ? "Guardando…" : "Creando…"
              : isEdit ? "Guardar cambios" : "Crear fan"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre *"
            placeholder="ej. Carlos"
            value={form.firstName}
            onChange={set("firstName")}
            disabled={isPending}
            size="sm"
          />
          <Input
            label="Apellido *"
            placeholder="ej. Rodríguez"
            value={form.lastName}
            onChange={set("lastName")}
            disabled={isPending}
            size="sm"
          />
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email"
            type="email"
            placeholder="ej. carlos@example.com"
            value={form.email}
            onChange={set("email")}
            disabled={isPending}
            size="sm"
          />
          <Input
            label="Teléfono"
            type="tel"
            placeholder="ej. +54 9 11 1234 5678"
            value={form.phone}
            onChange={set("phone")}
            disabled={isPending}
            size="sm"
          />
        </div>

        {/* Demographics row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={form.birthDate}
            onChange={set("birthDate")}
            disabled={isPending}
            size="sm"
          />
          <Select
            label="Género"
            placeholder="Seleccionar…"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={set("gender")}
            disabled={isPending}
            size="sm"
          />
        </div>

        {/* Location row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ciudad"
            placeholder="ej. Buenos Aires"
            value={form.city}
            onChange={set("city")}
            disabled={isPending}
            size="sm"
          />
          <Input
            label="País"
            placeholder="ej. Argentina"
            value={form.country}
            onChange={set("country")}
            disabled={isPending}
            size="sm"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/[0.06] border border-red-500/20 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
