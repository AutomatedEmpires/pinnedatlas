'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import {
  ACCESS_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  FEATURE_TYPE_LABELS,
  type AccessType,
  type DifficultyTier,
  type FeatureType,
} from '@/lib/types';

const ACCESS_TYPES = Object.keys(ACCESS_LABELS) as AccessType[];

// Coordinates arrive as input strings; validate presence + numeric + range with
// one message each so inline errors stay readable.
function coordField(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => Number.isFinite(Number(v)), { message: `${label} must be a number` })
    .refine(
      (v) => {
        const n = Number(v);
        return !Number.isFinite(n) || (n >= min && n <= max);
      },
      { message: `${label} must be between ${min} and ${max}` },
    );
}

// Mirrors the server schema in app/api/locations/route.ts.
const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(120, 'Name must be 120 characters or fewer'),
  feature_type: z.enum(FEATURE_TYPES as [FeatureType, ...FeatureType[]]),
  lat: coordField('Latitude', -90, 90),
  lng: coordField('Longitude', -180, 180),
  difficulty_tier: z.enum(DIFFICULTY_TIERS as [DifficultyTier, ...DifficultyTier[]]),
  access_type: z.enum(ACCESS_TYPES as [AccessType, ...AccessType[]]),
  description: z.string().trim().max(2000, 'Description must be 2000 characters or fewer'),
  hazard_notes: z.string().trim().max(1000, 'Hazard notes must be 1000 characters or fewer'),
});

interface FormValues {
  name: string;
  feature_type: FeatureType;
  lat: string;
  lng: string;
  difficulty_tier: DifficultyTier;
  access_type: AccessType;
  description: string;
  hazard_notes: string;
}

const INITIAL_VALUES: FormValues = {
  name: '',
  feature_type: 'cave',
  lat: '',
  lng: '',
  difficulty_tier: 'moderate',
  access_type: 'unclear',
  description: '',
  hazard_notes: '',
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const inputClass =
  'w-full min-h-11 rounded-lg border border-stone-700 bg-surface-raised px-3 py-2.5 text-base text-stone-100 placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-400">
      {message}
    </p>
  );
}

