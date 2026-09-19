"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { SelectField, TextField } from "../../_components/form-field";
import { createRiderAction } from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import { IDENTITY_DOCUMENT_TYPES, identityDocumentLabels } from "@/lib/types/enums";
import {
  VehiclePicker,
  requiresPlate,
  type VehicleCatalogue,
} from "./vehicle-picker";

type Draft = {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  city: string;
  vehicle_type_id: string;
  vehicle_make_id: string;
  vehicle_model_id: string;
  plate_number: string;
  date_of_birth: string;
  id_type: string;
  id_number: string;
  residential_address: string;
  vehicle_colour: string;
  vehicle_year: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const EMPTY: Draft = {
  email: "",
  phone: "",
  first_name: "",
  last_name: "",
  city: "",
  vehicle_type_id: "",
  vehicle_make_id: "",
  vehicle_model_id: "",
  plate_number: "",
  date_of_birth: "",
  id_type: "",
  id_number: "",
  residential_address: "",
  vehicle_colour: "",
  vehicle_year: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

/**
 * Staff onboarding a rider who walked into the office rather than registering
 * in the app.
 *
 * A single form rather than the vendor's five-step wizard: a rider is a name, a
 * number, a city and a bike, and a wizard over that many fields is ceremony.
 *
 * Documents and payout details are deliberately not here. They are uploaded on
 * the rider's own screens against the account this creates, and an admin typing
 * somebody's bank number from a piece of paper is not an onboarding flow worth
 * building. The rider lands `pending_review` either way, so nothing skips the
 * approval this is a precursor to.
 */
export function RiderComposer({ catalogue }: { catalogue: VehicleCatalogue }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");
  const [created, setCreated] = useState<{ id: number; password: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Draft>(key: K) {
    return (value: string) => setDraft((current) => ({ ...current, [key]: value as Draft[K] }));
  }

  // Whether a plate is demanded comes off the chosen type rather than a
  // hard-coded "not a bicycle" - the fleet is a table, and a type an admin adds
  // carries its own answer. The backend enforces the same rule.
  const needsPlate = requiresPlate(catalogue, draft.vehicle_type_id);

  const canSubmit =
    !pending &&
    draft.email.trim() !== "" &&
    draft.phone.trim() !== "" &&
    draft.first_name.trim() !== "" &&
    draft.last_name.trim() !== "" &&
    draft.city.trim() !== "" &&
    draft.vehicle_type_id !== "" &&
    (!needsPlate || draft.plate_number.trim() !== "");

  function submit() {
    startTransition(async () => {
      setErrors({});
      setFailure("");

      const result = await createRiderAction({
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim(),
        city: draft.city.trim(),
        vehicle_type_id: Number(draft.vehicle_type_id),
        vehicle_make_id: draft.vehicle_make_id ? Number(draft.vehicle_make_id) : null,
        vehicle_model_id: draft.vehicle_model_id ? Number(draft.vehicle_model_id) : null,
        plate_number: draft.plate_number.trim() || null,
        date_of_birth: draft.date_of_birth || null,
        id_type: draft.id_type || null,
        id_number: draft.id_number.trim() || null,
        residential_address: draft.residential_address.trim() || null,
        vehicle_colour: draft.vehicle_colour.trim() || null,
        vehicle_year: draft.vehicle_year ? Number(draft.vehicle_year) : null,
        emergency_contact_name: draft.emergency_contact_name.trim() || null,
        emergency_contact_phone: draft.emergency_contact_phone.trim() || null,
      });

      if (!result.ok) {
        setErrors(result.errors);
        setFailure(result.message);
        return;
      }

      setCreated(result.data);
    });
  }

  if (created) {
    return <CreatedPanel riderId={created.id} password={created.password} />;
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
      <Section title="Account" description="The login this rider will use. The password is generated.">
        <TextField
          id="email"
          label="Email"
          type="email"
          required
          value={draft.email}
          onChange={set("email")}
          error={fieldError(errors, "email")}
          disabled={pending}
        />
        <TextField
          id="phone"
          label="Phone"
          type="tel"
          required
          value={draft.phone}
          onChange={set("phone")}
          hint="Where their one-time codes go."
          error={fieldError(errors, "phone")}
          disabled={pending}
        />
      </Section>

      <Section title="Rider" description="Who they are, and where they work from.">
        <TextField
          id="first_name"
          label="First name"
          required
          value={draft.first_name}
          onChange={set("first_name")}
          error={fieldError(errors, "first_name")}
          disabled={pending}
        />
        <TextField
          id="last_name"
          label="Last name"
          required
          value={draft.last_name}
          onChange={set("last_name")}
          error={fieldError(errors, "last_name")}
          disabled={pending}
        />
        <TextField
          id="city"
          label="City"
          required
          value={draft.city}
          onChange={set("city")}
          error={fieldError(errors, "city")}
          disabled={pending}
        />
        <TextField
          id="date_of_birth"
          label="Date of birth"
          type="date"
          value={draft.date_of_birth}
          onChange={set("date_of_birth")}
          hint="Must be 18 or over."
          error={fieldError(errors, "date_of_birth")}
          disabled={pending}
        />
        <SelectField
          id="id_type"
          label="Identity document"
          value={draft.id_type}
          onChange={set("id_type")}
          placeholder="Not recorded yet"
          options={IDENTITY_DOCUMENT_TYPES.map((type) => ({
            value: type,
            label: identityDocumentLabels[type],
          }))}
          error={fieldError(errors, "id_type")}
          disabled={pending}
        />
        <TextField
          id="id_number"
          label="Document number"
          value={draft.id_number}
          onChange={set("id_number")}
          error={fieldError(errors, "id_number")}
          disabled={pending}
        />
        <TextField
          id="residential_address"
          label="Residential address"
          value={draft.residential_address}
          onChange={set("residential_address")}
          error={fieldError(errors, "residential_address")}
          disabled={pending}
        />
      </Section>

      <Section
        title="Vehicle"
        description="What they ride. The make and model lists follow the type, and a plate is asked for only when that type has one."
      >
        <VehiclePicker
          catalogue={catalogue}
          selection={{
            vehicle_type_id: draft.vehicle_type_id,
            vehicle_make_id: draft.vehicle_make_id,
            vehicle_model_id: draft.vehicle_model_id,
          }}
          onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
          errors={errors}
          disabled={pending}
          required
        />
        <TextField
          id="plate_number"
          label="Number plate"
          required={needsPlate}
          value={draft.plate_number}
          onChange={set("plate_number")}
          error={fieldError(errors, "plate_number")}
          disabled={pending}
        />
        <TextField
          id="vehicle_colour"
          label="Colour"
          value={draft.vehicle_colour}
          onChange={set("vehicle_colour")}
          error={fieldError(errors, "vehicle_colour")}
          disabled={pending}
        />
        <TextField
          id="vehicle_year"
          label="Year"
          type="number"
          value={draft.vehicle_year}
          onChange={set("vehicle_year")}
          error={fieldError(errors, "vehicle_year")}
          disabled={pending}
        />
      </Section>

      <Section title="Emergency contact" description="Who to call if something happens on the road.">
        <TextField
          id="emergency_contact_name"
          label="Name"
          value={draft.emergency_contact_name}
          onChange={set("emergency_contact_name")}
          error={fieldError(errors, "emergency_contact_name")}
          disabled={pending}
        />
        <TextField
          id="emergency_contact_phone"
          label="Phone"
          type="tel"
          value={draft.emergency_contact_phone}
          onChange={set("emergency_contact_phone")}
          error={fieldError(errors, "emergency_contact_phone")}
          disabled={pending}
        />
      </Section>

      {failure && (
        <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
          {failure}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-5">
        <Link
          href="/dashboard/riders"
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Creating…" : "Create rider"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="break-words text-sm font-semibold text-foreground">{title}</h2>
        <p className="break-words text-xs text-text-muted">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * The password is returned exactly once and is not recoverable — the same
 * contract staff accounts and vendors already use — so the screen stops here
 * rather than navigating away with it still unread.
 */
function CreatedPanel({ riderId, password }: { riderId: number; password: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
      <h2 className="break-words text-base font-semibold text-foreground">Rider created</h2>
      <p className="break-words text-sm text-text-secondary">
        Hand this password over now. It cannot be shown again — a super administrator would have to
        reset it.
      </p>

      <p className="select-all break-all rounded-lg border border-border-subtle bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">
        {password}
      </p>

      <p className="break-words text-sm text-text-muted">
        They are pending review. Their documents and payout details still have to be supplied before
        they can be approved and go online.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/riders/${riderId}`}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          Open rider
        </Link>
        <Link
          href="/dashboard/riders"
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Back to riders
        </Link>
      </div>
    </div>
  );
}
