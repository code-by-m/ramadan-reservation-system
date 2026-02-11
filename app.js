const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

const TABLE_SIZES = [4, 2];
const IFTAR_TIME = "19:30";

function assignTables(
  personCount,
  available,
  allowSmallGroupOnBigTable = true,
) {
  let best = null;

  function dfs(index, combo, capacity) {
    if (capacity >= personCount) {
      const waste = capacity - personCount;
      const candidate = {
        tables: [...combo],
        tableCount: combo.length,
        waste,
      };

      if (
        !best ||
        candidate.tableCount < best.tableCount ||
        (candidate.tableCount === best.tableCount &&
          candidate.waste < best.waste)
      ) {
        best = candidate;
      }
      return;
    }

    if (index === TABLE_SIZES.length) return;

    const size = TABLE_SIZES[index];
    let maxUse = available[size] || 0;

    if (size === 4 && personCount <= 2 && !allowSmallGroupOnBigTable) {
      maxUse = 0;
    }

    for (let i = 0; i <= maxUse; i++) {
      combo.push(...Array(i).fill(size));
      dfs(index + 1, combo, capacity + i * size);
      combo.splice(combo.length - i, i);
    }
  }

  dfs(0, [], 0);
  return best;
}

const reservationForm = document.getElementById("reservationForm");
const reservationResult = document.getElementById("reservationResult");
const availabilityResult = document.getElementById("availabilityResult");
const checkAvailabilityButton = document.getElementById("checkAvailability");
const reservationList = document.getElementById("reservationList");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editResult = document.getElementById("editResult");
const statRemaining = document.getElementById("statRemaining");
const statFree2 = document.getElementById("statFree2");
const statFree4 = document.getElementById("statFree4");
const adminForm = document.getElementById("adminForm");
const adminResult = document.getElementById("adminResult");
const reservationsView = document.getElementById("reservationsView");
const settingsView = document.getElementById("settingsView");
const logsView = document.getElementById("logsView");
const logsList = document.getElementById("logsList");
const navLinks = document.querySelectorAll("[data-section]");
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginResult = document.getElementById("loginResult");
const logoutButton = document.getElementById("logoutButton");
const currentUserLabel = document.getElementById("currentUserLabel");
const mainNavbar = document.getElementById("mainNavbar");
const filterForm = document.getElementById("filterForm");
const filterName = document.getElementById("filterName");
const filterPhone = document.getElementById("filterPhone");
const filterPerson = document.getElementById("filterPerson");
const filterStart = document.getElementById("filterStart");
const filterEnd = document.getElementById("filterEnd");
const clearFiltersButton = document.getElementById("clearFilters");
const toggleFiltersButton = document.getElementById("toggleFilters");
const exportCsvButton = document.getElementById("exportCsv");

const adminFields = {
  tableCount2: document.getElementById("tableCount2"),
  tableCount4: document.getElementById("tableCount4"),
  allowSmallGroup: document.getElementById("allowSmallGroup"),
};

const fields = {
  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  personCount: document.getElementById("personCount"),
  startDate: document.getElementById("startDate"),
  note: document.getElementById("reservationNote"),
  availabilityDate: document.getElementById("availabilityDate"),
};

const editFields = {
  customerName: document.getElementById("editCustomerName"),
  customerPhone: document.getElementById("editCustomerPhone"),
  personCount: document.getElementById("editPersonCount"),
  startDate: document.getElementById("editStartDate"),
  note: document.getElementById("editNote"),
};

let editingReservation = null;
const reservationCache = new Map();
const editModalInstance =
  editModal && window.bootstrap ? new window.bootstrap.Modal(editModal) : null;
let currentUser = null;
let currentRole = null;
let lastReservations = [];

function toIsoFromDate(dateValue) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T${IFTAR_TIME}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatTables(tables) {
  if (!tables || tables.length === 0) return "-";
  return tables.join(" + ");
}

async function fetchSettings() {
  const { data, error } = await supabaseClient
    .from("restaurant_settings")
    .select("allow_small_group_on_big_table")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return { allowSmallGroupOnBigTable: true };
  }

  return {
    allowSmallGroupOnBigTable: data?.allow_small_group_on_big_table ?? true,
  };
}

