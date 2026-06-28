import { useState, useEffect, useCallback } from "react";
import {
  Search, MapPin, Star, ChevronLeft, Check, Clock, Calendar,
  Wrench, Zap, Hammer, Bone, Home, CalendarDays, MessageCircle, User,
  CheckCircle2, XCircle, ShieldCheck, Inbox, ArrowRight, Plus
} from "lucide-react";
import {
  fetchArtisans, upsertArtisans, fetchBookings, insertBooking, updateBooking,
} from "./supabaseClient.js";

// ---------- Design tokens ----------
const COLORS = {
  ocre: "#D4773F",
  ocreDeep: "#B85F2D",
  bleu: "#1B3A5C",
  bleuLight: "#2C5683",
  vert: "#3D8361",
  creme: "#F2E9DC",
  cremeCard: "#FBF6EC",
  encre: "#22272B",
  encreSoft: "#5A5650",
  ligne: "#E2D5BE",
};

// ---------- Demo data (seeded once) ----------
const ARTISAN_SEED = [
  {
    id: "art-moussa",
    name: "Moussa Diop",
    job: "Plombier",
    jobKey: "plomberie",
    initials: "MD",
    color: COLORS.bleu,
    rating: 4.9,
    missions: 132,
    zone: "Sacré-Cœur, Dakar",
    distance: "1,2 km",
    specialties: ["Fuite d'eau", "Installation WC", "Chauffe-eau", "Tuyauterie"],
    travelFee: 2000,
    reviews: [
      { name: "Khadija B.", stars: 5, text: "Très ponctuel, a réglé la fuite en moins d'une heure. Prix annoncé respecté." },
      { name: "Modou T.", stars: 5, text: "Sérieux et propre dans son travail. Je le recommande pour toute la cité." },
    ],
  },
  {
    id: "art-fatou",
    name: "Fatou Sarr",
    job: "Électricienne",
    jobKey: "electricite",
    initials: "FS",
    color: COLORS.ocreDeep,
    rating: 4.8,
    missions: 98,
    zone: "Mermoz, Dakar",
    distance: "2,0 km",
    specialties: ["Panne de courant", "Installation prises", "Tableau électrique", "Éclairage"],
    travelFee: 2500,
    reviews: [
      { name: "Awa N.", stars: 5, text: "A trouvé la panne en 20 minutes, très professionnelle." },
      { name: "Cheikh F.", stars: 4, text: "Bon travail, un peu en retard mais prévenu à l'avance." },
    ],
  },
  {
    id: "art-ibra",
    name: "Ibrahima Ndiaye",
    job: "Menuisier",
    jobKey: "menuiserie",
    initials: "IN",
    color: COLORS.vert,
    rating: 5.0,
    missions: 64,
    zone: "Liberté 6, Dakar",
    distance: "3,4 km",
    specialties: ["Portes", "Placards", "Réparation meubles", "Sur mesure"],
    travelFee: 1500,
    reviews: [
      { name: "Mariama D.", stars: 5, text: "Travail impeccable, finitions soignées. Je referai appel à lui." },
    ],
  },
  {
    id: "art-ousmane",
    name: "Ousmane Kane",
    job: "Maçon",
    jobKey: "maconnerie",
    initials: "OK",
    color: COLORS.ocre,
    rating: 4.7,
    missions: 47,
    zone: "Parcelles Assainies, Dakar",
    distance: "4,1 km",
    specialties: ["Fissures", "Carrelage", "Enduit", "Petite construction"],
    travelFee: 2000,
    reviews: [
      { name: "Babacar S.", stars: 5, text: "A réparé le mur du jardin rapidement, très bon rapport qualité prix." },
    ],
  },
];

const CATEGORIES = [
  { key: "plomberie", label: "Plomberie", Icon: Wrench },
  { key: "electricite", label: "Électricité", Icon: Zap },
  { key: "menuiserie", label: "Menuiserie", Icon: Hammer },
  { key: "maconnerie", label: "Maçonnerie", Icon: Home },
];

