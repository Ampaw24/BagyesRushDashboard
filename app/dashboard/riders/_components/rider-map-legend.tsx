import { RIDER_STATES } from "./rider-marker";

/**
 * What the colours and the shapes on a rider map mean.
 *
 * A marker encodes two things at once — the silhouette says what they are
 * riding, the colour says whether they can take a job — and neither is worth
 * anything to somebody who has to guess. The colours come from `RIDER_STATES`,
 * the same list the markers are painted from, so a shade cannot be changed in
 * one place and explained in another.
 *
 * Shared by the dispatch map and a rider's own profile map. On a profile there
 * is one marker rather than forty, and the colour is still the fastest answer
 * to "is this person working right now".
 */
export function RiderMapLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted ${className}`}>
      {RIDER_STATES.map((state) => (
        <span key={state.key} className="inline-flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full border-2 border-white shadow"
            style={{ background: state.colour }}
          />
          {state.label}
        </span>
      ))}

      <span className="text-text-muted/80">
        The shape is the vehicle — motorbike, bicycle, tricycle or car. The nose points the way
        they are travelling.
      </span>
    </div>
  );
}