async function loadAdminSettings() {
  if (!adminForm) return;

  const { data: settings } = await supabaseClient
    .from("restaurant_settings")
    .select("allow_small_group_on_big_table")
    .eq("id", 1)
    .maybeSingle();

  if (settings) {
    adminFields.allowSmallGroup.checked = settings.allow_small_group_on_big_table;
  }

  const { data: inventory } = await supabaseClient
    .from("table_inventory")
    .select("size,total_count");

  if (inventory) {
    const row2 = inventory.find((row) => row.size === 2);
    const row4 = inventory.find((row) => row.size === 4);
    adminFields.tableCount2.value = row2?.total_count ?? 0;
    adminFields.tableCount4.value = row4?.total_count ?? 0;
  }
}

async function saveAdminSettings(event) {
  event.preventDefault();
  if (!adminResult) return;

  adminResult.className = "alert alert-info alert-dismissible fade show mt-3 mb-0";
  adminResult.innerHTML =
    '<i class="bi bi-info-circle me-1"></i> Kaydediliyor...';

  const settingsPayload = {
    id: 1,
    allow_small_group_on_big_table: adminFields.allowSmallGroup.checked,
  };

  const inventoryPayload = [
    { size: 2, total_count: Number(adminFields.tableCount2.value) || 0 },
    { size: 4, total_count: Number(adminFields.tableCount4.value) || 0 },
  ];

  const { error: settingsError } = await supabaseClient
    .from("restaurant_settings")
    .upsert(settingsPayload, { onConflict: "id" });

  if (settingsError) {
    adminResult.className = "alert alert-danger mt-3 mb-0";
    adminResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Ayar hatasi: ${settingsError.message}`;
    return;
  }

  const { error: inventoryError } = await supabaseClient
    .from("table_inventory")
    .upsert(inventoryPayload, { onConflict: "size" });

  if (inventoryError) {
    adminResult.className = "alert alert-danger mt-3 mb-0";
    adminResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Masa hatasi: ${inventoryError.message}`;
    return;
  }

  adminResult.className = "alert alert-success mt-3 mb-0";
  adminResult.innerHTML =
    '<i class="bi bi-check-circle me-1"></i> Ayarlar kaydedildi.';
}
async function loadDefaults() {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);
  if (fields.startDate) {
    fields.startDate.value = isoDate;
  }
  if (fields.availabilityDate) {
    fields.availabilityDate.value = isoDate;
  }
  await fetchSettings();
}

function getDayRangeIso(dateValue) {
  if (!dateValue) return null;
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59`);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function renderReservationList(items) {
  reservationCache.clear();
  if (!items || items.length === 0) {
    reservationList.innerHTML =
      '<div class="alert alert-light border" role="alert">Seçilen tarihte rezervasyon yok.</div>';
    return;
  }

  items.forEach((item) => {
    reservationCache.set(item.id, item);
  });

  reservationList.innerHTML = items
    .map((item) => {
      const tables = formatTables(item.assigned_tables);
      const statusClass =
        item.person_count >= 6 ? "border-warning" : "border-success";
      const isPast = new Date(item.end_time) < new Date();
      const mutedClass = isPast
        ? "text-muted text-decoration-line-through"
        : "";
      return `
        <div class="card shadow-sm ${statusClass}">
          <div class="card-body d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 ${mutedClass}">
            <div>
              <h5 class="card-title mb-1">${item.customer_name}</h5>
              <div class="text-muted">${item.phone ?? "-"}</div>
              ${item.note ? `<div class="text-muted small">Not: ${item.note}</div>` : ""}
            </div>
            <div>
              <div class="fw-semibold">${item.person_count} kişi</div>
              <div class="text-muted">Masalar: ${tables}</div>
            </div>
            <div>
              <div class="fw-semibold">Tarih</div>
              <div class="text-muted">${formatDate(item.start_time)}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="btn-group">
                <button type="button" class="btn btn-outline-warning btn-sm" data-action="edit" data-id="${item.id}">
                  <i class="bi bi-pencil"></i>
                  Duzenle
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${item.id}">
                  <i class="bi bi-trash"></i>
                  Sil
                </button>
              </div>
              <span class="badge bg-light text-dark">#${item.id.slice(0, 6)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  reservationList
    .querySelectorAll("button[data-action][data-id]")
    .forEach((button) => {
      button.addEventListener("click", onReservationAction);
    });
}

