// Petit client Supabase "fait main" via l'API REST (PostgREST).
// Pas besoin d'installer le SDK officiel : ça reste simple et léger à déployer.

const SUPABASE_URL = "https://bgwschicjxcdeooxpyiw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd3NjaGljanhjZGVvb3hweWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTcwNTQsImV4cCI6MjA5ODE3MzA1NH0.yetsD-3SYMXXUMJnG62xAlpFdkNzGrpqQCs3c0lIrLs";

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// ---- artisans ----
export async function fetchArtisans() {
  const res = await fetch(`${REST_URL}/artisans?select=id,data`, {
    headers: baseHeaders,
  });
  if (!res.ok) throw new Error("Erreur de chargement des artisans");
  const rows = await res.json();
  return rows.map((r) => r.data);
}

export async function upsertArtisans(artisanList) {
  const rows = artisanList.map((a) => ({ id: a.id, data: a }));
  const res = await fetch(`${REST_URL}/artisans`, {
    method: "POST",
    headers: { ...baseHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error("Erreur d'enregistrement des artisans");
}

// ---- bookings ----
export async function fetchBookings() {
  const res = await fetch(`${REST_URL}/bookings?select=id,data&order=id.desc`, {
    headers: baseHeaders,
  });
  if (!res.ok) throw new Error("Erreur de chargement des rendez-vous");
  const rows = await res.json();
  return rows.map((r) => r.data).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function insertBooking(booking) {
  const res = await fetch(`${REST_URL}/bookings`, {
    method: "POST",
    headers: { ...baseHeaders, Prefer: "return=representation" },
    body: JSON.stringify([{ id: booking.id, data: booking }]),
  });
  if (!res.ok) throw new Error("Erreur de création du rendez-vous");
  return booking;
}

export async function updateBooking(id, newData) {
  const res = await fetch(`${REST_URL}/bookings?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...baseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ data: newData }),
  });
  if (!res.ok) throw new Error("Erreur de mise à jour du rendez-vous");
  return newData;
}
