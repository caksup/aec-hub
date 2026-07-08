/* ==================================================
   script.js - Skrip Pangkalan Data Global Terpadu
   AEC Hub - Versi 1.6.6 Ultimate
   
   Riwayat Versi (JS):
   - v1.0 - v1.6.3: Inisialisasi Firebase dan manajemen CRUD.
   - v1.6.4 - v1.6.5: Terjadi kesalahan pemuatan Event Listener.
   - v1.6.6: (CURRENT) FIX FATAL LOGIN. Menghapus pembungkus DOMContentLoaded yang memblokir skrip type="module". Sistem kini langsung membaca form login dan mengeksekusi pangkalan data seketika.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. KONFIGURASI FIREBASE & MODE LURING
// ==========================================
const firebaseConfig = { 
    apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", 
    authDomain: "special-mentor.firebaseapp.com", 
    projectId: "special-mentor", 
    storageBucket: "special-mentor.firebasestorage.app", 
    messagingSenderId: "1075582532703", 
    appId: "1:1075582532703:web:969365cefff8999335efea" 
};
const app = initializeApp(firebaseConfig); 
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => { 
    console.warn("Status Luring PWA:", err.code); 
});

// ==========================================
// 2. FUNGSI PERINGATAN MODAL MODERN
// ==========================================
window.showModernAlert = function(title, message, type = 'error') {
    const tEl = document.getElementById('alertTitle'); 
    const mEl = document.getElementById('alertMessage'); 
    const iEl = document.getElementById('alertIcon'); 
    const modalEl = document.getElementById('modernAlertModal');
    
    if(!tEl || !mEl || !iEl || !modalEl) { alert(title + "\n" + message); return; }
    
    tEl.innerText = title; mEl.innerText = message;
    
    if (type === 'error') iEl.className = 'bi bi-x-circle-fill text-danger mb-3 d-block'; 
    else if (type === 'success') iEl.className = 'bi bi-check-circle-fill text-success mb-3 d-block'; 
    else iEl.className = 'bi bi-info-circle-fill text-primary mb-3 d-block';
    
    new bootstrap.Modal(modalEl).show();
};

// ==========================================
// 3. TEMA GELAP & IDENTITAS SESI GLOBAL
// ==========================================
const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

const actUser = localStorage.getItem("loggedInUser"); 
const actRole = localStorage.getItem("loggedInRole"); 
const myName = localStorage.getItem("loggedInName");

// ==========================================
// 4. LOGIKA HALAMAN LOGIN (TANPA PEMBUNGKUS DOMContentLoaded)
// ==========================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    // Jika sudah masuk (login), paksa beralih rute
    if (actUser && actRole) {
        if (actRole === "admin") window.location.replace("superuser.html");
        else if (actRole === "direktur") window.location.replace("direktur.html");
        else window.location.replace("mentor.html");
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById("btnLogin");
        const u = document.getElementById("username").value.toLowerCase().trim();
        const p = document.getElementById("pin").value.trim();
        
        if (!u || !p) return window.showModernAlert("Akses Ditolak", "ID Pengguna dan PIN wajib diisi.");
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...'; 
        btn.disabled = true;
        
        try {
            const snap = await getDoc(doc(db, "users", u));
            if (snap.exists() && snap.data().pin === p) {
                const data = snap.data();
                if (data.status === "nonaktif") { 
                    window.showModernAlert("Akses Terkunci", "Akun dinonaktifkan Admin."); 
                    btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; return; 
                }
                
                // Merekam Sesi
                localStorage.setItem("loggedInUser", u); 
                localStorage.setItem("loggedInRole", data.role); 
                localStorage.setItem("loggedInName", data.julukan || u);
                
                // Mengalihkan Rute
                if (data.role === "admin") window.location.replace("superuser.html");
                else if (data.role === "direktur") window.location.replace("direktur.html");
                else window.location.replace("mentor.html");
            } else { 
                window.showModernAlert("Akses Ditolak", "ID atau PIN tidak sesuai."); 
                btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; 
            }
        } catch (err) { 
            window.showModernAlert("Kesalahan Jaringan", "Gagal menghubungkan ke server Firebase."); 
            btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; 
        }
    });

} 
// ==========================================
// 5. LOGIKA DASBOR SISTEM
// ==========================================
else {
    
    // Pagar Keamanan Dasbor
    if (!actUser || !actRole) { 
        window.location.replace("index.html"); 
    }

    if (document.getElementById("userNameDisplay")) document.getElementById("userNameDisplay").innerText = myName || "Pengguna";
    if (document.getElementById("userIdDisplay")) document.getElementById("userIdDisplay").innerText = actUser;

    function runClock() {
        const clk = document.getElementById('headClockDate'); if(!clk) return; const d = new Date();
        clk.innerText = `${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' })} WIB`;
    }
    setInterval(runClock, 1000); runClock();

    function updateNetworkStatus() {
        const icon = document.getElementById("networkStatusIcon"); if(!icon) return;
        if (navigator.onLine) { icon.className = "bi bi-wifi ms-1 net-status-icon net-online"; icon.title = "Daring"; } 
        else { icon.className = "bi bi-wifi-off ms-1 net-status-icon net-offline"; icon.title = "Luring"; }
    }
    window.addEventListener('online', updateNetworkStatus); window.addEventListener('offline', updateNetworkStatus); updateNetworkStatus();

    const themes = ['light', 'dark', 'system']; const themeIcons = ['bi-sun-fill text-warning', 'bi-moon-stars-fill text-light', 'bi-display text-info'];
    let currentThemeIndex = themes.indexOf(localStorage.getItem('aecTheme') || 'system'); if (currentThemeIndex === -1) currentThemeIndex = 2;
    function applyThemeVisuals(index) {
        const t = themes[index]; localStorage.setItem('aecTheme', t);
        if (t === 'system') document.documentElement.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); else document.documentElement.setAttribute('data-theme', t);
        const iconEl = document.getElementById("themeIconDisplay"); if(iconEl) { iconEl.className = `bi ${themeIcons[index]} fs-4 text-white`; void iconEl.offsetWidth; iconEl.classList.add("theme-icon-animate"); }
    }
    applyThemeVisuals(currentThemeIndex);
    if(document.getElementById("btnCycleTheme")) document.getElementById("btnCycleTheme").onclick = () => { currentThemeIndex = (currentThemeIndex + 1) % 3; applyThemeVisuals(currentThemeIndex); };

    if(document.getElementById("btnLogoutOffcanvas")) { 
        document.getElementById("btnLogoutOffcanvas").onclick = (e) => { 
            e.preventDefault(); 
            if(confirm("Yakin ingin keluar dari sistem AEC Hub?")) { localStorage.clear(); window.location.replace("index.html"); } 
        }; 
    }

    // Variabel Sesi Pangkalan Data Global
    let currentSchoolId = ""; let rawKurikulum = {}; let rawMasterSiswa = ""; let dataLengkap = []; let dataLengkapMentor = []; let masterTugasWA = [];
    let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
    let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

    function killListeners() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; dataLengkapMentor = []; masterTugasWA = []; }

    export function getActiveSchedule(jadwalGlobal) {
        if (!jadwalGlobal || jadwalGlobal === "-") return "Tidak ada jadwal kelas.";
        const lines = jadwalGlobal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes();
        for (let line of lines) { const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/); if (match) { const s = parseInt(match[1]) * 60 + parseInt(match[2]); const e = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= s && cur <= e) return line; } } return "Di luar jam operasional.";
    }

    // ==========================================
    // RUTE ADMIN (SUPERUSER)
    // ==========================================
    const isAdminPage = document.getElementById("adminTabs") !== null;
    if (actRole === 'admin' && isAdminPage) {
        onSnapshot(collection(db, "schools"), (snap) => { 
            globalAllSchools = []; let archivedSchools = [];
            snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); else archivedSchools.push({ id: d.id, ...d.data() }); }); 
            renderModernSchoolSelect(); renderOverviewCardsAdmin(); processGlobalStudentsData();
            const listArsip = document.getElementById("listArsipSekolah");
            if(listArsip) { listArsip.innerHTML = ""; if(archivedSchools.length === 0) listArsip.innerHTML = "<div class='text-muted small text-center p-3'>Arsip kosong.</div>"; archivedSchools.forEach(s => { listArsip.innerHTML += `<div class="list-group-item d-flex justify-content-between align-items-center bg-white border mb-1 rounded"><div class="fw-bold text-dark text-sm">${s.namaSekolah}</div><button class="btn btn-sm btn-outline-primary py-0 px-3 rounded-pill fw-bold" onclick="window.readArchivedLogbook('${s.id}')">Lihat Riwayat</button></div>`; }); }
        });

        window.readArchivedLogbook = async function(sid) {
            const area = document.getElementById("areaLogbookArsip"); const konten = document.getElementById("kontenLogbookArsip");
            if(!area || !konten) return; document.getElementById("judulArsipLogbook").innerText = "Logbook: " + sid; area.classList.remove("d-none"); konten.innerHTML = '<div class="text-center small text-muted">Memuat...</div>';
            try {
                const logsSnap = await getDocs(query(collection(db, "logbooks"), where("schoolId", "==", sid))); let arrLogs = [];
                logsSnap.forEach(d => arrLogs.push({id: d.id, ...d.data()})); arrLogs.sort((a,b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
                if(arrLogs.length === 0) { konten.innerHTML = '<div class="text-center text-muted mt-2">Tidak ada pencatatan logbook.</div>'; return; }
                konten.innerHTML = arrLogs.map(d => `<div class="p-2 border rounded mb-2 bg-white shadow-sm"><div class="fw-bold text-wa border-bottom pb-1 mb-1">${d.nama.toUpperCase()} <span class="badge bg-secondary rounded-pill float-end">${d.kelas}</span></div><div class="text-dark mt-1 text-xs">📖 Materi: ${d.materi?.join(', ')}</div></div>`).join('');
            } catch (error) { konten.innerHTML = '<div class="text-danger text-center">Gagal memuat arsip.</div>'; }
        };

        function renderOverviewCardsAdmin() {
            const container = document.getElementById("overviewCardsContainer"); const pesertaContainer = document.getElementById("trackerPesertaList");
            if (!container) return; container.innerHTML = ""; let totalPesertaGlobal = 0;
            if (globalAllSchools.length === 0) { container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif.</div></div>`; if(pesertaContainer) pesertaContainer.innerHTML = "0 Peserta"; return; }
            globalAllSchools.forEach(s => {
                let jmlSiswa = 0; if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').filter(n => n.trim() !== "").length; } }); }
                totalPesertaGlobal += jmlSiswa; const jmlTutor = (s.assignedMentors || []).length;
                container.innerHTML += `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-1" style="cursor: pointer; border-left: 4px solid var(--wa-primary) !important;" onclick="window.langsungKeSekolah('${s.id}')"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Tanggal Mulai:</span><span class="text-xs fw-bold text-dark">${s.waktuUpdate ? s.waktuUpdate.toDate().toLocaleDateString('id-ID') : '-'}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Hari Berjalan:</span><span class="badge bg-wa text-white rounded-pill">Hari ke-${s.hariBerjalan||0}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Mentor Terplot:</span><span class="badge bg-light text-dark border rounded-pill">${jmlTutor} Orang</span></div><div class="d-flex justify-content-between align-items-center"><span class="text-secondary text-xs fw-bold">Total Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jmlSiswa} Peserta</span></div></div></div></div>`;
            });
            if(pesertaContainer) pesertaContainer.innerHTML = `<h5 class="fw-bold text-wa mb-1">${totalPesertaGlobal}</h5><span class="text-xs text-muted fw-bold">TOTAL PESERTA GLOBAL</span>`;
        }

        function renderModernSchoolSelect() {
            const container = document.getElementById("modernSchoolSelect"); if (!container) return;
            let htmlContent = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value=""><i class="bi bi-globe"></i><span class="tab-label">GLOBAL</span></button><button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa active-pill' : 'btn-outline-success'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW"><i class="bi bi-plus-circle"></i><span class="tab-label">BARU</span></button>`;
            globalAllSchools.forEach(s => { const isAct = (currentSchoolId === s.id); htmlContent += `<button class="btn btn-sm ${isAct ? 'btn-wa active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}"><i class="bi bi-building"></i><span class="tab-label">${s.namaSekolah}</span></button>`; });
            container.innerHTML = htmlContent; container.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.currentTarget.getAttribute('data-value')); }; });
        }

        window.langsungKeSekolah = function(val) {
            killListeners(); currentSchoolId = val; renderModernSchoolSelect();
            if(!val) {
                if(document.getElementById("adminLogbookList")) document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Pilih lokasi sekolah spesifik untuk memuat riwayat.</div>`;
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-sekolah"]')).show(); processGlobalStudentsData();
            } else if(val === "NEW") {
                if(document.getElementById("inputIdSchool")) {
                    document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = ""; document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
                }
                currentAssignedMentors = []; renderMentorChecklistAdmin(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#setup-spesifik"]')).show();
            } else {
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show(); connectDatabaseAdmin(val);
            }
        }

        function connectDatabaseAdmin(sid) {
            unsubSchool = onSnapshot(doc(db, "schools", sid), (snap) => {
                if(!snap.exists()) return; const d = snap.data();
                if(document.getElementById('inputIdSchool')) {
                    document.getElementById('inputIdSchool').value = sid; document.getElementById('inputIdSchool').readOnly = true;
                    document.getElementById('inputSekolah').value = d.namaSekolah || ""; document.getElementById('inputTotalHari').value = d.totalHari || 5; document.getElementById('inputHariKe').value = d.hariBerjalan || 0; document.getElementById('inputMasterKelas').value = d.masterKelas || ""; document.getElementById('inputBriefing').value = d.briefing || ""; document.getElementById('inputJadwal').value = d.jadwal || ""; document.getElementById('inputGoal').value = d.goal || ""; document.getElementById('inputMasterSiswa').value = d.masterSiswa || "";
                    rawKurikulum = d.kurikulum || {}; 
                    document.getElementById('inputVocab').value = rawKurikulum.vocab ? rawKurikulum.vocab.join('\n') : ""; document.getElementById('inputSpeaking').value = rawKurikulum.speaking ? rawKurikulum.speaking.join('\n') : ""; document.getElementById('inputGrammar').value = rawKurikulum.grammar ? rawKurikulum.grammar.join('\n') : ""; document.getElementById('inputPractice').value = rawKurikulum.practice ? rawKurikulum.practice.join('\n') : "";
                }
                currentAssignedMentors = d.assignedMentors || []; renderMentorChecklistAdmin();
                const arrKelas = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                ['filterKelasHistori', 'waTarget'].forEach(id => { const el = document.getElementById(id); if(!el) return; el.innerHTML = (id === 'waTarget' ? `<option value="GLOBAL">GLOBAL (Semua Kelas)</option>` : `<option value="SEMUA">Semua Kelas</option>`) + arrKelas.map(k => `<option value="${k}">${k}</option>`).join(''); });
            });
            unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { dataLengkap = []; snap.forEach(doc => dataLengkap.push({ id: doc.id, ...doc.data() })); dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); extractDaysLogbookAdmin(); renderLogbooksListAdmin(); calculateLeaderboardTutorAdmin(); });
            unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() })); chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0)); const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = chats.map(c => { const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; return `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time} <i class="bi bi-trash ms-2 text-danger" style="cursor:pointer;" onclick="window.hapusPesanObrolan('${c.id}')"></i></div></div>`; }).join(''); box.scrollTop = box.scrollHeight; });
            unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push({ id: doc.id, ...doc.data() })); masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); renderRiwayatTugasWAAdmin(); });
        }

        if(document.getElementById("btnSimpanRoadmap")) {
            document.getElementById("btnSimpanRoadmap").onclick = async () => { const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim(); if(!w || !j) return window.showModernAlert("Peringatan", "Waktu Target dan Judul wajib diisi!"); try { await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() }); window.showModernAlert("Berhasil", "Roadmap Program Harian berhasil disimpan!", "success"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = ""; } catch(e) { window.showModernAlert("Kesalahan", e.message); } };
        }

        onSnapshot(query(collection(db, "roadmaps")), (snap) => {
            const listOverview = document.getElementById("overviewRoadmap"); const listSistem = document.getElementById("sistemRoadmapList");
            let dataRoadmap = []; snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); }); dataRoadmap.sort((a,b) => (a.created_at?.toMillis() || 0) - (b.created_at?.toMillis() || 0));
            if(listOverview) listOverview.innerHTML = dataRoadmap.map(r => `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`).join('');
            if(listSistem) listSistem.innerHTML = dataRoadmap.map(r => `<li class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom"><div><div class="fw-bold text-dark text-sm">${r.judul}</div><div class="text-muted" style="font-size:0.65rem">${r.waktu_target}</div></div><i class="bi bi-trash text-danger" style="cursor:pointer;" onclick="window.removeRoadmapAdmin('${r.id}')"></i></li>`).join('');
        });
        window.removeRoadmapAdmin = async function(id) { if(confirm("Hapus rincian peta jalan ini secara permanen?")) await deleteDoc(doc(db, "roadmaps", id)); };

        onSnapshot(collection(db, "users"), (snap) => {
            globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = "";
            snap.forEach(d => {
                const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud});
                let btnStatus = ud.role === 'admin' ? `<span class="badge bg-secondary p-1 text-xs"><i class="bi bi-shield-lock-fill"></i> Admin</span>` : `<button class="btn btn-sm bg-transparent border-0 p-0" onclick="window.ubahStatusPengguna('${uid}', '${ud.status === 'aktif' ? 'nonaktif' : 'aktif'}')"><i class="bi ${ud.status === 'aktif' ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'} fs-4"></i></button>`;
                let btnHapus = ud.role === 'admin' ? `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1 rounded-pill" disabled><i class="bi bi-trash"></i></button>` : `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.hapusPenggunaPermanen('${uid}')"><i class="bi bi-trash"></i></button>`;
                let btnEdit = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.siapSuntingPengguna('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')"><i class="bi bi-pencil"></i></button>`;
                tbody.innerHTML += `<tr><td class="text-start ps-2"><b>${uid}</b><br><small class="text-muted">${ud.julukan}</small></td><td class="text-uppercase fw-bold text-xs">${ud.role}<br><span class="text-danger font-monospace">${ud.pin}</span></td><td><div class="d-flex justify-content-center align-items-center gap-1">${btnStatus}${btnEdit}${btnHapus}</div></td></tr>`;
            }); renderMentorChecklistAdmin();
        });

        window.ubahStatusPengguna = async function(uid, statusBaru) { await updateDoc(doc(db, "users", uid), { status: statusBaru }); };
        window.hapusPenggunaPermanen = async function(uid) { if(confirm(`Apakah Anda yakin ingin menghapus akun tutor ${uid}?`)) await deleteDoc(doc(db, "users", uid)); };
        window.siapSuntingPengguna = function(uid, nama, role, pin) { document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; document.getElementById("newPin").value = pin; document.getElementById("newName").value = nama; document.getElementById("newRole").value = role; };

        if(document.getElementById("btnAddUser")) {
            document.getElementById("btnAddUser").onclick = async () => { 
                const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value.trim(); const n = document.getElementById("newName").value.trim(); const r = document.getElementById("newRole").value; 
                if(!u || !p || !n) return window.showModernAlert("Peringatan", "Formulir Pendaftaran wajib dilengkapi!"); 
                await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); window.showModernAlert("Berhasil", "Data Akun Pengguna berhasil disimpan.", "success"); document.getElementById("newUser").readOnly = false; document.getElementById("newUser").value = ""; document.getElementById("newPin").value = ""; document.getElementById("newName").value = ""; 
            };
        }

        function renderMentorChecklistAdmin() { const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = globalAllUsers.filter(u => u.status === 'aktif').map(u => `<div class="col-6"><div class="form-check border p-1 bg-white rounded shadow-sm"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${currentAssignedMentors.includes(u.id)?"checked":""}><label class="form-check-label ms-1 text-xs fw-bold" for="chk_${u.id}">${u.julukan}</label></div></div>`).join(''); }

        if(document.getElementById("btnSaveSchool")) {
            document.getElementById("btnSaveSchool").onclick = async () => {
                const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return window.showModernAlert("Kesalahan", "ID Handle Sekolah wajib diisi!");
                const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
                const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
                try { await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); window.showModernAlert("Berhasil", "Konfigurasi profil sekolah berhasil diperbarui!", "success"); window.langsungKeSekolah(sid); } catch (e) { window.showModernAlert("Kesalahan", e.message); }
            };
        }

        if(document.getElementById("btnArsipSekolah")) { document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW') { if(confirm("Anda yakin ingin mengarsipkan data sekolah ini?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); window.showModernAlert("Berhasil", "Sekolah Resmi Diarsipkan.", "success"); window.langsungKeSekolah(""); } } }; }
        if(document.getElementById('btnImportExcel')) {
            document.getElementById('btnImportExcel').onclick = function() {
                const file = document.getElementById('excelSiswa').files[0]; if(!file) return window.showModernAlert("Peringatan", "Silakan lampirkan format berkas Excel terlebih dahulu!");
                const reader = new FileReader(); reader.onload = function(e) {
                    try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } }); let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); } document.getElementById('inputMasterSiswa').value = output.join('\n'); window.showModernAlert("Berhasil", "Penguraian Data Excel Berhasil!", "success"); } catch(error) { window.showModernAlert("Gagal", "Format Berkas Tidak Valid."); }
                }; reader.readAsArrayBuffer(file);
            };
        }

        function extractDaysLogbookAdmin() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Log Kehadiran</option>' + sortedDays.map((entry, idx) => `<option value="${entry[0]}">Hari ke-${idx+1}</option>`).join(''); }
        
        function renderLogbooksListAdmin() { 
            const container = document.getElementById("adminLogbookList"); if(!container) return; container.innerHTML = ""; 
            const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value; 
            let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dataTampil = dataTampil.filter(d => d.kelas === fKelas); 
            if(dataTampil.length === 0) { container.innerHTML = `<div class="alert alert-secondary text-center small border-0">Pencatatan Kosong.</div>`; return; } 
            container.innerHTML = dataTampil.map(d => `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs text-dark border-start border-wa border-4"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><b class="text-dark">${d.nama.toUpperCase()}</b><span class="badge bg-secondary rounded-pill">${d.kelas}</span></div><div class="mb-1">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div class="mb-1">📝 <b>Catatan:</b> ${d.laporanSiswa || '-'}</div><div class="text-end mt-2"><button class="btn btn-xs btn-outline-danger py-0 px-3 rounded-pill fw-bold" onclick="window.hapusLaporanLogbook('${d.id}')">Hapus Laporan</button></div></div>`).join(''); 
        }
        window.hapusLaporanLogbook = async function(id) { if(confirm("Hapus laporan pengajaran ini secara permanen? Data nilai siswa yang terkait akan ikut terhapus.")) await deleteDoc(doc(db, "logbooks", id)); };
        if(document.getElementById('filterHari')) document.getElementById('filterHari').addEventListener('change', renderListLogbookAdmin); 
        if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').addEventListener('change', renderListLogbookAdmin);

        function calculateLeaderboardTutorAdmin() { let rekapMentor = {}; dataLengkap.forEach(log => { if(!rekapMentor[log.nama]) rekapMentor[log.nama] = 0; rekapMentor[log.nama]++; }); const board = document.getElementById("leaderboardTutor"); if(!board) return; board.innerHTML = Object.entries(rekapMentor).sort((a,b)=>b[1]-a[1]).map(([nm, ct], idx) => { let med = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : "🏅"); return `<div class="d-flex justify-content-between p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark">${med} ${nm}</div><div class="badge bg-wa rounded-pill">${ct} Logbook</div></div>`; }).join('') || '<div class="text-muted small text-center p-3 border rounded bg-light">Belum ada data kinerja mentor.</div>'; }

        async function processGlobalStudentsData() {
            const tabelNilai = document.getElementById("tabelNilaiGlobal"); const labelHadir = document.getElementById("containerKehadiranGlobal"); const trackPrestasi = document.getElementById("trackerPrestasiList");
            if(!tabelNilai || !labelHadir || !trackPrestasi) return; tabelNilai.innerHTML = `<tr><td colspan="6" class="text-muted"><div class="spinner-border spinner-border-sm"></div> Memuat data global...</td></tr>`;
            let rekapSiswaGlobal = {}; let totalKehadiranGlobal = { h: 0, a: 0, s: 0, i: 0 }; let activeIds = globalAllSchools.map(s => s.id);
            if(activeIds.length === 0) { tabelNilai.innerHTML = `<tr><td colspan="6" class="text-muted">Tidak ada data aktif.</td></tr>`; labelHadir.innerHTML = `<div class="alert alert-light border small text-center text-muted">Belum ada aktivitas sekolah.</div>`; trackPrestasi.innerHTML = `<div class="text-center text-muted small p-3">Data prestasi kosong.</div>`; return; }
            try {
                const logbooksSnap = await getDocs(collection(db, "logbooks"));
                logbooksSnap.forEach(doc => {
                    const data = doc.data();
                    if(activeIds.includes(data.schoolId) && data.dataSiswa) {
                        data.dataSiswa.forEach(siswa => {
                            const identitas = `${siswa.nama} (${data.kelas})`; if(!rekapSiswaGlobal[identitas]) rekapSiswaGlobal[identitas] = { vocab: '-', speak: '-', grammar: '-', prac: '-', poinTotal: 0 };
                            let nilaiHuruf = (siswa.nilai || "").toUpperCase();
                            if(['A','B','C'].includes(nilaiHuruf)) {
                                let mStr = (data.materi || []).join(' ').toLowerCase();
                                if(mStr.includes('vocab')) rekapSiswaGlobal[identitas].vocab = nilaiHuruf; if(mStr.includes('speak')) rekapSiswaGlobal[identitas].speak = nilaiHuruf; if(mStr.includes('gram')) rekapSiswaGlobal[identitas].grammar = nilaiHuruf; if(mStr.includes('prac')) rekapSiswaGlobal[identitas].prac = nilaiHuruf;
                            }
                            if(nilaiHuruf === 'A' || nilaiHuruf === 'A+') rekapSiswaGlobal[identitas].poinTotal += 90; else if(parseInt(nilaiHuruf) > 0) rekapSiswaGlobal[identitas].poinTotal += parseInt(nilaiHuruf);
                            if(siswa.kehadiran === 'h') totalKehadiranGlobal.h++; if(siswa.kehadiran === 'a') totalKehadiranGlobal.a++; if(siswa.kehadiran === 's') totalKehadiranGlobal.s++; if(siswa.kehadiran === 'i') totalKehadiranGlobal.i++;
                        });
                    }
                });
                
                let barisHtml = ""; let nomor = 1; let arrPrestasi = [];
                for (const [nama, nl] of Object.entries(rekapSiswaGlobal)) { 
                    arrPrestasi.push({ nama, poin: nl.poinTotal });
                    barisHtml += `<tr><td class="text-muted">${nomor++}</td><td class="text-start fw-bold text-dark text-xs">${nama}</td><td class="fw-bold ${nl.vocab==='A'?'text-success':(nl.vocab==='B'?'text-primary':'text-danger')}">${nl.vocab}</td><td class="fw-bold ${nl.speak==='A'?'text-success':(nl.speak==='B'?'text-primary':'text-danger')}">${nl.speak}</td><td class="fw-bold ${nl.grammar==='A'?'text-success':(nl.grammar==='B'?'text-primary':'text-danger')}">${nl.grammar}</td><td class="fw-bold ${nl.prac==='A'?'text-success':(nl.prac==='B'?'text-primary':'text-danger')}">${nl.prac}</td></tr>`; 
                }
                tabelNilai.innerHTML = barisHtml || `<tr><td colspan="6" class="text-muted">Data nilai masih kosong.</td></tr>`;
                labelHadir.innerHTML = `<div class="row g-2 text-center mt-2"><div class="col-6"><div class="p-2 border rounded bg-white shadow-sm"><h4 class="fw-bold text-success mb-0">${totalKehadiranGlobal.h}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">HADIR</span></div></div><div class="col-6"><div class="p-2 border rounded bg-white shadow-sm"><h4 class="fw-bold text-danger mb-0">${totalKehadiranGlobal.a}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">ALFA</span></div></div><div class="col-6"><div class="p-2 border rounded bg-white shadow-sm"><h4 class="fw-bold text-warning mb-0">${totalKehadiranGlobal.s}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">SAKIT</span></div></div><div class="col-6"><div class="p-2 border rounded bg-white shadow-sm"><h4 class="fw-bold text-info mb-0">${totalKehadiranGlobal.i}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">IZIN</span></div></div></div>`;
                arrPrestasi.sort((a,b) => b.poin - a.poin).slice(0, 10);
                trackPrestasi.innerHTML = arrPrestasi.map((item, idx) => `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-light text-sm"><div class="fw-bold text-dark"><span class="badge ${idx===0?"bg-warning text-dark":"bg-wa text-white"} rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`).join('') || '<div class="text-muted small text-center p-3 border rounded bg-light">Data prestasi kosong.</div>';
            } catch (e) { tabelNilai.innerHTML = `<tr><td colspan="6" class="text-danger">Gagal sinkronisasi data rekap.</td></tr>`; }
        }

        if(document.getElementById("btnKirimTugasWA")) { document.getElementById("btnKirimTugasWA").onclick = async () => { const i = document.getElementById("waInstruksi").value; if(!i) return window.showModernAlert("Peringatan", "Instruksi wajib."); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: document.getElementById("waTarget").value || "GLOBAL", linkGambar: document.getElementById("waGambar").value, instruksi: i, waktu: serverTimestamp() }); window.showModernAlert("Sukses", "Tugas WA dipublikasikan.", "success"); document.getElementById("waInstruksi").value = ""; document.getElementById("waGambar").value = ""; }; }
        function renderRiwayatTugasWAAdmin() { const box = document.getElementById("listTugasWAHistory"); if(!box) return; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); box.innerHTML = dt.map(d => `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill">${d.targetKelas}</span><span class="text-xs text-muted">${d.waktu?d.waktu.toDate().toLocaleDateString('id-ID'):''}</span></div>${d.linkGambar?`<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height:120px; object-fit:cover;">`:''}<div class="p-2 bg-light border rounded text-sm font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-outline-danger btn-sm mt-2 rounded-pill fw-bold" onclick="window.tarikTugasWAAdmin('${d.id}')">Tarik Tugas</button></div>`).join('') || '<div class="text-center text-muted small p-3 border rounded bg-light">Belum ada tugas WhatsApp.</div>'; }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderRiwayatTugasWAAdmin;
        window.tarikTugasWAAdmin = async function(id) { if(confirm("Hapus tugas ini dari lapangan?")) await deleteDoc(doc(db, "tugas_wa", id)); };

        if(document.getElementById("btnSaveMateri")) { document.getElementById("btnSaveMateri").onclick = async () => { const j = document.getElementById("materiJudul").value.trim(); const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value.trim(); if(!j || !l) return window.showModernAlert("Peringatan", "Lengkapi formulir."); await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() }); window.showModernAlert("Sukses", "Materi diunggah.", "success"); document.getElementById("materiJudul").value = ""; document.getElementById("materiLink").value = ""; }; }
        onSnapshot(collection(db, "materials"), (snap) => { const box = document.getElementById("listGudangMateri"); if(!box) return; box.innerHTML = snap.docs.map(d => { const data = d.data(); return `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm border-start border-info border-4"><div><div class="fw-bold text-dark text-sm mb-1">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div><a href="${data.link}" target="_blank" class="text-xs text-primary text-decoration-none"><i class="bi bi-link"></i> Buka Link</a></div><button class="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill shadow-sm" onclick="window.hapusMateriCloudAdmin('${d.id}')"><i class="bi bi-trash"></i></button></div>`; }).join('') || "<div class='text-muted small text-center p-3 border rounded bg-light'>Pustaka awan kosong.</div>"; });
        window.hapusMateriCloudAdmin = async function(id) { if(confirm("Hapus pustaka ini?")) await deleteDoc(doc(db, "materials", id)); };
        
        window.hapusPesanObrolan = async function(cid) { if(confirm("Hapus pesan ini?")) await deleteDoc(doc(db, "chats", cid)); };
    }

    // ==========================================
    // RUTE 3: LOGIKA PANEL DIREKTUR
    // ==========================================
    const isDirekturPage = document.getElementById("menuTabs") !== null && actRole === 'direktur';
    if (isDirekturPage) {
        onSnapshot(collection(db, "schools"), (snap) => {
            let arr = []; snap.forEach(d => { if(d.data().status !== 'archived') arr.push({ id: d.id, ...d.data() }); });
            const sel = document.getElementById("modernSchoolSelect"); const cards = document.getElementById("overviewCardsContainer");
            if(sel) sel.innerHTML = `<option value="">Pilih Sekolah Pengawasan...</option>` + arr.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('');
            if(sel) sel.onchange = (e) => window.langsungKeSekolah(e.target.value);
            if(cards) cards.innerHTML = arr.map(s => { let jSiswa=0; if(s.masterSiswa) s.masterSiswa.split('\n').forEach(l=>{if(l.includes(':')) jSiswa+=l.split(':')[1].split(',').filter(n=>n.trim()!=="").length;}); return `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 bg-white p-1" style="border-left: 4px solid var(--wa-primary) !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6><div class="d-flex justify-content-between mb-2"><span class="text-xs text-muted fw-bold">Hari Berjalan:</span><span class="badge bg-wa rounded-pill">${s.hariBerjalan||0}/${s.totalHari||0}</span></div><div class="d-flex justify-content-between"><span class="text-xs text-muted fw-bold">Kapasitas Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jSiswa} Peserta</span></div></div></div></div>`; }).join('') || `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif.</div></div>`;
        });

        window.langsungKeSekolah = function(sid) {
            killListeners(); currentSchoolId = sid; 
            if(!sid) { if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.add("d-none"); return; }
            if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none");
            
            unsubSchool = onSnapshot(doc(db, "schools", sid), (snap) => {
                if(!snap.exists()) return; const d = snap.data();
                const filledArr = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"]; const hBerjalan = parseInt(d.hariBerjalan) || 0; const tHari = parseInt(d.totalHari) || 5; const timelineText = `${(hBerjalan > 0 && hBerjalan <= 20) ? filledArr[hBerjalan - 1] : hBerjalan}/${tHari}`;
                if(document.getElementById('headSekolah')) document.getElementById('headSekolah').innerText = d.namaSekolah; if(document.getElementById("headTimeline")) document.getElementById("headTimeline").innerText = timelineText;
                if(document.getElementById('tutorBriefing')) document.getElementById('tutorBriefing').innerText = d.briefing || "-"; if(document.getElementById('dirBriefing')) document.getElementById('dirBriefing').value = d.briefing || "";
                if(document.getElementById('tutorJadwal')) document.getElementById('tutorJadwal').innerText = d.jadwal || "-"; if(document.getElementById('dirJadwal')) document.getElementById('dirJadwal').value = d.jadwal || "";
                if(document.getElementById('tutorGoal')) document.getElementById('tutorGoal').innerText = d.goal || "-"; if(document.getElementById('dirGoal')) document.getElementById('dirGoal').value = d.goal || "";
                if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = getActiveSchedule(d.jadwal);
                rawKurikulum = d.kurikulum || {}; const cls = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                ['filterKelasSiswa', 'trackerKelas', 'filterKelasHistori', 'filterWA'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = `<option value="SEMUA">Semua Kelas</option>` + cls.map(k => `<option value="${k}">${k}</option>`).join(''); });
            });

            unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { 
                dataLengkap = []; snap.forEach(d => dataLengkap.push({id: d.id, ...d.data()})); dataLengkap.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); 
                extractDaysLogbookDir(); renderLogbooksListDir(); renderTrackerDir(); calculateLeaderboardStudentsDir(); renderOverviewLogbookDirektur();
            });
            unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let arr = []; snap.forEach(d => arr.push(d.data())); arr.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0)); const box = document.getElementById("chatBox"); if(box) box.innerHTML = arr.map(c => `<div class="msg-bubble ${c.sender===myName?'msg-me':'msg-other'} mb-2"><div class="fw-bold text-xs text-wa">${c.role==='direktur'?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${c.waktu?c.waktu.toDate().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'..'}</div></div>`).join(''); if(box) box.scrollTop = box.scrollHeight; });
            unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(d => masterTugasWA.push(d.data())); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); renderTugasWAPantauanDir(); });
        }

        if(document.getElementById("btnSaveDirBriefing")) { document.getElementById("btnSaveDirBriefing").onclick = async () => { if(!currentSchoolId) return window.showModernAlert("Peringatan", "Pilih sekolah di bilah atas terlebih dahulu."); await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value, jadwal: document.getElementById("dirJadwal").value, goal: document.getElementById("dirGoal").value }); window.showModernAlert("Berhasil", "Arahan Instruksi pembaruan berhasil dikirim ke perangkat Mentor.", "success"); }; }
        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "direktur" }); document.getElementById("inputChat").value = ""; }; }

        // DIREKTUR: OUTPUT LOGBOOK DI OVERVIEW
        function renderOverviewLogbookDirektur() { 
            const box = document.getElementById("dirOverviewLogbook"); if(!box) return; 
            let dtTerkini = dataLengkap.slice(0, 10);
            if(dtTerkini.length === 0) { box.innerHTML = `<div class="text-muted small border rounded p-3 bg-light text-center">Belum ada riwayat aktivitas dari mentor.</div>`; return; }
            box.innerHTML = dtTerkini.map(d => {
                const tgl = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '';
                const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '';
                return `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs border-start border-wa border-4"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><span class="fw-bold text-dark text-xs">${d.nama.toUpperCase()}</span><span class="badge bg-secondary rounded-pill text-xs">${d.kelas} (${tgl} ${w})</span></div><div class="text-xs text-dark mt-1">📖 Materi: ${d.materi?.join(', ')}</div><div class="text-xs text-muted mt-1">📝 ${d.laporanSiswa || 'Tidak ada catatan'}</div></div>`; 
            }).join(''); 
        }

        function extractDaysLogbookDir() { const map = new Map(); dataLengkap.forEach(d => { if(d.waktu) map.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sorted = Array.from(map.entries()).sort((a,b) => a[1] - b[1]); const el = document.getElementById("filterHari"); if(el) el.innerHTML = '<option value="SEMUA">Semua Waktu</option>' + sorted.map((entry, idx) => `<option value="${entry[0]}">Hari ke-${idx+1}</option>`).join(''); }
        function renderLogbooksListDir() { const box = document.getElementById("logbookList"); if(!box) return; const fH = document.getElementById("filterHari").value; const fK = document.getElementById("filterKelasHistori").value; let dt = dataLengkap; if (fH !== "SEMUA") dt = dt.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fH); if (fK !== "SEMUA") dt = dt.filter(d => d.kelas === fK); box.innerHTML = dt.map(d => `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs border-start border-wa border-4"><div class="fw-bold text-dark border-bottom pb-1 mb-1">${d.nama.toUpperCase()} <span class="badge bg-secondary rounded-pill float-end">${d.kelas}</span></div><div class="text-dark">📖 Materi: ${d.materi?.join(', ')}</div><div class="text-muted">📝 Note: ${d.laporanSiswa || '-'}</div></div>`).join('') || '<div class="text-center text-muted small p-3 border rounded bg-light">Logbook kosong.</div>'; }
        if(document.getElementById('filterHari')) document.getElementById('filterHari').onchange = renderLogbooksListDir; if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').onchange = renderLogbooksListDir;

        function renderTrackerDir() { const area = document.getElementById("areaTracker"); const cls = document.getElementById("trackerKelas").value; if(!area || !rawKurikulum.vocab) return; let done = new Set(); dataLengkap.forEach(l => { if (l.kelas === cls && l.materi) l.materi.forEach(m => done.add(m)); }); const block = (title, arr, color) => `<div class="mb-2"><h6 class="text-xs fw-bold text-${color} mb-1 border-bottom pb-1">${title}</h6>${(arr||[]).map(m => `<div class="p-1 mb-1 rounded text-xs d-flex justify-content-between ${done.has(m)?`bg-${color} bg-opacity-10 border-${color}`:'border'}"><span>${m}</span>${done.has(m)?`<i class="bi bi-check-circle-fill text-${color}"></i>`:`<i class="bi bi-circle opacity-50"></i>`}</div>`).join('')}</div>`; area.innerHTML = block("KOSAKATA", rawKurikulum.vocab, "primary") + block("BERBICARA", rawKurikulum.speaking, "success") + block("TATA BAHASA", rawKurikulum.grammar, "danger") + block("PRAKTIK KELAS", rawKurikulum.practice, "warning"); }
        if(document.getElementById('trackerKelas')) document.getElementById('trackerKelas').onchange = renderTrackerDir;

        function calculateLeaderboardStudentsDir() { const cls = document.getElementById("filterKelasSiswa").value; let r = {}; dataLengkap.forEach(l => { if(l.kelas === cls && l.dataSiswa) { l.dataSiswa.forEach(s => { if(!r[s.nama]) r[s.nama] = 0; let n = (s.nilai || "").toString().toLowerCase(); if(['a','a+'].includes(n)) r[s.nama] += 90; else if(parseInt(n) > 0) r[s.nama] += parseInt(n); }); } }); const box = document.getElementById("listTop10"); if(!box) return; let arr = Object.entries(r).map(([nama, poin]) => ({ nama, poin })).sort((a,b) => b.poin - a.poin).slice(0, 10); box.innerHTML = arr.map((item, idx) => `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-white text-sm shadow-sm"><div class="fw-bold text-dark"><span class="badge ${idx===0?"bg-warning text-dark":"bg-wa text-white"} rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`).join('') || '<div class="text-muted small text-center p-3 border rounded bg-light">Belum ada data nilai.</div>'; }
        if(document.getElementById('filterKelasSiswa')) document.getElementById('filterKelasSiswa').onchange = calculateLeaderboardStudentsDir;

        function renderTugasWAPantauanDir() { const box = document.getElementById("listTugasWAHistory"); if(!box) return; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); box.innerHTML = dt.map(d => `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill">${d.targetKelas}</span><span class="text-xs text-muted fw-bold">${d.waktu?d.waktu.toDate().toLocaleDateString('id-ID'):''}</span></div>${d.linkGambar?`<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height:100px; object-fit:cover;">`:''}<div class="p-2 bg-light border rounded text-sm font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div></div>`).join('') || '<div class="text-muted small text-center p-3 border rounded bg-light">Kosong.</div>'; }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderTugasWAPantauanDir;
    }

    // ==========================================
    // RUTE 4: LOGIKA PANEL MENTOR (EKSEKUTOR)
    // ==========================================
    const isMentorPage = document.getElementById("menuTabs") !== null && actRole === 'mentor';
    if (isMentorPage) {
        
        // Pemasangan Event Listener Statis
        const selKelas = document.getElementById('inputKelas');
        if(selKelas) selKelas.addEventListener('change', renderFormAbsenMentor);
        
        const btnSubmit = document.getElementById("btnSubmitLogbook");
        if(btnSubmit) btnSubmit.addEventListener('click', eksekusiKirimLogbookMentor);

        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "mentor" }); document.getElementById("inputChat").value = ""; }; }
        if(document.getElementById("btnKirimLapor")) { document.getElementById("btnKirimLapor").onclick = () => { const detail = document.getElementById("laporDetail").value.trim(); if(!detail) return window.showModernAlert("Peringatan", "Mohon lengkapi detail kendala Anda secara spesifik."); window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(`🚨 *KENDALA MENTOR* 🚨\n\n*Nama:* ${myName}\n*Detail:* ${detail}`)}`, '_blank'); document.getElementById("laporDetail").value = ""; }; }

        onSnapshot(collection(db, "schools"), (snap) => {
            let listSekolah = []; snap.forEach(doc => { if(doc.data().status !== 'archived') listSekolah.push({ id: doc.id, ...doc.data() }); });
            const tugasSekolahku = listSekolah.find(s => s.assignedMentors && s.assignedMentors.includes(actUser));
            const pesanKosong = document.getElementById("pesanKosong"); const utamaKonten = document.getElementById("utamaMentorContent"); const infoBar = document.getElementById("schoolInfoBar");
            if(tugasSekolahku) { currentSchoolId = tugasSekolahku.id; if(pesanKosong) pesanKosong.classList.add("d-none"); if(utamaKonten) utamaKonten.classList.remove("d-none"); muatDataSekolahMentor(tugasSekolahku.id); } 
            else { if(pesanKosong) pesanKosong.classList.remove("d-none"); if(utamaKonten) utamaKonten.classList.add("d-none"); if(infoBar) infoBar.classList.add("d-none"); }
        });

        function muatDataSekolahMentor(sid) {
            unsubSchool = onSnapshot(doc(db, "schools", sid), (docSnap) => {
                if(!docSnap.exists()) return; const d = docSnap.data();
                const filledArr = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"]; const hBerjalan = parseInt(d.hariBerjalan) || 0; const tHari = parseInt(d.totalHari) || 5; const timelineText = `${(hBerjalan > 0 && hBerjalan <= 20) ? filledArr[hBerjalan - 1] : hBerjalan}/${tHari}`;
                let jadwalLive = "Tidak ada jadwal kelas."; if (d.jadwal && d.jadwal !== "-") { const lines = d.jadwal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes(); for (let line of lines) { const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/); if (match) { const s = parseInt(match[1]) * 60 + parseInt(match[2]); const e = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= s && cur <= e) { jadwalLive = line; break; } } } }
                
                if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none"); if(document.getElementById("headSekolah")) document.getElementById("headSekolah").innerText = d.namaSekolah; if(document.getElementById("headTimeline")) document.getElementById("headTimeline").innerText = timelineText; if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = jadwalLive;
                if(document.getElementById("tutorBriefing")) document.getElementById("tutorBriefing").innerText = d.briefing || "-"; if(document.getElementById("tutorJadwal")) document.getElementById("tutorJadwal").innerText = d.jadwal || "-"; if(document.getElementById("tutorGoal")) document.getElementById("tutorGoal").innerText = d.goal || "-";
                
                // MENTOR: TARIK KURIKULUM (INPUT LOGBOOK DARI ADMIN)
                rawKurikulum = d.kurikulum || {}; rawMasterSiswa = d.masterSiswa || "";
                
                const cls = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                if(document.getElementById("inputKelas")) { const cur = document.getElementById("inputKelas").value; document.getElementById("inputKelas").innerHTML = '<option value="">Pilih...</option>' + cls.map(k => `<option value="${k}" ${k===cur?'selected':''}>${k}</option>`).join(''); }
                if(document.getElementById("mentorFilterKelasHistori")) document.getElementById("mentorFilterKelasHistori").innerHTML = `<option value="SEMUA">Semua Kelas Tergabung</option>` + cls.map(k => `<option value="${k}">${k}</option>`).join('');
                if(document.getElementById("filterWA")) document.getElementById("filterWA").innerHTML = `<option value="SEMUA">Semua Kelas Tergabung</option>` + cls.map(k => `<option value="${k}">${k}</option>`).join('');
                
                renderDinamicMateriMentor(jadwalLive); renderFormAbsenMentor();
            });

            // MENTOR: TARIK RIWAYAT LOGBOOK BERDASARKAN ID SEKOLAH TUGAS
            if(unsubLogbooks) unsubLogbooks();
            unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => {
                dataLengkapMentor = []; snap.forEach(doc => dataLengkapMentor.push({id: doc.id, ...doc.data()}));
                dataLengkapMentor.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0));
                renderRiwayatLogbookMentor();
            });

            unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let arr = []; snap.forEach(doc => arr.push(doc.data())); arr.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0)); const box = document.getElementById("chatBox"); if(box) box.innerHTML = arr.map(c => `<div class="msg-bubble ${c.sender===myName?'msg-me':'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${c.role==='direktur'?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${c.waktu?c.waktu.toDate().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'..'}</div></div>`).join(''); if(box) box.scrollTop = box.scrollHeight; });
            unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push(doc.data())); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); renderTugasWAEksekusiMentor(); });
        }

        // MENTOR: RENDER OUTPUT LOGBOOK (DI INFO/BERANDA DAN TAB RIWAYAT)
        function renderRiwayatLogbookMentor() {
            const list = document.getElementById("mentorLogbookList"); const fil = document.getElementById("mentorFilterKelasHistori") ? document.getElementById("mentorFilterKelasHistori").value : "SEMUA";
            if(list) {
                let res = dataLengkapMentor; if(fil !== "SEMUA") res = res.filter(d => d.kelas === fil);
                list.innerHTML = res.map(d => {
                    const tgl = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '';
                    const jam = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '';
                    return `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs border-start border-wa border-4"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><b class="text-dark">${d.nama.toUpperCase()}</b><span class="badge bg-secondary rounded-pill">${d.kelas} (${tgl} ${jam})</span></div><div class="mb-1 text-dark">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div class="mb-1 text-muted">📝 <b>Catatan Kelas:</b> ${d.laporanSiswa || '-'}</div></div>`;
                }).join('') || `<div class="text-center text-muted small p-3 border rounded bg-light">Belum ada riwayat pengajaran di kelas ini.</div>`;
            }
            
            const beranda = document.getElementById("berandaLogbook");
            if(beranda) {
                beranda.innerHTML = dataLengkapMentor.slice(0, 5).map(d => {
                    const tgl = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : ''; 
                    return `<div class="border-bottom pb-2 mb-2"><div class="d-flex justify-content-between"><span class="fw-bold text-dark text-xs">${d.nama.toUpperCase()}</span><span class="badge bg-secondary rounded-pill text-xs">${d.kelas} (${tgl})</span></div><div class="text-xs text-dark mt-1">📖 Materi: ${d.materi?.join(', ')}</div><div class="text-xs text-muted mt-1">📝 ${d.laporanSiswa || '-'}</div></div>`;
                }).join('') || '<div class="text-muted small border rounded p-3 bg-light text-center">Belum ada riwayat aktivitas pengajaran.</div>';
            }
        }
        if(document.getElementById("mentorFilterKelasHistori")) document.getElementById("mentorFilterKelasHistori").onchange = renderRiwayatLogbookMentor;

        function renderTugasWAEksekusiMentor() {
            const list = document.getElementById("listTugasWAHarian"); if(!list) return; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil);
            list.innerHTML = dt.map(d => `<div class="card card-custom p-3 mb-3 bg-white shadow-sm border"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3 py-1 shadow-sm">${d.targetKelas}</span><span class="text-xs text-muted fw-bold">${d.waktu?d.waktu.toDate().toLocaleDateString('id-ID'):''}</span></div>${d.linkGambar?`<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height:200px; object-fit:cover;">`:''}<div class="p-2 bg-light border rounded text-sm mb-3 font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-wa btn-sm w-100 fw-bold rounded-pill shadow-sm" onclick="window.broadcastTugasWA('${encodeURIComponent(d.instruksi)}')"><i class="bi bi-whatsapp me-2"></i> Broadcast Pesan</button></div>`).join('') || '<div class="text-muted text-center small p-4 border rounded bg-light">Belum ada tugas distribusi WA.</div>';
        }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderTugasWAEksekusiMentor;
        window.broadcastTugasWA = function(txt) { window.open(`https://wa.me/?text=${txt}`, '_blank'); };

        function renderDinamicMateriMentor(live) {
            const str = live.toLowerCase(); const builder = (arr, parent) => { const el = document.getElementById(parent); if(!el || !arr) return; el.innerHTML = arr.map(m => `<div class="col-12"><div class="form-check p-2 border rounded bg-white shadow-sm mb-1 d-flex align-items-center"><input class="form-check-input ms-1 cek-materi" type="checkbox" value="${m.replace(/"/g, '&quot;')}"><label class="form-check-label text-dark text-xs ms-2 fw-bold w-100">${m}</label></div></div>`).join(''); };
            ['wadahVocab','wadahSpeaking','wadahGrammar','wadahPractice'].forEach(id => { const x = document.getElementById(id); if(x) x.classList.add('d-none'); });
            let hit = false;
            if(str.includes("vocab")) { document.getElementById("wadahVocab").classList.remove('d-none'); builder(rawKurikulum.vocab, "checkVocab"); hit = true; }
            if(str.includes("speak")) { document.getElementById("wadahSpeaking").classList.remove('d-none'); builder(rawKurikulum.speaking, "checkSpeaking"); hit = true; }
            if(str.includes("gram")) { document.getElementById("wadahGrammar").classList.remove('d-none'); builder(rawKurikulum.grammar, "checkGrammar"); hit = true; }
            if(str.includes("prac")) { document.getElementById("wadahPractice").classList.remove('d-none'); builder(rawKurikulum.practice, "checkPractice"); hit = true; }
            if(!hit) { ['wadahVocab','wadahSpeaking','wadahGrammar','wadahPractice'].forEach(id => { const x = document.getElementById(id); if(x) x.classList.remove('d-none'); }); builder(rawKurikulum.vocab, "checkVocab"); builder(rawKurikulum.speaking, "checkSpeaking"); builder(rawKurikulum.grammar, "checkGrammar"); builder(rawKurikulum.practice, "checkPractice"); }
        }

        function renderFormAbsenMentor() {
            const kls = document.getElementById('inputKelas').value; const list = document.getElementById('listAbsenSiswa'); if(!list) return; list.innerHTML = ""; let arr = [];
            if(!kls) { list.innerHTML = `<div class="text-muted small text-center p-3 border rounded bg-light">Pilih kelas terlebih dahulu.</div>`; return; }
            rawMasterSiswa.split('\n').forEach(line => { if(line.startsWith(kls + ":")) arr = line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== ""); });
            if(arr.length === 0) { list.innerHTML = `<div class="text-center text-muted small p-3 border rounded bg-light">Data peserta belum diunggah Admin.</div>`; return; }
            list.innerHTML = arr.map(nama => `<div class="d-flex align-items-center justify-content-between p-2 border rounded bg-light siswa-row mb-2 shadow-sm"><div class="fw-bold text-dark text-xs text-truncate w-50 nama-siswa">${nama}</div><div class="d-flex gap-2 justify-content-end w-50"><select class="form-select form-select-sm absen-siswa p-1 text-center fw-bold border-success text-success shadow-sm" style="width:55px; font-size:0.75rem;"><option value="h">✔</option><option value="a">✖</option><option value="s">S</option><option value="i">I</option></select><input type="text" class="form-control form-control-sm nilai-siswa p-1 text-center text-xs border-primary fw-bold shadow-sm" style="width:50px;" placeholder="Nilai"></div></div>`).join('');
        }

        // MENTOR: INPUT LOGBOOK
        async function eksekusiKirimLogbookMentor() {
            const btn = document.getElementById("btnSubmitLogbook"); const kelas = document.getElementById("inputKelas").value; const jam = document.getElementById("inputJam").value; const catatan = document.getElementById("inputCatatan").value; const tugas = document.getElementById("inputTugasSiswa").value;
            if(!kelas) return window.showModernAlert("Peringatan", "Pilih kelas mengajar.");
            let mats = []; document.querySelectorAll('.cek-materi:checked').forEach(el => mats.push(el.value)); if(mats.length === 0) return window.showModernAlert("Peringatan", "Centang minimal satu materi yang diajarkan.");
            let dataS = []; document.querySelectorAll('.siswa-row').forEach(row => { dataS.push({ nama: row.querySelector('.nama-siswa').innerText, kehadiran: row.querySelector('.absen-siswa').value, nilai: row.querySelector('.nilai-siswa').value.trim() }); });
            btn.innerHTML = 'Mengirim...'; btn.disabled = true;
            try { await addDoc(collection(db, "logbooks"), { schoolId: currentSchoolId, mentorId: actUser, nama: myName, kelas, jamKe: jam, materi: mats, laporanSiswa: catatan, dataSiswa: dataS, tugasSiswa: tugas, waktu: serverTimestamp() }); window.showModernAlert("Sukses", "Logbook terekam aman ke sistem.", "success"); document.getElementById("inputCatatan").value = ""; document.getElementById("inputTugasSiswa").value = ""; document.querySelectorAll('.cek-materi').forEach(el => el.checked = false); document.getElementById("inputKelas").value = ""; renderFormAbsenMentor(); } catch(e) { window.showModernAlert("Gagal", e.message); }
            btn.innerHTML = '<i class="bi bi-send-fill me-2"></i> KIRIM DATA LAPORAN (LOGBOOK)'; btn.disabled = false;
        }
    }

    // ==========================================
    // PUSTAKA MATERI CLOUD BERSAMA (DIREKTUR & MENTOR)
    // ==========================================
    if (actRole !== 'admin') {
        onSnapshot(collection(db, "materials"), (snap) => {
            const box = document.getElementById("listGudangMateri"); if(!box) return;
            box.innerHTML = snap.docs.map(d => { const data = d.data(); return `<div class="d-flex justify-content-between align-items-center p-3 border rounded mb-2 bg-white shadow-sm border-start border-info border-4"><div><div class="fw-bold text-dark text-sm mb-1">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div></div><a href="${data.link}" target="_blank" class="btn btn-sm btn-primary py-1 px-4 rounded-pill fw-bold shadow-sm">Akses Modul</a></div>`; }).join('') || "<div class='text-muted small text-center p-3 border rounded bg-light'>Belum ada materi pembelajaran dari pusat.</div>";
        });
    }
}
});