function applyFilters(items) {
  let filtered = [...items];
  const nameValue = filterName?.value.trim().toLowerCase();
  const phoneValue = filterPhone?.value.trim().toLowerCase();
  const personValue = filterPerson?.value ? Number(filterPerson.value) : null;
  const startValue = filterStart?.value;
  const endValue = filterEnd?.value;

  if (nameValue) {
    filtered = filtered.filter((item) =>
      item.customer_name?.toLowerCase().includes(nameValue),
    );
  }

  if (phoneValue) {
    filtered = filtered.filter((item) =>
      item.phone?.toLowerCase().includes(phoneValue),
    );
  }

  if (personValue) {
    filtered = filtered.filter((item) => item.person_count === personValue);
  }

  if (startValue || endValue) {
    filtered = filtered.filter((item) => {
      const dateStr = item.start_time?.slice(0, 10);
      if (!dateStr) return false;
      if (startValue && dateStr < startValue) return false;
      if (endValue && dateStr > endValue) return false;
      return true;
    });
  }

  return filtered;
}

function refreshReservationList() {
  const filtered = applyFilters(lastReservations);
  renderReservationList(filtered);
}

async function loadReservations() {
  const range = getQueryRange();
  if (!range) {
    reservationList.innerHTML =
      '<div class="alert alert-warning" role="alert">Tarih seçin.</div>';
    return;
  }

  const { data, error } = await supabaseClient
    .from("reservations")
    .select(
      "id,customer_name,phone,person_count,start_time,end_time,assigned_tables,note",
    )
    .gte("start_time", range.start)
    .lte("start_time", range.end)
    .order("start_time", { ascending: true });

  if (error) {
    reservationList.innerHTML = `<div class="alert alert-danger" role="alert">Hata: ${error.message}</div>`;
    return;
  }

  lastReservations = data || [];
  refreshReservationList();
}

function getQueryRange() {
  const startValue = filterStart?.value;
  const endValue = filterEnd?.value;

  if (startValue || endValue) {
    const start = new Date(`${startValue || endValue}T00:00:00`);
    const end = new Date(`${endValue || startValue}T23:59:59`);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  const dateValue = fields.availabilityDate.value;
  return getDayRangeIso(dateValue);
}

function openEditModal(reservation) {
  editingReservation = reservation;
  editFields.customerName.value = reservation.customer_name;
  editFields.customerPhone.value = reservation.phone ?? "";
  editFields.personCount.value = reservation.person_count;
  editFields.startDate.value = reservation.start_time.slice(0, 10);
  editFields.note.value = reservation.note ?? "";
  editResult.className = "alert alert-info mt-3 mb-0";
  editResult.innerHTML =
    '<i class="bi bi-info-circle me-1"></i> Güncelleme sonucu burada görünür.';
  if (editModalInstance) {
    editModalInstance.show();
  }
}

function closeEditModal() {
  editingReservation = null;
  if (editModalInstance) {
    editModalInstance.hide();
  }
}

function showSection(section) {
  if (!reservationsView || !settingsView || !logsView) return;
  const isSettings = section === "settings";
  const isLogs = section === "logs";
  if (isSettings && currentRole === "manager") return;
  if (isLogs && currentRole !== "developer") return;

  reservationsView.classList.toggle("d-none", isSettings || isLogs);
  settingsView.classList.toggle("d-none", !isSettings);
  logsView.classList.toggle("d-none", !isLogs);
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === section);
  });

  if (isLogs) {
    loadLogs();
  }
}

function setAuthView(isAuthed) {
  if (loginView) loginView.classList.toggle("d-none", isAuthed);
  if (appView) appView.classList.toggle("d-none", !isAuthed);
  if (logoutButton) logoutButton.classList.toggle("d-none", !isAuthed);
  if (mainNavbar) mainNavbar.classList.toggle("d-none", !isAuthed);
  if (currentUserLabel) {
    currentUserLabel.textContent = isAuthed && currentUser?.email
      ? currentUser.email
      : "";
  }
}

