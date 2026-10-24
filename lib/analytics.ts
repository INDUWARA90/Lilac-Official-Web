import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { getAds } from "@/lib/ads";
import { TSHIRT_COLORS, TSHIRT_SIZES } from "@/lib/tshirts-shared";

export interface AdAnalyticsRow {
  id: string;
  title: string;
  kind: string;
  shown: number;
  watched: number;
  completionPct: number;
}

export interface SiteAnalytics {
  perAd: AdAnalyticsRow[];
  verifiedEntries: number;
  flowSessionsStarted: number;
  flowSessionsCompleted: number;
  ticketBuyers: number;
}

export interface TshirtAnalytics {
  submittedOrders: number;
  activeOrders: number;
  orderedShirts: number;
  shirtsWithPayment: number;
  awaitingReview: number;
  rejectedOrCancelled: number;
  unrecordedColorShirts: number;
  sizeColor: Array<{ size: string; colors: Record<string, number>; unrecordedColor: number; total: number }>;
  byFaculty: Array<{
    faculty: string;
    orders: number;
    shirts: number;
    shirtsWithPayment: number;
    sizes: Record<string, number>;
    colors: Record<string, number>;
    colorSizes: Record<string, Record<string, number>>;
    unrecordedColor: number;
  }>;
}

export type TshirtAnalyticsResult = { ok: true; data: TshirtAnalytics } | { ok: false; error: string };

export interface TshirtHandoverAnalytics {
  activeOrders: number;
  shirts: number;
  givenShirts: number;
  notGivenShirts: number;
  bySize: Array<{ size: string; shirts: number; given: number; notGiven: number }>;
  byFaculty: Array<{
    faculty: string;
    orders: number;
    shirts: number;
    given: number;
    notGiven: number;
    sizes: Record<string, { shirts: number; given: number; notGiven: number }>;
  }>;
}

export type TshirtHandoverAnalyticsResult =
  | { ok: true; data: TshirtHandoverAnalytics }
  | { ok: false; error: string };

export interface TicketAnalytics {
  submittedOrders: number;
  activeOrders: number;
  ticketsRequested: number;
  ticketsApproved: number;
  awaitingReview: number;
  rejectedOrCancelled: number;
  byType: Array<{ type: string; requested: number; approved: number }>;
  byFaculty: Array<{
    faculty: string;
    orders: number;
    tickets: number;
    ticketsApproved: number;
    seatingRequested: number;
    standingRequested: number;
    seatingApproved: number;
    standingApproved: number;
  }>;
}

export type TicketAnalyticsResult = { ok: true; data: TicketAnalytics } | { ok: false; error: string };

/**
 * Site-wide interaction numbers plus a per-ad breakdown (shown/watched/
 * completion), for the admin Analytics page and its CSV export.
 *
 * Per-ad counts are exact `count` queries (two per ad) rather than pulling raw
 * event rows: a plain select is capped at 1000 rows, which would silently
 * under-report a busy ad. The number of ads is small, so this stays cheap.
 */
export async function getSiteAnalytics(): Promise<SiteAnalytics> {
  const db = createAdminClient();
  const head = { count: "exact", head: true } as const;

  const [ads, entriesTotal, ticketsApproved, flowViews, flowCompletes] = await Promise.all([
    getAds(),
    db.from("entries").select("*", head).eq("verified", true),
    db.from("ticket_purchases").select("id", head).eq("status", "approved"),
    db.from("events").select("*", head).eq("type", "ad_view"),
    db.from("events").select("*", head).eq("type", "ad_complete"),
  ]);

  const adCount = (type: "ad_shown" | "ad_watched", adId: string) =>
    db.from("events").select("*", head).eq("type", type).eq("ad_id", adId);

  // The fallback "default" ad isn't a real `ads` row (see AdsStep.tsx), so it
  // has no events to count.
  const counts = await Promise.all(
    ads.map(async (ad) => {
      if (ad.id === "default") return { shown: 0, watched: 0 };
      const [shown, watched] = await Promise.all([
        adCount("ad_shown", ad.id),
        adCount("ad_watched", ad.id),
      ]);
      return { shown: shown.count ?? 0, watched: watched.count ?? 0 };
    }),
  );

  const perAd: AdAnalyticsRow[] = ads.map((ad, i) => {
    const c = counts[i];
    return {
      id: ad.id,
      title: ad.title,
      kind: ad.kind,
      shown: c.shown,
      watched: c.watched,
      completionPct: c.shown ? Math.round((c.watched / c.shown) * 100) : 0,
    };
  });

  return {
    perAd,
    verifiedEntries: entriesTotal.count ?? 0,
    flowSessionsStarted: flowViews.count ?? 0,
    flowSessionsCompleted: flowCompletes.count ?? 0,
    ticketBuyers: ticketsApproved.count ?? 0,
  };
}

/**
 * Summarize current T-shirt demand by size, color, and faculty. Rejected and
 * cancelled orders are excluded from demand; partially paid orders remain in
 * demand, with their paid quantity reported separately.
 */