export function SubmitForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function useMyLocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Location is not supported by this browser — enter coordinates manually.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues((v) => ({
          ...v,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setFieldErrors((e) => ({ ...e, lat: undefined, lng: undefined }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied — enter coordinates manually.'
            : 'Could not determine your location — enter coordinates manually.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: FieldErrors = {};
      for (const [key, messages] of Object.entries(flat)) {
        next[key as keyof FormValues] = messages?.[0];
      }
      setFieldErrors(next);
      setFormError(null);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setPending(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.data.name,
          feature_type: parsed.data.feature_type,
          lat: Number(parsed.data.lat),
          lng: Number(parsed.data.lng),
          difficulty_tier: parsed.data.difficulty_tier,
          access_type: parsed.data.access_type,
          description: parsed.data.description,
          hazard_notes: parsed.data.hazard_notes,
        }),
      });
      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }
      if (res.status === 429) {
        setFormError(
          'You have too many submissions awaiting review. Please wait for those to be approved before adding more.',
        );
        return;
      }
      if (!res.ok) {
        setFormError('Something went wrong submitting your spot. Please try again.');
        return;
      }
      setSubmitted(true);
      setValues(INITIAL_VALUES);
    } catch {
      setFormError('Network error — check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  function addAnother() {
    setSubmitted(false);
    setFormError(null);
    setFieldErrors({});
    setGeoError(null);
  }

  if (submitted) {
    return (
      <section
        role="status"
        className="rounded-xl border border-stone-800 bg-surface-raised p-6 text-center"
      >
        <span className="inline-flex rounded-full bg-accent/15 p-3 text-accent">
          <Icon name="check" size={28} weight="bold" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-stone-100">Submitted for review</h2>
        <p className="mt-2 text-sm text-stone-400">
          It will appear on the map once approved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={addAnother}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 font-medium text-stone-950 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Add another spot
          </button>
          <Link
            href="/spots"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-700 px-4 font-medium text-stone-200 hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Browse spots
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="submit-name" className="mb-1.5 block text-sm font-medium text-stone-300">
          Name <span aria-hidden className="text-red-400">*</span>
        </label>
        <input
          id="submit-name"
          type="text"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Hidden Falls"
          className={inputClass}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? 'submit-name-error' : undefined}
        />
        <FieldError id="submit-name-error" message={fieldErrors.name} />
      </div>

      <div>
        <label htmlFor="submit-type" className="mb-1.5 block text-sm font-medium text-stone-300">
          Feature type
        </label>
        <select
          id="submit-type"
          value={values.feature_type}
          onChange={(e) => set('feature_type', e.target.value as FeatureType)}
          className={inputClass}
        >
          {FEATURE_TYPES.map((t) => (
            <option key={t} value={t}>
              {FEATURE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-stone-300">
          Coordinates <span aria-hidden className="text-red-400">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="submit-lat" className="mb-1 block text-xs text-stone-400">
              Latitude
            </label>
            <input
              id="submit-lat"
              type="number"
              inputMode="decimal"
              step="any"
              min={-90}
              max={90}
              required
              value={values.lat}
              onChange={(e) => set('lat', e.target.value)}
              placeholder="44.4280"
              className={inputClass}
              aria-invalid={fieldErrors.lat ? true : undefined}
              aria-describedby={fieldErrors.lat ? 'submit-lat-error' : undefined}
            />
            <FieldError id="submit-lat-error" message={fieldErrors.lat} />
          </div>
          <div>
            <label htmlFor="submit-lng" className="mb-1 block text-xs text-stone-400">
              Longitude
            </label>
            <input
              id="submit-lng"
              type="number"
              inputMode="decimal"
              step="any"
              min={-180}
              max={180}
              required
              value={values.lng}
              onChange={(e) => set('lng', e.target.value)}
              placeholder="-110.5885"
              className={inputClass}
              aria-invalid={fieldErrors.lng ? true : undefined}
              aria-describedby={fieldErrors.lng ? 'submit-lng-error' : undefined}
            />
            <FieldError id="submit-lng-error" message={fieldErrors.lng} />
          </div>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-700 px-4 text-sm font-medium text-stone-200 hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          {geoLoading ? (
            <Icon name="spinner" size={18} className="animate-spin" />
          ) : (
            <Icon name="directions" size={18} />
          )}
          {geoLoading ? 'Locating…' : 'Use my location'}
        </button>
        {geoError ? (
          <p role="alert" className="mt-1.5 text-sm text-red-400">
            {geoError}
          </p>
        ) : null}
      </fieldset>

      <div>
        <label
          htmlFor="submit-difficulty"
          className="mb-1.5 block text-sm font-medium text-stone-300"
        >
          Difficulty
        </label>
        <select
          id="submit-difficulty"
          value={values.difficulty_tier}
          onChange={(e) => set('difficulty_tier', e.target.value as DifficultyTier)}
          className={inputClass}
        >
          {DIFFICULTY_TIERS.map((t) => (
            <option key={t} value={t}>
              {DIFFICULTY_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="submit-access" className="mb-1.5 block text-sm font-medium text-stone-300">
          Access
        </label>
        <select
          id="submit-access"
          value={values.access_type}
          onChange={(e) => set('access_type', e.target.value as AccessType)}
          className={inputClass}
        >
          {ACCESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCESS_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="submit-description"
          className="mb-1.5 block text-sm font-medium text-stone-300"
        >
          Description <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <textarea
          id="submit-description"
          rows={4}
          maxLength={2000}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What makes this spot worth the trip? How do you get there?"
          className={inputClass}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={fieldErrors.description ? 'submit-description-error' : undefined}
        />
        <FieldError id="submit-description-error" message={fieldErrors.description} />
      </div>

      <div>
        <label htmlFor="submit-hazards" className="mb-1.5 block text-sm font-medium text-stone-300">
          Hazards &amp; warnings{' '}
          <span className="font-normal text-stone-500">(optional, strongly encouraged)</span>
        </label>
        <textarea
          id="submit-hazards"
          rows={3}
          maxLength={1000}
          value={values.hazard_notes}
          onChange={(e) => set('hazard_notes', e.target.value)}
          placeholder="e.g. Slick rock near the falls; flash flood risk in the canyon"
          className={inputClass}
          aria-invalid={fieldErrors.hazard_notes ? true : undefined}
          aria-describedby={fieldErrors.hazard_notes ? 'submit-hazards-error' : undefined}
        />
        <FieldError id="submit-hazards-error" message={fieldErrors.hazard_notes} />
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-4 font-medium text-stone-950 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
      >
        {pending ? <Icon name="spinner" size={18} className="animate-spin" /> : null}
        {pending ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  );
}