async function getProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id,role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return { role: null, error };
  }
  return { role: data?.role ?? null, error: null };
}

function applyRoleUI(role) {
  currentRole = role;
  if (currentRole === "manager") {
    if (settingsView) settingsView.classList.add("d-none");
    navLinks.forEach((link) => {
      if (link.dataset.section === "settings") {
        link.classList.add("d-none");
      }
    });
  } else {
    navLinks.forEach((link) => link.classList.remove("d-none"));
  }

  navLinks.forEach((link) => {
    if (link.dataset.section === "logs") {
      if (currentRole !== "developer") {
        link.classList.add("d-none");
      } else {
        link.classList.remove("d-none");
      }
    }
  });
}

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data?.session?.user ?? null;
  if (!currentUser) {
    setAuthView(false);
    return;
  }
  setAuthView(true);
  const profile = await getProfile(currentUser.id);
  applyRoleUI(profile.role);
  showSection("reservations");
  await loadDefaults();
  await loadAdminSettings();
  checkAvailability();
  loadReservations();
}

function renderLogs(items) {
  if (!logsList) return;
  if (!items || items.length === 0) {
    logsList.innerHTML =
      '<div class="list-group-item text-muted">Kayıt bulunamadı.</div>';
    return;
  }
  logsList.innerHTML = items
    .map((item) => {
      const when = new Date(item.created_at).toLocaleString("tr-TR");
      return `
        <div class="list-group-item d-flex flex-column flex-md-row justify-content-between gap-2">
          <div>
            <div class="fw-semibold">${item.action} • ${item.entity}</div>
            <div class="text-muted small">Kullanıcı: ${item.user_email ?? "-"}</div>
          </div>
          <div class="text-muted small">${when}</div>
        </div>
      `;
    })
    .join("");
}

async function loadLogs() {
  if (!logsList) return;
  logsList.innerHTML =
    '<div class="list-group-item text-muted">Loglar yükleniyor...</div>';

  const { data, error } = await supabaseClient
    .from("audit_logs_view")
    .select("id,action,entity,entity_id,created_at,user_email")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logsList.innerHTML = `<div class="list-group-item text-danger">Hata: ${error.message}</div>`;
    return;
  }

  renderLogs(data);
}

async function updateReservation(payload) {
  const { data, error } = await supabaseClient.rpc(
    "update_reservation",
    payload,
  );

  if (error) {
    editResult.className = "alert alert-danger mt-3 mb-0";
    editResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Hata: ${error.message}`;
    return false;
  }

  if (!data || data.length === 0) {
    editResult.className = "alert alert-warning mt-3 mb-0";
    editResult.innerHTML =
      '<i class="bi bi-exclamation-circle me-1"></i> Uygun masa kombinasyonu bulunamadı. Güncelleme reddedildi.';
    return false;
  }

  editResult.className = "alert alert-success mt-3 mb-0";
  editResult.innerHTML =
    '<i class="bi bi-check-circle me-1"></i> Rezervasyon güncellendi.';
  return true;
}

async function deleteReservation(id) {
  const { data, error } = await supabaseClient.rpc("delete_reservation", {
    p_id: id,
  });

  if (error || !data) {
    reservationResult.className = "alert alert-danger mt-3 mb-0";
    reservationResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Silme hatası: ${error?.message ?? "Bilinmeyen hata"}`;
    return false;
  }

  reservationResult.className = "alert alert-success mt-3 mb-0";
  reservationResult.innerHTML =
    '<i class="bi bi-check-circle me-1"></i> Rezervasyon silindi.';
  return true;
}

function renderAvailabilityState({
  status,
  free2,
  free4,
  remaining,
  suggestion,
  waste,
}) {
  if (statRemaining) statRemaining.textContent = remaining ?? "-";
  if (statFree2) statFree2.textContent = free2 ?? "-";
  if (statFree4) statFree4.textContent = free4 ?? "-";

  const hint = `${suggestion ?? ""}${waste != null ? ` (fire: ${waste})` : ""}`;
  availabilityResult.className = "alert alert-secondary mb-0";
  availabilityResult.innerHTML = `
    <div class="d-flex align-items-start gap-2">
      <i class="bi bi-info-circle"></i>
      <div>
        <div class="fw-semibold">${status}</div>
        <div class="text-muted">${hint}</div>
      </div>
    </div>
  `;
}

