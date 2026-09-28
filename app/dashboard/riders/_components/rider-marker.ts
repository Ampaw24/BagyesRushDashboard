import type { Marker } from "leaflet";

import type { RiderLiveDto } from "@/lib/types/api";

/**
 * How a rider is drawn on a map.
 *
 * Shared by the dispatch map and the single-rider map on a rider's profile. It
 * lives here rather than in either of them because a bike that looks one way on
 * one screen and another way on the next is worse than either choice — and the
 * heading logic in particular is the sort of detail that gets fixed in one copy
 * and not the other.
 *
 * The artwork is drawn here as SVG rather than loaded from an image host, and
 * that is deliberate. A marker has to recolour per state, mirror by direction
 * and stay sharp at every zoom, none of which a raster file does; and this
 * platform has already had every image on it disappear once because a shared
 * image host landed on a blocklist. A map that silently loses all its markers
 * to somebody else's phishing report is not a map a dispatcher can rely on.
 * Nothing here fetches anything.
 */

/**
 * Make a marker animate to its next position instead of teleporting.
 *
 * Leaflet positions markers with a CSS `transform`, so a transition on the
 * element is all it takes — `setLatLng` then reads as movement. Positions
 * arrive every few seconds at most, and without this the bikes jump between
 * fixes and the map looks broken rather than live.
 *
 * Re-applied after `setIcon`, which replaces the underlying element.
 */
export function glide(marker: Marker): void {
  const element = marker.getElement();

  if (element) {
    element.style.transition = "transform .8s linear";
  }
}

/**
 * The vehicle silhouettes, side-on and facing right.
 *
 * Drawn in a 64×44 box with heavy round-capped strokes: a marker is about 30
 * screen pixels wide, and the thin line-art this replaced turned to mush at
 * that size — which is the whole reason a dispatcher could not tell what they
 * were looking at. Filled wheels and a visible rider are what make the shape
 * readable when it is small.
 *
 * Keyed by `vehicle_types.slug`. That table is admin-managed, so a slug nobody
 * anticipated is not an error — `glyphFor` falls back rather than drawing
 * nothing.
 */
const VEHICLE_GLYPHS: Record<string, string> = {
  /**
   * A rider leaning forward on a motorbike: the fleet's usual vehicle, so the
   * one that has to be unmistakable. The heavy tank-and-seat slab is what
   * separates it from the bicycle at 30 pixels, where frame geometry does not
   * survive but mass does.
   */
  motorbike: `
    <circle cx="14" cy="33" r="8"/>
    <circle cx="50" cy="33" r="8"/>
    <path d="M14 33 H25 L30 26 H41"/>
    <path d="M41 26 L50 33"/>
    <path d="M41 26 L46 18"/>
    <path d="M43 15 H51"/>
    <path d="M22 23 H40" stroke-width="6"/>
    <circle cx="36" cy="5" r="5" fill="currentColor" stroke="none"/>
    <path d="M29 22 L34 13"/>
    <path d="M33 14 L46 18"/>
    <path d="M29 22 L37 28 L36 33"/>`,

  /** Upright rider, diamond frame, slimmer wheels. */
  bicycle: `
    <circle cx="13" cy="33" r="9"/>
    <circle cx="51" cy="33" r="9"/>
    <path d="M13 33 L30 33 L36 20 L45 20"/>
    <path d="M30 33 L36 20"/>
    <path d="M45 20 L51 33"/>
    <path d="M30 33 L26 22 H36"/>
    <path d="M45 20 L44 14"/>
    <path d="M40 12 H48"/>
    <circle cx="34" cy="6" r="5.5" fill="currentColor" stroke="none"/>
    <path d="M34 11 L32 21"/>
    <path d="M33 14 L43 13"/>
    <path d="M32 21 L30 33"/>`,

  /**
   * The Accra pragya: handlebars and one wheel at the front, a cargo box over
   * two at the back. Drawn as the box rather than the cab, because the box is
   * what a dispatcher is picking it for.
   */
  tricycle: `
    <circle cx="15" cy="33" r="7"/>
    <circle cx="48" cy="33" r="7"/>
    <path d="M6 33 V17 H30 V33"/>
    <path d="M30 27 H39"/>
    <path d="M39 27 L48 33"/>
    <path d="M39 27 L44 18"/>
    <path d="M41 15 H50"/>`,

  /** Side view: roofline, bonnet, two wheels. */
  car: `
    <circle cx="17" cy="32" r="7"/>
    <circle cx="47" cy="32" r="7"/>
    <path d="M5 32 V23 L13 13 H40 L54 22 L59 24 V32"/>
    <path d="M10 32 H40"/>
    <path d="M54 32 H59"/>
    <path d="M16 22 H36"/>`,

  /** A box on wheels, for a slug this build has never heard of. */
  fallback: `
    <circle cx="18" cy="33" r="7"/>
    <circle cx="46" cy="33" r="7"/>
    <path d="M7 33 V14 H41 V33"/>
    <path d="M41 21 H50 L57 28 V33"/>
    <path d="M7 24 H41"/>`,
};

/**
 * The silhouette for a vehicle type.
 *
 * Unknown slugs get the generic vehicle rather than an empty badge: vehicle
 * types are reference data an admin can add to at any time, and a dashboard
 * build that predates "Van" must still put something on the map.
 */