export async function getTshirtAnalytics(): Promise<TshirtAnalyticsResult> {
  const db = createAdminClient();
  const { data: orders, error } = await fetchAll((from, to) =>
    db
      .from("tshirt_orders")
      .select("faculty, tshirt_size, quantity, order_items, status")
      .order("id")
      .range(from, to),
  );

  if (error) {
    console.error("T-shirt analytics lookup failed", error);
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "Unknown database error";
    return { ok: false, error: message };
  }

  const activeStatuses = new Set(["pending_review", "partially_paid", "payment_collected"]);
  const paidStatuses = new Set(["partially_paid", "payment_collected"]);
  const sizeColor = TSHIRT_SIZES.map((size) => {
    const colors: Record<string, number> = Object.fromEntries(TSHIRT_COLORS.map((color) => [color, 0]));
    return { size, colors, unrecordedColor: 0, total: 0 };
  });
  const sizesByName = new Map<string, (typeof sizeColor)[number]>(sizeColor.map((row) => [row.size, row]));
  const facultyTotals = new Map<string, {
    orders: number; shirts: number; shirtsWithPayment: number;
    sizes: Record<string, number>; colors: Record<string, number>;
    colorSizes: Record<string, Record<string, number>>; unrecordedColor: number;
  }>();
  let activeOrders = 0;
  let orderedShirts = 0;
  let shirtsWithPayment = 0;
  let awaitingReview = 0;
  let rejectedOrCancelled = 0;
  let unrecordedColorShirts = 0;

  for (const order of orders) {
    if (order.status === "rejected" || order.status === "cancelled") {
      rejectedOrCancelled += 1;
      continue;
    }
    if (!activeStatuses.has(order.status)) continue;

    activeOrders += 1;
    orderedShirts += order.quantity;
    if (order.status === "pending_review") awaitingReview += 1;
    const hasPayment = paidStatuses.has(order.status);
    if (hasPayment) shirtsWithPayment += order.quantity;

    const facultyName = order.faculty.trim() || "Not provided";
    const faculty = facultyTotals.get(facultyName) ?? {
      orders: 0, shirts: 0, shirtsWithPayment: 0,
      sizes: Object.fromEntries(TSHIRT_SIZES.map((size) => [size, 0])),
      colors: Object.fromEntries(TSHIRT_COLORS.map((color) => [color, 0])),
      colorSizes: Object.fromEntries(
        TSHIRT_COLORS.map((color) => [color, Object.fromEntries(TSHIRT_SIZES.map((size) => [size, 0]))]),
      ),
      unrecordedColor: 0,
    };
    faculty.orders += 1;
    faculty.shirts += order.quantity;
    if (hasPayment) faculty.shirtsWithPayment += order.quantity;
    facultyTotals.set(facultyName, faculty);

    const items = order.order_items?.length
      ? order.order_items
      : Array.from({ length: order.quantity }, () => ({ size: order.tshirt_size, color: null }));
    for (const item of items) {
      const sizeRow = sizesByName.get(item.size);
      if (sizeRow) {
        sizeRow.total += 1;
        faculty.sizes[item.size] += 1;
        if (item.color && Object.hasOwn(sizeRow.colors, item.color)) {
          sizeRow.colors[item.color] += 1;
          faculty.colors[item.color] += 1;
          faculty.colorSizes[item.color][item.size] += 1;
        } else if (item.color === null) {
          sizeRow.unrecordedColor += 1;
          faculty.unrecordedColor += 1;
        }
      }
      if (item.color === null) unrecordedColorShirts += 1;
    }
  }

  return {
    ok: true,
    data: {
      submittedOrders: orders.length,
      activeOrders,
      orderedShirts,
      shirtsWithPayment,
      awaitingReview,
      rejectedOrCancelled,
      unrecordedColorShirts,
      sizeColor,
      byFaculty: [...facultyTotals.entries()]
        .map(([faculty, totals]) => ({ faculty, ...totals }))
        .sort((a, b) => b.shirts - a.shirts || a.faculty.localeCompare(b.faculty)),
    },
  };
}

/**
 * Physical collection reporting. Payment status is deliberately not used to
 * decide whether a shirt is handed over: staff record that independently.
 */