async function checkAvailability() {
  renderAvailabilityState({
    status: "Kontrol ediliyor...",
    free2: "-",
    free4: "-",
    remaining: "-",
    suggestion: "",
  });

  const startIso = toIsoFromDate(fields.availabilityDate.value);
  const settings = await fetchSettings();
  if (!startIso) {
    renderAvailabilityState({
      status: "Tarih seçin.",
      free2: "-",
      free4: "-",
      remaining: "-",
      suggestion: "",
    });
    return;
  }

  const { data, error } = await supabaseClient.rpc("get_table_availability", {
    p_date: startIso.slice(0, 10),
  });

  if (error) {
    renderAvailabilityState({
      status: `Hata: ${error.message}`,
      free2: "-",
      free4: "-",
      remaining: "-",
      suggestion: "",
    });
    return;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    renderAvailabilityState({
      status: "Sonuç bulunamadı.",
      free2: "-",
      free4: "-",
      remaining: "-",
      suggestion: "",
    });
    return;
  }

  const best = assignTables(
    Number(fields.personCount.value) || 1,
    { 2: row.free2, 4: row.free4 },
    settings.allowSmallGroupOnBigTable,
  );

  renderAvailabilityState({
    status: "Güncel doluluk",
    free2: row.free2,
    free4: row.free4,
    remaining: row.remaining_seats,
    suggestion: best
      ? `Örnek masa kombinasyonu: ${formatTables(best.tables)}`
      : "Uygun kombinasyon yok.",
    waste: best ? best.waste : null,
  });
}

reservationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  reservationResult.className =
    "alert alert-info alert-dismissible fade show mt-3 mb-0";
  reservationResult.innerHTML =
    '<i class="bi bi-info-circle me-1"></i> Kaydediliyor...';

  const startIso = toIsoFromDate(fields.startDate.value);
  if (!startIso) {
    reservationResult.className = "alert alert-danger mt-3 mb-0";
    reservationResult.innerHTML =
      '<i class="bi bi-exclamation-triangle me-1"></i> Tarih zorunlu.';
    return;
  }

  const payload = {
    p_customer_name: fields.customerName.value.trim(),
    p_phone: fields.customerPhone.value.trim(),
    p_person_count: Number(fields.personCount.value),
    p_start_time: startIso,
    p_note: fields.note?.value?.trim() || null,
  };

  const { data, error } = await supabaseClient.rpc(
    "create_reservation",
    payload,
  );

  if (error) {
    reservationResult.className = "alert alert-danger mt-3 mb-0";
    reservationResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Hata: ${error.message}`;
    return;
  }

  if (!data || data.length === 0) {
    reservationResult.className = "alert alert-warning mt-3 mb-0";
    reservationResult.innerHTML =
      '<i class="bi bi-exclamation-circle me-1"></i> Uygun masa kombinasyonu bulunamadı. Rezervasyon reddedildi.';
    return;
  }

  reservationResult.className = "alert alert-success mt-3 mb-0";
  reservationResult.innerHTML =
    '<i class="bi bi-check-circle me-1"></i> Rezervasyon başarılı.';
  reservationForm.reset();
  const today = new Date().toISOString().slice(0, 10);
  fields.startDate.value = today;
  loadReservations();
  checkAvailability();
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!editingReservation) return;

  const startIso = toIsoFromDate(editFields.startDate.value);
  if (!startIso) {
    editResult.className = "alert alert-danger mt-3 mb-0";
    editResult.innerHTML =
      '<i class="bi bi-exclamation-triangle me-1"></i> Tarih zorunlu.';
    return;
  }

  const payload = {
    p_id: editingReservation.id,
    p_customer_name: editFields.customerName.value.trim(),
    p_phone: editFields.customerPhone.value.trim(),
    p_person_count: Number(editFields.personCount.value),
    p_start_time: startIso,
    p_note: editFields.note?.value?.trim() || null,
  };

  const ok = await updateReservation(payload);
  if (ok) {
    closeEditModal();
    loadReservations();
    checkAvailability();
  }
});

checkAvailabilityButton.addEventListener("click", checkAvailability);

fields.availabilityDate.addEventListener("change", () => {
  checkAvailability();
  loadReservations();
});

async function onReservationAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  let data = reservationCache.get(id);
  if (!data) {
    const response = await supabaseClient
    .from("reservations")
    .select(
      "id,customer_name,phone,person_count,start_time,end_time,assigned_tables,note",
    )
      .eq("id", id)
      .maybeSingle();
    if (response.error) {
      reservationResult.className = "alert alert-danger mt-3 mb-0";
      reservationResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Hata: ${response.error.message}`;
      return;
    }
    data = response.data;
  }

  if (!data) {
    reservationResult.className = "alert alert-warning mt-3 mb-0";
    reservationResult.innerHTML =
      '<i class="bi bi-exclamation-circle me-1"></i> Rezervasyon bulunamadı.';
    return;
  }

  if (action === "edit") {
    openEditModal(data);
  }

  if (action === "delete") {
    const ok = window.confirm("Rezervasyon silinsin mi?");
    if (!ok) return;
    const deleted = await deleteReservation(id);
    if (deleted) {
      if (editingReservation && editingReservation.id === id) {
        closeEditModal();
      }
      loadReservations();
      checkAvailability();
    }
  }
}

