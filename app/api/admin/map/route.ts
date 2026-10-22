import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { revalidateMapCache } from "@/lib/map";
import { createMapPlaceSchema, updateMapPlaceSchema } from "@/lib/validation/map";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function GET() {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const { data, error } = await createAdminClient()
    .from("map_places")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Admin map fetch error:", error);
    return json({ ok: false, error: "Failed to load map places." }, 500);
  }

  return json({ ok: true, places: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const body = await req.json().catch(() => null);
  const parsed = createMapPlaceSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid place data.";
    return json({ ok: false, error: message }, 400);
  }

  const { name, category, description, location_tag, position_x, position_z } = parsed.data;
  const db = createAdminClient();

  const { data, error } = await db
    .from("map_places")
    .insert({
      name,
      category,
      description,
      location_tag,
      position_x,
      position_z,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create map place:", error);
    return json({ ok: false, error: "Failed to save place to map." }, 500);
  }

  await logAudit(
    "map.place_created",
    {
      place_id: data.id,
      name: data.name,
      category: data.category,
      location_tag: data.location_tag,
      position: { x: data.position_x, z: data.position_z },
    },
    session.email,
  );

  revalidateMapCache();

  return json({ ok: true, place: data });
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const body = await req.json().catch(() => null);
  const parsed = updateMapPlaceSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid update data.";
    return json({ ok: false, error: message }, 400);
  }

  const { id, ...updates } = parsed.data;
  const db = createAdminClient();

  const { data, error } = await db
    .from("map_places")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to update map place:", error);
    return json({ ok: false, error: "Failed to update place." }, 500);
  }

  await logAudit(
    "map.place_updated",
    {
      place_id: id,
      updated_fields: Object.keys(updates),
      name: data.name,
      category: data.category,
      position: { x: data.position_x, z: data.position_z },
    },
    session.email,
  );

  revalidateMapCache();

  return json({ ok: true, place: data });
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return json({ ok: false, error: "A valid place ID is required." }, 400);
  }

  const db = createAdminClient();
  const { data: existing } = await db
    .from("map_places")
    .select("id, name, category")
    .eq("id", parsedId.data)
    .maybeSingle();

  const { error } = await db.from("map_places").delete().eq("id", parsedId.data);
  if (error) {
    console.error("Failed to delete map place:", error);
    return json({ ok: false, error: "Failed to delete place." }, 500);
  }

  await logAudit(
    "map.place_deleted",
    {
      place_id: parsedId.data,
      name: existing?.name ?? "Unknown",
      category: existing?.category ?? "Unknown",
    },
    session.email,
  );

  revalidateMapCache();

  return json({ ok: true });
}
