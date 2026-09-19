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
 * A rider on a motorbike, with a separate pointer for which way they are going.
 *
 * The two are split deliberately. A side-on bike is what makes the marker
 * readable at a glance, but rotating one by its heading turns it upside down
 * every time a rider travels west — so the bike stays upright and a small nose
 * outside the badge carries the bearing instead. The bike only mirrors, left or
 * right, so it still faces the way it is travelling.
 */
export function riderIconOptions(rider: RiderLiveDto) {
  const colour = rider.is_stale ? "#898781" : rider.active_order_count > 0 ? "#e91d26" : "#0ca30c";
  const heading = rider.heading ?? 0;

  // Headings between south and north through west mean the bike is travelling
  // leftwards across the screen.
  const facingLeft = heading > 180;

  return {
    className: "",
    html: `
      <span style="position:relative;display:block;width:44px;height:44px;opacity:${rider.is_stale ? 0.6 : 1}">
        <span style="position:absolute;inset:0;transform:rotate(${heading}deg);transition:transform .8s linear">
          <svg viewBox="0 0 44 44" width="44" height="44">
            <path d="M22 0 L27 9 L17 9 Z" fill="${colour}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </span>

        <span style="
          position:absolute;left:5px;top:5px;
          display:flex;align-items:center;justify-content:center;
          width:34px;height:34px;border-radius:9999px;
          background:${colour};border:3px solid #fff;
          box-shadow:0 1px 5px rgba(0,0,0,.45);
        ">
          <svg viewBox="0 0 48 36" width="24" height="18" fill="none" stroke="#fff"
               stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"
               style="transform:scaleX(${facingLeft ? -1 : 1})">
            <circle cx="10" cy="26" r="6.5"/>
            <circle cx="38" cy="26" r="6.5"/>
            <path d="M10 26 H19 L26 17 H33"/>
            <path d="M33 17 L38 26"/>
            <path d="M33 17 L37.5 12"/>
            <circle cx="21.5" cy="6" r="4" fill="#fff" stroke="none"/>
            <path d="M21.5 11 L26 18"/>
            <path d="M23 13 H35"/>
            <path d="M26 18 L24.5 24"/>
          </svg>
        </span>
      </span>`,
    iconSize: [44, 44] as [number, number],
    iconAnchor: [22, 22] as [number, number],
  };
}

export function riderTooltip(rider: RiderLiveDto): string {
  const parts = [rider.name];

  if (rider.plate_number) parts.push(rider.plate_number);
  if (rider.active_order_count > 0) parts.push(`${rider.active_order_count} on board`);
  if (rider.is_stale) parts.push("last seen a while ago");

  return parts.join(" · ");
}

/** Central Accra — so an empty map shows the city rather than the Atlantic. */
export const ACCRA: [number, number] = [5.6037, -0.187];
