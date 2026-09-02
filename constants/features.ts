/**
 * Temporary feature switches.
 *
 * A flag here parks a finished feature instead of deleting it: the screens,
 * hooks and components stay in the tree and only their entry points are gated,
 * so turning the flag back on is a one-line change.
 */
export const Features = {
  /**
   * Browsing marketplace listings on the map — the "Xarita" button on Bozor
   * (home) and the `(tabs)/map` screen it opens.
   *
   * Parked for now. The map screen, `useProductMapMarkersQuery`, GoogleMap and
   * the marker detail sheet are all still here; flip this to `true` to bring
   * the feature back. Picking a location on a map (posting a listing, the
   * neighbourhood radius, a single listing's meeting point) is a different
   * feature and is NOT affected by this flag.
   */
  PRODUCT_MAP: false,
} as const