if (adminForm) {
  adminForm.addEventListener("submit", saveAdminSettings);
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showSection(link.dataset.section);
  });
});

if (filterForm) {
  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    refreshReservationList();
  });
}

if (clearFiltersButton) {
  clearFiltersButton.addEventListener("click", () => {
    if (filterName) filterName.value = "";
    if (filterPhone) filterPhone.value = "";
    if (filterPerson) filterPerson.value = "";
    if (filterStart) filterStart.value = "";
    if (filterEnd) filterEnd.value = "";
    refreshReservationList();
  });
}

if (toggleFiltersButton && filterForm) {
  toggleFiltersButton.addEventListener("click", () => {
    filterForm.classList.toggle("d-none");
  });
}

function downloadCsv(rows) {
  if (!rows || rows.length === 0) return;
  const headers = [
    "ID",
    "Müşteri Adı",
    "Telefon",
    "Kişi Sayısı",
    "Tarih",
    "Masalar",
    "Not",
  ];
  const lines = [
    headers.join(";"),
    ...rows.map((row) => {
      const values = [
        row.id ?? "",
        row.customer_name ?? "",
        row.phone ? `'${row.phone}` : "",
        row.person_count ?? "",
        formatDate(row.start_time) ? `'${formatDate(row.start_time)}` : "",
        Array.isArray(row.assigned_tables)
          ? row.assigned_tables.join(" + ")
          : row.assigned_tables ?? "",
        row.note ?? "",
      ];
      return values
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(";");
    }),
  ];
  const csvContent = "\ufeff" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePart = fields.availabilityDate?.value || "tarih";
  link.href = url;
  link.download = `rezervasyonlar_${datePart}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

if (exportCsvButton) {
  exportCsvButton.addEventListener("click", () => {
    const rows = applyFilters(lastReservations);
    downloadCsv(rows);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginResult) return;
    loginResult.className = "alert alert-info mt-3 mb-0";
    loginResult.innerHTML =
      '<i class="bi bi-info-circle me-1"></i> Giriş yapılıyor...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value,
    });

    if (error || !data?.user) {
      loginResult.className = "alert alert-danger mt-3 mb-0";
      loginResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Hata: ${error?.message ?? "Giriş başarısız."}`;
      return;
    }

    currentUser = data.user;
    loginResult.className = "alert alert-success mt-3 mb-0";
    loginResult.innerHTML =
      '<i class="bi bi-check-circle me-1"></i> Giriş başarılı.';
    await initAuth();
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentRole = null;
    setAuthView(false);
  });
}

supabaseClient.auth.onAuthStateChange(() => {
  initAuth();
});

initAuth();