function glyphFor(vehicleType: string | null): string {
  return VEHICLE_GLYPHS[vehicleType ?? ""] ?? VEHICLE_GLYPHS.fallback;
}

/**
 * What a marker's colour means.
 *
 * Exported so the legend on a map page is generated from the same list the
 * markers are coloured from, rather than a second copy of the rule that drifts
 * the first time somebody changes a shade.
 */
export const RIDER_STATES = [
  { key: "busy", colour: "#e91d26", label: "On a delivery" },
  { key: "free", colour: "#0ca30c", label: "Free for a job" },
  { key: "stale", colour: "#898781", label: "No recent position" },
] as const;

const COLOUR_BUSY = RIDER_STATES[0].colour;
const COLOUR_FREE = RIDER_STATES[1].colour;
const COLOUR_STALE = RIDER_STATES[2].colour;

/**
 * The colour that says what a dispatcher can do with this rider.
 *
 * Staleness wins: somebody whose phone stopped reporting twenty minutes ago is
 * not "free for a job" however empty their queue looks, because the queue is as
 * old as the position.
 */
function stateColour(rider: RiderLiveDto): string {
  if (rider.is_stale) {
    return COLOUR_STALE;
  }

  return rider.active_order_count > 0 ? COLOUR_BUSY : COLOUR_FREE;
}

/**
 * The marker itself: a vehicle in a coloured badge, optionally with a nose
 * outside it pointing the way the rider is travelling.
 *
 * The badge and the pointer are split deliberately. A side-on vehicle is what
 * makes the marker readable at a glance, but rotating one by its heading turns
 * it upside down every time a rider travels west — so the vehicle stays upright
 * and the nose carries the bearing instead. The silhouette only mirrors, left
 * or right, so it still faces the way it is going.
 *
 * Shared with the order tracking map, which draws one rider beside a pickup and
 * a drop-off pin and has no heading to show — hence `heading: null` drawing no
 * pointer at all rather than one stuck pointing north.
 */
export function vehicleMarkerOptions({
  vehicleType,
  colour,
  heading = null,
  badge = 42,
  dimmed = false,
}: {
  vehicleType: string | null;
  colour: string;
  heading?: number | null;
  badge?: number;
  dimmed?: boolean;
}) {
  // The pointer sits outside the badge, so the box has to be bigger than it.
  const box = heading === null ? badge : badge + 10;
  const inset = (box - badge) / 2;
  const glyphWidth = Math.round(badge * 0.72);

  // Headings between south and north through west mean the rider is travelling
  // leftwards across the screen.
  const facingLeft = (heading ?? 0) > 180;

  const pointer =
    heading === null
      ? ""
      : `<span style="position:absolute;inset:0;transform:rotate(${heading}deg);transition:transform .8s linear">
           <svg viewBox="0 0 ${box} ${box}" width="${box}" height="${box}">
             <path d="M${box / 2} 0 L${box / 2 + 5.5} 10 L${box / 2 - 5.5} 10 Z"
                   fill="${colour}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
           </svg>
         </span>`;

  return {
    className: "",
    html: `
      <span style="position:relative;display:block;width:${box}px;height:${box}px;opacity:${dimmed ? 0.65 : 1}">
        ${pointer}
        <span style="
          position:absolute;left:${inset}px;top:${inset}px;
          display:flex;align-items:center;justify-content:center;
          width:${badge}px;height:${badge}px;border-radius:9999px;
          background:${colour};border:3px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,.45);
        ">
          <svg viewBox="0 0 64 44" width="${glyphWidth}" height="${Math.round(glyphWidth * 0.69)}"
               fill="none" stroke="#fff" color="#fff"
               stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"
               style="transform:scaleX(${facingLeft ? -1 : 1})">
            ${glyphFor(vehicleType)}
          </svg>
        </span>
      </span>`,
    iconSize: [box, box] as [number, number],
    iconAnchor: [box / 2, box / 2] as [number, number],
  };
}

/**
 * A rider on the dispatch map or their own profile map.
 *
 * Colour carries state and is not decoration: a dispatcher reads this map to
 * decide who to give a job to, so the vehicle shape answers "what" while the
 * colour answers "can I give them one".
 */
export function riderIconOptions(rider: RiderLiveDto) {
  return vehicleMarkerOptions({
    vehicleType: rider.vehicle_type,
    colour: stateColour(rider),
    heading: rider.heading ?? 0,
    dimmed: rider.is_stale,
  });
}

/**
 * How many jobs this rider is holding.
 *
 * Spelled out rather than "on board", which was the old wording and read as
 * cargo physically on the bike — it is not. The count includes orders still
 * being cooked, because a rider assigned to one is committed to it and cannot
 * take unlimited others.
 */
export function activeDeliveriesLabel(count: number): string {
  return count === 1 ? "1 active delivery" : `${count} active deliveries`;
}

export function riderTooltip(rider: RiderLiveDto): string {
  const parts = [rider.name];

  if (rider.vehicle_type_label) parts.push(rider.vehicle_type_label);
  if (rider.plate_number) parts.push(rider.plate_number);
  if (rider.active_order_count > 0) parts.push(activeDeliveriesLabel(rider.active_order_count));
  if (rider.is_stale) parts.push("last seen a while ago");

  return parts.join(" · ");
}

/** Central Accra — so an empty map shows the city rather than the Atlantic. */
export const ACCRA: [number, number] = [5.6037, -0.187];
