import { getAdminSession } from "@/lib/auth";
import { toCsvSections, csvResponse } from "@/lib/csv";
import { getSiteAnalytics, getTshirtAnalytics, getTicketAnalytics, getTshirtHandoverAnalytics } from "@/lib/analytics";
import { TSHIRT_COLORS } from "@/lib/tshirts-shared";
import { TSHIRT_SIZES } from "@/lib/tshirts-shared";

/** GET /api/admin/export/analytics — CSV: site-wide, ad, T-shirt, and ticket analytics. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const [data, tshirtResult, handoverResult, ticketResult] = await Promise.all([
    getSiteAnalytics(),
    getTshirtAnalytics(),
    getTshirtHandoverAnalytics(),
    getTicketAnalytics(),
  ]);
  if (!tshirtResult.ok) {
    return Response.json({ ok: false, error: "T-shirt analytics export failed." }, { status: 500 });
  }
  if (!ticketResult.ok) {
    return Response.json({ ok: false, error: "Ticket analytics export failed." }, { status: 500 });
  }
  if (!handoverResult.ok) {
    return Response.json({ ok: false, error: "T-shirt handover analytics export failed. Apply migration 0028_tshirt_handover.sql first." }, { status: 500 });
  }

  const siteRows = [
    ["Ad-flow sessions started", data.flowSessionsStarted],
    ["Sessions completed", data.flowSessionsCompleted],
    ["Verified entries", data.verifiedEntries],
    ["Ticket buyers", data.ticketBuyers],
  ];
  const adRows = data.perAd.map((a) => [a.title, a.kind, a.shown, a.watched, `${a.completionPct}%`]);
  const tshirtSummaryRows = [
    ["Orders submitted", tshirtResult.data.submittedOrders],
    ["Active orders", tshirtResult.data.activeOrders],
    ["Active shirts ordered", tshirtResult.data.orderedShirts],
    ["Shirts in orders with payment", tshirtResult.data.shirtsWithPayment],
    ["Awaiting review", tshirtResult.data.awaitingReview],
    ["Rejected or cancelled orders", tshirtResult.data.rejectedOrCancelled],
    ["Active shirts without recorded color", tshirtResult.data.unrecordedColorShirts],
  ];
  const tshirtVariantRows = tshirtResult.data.sizeColor.flatMap((row) => [
    ...TSHIRT_COLORS.map((color) => [row.size, color, row.colors[color]]),
    [row.size, "Color not recorded", row.unrecordedColor],
    [row.size, "Total shirts", row.total],
  ]);
  const tshirtFacultyRows = tshirtResult.data.byFaculty.map((row) => [
    row.faculty,
    row.orders,
    row.shirts,
    row.shirtsWithPayment,
    ...TSHIRT_COLORS.flatMap((color) => TSHIRT_SIZES.map((size) => row.colorSizes[color][size])),
    row.unrecordedColor,
  ]);
  const handoverSummaryRows = [
    ["Active orders", handoverResult.data.activeOrders],
    ["Shirts to hand over", handoverResult.data.shirts],
    ["Shirts given", handoverResult.data.givenShirts],
    ["Shirts not given", handoverResult.data.notGivenShirts],
  ];
  const handoverSizeRows = handoverResult.data.bySize.map((row) => [row.size, row.shirts, row.given, row.notGiven]);
  const handoverFacultyRows = handoverResult.data.byFaculty.map((row) => [row.faculty, row.orders, row.shirts, row.given, row.notGiven]);
  const ticketSummaryRows = [
    ["Orders submitted", ticketResult.data.submittedOrders],
    ["Active orders", ticketResult.data.activeOrders],
    ["Tickets requested", ticketResult.data.ticketsRequested],
    ["Tickets approved", ticketResult.data.ticketsApproved],
    ["Awaiting review", ticketResult.data.awaitingReview],
    ["Rejected or cancelled orders", ticketResult.data.rejectedOrCancelled],
  ];
  const ticketTypeRows = ticketResult.data.byType.map((row) => [
    row.type,
    row.requested,
    row.approved,
  ]);
  const ticketFacultyRows = ticketResult.data.byFaculty.map((row) => [
    row.faculty,
    row.orders,
    row.tickets,
    row.ticketsApproved,
    row.seatingRequested,
    row.seatingApproved,
    row.standingRequested,
    row.standingApproved,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  const sections = {
    "site-wide": [
    { headers: ["Site-wide metric", "Value"], rows: siteRows },
    ],
    "ad-performance": [
    { headers: ["Ad", "Kind", "Times shown", "Times watched", "Completion"], rows: adRows },
    ],
    "tshirt-orders": [
    { headers: ["T-shirt metric", "Value"], rows: tshirtSummaryRows },
    { headers: ["Size", "Color", "Shirts"], rows: tshirtVariantRows },
    { headers: ["Faculty", "Orders", "Shirts ordered", "Shirts paid", ...TSHIRT_COLORS.flatMap((color) => TSHIRT_SIZES.map((size) => `${color} ${size}`)), "Color not recorded"], rows: tshirtFacultyRows },
    ],
    "tshirt-handover": [
    { headers: ["T-shirt handover metric", "Value"], rows: handoverSummaryRows },
    { headers: ["Size", "Shirts", "Given", "Not given"], rows: handoverSizeRows },
    { headers: ["Faculty", "Orders", "Shirts", "Given", "Not given"], rows: handoverFacultyRows },
    ],
    "ticket-orders": [
    { headers: ["Ticket metric", "Value"], rows: ticketSummaryRows },
    { headers: ["Ticket type", "Tickets requested", "Tickets approved"], rows: ticketTypeRows },
    { headers: ["Faculty", "Orders", "Tickets requested", "Tickets approved", "Seating requested", "Seating approved", "Standing requested", "Standing approved"], rows: ticketFacultyRows },
    ],
  };
  const requestedSection = new URL(request.url).searchParams.get("section");
  const validSection = requestedSection === "site-wide" || requestedSection === "ad-performance" || requestedSection === "tshirt-orders" || requestedSection === "tshirt-handover" || requestedSection === "ticket-orders";
  const csv = toCsvSections(validSection ? sections[requestedSection] : Object.values(sections).flat());
  const name = validSection ? `lailac-${requestedSection}-analytics` : "lailac-analytics";
  return csvResponse(`${name}-${stamp}.csv`, csv);
}