const DATES = (() => {
  const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const out = [];
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({ key: d.toISOString().slice(0, 10), label: days[d.getDay()], num: d.getDate() });
  }
  return out;
})();

const TIME_SLOTS = ["09:00", "10:30", "11:00", "14:00", "15:30", "17:00"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- Storage helpers (Supabase) ----------
async function seedArtisansIfNeeded() {
  try {
    const existing = await fetchArtisans();
    if (!existing || existing.length === 0) {
      await upsertArtisans(ARTISAN_SEED);
    }
  } catch (e) {
    console.error("Seed error", e);
  }
}

async function loadArtisans() {
  try {
    const list = await fetchArtisans();
    return list && list.length > 0 ? list : ARTISAN_SEED;
  } catch {
    return ARTISAN_SEED;
  }
}

async function loadAllBookings() {
  try {
    return await fetchBookings();
  } catch (e) {
    console.error("Load bookings error", e);
    return [];
  }
}

async function createBooking(booking) {
  const id = uid();
  const full = { ...booking, id, status: "en_attente", createdAt: Date.now() };
  try {
    await insertBooking(full);
    return full;
  } catch (e) {
    console.error("Create booking error", e);
    return null;
  }
}

async function updateBookingStatus(id, status, allBookings) {
  try {
    const current = allBookings.find((b) => b.id === id);
    if (!current) return null;
    const updated = { ...current, status };
    await updateBooking(id, updated);
    return updated;
  } catch (e) {
    console.error("Update booking error", e);
    return null;
  }
}

// ---------- Small UI atoms ----------
function Seal({ children, size = 56, border = COLORS.bleu, bg = COLORS.cremeCard, dashed = true }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {dashed && (
        <div
          style={{
            position: "absolute", inset: -5, borderRadius: "50%",
            border: `1px dashed ${COLORS.ocre}`, opacity: 0.6,
          }}
        />
      )}
      <div
        style={{
          width: size, height: size, borderRadius: "50%", border: `2px solid ${border}`,
          background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Avatar({ initials, color, size = 54, checked }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size, height: size, borderRadius: "50%", background: color,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: size * 0.32,
        }}
      >
        {initials}
      </div>
      {checked && (
        <div
          style={{
            position: "absolute", bottom: -2, right: -2, width: 18, height: 18,
            background: COLORS.vert, borderRadius: "50%", border: `2px solid ${COLORS.cremeCard}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Check size={10} color="#fff" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

function Pill({ children, active, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        border: `1.5px solid ${active ? COLORS.ocre : COLORS.ligne}`,
        background: active ? COLORS.ocre : COLORS.cremeCard,
        color: active ? "#fff" : COLORS.encre,
        whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
        fontFamily: "'Work Sans', sans-serif",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#D9CBB0" : COLORS.ocre,
        color: "#fff", border: "none", width: "100%", padding: 15,
        borderRadius: 14, fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700, fontSize: 14.5, textAlign: "center",
        boxShadow: disabled ? "none" : "0 6px 14px -4px rgba(212,119,63,0.5)",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, color = COLORS.bleu, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: 14, borderRadius: 14, border: `1.5px solid ${color}`,
        color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: 13.5, textAlign: "center", background: "transparent", cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function TopHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px 14px" }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 34, height: 34, borderRadius: "50%", border: "none",
            background: "rgba(27,58,92,0.08)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color={COLORS.bleu} />
        </button>
      )}
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.bleu }}>
        {title}
      </h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    en_attente: { label: "En attente", bg: "#FBF0DD", color: COLORS.ocreDeep },
    accepte: { label: "Accepté", bg: "#E3F1E8", color: COLORS.vert },
    refuse: { label: "Refusé", bg: "#F5E2E0", color: "#B0463C" },
  };
  const s = map[status] || map.en_attente;
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12,
        background: s.bg, color: s.color, whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

// ============================================================
// CLIENT FLOW
// ============================================================
function ClientHome({ artisans, onSelectArtisan, onGoBookings, query, setQuery, category, setCategory }) {
  const filtered = artisans.filter((a) => {
    const matchesCat = !category || a.jobKey === category;
    const matchesQuery = !query || a.job.toLowerCase().includes(query.toLowerCase()) || a.name.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Seal size={32} border={COLORS.ocre} bg={COLORS.ocre} dashed={false}>
            <ShieldCheck size={16} color="#fff" />
          </Seal>
          <div>
            <div style={{ fontSize: 12, color: COLORS.encreSoft }}>Asalaam alekum 👋</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, color: COLORS.bleu }}>
              Aminata
            </div>
          </div>
        </div>

        <div
          style={{
            background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 16,
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}
        >
          <Search size={16} color={COLORS.encreSoft} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Un plombier près de Sacré-Cœur…"
            style={{
              border: "none", outline: "none", background: "transparent", fontSize: 14,
              color: COLORS.encre, width: "100%", fontFamily: "'Work Sans', sans-serif",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "0 20px 20px", overflowX: "auto" }}>
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <div
              key={c.key}
              onClick={() => setCategory(active ? null : c.key)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", flexShrink: 0 }}
            >
              <Seal size={54} border={active ? COLORS.ocre : COLORS.bleu} bg={active ? COLORS.ocre : COLORS.cremeCard}>
                <c.Icon size={22} color={active ? "#fff" : COLORS.bleu} />
              </Seal>
              <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{c.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 20px 12px" }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
          Artisans certifiés près de vous
        </h3>
        <span style={{ fontSize: 12, color: COLORS.encreSoft }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.encreSoft, fontSize: 13, padding: "40px 0" }}>
            Aucun artisan ne correspond. Essayez une autre catégorie.
          </div>
        )}
        {filtered.map((a) => (
          <div
            key={a.id}
            onClick={() => onSelectArtisan(a)}
            style={{
              background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 18,
              padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer",
            }}
          >
            <Avatar initials={a.initials} color={a.color} checked />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, fontFamily: "'Space Grotesk', sans-serif" }}>{a.name}</div>
              <div style={{ fontSize: 12, color: COLORS.ocreDeep, fontWeight: 600, margin: "1px 0 4px" }}>{a.job}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: COLORS.encreSoft }}>
                <span style={{ color: COLORS.ocre, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
                  <Star size={11} fill={COLORS.ocre} strokeWidth={0} /> {a.rating}
                </span>
                <span>· {a.missions} missions</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={11} /> {a.distance}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="home" onGoBookings={onGoBookings} />
    </div>
  );
}

function BottomNav({ active, onGoBookings }) {
  const items = [
    { key: "home", label: "Accueil", Icon: Home },
    { key: "bookings", label: "RDV", Icon: CalendarDays },
    { key: "support", label: "Support", Icon: MessageCircle },
    { key: "profile", label: "Profil", Icon: User },
  ];
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "12px 10px 18px", background: COLORS.cremeCard, borderTop: `1.5px solid ${COLORS.ligne}`,
        flexShrink: 0,
      }}
    >
      {items.map((it) => (
        <div
          key={it.key}
          onClick={() => it.key === "bookings" && onGoBookings && onGoBookings()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 600, color: active === it.key ? COLORS.ocreDeep : COLORS.encreSoft,
            cursor: it.key === "bookings" ? "pointer" : "default",
          }}
        >
          <it.Icon size={19} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

function ArtisanProfile({ artisan, onBack, onBook }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          background: COLORS.bleu, padding: "16px 20px 56px", flexShrink: 0,
          borderRadius: "0 0 32px 32px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
            border: "none", display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 18, cursor: "pointer",
          }}
        >
          <ChevronLeft size={16} color="#fff" />
        </button>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: "50%", background: artisan.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26,
              color: "#fff", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0,
            }}
          >
            {artisan.initials}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {artisan.name}
            </div>
            <div style={{ fontSize: 13, color: COLORS.ocre, fontWeight: 600, margin: "2px 0 6px" }}>
              {artisan.job} — {artisan.specialties[0]}
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              <span>★ {artisan.rating} ({artisan.missions})</span>
              <span>📍 {artisan.zone}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: -32, flexShrink: 0 }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: "50%", background: COLORS.cremeCard,
            border: `3px solid ${COLORS.vert}`, display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
          }}
        >
          <ShieldCheck size={28} color={COLORS.vert} />
        </div>
      </div>
      <div
        style={{
          textAlign: "center", fontSize: 11, fontWeight: 700, color: COLORS.vert,
          letterSpacing: "0.06em", textTransform: "uppercase", margin: "8px 0 18px", flexShrink: 0,
        }}
      >
        Identité vérifiée · Teranga
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 20px 18px", overflowX: "auto", flexShrink: 0 }}>
        {artisan.specialties.map((s) => (
          <Pill key={s} active={false}>{s}</Pill>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px 12px", flexShrink: 0 }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>Avis clients</h3>
        <span style={{ fontSize: 12, color: COLORS.ocreDeep, fontWeight: 600 }}>{artisan.missions} avis</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        {artisan.reviews.map((r, i) => (
          <div key={i} style={{ background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</span>
              <span style={{ color: COLORS.ocre, fontSize: 12 }}>{"★".repeat(r.stars)}</span>
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.encreSoft, lineHeight: 1.4 }}>{r.text}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 20px 18px", background: COLORS.creme, borderTop: `1.5px solid ${COLORS.ligne}`, flexShrink: 0 }}>
        <PrimaryButton onClick={onBook}>Réserver un rendez-vous</PrimaryButton>
      </div>
    </div>
  );
}

function BookingScreen({ artisan, onBack, onConfirmed }) {
  const [date, setDate] = useState(DATES[1]?.key || DATES[0].key);
  const [time, setTime] = useState("11:00");
  const [issue, setIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    const booking = await createBooking({
      artisanId: artisan.id,
      artisanName: artisan.name,
      artisanJob: artisan.job,
      clientName: "Aminata",
      date,
      time,
      issue: issue.trim() || "Pas de description fournie.",
      travelFee: artisan.travelFee,
    });
    setSubmitting(false);
    if (booking) onConfirmed(booking);
  };

  const dateObj = DATES.find((d) => d.key === date);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopHeader title="Choisir un créneau" onBack={onBack} />
      <div style={{ padding: "0 20px 14px", fontSize: 12.5, color: COLORS.encreSoft, marginTop: -8 }}>
        Avec {artisan.name} — {artisan.job}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.ocreDeep, padding: "0 20px", marginBottom: 10, flexShrink: 0 }}>
        Date
      </div>
      <div style={{ display: "flex", gap: 10, padding: "0 20px 22px", overflowX: "auto", flexShrink: 0 }}>
        {DATES.map((d) => {
          const sel = d.key === date;
          return (
            <div
              key={d.key}
              onClick={() => setDate(d.key)}
              style={{
                flexShrink: 0, width: 54, padding: "10px 0", borderRadius: 14, textAlign: "center",
                border: `1.5px solid ${sel ? COLORS.bleu : COLORS.ligne}`,
                background: sel ? COLORS.bleu : COLORS.cremeCard, cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: sel ? "rgba(255,255,255,0.7)" : COLORS.encreSoft }}>{d.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2, color: sel ? "#fff" : COLORS.encre }}>{d.num}</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.ocreDeep, padding: "0 20px", marginBottom: 10, flexShrink: 0 }}>
        Heure
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 20px 22px", flexShrink: 0 }}>
        {TIME_SLOTS.map((t) => {
          const sel = t === time;
          return (
            <div
              key={t}
              onClick={() => setTime(t)}
              style={{
                textAlign: "center", padding: "11px 0", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${sel ? COLORS.ocre : COLORS.ligne}`,
                background: sel ? COLORS.ocre : COLORS.cremeCard,
                color: sel ? "#fff" : COLORS.encre,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.ocreDeep, padding: "0 20px", marginBottom: 10, flexShrink: 0 }}>
        Décrire le besoin
      </div>
      <div style={{ padding: "0 20px 16px", flex: 1, overflowY: "auto" }}>
        <textarea
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          placeholder="Ex : robinet de la cuisine qui fuit depuis 2 jours…"
          style={{
            width: "100%", minHeight: 90, borderRadius: 14, border: `1.5px dashed ${COLORS.ligne}`,
            background: COLORS.cremeCard, padding: 14, fontSize: 12.5, color: COLORS.encre,
            fontFamily: "'Work Sans', sans-serif", resize: "none", outline: "none",
          }}
        />
      </div>

      <div style={{ padding: "14px 20px 18px", background: COLORS.creme, borderTop: `1.5px solid ${COLORS.ligne}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: COLORS.encreSoft }}>Frais de déplacement estimés</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.bleu }}>
            {artisan.travelFee.toLocaleString("fr-FR")} F
          </span>
        </div>
        <PrimaryButton onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Envoi en cours…" : `Confirmer pour le ${dateObj?.num} à ${time}`}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ConfirmationScreen({ booking, onSeeBookings, onBackHome }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", height: "100%" }}>
      <div
        style={{
          width: 100, height: 100, borderRadius: "50%", background: COLORS.vert,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
          position: "relative", boxShadow: "0 12px 24px -6px rgba(61,131,97,0.45)",
        }}
      >
        <div style={{ position: "absolute", inset: -8, border: `2px dashed ${COLORS.vert}`, borderRadius: "50%", opacity: 0.4 }} />
        <Check size={44} color="#fff" strokeWidth={2.5} />
      </div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.bleu, marginBottom: 8 }}>
        Demande envoyée
      </h2>
      <p style={{ fontSize: 13.5, color: COLORS.encreSoft, lineHeight: 1.5, maxWidth: 240, marginBottom: 26 }}>
        {booking.artisanName} va confirmer votre rendez-vous. Vous verrez le statut dans "Mes RDV".
      </p>

      <div style={{ width: "100%", background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 18, padding: 18, textAlign: "left", marginBottom: 22 }}>
        {[
          ["Artisan", booking.artisanName],
          ["Service", booking.artisanJob],
          ["Date", `${DATES.find(d=>d.key===booking.date)?.label || ""} ${DATES.find(d=>d.key===booking.date)?.num || ""}, ${booking.time}`],
          ["Déplacement", `${booking.travelFee.toLocaleString("fr-FR")} F`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${COLORS.ligne}` }}>
            <span style={{ color: COLORS.encreSoft }}>{k}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onSeeBookings} style={{ marginBottom: 10 }}>Voir mes rendez-vous</PrimaryButton>
      <OutlineButton onClick={onBackHome}>Retour à l'accueil</OutlineButton>
    </div>
  );
}

function ClientBookings({ bookings, onBack, onBackHome }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopHeader title="Mes rendez-vous" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {bookings.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.encreSoft, fontSize: 13, padding: "60px 10px" }}>
            <Inbox size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div>Aucun rendez-vous pour l'instant.</div>
          </div>
        )}
        {bookings.map((b) => (
          <div key={b.id} style={{ background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>{b.artisanName}</div>
                <div style={{ fontSize: 12, color: COLORS.ocreDeep, fontWeight: 600 }}>{b.artisanJob}</div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: COLORS.encreSoft, marginTop: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {DATES.find(d=>d.key===b.date)?.label} {DATES.find(d=>d.key===b.date)?.num}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {b.time}</span>
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.encreSoft, marginTop: 8, fontStyle: "italic" }}>"{b.issue}"</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 20px 18px", background: COLORS.creme, borderTop: `1.5px solid ${COLORS.ligne}`, flexShrink: 0 }}>
        <OutlineButton onClick={onBackHome}>Retour à l'accueil</OutlineButton>
      </div>
    </div>
  );
}

// ============================================================
// ARTISAN FLOW
// ============================================================
function ArtisanLogin({ artisans, onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "30px 20px 10px", flexShrink: 0 }}>
        <Seal size={48} border={COLORS.vert} bg={COLORS.vert} dashed={false}>
          <ShieldCheck size={22} color="#fff" />
        </Seal>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, color: COLORS.bleu, marginTop: 14 }}>
          Espace artisan
        </h2>
        <p style={{ fontSize: 12.5, color: COLORS.encreSoft, marginTop: 4 }}>
          Choisissez votre profil de démonstration pour voir vos rendez-vous.
        </p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {artisans.map((a) => (
          <div
            key={a.id}
            onClick={() => onSelect(a)}
            style={{
              background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 18,
              padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer",
            }}
          >
            <Avatar initials={a.initials} color={a.color} checked />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, fontFamily: "'Space Grotesk', sans-serif" }}>{a.name}</div>
              <div style={{ fontSize: 12, color: COLORS.ocreDeep, fontWeight: 600 }}>{a.job}</div>
            </div>
            <ArrowRight size={16} color={COLORS.encreSoft} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtisanDashboard({ artisan, bookings, onLogout, onUpdateStatus }) {
  const mine = bookings.filter((b) => b.artisanId === artisan.id);
  const pending = mine.filter((b) => b.status === "en_attente");
  const accepted = mine.filter((b) => b.status === "accepte");
  const [tab, setTab] = useState("en_attente");
  const list = tab === "en_attente" ? pending : tab === "accepte" ? accepted : mine.filter(b=>b.status==="refuse");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: COLORS.bleu, padding: "20px 20px 24px", flexShrink: 0, borderRadius: "0 0 28px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar initials={artisan.initials} color={artisan.color} size={44} />
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>{artisan.name}</div>
              <div style={{ color: COLORS.ocre, fontSize: 11.5, fontWeight: 600 }}>{artisan.job}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            Changer
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>{pending.length}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10.5 }}>En attente</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>{accepted.length}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10.5 }}>Acceptés</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>★{artisan.rating}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10.5 }}>Note</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "16px 20px 12px", flexShrink: 0 }}>
        {[
          ["en_attente", `En attente (${pending.length})`],
          ["accepte", `Acceptés (${accepted.length})`],
          ["refuse", "Refusés"],
        ].map(([key, label]) => (
          <Pill key={key} active={tab === key} onClick={() => setTab(key)}>{label}</Pill>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {list.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.encreSoft, fontSize: 13, padding: "50px 10px" }}>
            <Inbox size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div>Rien dans cette liste pour le moment.</div>
          </div>
        )}
        {list.map((b) => (
          <div key={b.id} style={{ background: COLORS.cremeCard, border: `1.5px solid ${COLORS.ligne}`, borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>{b.clientName}</div>
              <StatusBadge status={b.status} />
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: COLORS.encreSoft, marginBottom: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {DATES.find(d=>d.key===b.date)?.label} {DATES.find(d=>d.key===b.date)?.num}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {b.time}</span>
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.encreSoft, marginBottom: b.status === "en_attente" ? 12 : 0, fontStyle: "italic" }}>
              "{b.issue}"
            </div>
            {b.status === "en_attente" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => onUpdateStatus(b.id, "refuse")}
                  style={{
                    flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid #B0463C`,
                    background: "transparent", color: "#B0463C", fontWeight: 700, fontSize: 12.5,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                  }}
                >
                  <XCircle size={14} /> Refuser
                </button>
                <button
                  onClick={() => onUpdateStatus(b.id, "accepte")}
                  style={{
                    flex: 1, padding: 10, borderRadius: 10, border: "none",
                    background: COLORS.vert, color: "#fff", fontWeight: 700, fontSize: 12.5,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                  }}
                >
                  <CheckCircle2 size={14} /> Accepter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function TerangaApp() {
  const [mode, setMode] = useState("client"); // 'client' | 'artisan'
  const [loading, setLoading] = useState(true);
  const [artisans, setArtisans] = useState(ARTISAN_SEED);
  const [bookings, setBookings] = useState([]);

  // Client navigation state
  const [clientScreen, setClientScreen] = useState("home"); // home | profile | booking | confirmation | bookings
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [lastBooking, setLastBooking] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);

  // Artisan navigation state
  const [artisanUser, setArtisanUser] = useState(null);

  const refreshBookings = useCallback(async () => {
    const all = await loadAllBookings();
    setBookings(all);
  }, []);

  useEffect(() => {
    (async () => {
      await seedArtisansIfNeeded();
      const a = await loadArtisans();
      setArtisans(a);
      await refreshBookings();
      setLoading(false);
    })();
  }, [refreshBookings]);

  const handleUpdateStatus = async (id, status) => {
    const updated = await updateBookingStatus(id, status, bookings);
    if (updated) await refreshBookings();
  };

  const clientBookings = bookings.filter((b) => b.clientName === "Aminata");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.encreSoft, fontFamily: "'Work Sans', sans-serif" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Work Sans', sans-serif", background: COLORS.creme, color: COLORS.encre }}>
      {/* Mode switcher */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", flexShrink: 0 }}>
        <button
          onClick={() => setMode("client")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
            border: "none", cursor: "pointer",
            background: mode === "client" ? COLORS.bleu : "transparent",
            color: mode === "client" ? "#fff" : COLORS.encreSoft,
          }}
        >
          Espace client
        </button>
        <button
          onClick={() => setMode("artisan")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
            border: "none", cursor: "pointer",
            background: mode === "artisan" ? COLORS.vert : "transparent",
            color: mode === "artisan" ? "#fff" : COLORS.encreSoft,
          }}
        >
          Espace artisan
        </button>
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {mode === "client" && clientScreen === "home" && (
          <ClientHome
            artisans={artisans}
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            onSelectArtisan={(a) => { setSelectedArtisan(a); setClientScreen("profile"); }}
            onGoBookings={() => setClientScreen("bookings")}
          />
        )}
        {mode === "client" && clientScreen === "profile" && selectedArtisan && (
          <ArtisanProfile
            artisan={selectedArtisan}
            onBack={() => setClientScreen("home")}
            onBook={() => setClientScreen("booking")}
          />
        )}
        {mode === "client" && clientScreen === "booking" && selectedArtisan && (
          <BookingScreen
            artisan={selectedArtisan}
            onBack={() => setClientScreen("profile")}
            onConfirmed={async (b) => {
              setLastBooking(b);
              await refreshBookings();
              setClientScreen("confirmation");
            }}
          />
        )}
        {mode === "client" && clientScreen === "confirmation" && lastBooking && (
          <ConfirmationScreen
            booking={lastBooking}
            onSeeBookings={() => setClientScreen("bookings")}
            onBackHome={() => { setClientScreen("home"); setSelectedArtisan(null); }}
          />
        )}
        {mode === "client" && clientScreen === "bookings" && (
          <ClientBookings
            bookings={clientBookings}
            onBack={() => setClientScreen("home")}
            onBackHome={() => setClientScreen("home")}
          />
        )}

        {mode === "artisan" && !artisanUser && (
          <ArtisanLogin artisans={artisans} onSelect={setArtisanUser} />
        )}
        {mode === "artisan" && artisanUser && (
          <ArtisanDashboard
            artisan={artisanUser}
            bookings={bookings}
            onLogout={() => setArtisanUser(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
}