export async function getTshirtHandoverAnalytics(): Promise<TshirtHandoverAnalyticsResult> {
  const db = createAdminClient();
  const { data: orders, error } = await fetchAll((from, to) =>
    db
      .from("tshirt_orders")
      .select("faculty, tshirt_size, quantity, order_items, status, handed_over")
      .order("id")
      .range(from, to),
  );

  if (error) {
    console.error("T-shirt handover analytics lookup failed", error);
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "Unknown database error";
    return { ok: false, error: message };
  }

  const sizeTotals = new Map(TSHIRT_SIZES.map((size) => [size, { shirts: 0, given: 0, notGiven: 0 }]));
  const faculties = new Map<string, {
    orders: number; shirts: number; given: number; notGiven: number;
    sizes: Record<string, { shirts: number; given: number; notGiven: number }>;
  }>();
  const activeStatuses = new Set(["pending_review", "partially_paid", "payment_collected"]);
  let activeOrders = 0;
  let shirts = 0;
  let givenShirts = 0;

  for (const order of orders) {
    if (!activeStatuses.has(order.status)) continue;
    const given = order.handed_over === true;
    const facultyName = order.faculty.trim() || "Not provided";
    const faculty = faculties.get(facultyName) ?? {
      orders: 0, shirts: 0, given: 0, notGiven: 0,
      sizes: Object.fromEntries(TSHIRT_SIZES.map((size) => [size, { shirts: 0, given: 0, notGiven: 0 }])),
    };
    activeOrders += 1;
    faculty.orders += 1;

    const items = order.order_items?.length
      ? order.order_items
      : Array.from({ length: order.quantity }, () => ({ size: order.tshirt_size }));
    for (const item of items) {
      if (!TSHIRT_SIZES.includes(item.size as (typeof TSHIRT_SIZES)[number])) continue;
      const size = item.size as (typeof TSHIRT_SIZES)[number];
      const total = sizeTotals.get(size);
      if (!total || !faculty.sizes[size]) continue;
      shirts += 1;
      faculty.shirts += 1;
      total.shirts += 1;
      faculty.sizes[size].shirts += 1;
      if (given) {
        givenShirts += 1;
        faculty.given += 1;
        total.given += 1;
        faculty.sizes[size].given += 1;
      } else {
        faculty.notGiven += 1;
        total.notGiven += 1;
        faculty.sizes[size].notGiven += 1;
      }
    }
    faculties.set(facultyName, faculty);
  }

  return {
    ok: true,
    data: {
      activeOrders,
      shirts,
      givenShirts,
      notGivenShirts: shirts - givenShirts,
      bySize: TSHIRT_SIZES.map((size) => ({ size, ...sizeTotals.get(size)! })),
      byFaculty: [...faculties.entries()]
        .map(([faculty, totals]) => ({ faculty, ...totals }))
        .sort((a, b) => b.shirts - a.shirts || a.faculty.localeCompare(b.faculty)),
    },
  };
}

/**
 * Summarize ticket demand by ticket type and buyer faculty. Pending purchases
 * are included in requested demand; only approved purchases count as approved.
 */
export async function getTicketAnalytics(): Promise<TicketAnalyticsResult> {
  const db = createAdminClient();
  const { data: purchases, error } = await fetchAll((from, to) =>
    db
      .from("ticket_purchases")
      .select("faculty, quantity, ticket_types, status")
      .order("id")
      .range(from, to),
  );

  if (error) {
    console.error("Ticket analytics lookup failed", error);
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "Unknown database error";
    return { ok: false, error: message };
  }

  const byType = [
    { type: "Seating", requested: 0, approved: 0 },
    { type: "Standing", requested: 0, approved: 0 },
  ];
  const byFaculty = new Map<string, {
    orders: number; tickets: number; ticketsApproved: number;
    seatingRequested: number; standingRequested: number;
    seatingApproved: number; standingApproved: number;
  }>();
  let activeOrders = 0;
  let ticketsRequested = 0;
  let ticketsApproved = 0;
  let awaitingReview = 0;
  let rejectedOrCancelled = 0;

  for (const purchase of purchases) {
    if (purchase.status === "rejected" || purchase.status === "cancelled") {
      rejectedOrCancelled += 1;
      continue;
    }
    if (purchase.status !== "pending_review" && purchase.status !== "approved") continue;

    activeOrders += 1;
    ticketsRequested += purchase.quantity;
    const isApproved = purchase.status === "approved";
    if (isApproved) ticketsApproved += purchase.quantity;
    else awaitingReview += 1;

    const facultyName = purchase.faculty.trim() || "Not provided";
    const faculty = byFaculty.get(facultyName) ?? {
      orders: 0, tickets: 0, ticketsApproved: 0,
      seatingRequested: 0, standingRequested: 0, seatingApproved: 0, standingApproved: 0,
    };
    faculty.orders += 1;
    faculty.tickets += purchase.quantity;
    if (isApproved) faculty.ticketsApproved += purchase.quantity;
    byFaculty.set(facultyName, faculty);

    for (const ticketType of purchase.ticket_types) {
      const row = ticketType === "seating" ? byType[0] : byType[1];
      row.requested += 1;
      if (ticketType === "seating") faculty.seatingRequested += 1;
      else faculty.standingRequested += 1;
      if (isApproved) row.approved += 1;
      if (isApproved && ticketType === "seating") faculty.seatingApproved += 1;
      if (isApproved && ticketType !== "seating") faculty.standingApproved += 1;
    }
  }

  return {
    ok: true,
    data: {
      submittedOrders: purchases.length,
      activeOrders,
      ticketsRequested,
      ticketsApproved,
      awaitingReview,
      rejectedOrCancelled,
      byType,
      byFaculty: [...byFaculty.entries()]
        .map(([faculty, totals]) => ({ faculty, ...totals }))
        .sort((a, b) => b.tickets - a.tickets || a.faculty.localeCompare(b.faculty)),
    },
  };
}
