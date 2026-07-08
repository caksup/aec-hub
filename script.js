/* ==================================================
   script.js - Skrip Pangkalan Data Global Terpadu
   AEC Hub - Versi 1.5.4 Ultimate
   
   Riwayat Versi (JS):
   - v1.0: Inisialisasi Firebase dan logika masuk (login) dasar.
   - v1.1: Penambahan pengaturan pengalihan rute (redirect) berdasarkan peran.
   - v1.2: Pengelolaan dan penyimpanan data sesi di LocalStorage.
   - v1.3: Penghapusan alert bawaan dan diganti dengan fungsi Pop-up Modern.
   - v1.4: Deteksi otomatis mode gelap.
   - v1.5.3: Evaluasi keamanan masuk, perlindungan akun nonaktif.
   - v1.5.4: (CURRENT) PENGGABUNGAN TOTAL (MERGER). Penyatuan logika dari su.js, dt.js, dan mt.js ke dalam satu kontrol skrip global dengan perlindungan pembatasan peran (Role-Based Access Control) yang sangat ketat untuk mencegah konflik DOM.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Pangkalan Data Firebase
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

// Mengaktifkan Penyimpanan Luring (PWA Offline Persistence)
enableIndexedDbPersistence(db).catch((err) => { 
    console.warn("Peringatan PWA Luring:", err.code); 
});

// ==========================================
// FUNGSI GLOBAL: POP-UP MODERN PENGGANTI ALERT
// ==========================================
window.showModernAlert = function(title, message, type = 'error') {
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMessage');
    const iconEl = document.getElementById('alertIcon');
    const modalEl = document.getElementById('modernAlertModal');
    
    if(!titleEl || !msgEl || !iconEl || !modalEl) {
        alert(message); return; // Jatuh kembali (fallback) jika HTML belum termuat
    }
    
    titleEl.innerText = title;
    msgEl.innerText = message;
    
    if (type === 'error') { iconEl.className = 'bi bi-x-circle-fill text-danger mb-3 d-block'; } 
    else if (type === 'success') { iconEl.className = 'bi bi-check-circle-fill text-success mb-3 d-block'; } 
    else { iconEl.className = 'bi bi-info-circle-fill text-primary mb-3 d-block'; }
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Deteksi Tema Gelap (Dark Mode) Global
const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

// Variabel Sesi Pengguna
const actUser = localStorage.getItem("loggedInUser"); 
const actRole = localStorage.getItem("loggedInRole"); 
const myName = localStorage.getItem("loggedInName");

// ==========================================
// BLOK 1: LOGIKA HALAMAN MASUK (LOGIN)
// ==========================================
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btnLogin");
        const u = document.getElementById("username").value.toLowerCase().trim();
        const p = document.getElementById("pin").value.trim();
        
        if (!u || !p) return window.showModernAlert("Akses Ditolak", "ID Pengguna dan PIN keamanan wajib diisi secara lengkap.");
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...'; btn.disabled = true;

        try {
            const snap = await getDoc(doc(db, "users", u));
            if (snap.exists() && snap.data().pin === p) {
                const data = snap.data();
                if (data.status === "nonaktif") {
                    window.showModernAlert("Akses Terkunci", "Akun Anda sedang dinonaktifkan oleh Administrator. Silakan hubungi pusat.");
                    btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; return;
                }
                localStorage.setItem("loggedInUser", u);
                localStorage.setItem("loggedInRole", data.role);
                localStorage.setItem("loggedInName", data.julukan || u);
                
                if (data.role === "admin") window.location.replace("superuser.html");
                else if (data.role === "direktur") window.location.replace("direktur.html");
                else window.location.replace("mentor.html");
            } else {
                window.showModernAlert("Akses Ditolak", "Kombinasi ID Pengguna atau PIN tidak valid.");
                btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false;
            }
        } catch (err) {
            window.showModernAlert("Kesalahan Jaringan", "Gagal terhubung ke pangkalan data. Harap periksa koneksi internet Anda.");
            btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false;
        }
    });
}

// ==========================================
// BLOK 2: LOGIKA GLOBAL DASBOR (ADMIN/DIREKTUR/MENTOR)
// ==========================================
if (actUser && document.getElementById("userNameDisplay")) {
    document.getElementById("userNameDisplay").innerText = myName || "Pengguna";
    document.getElementById("userIdDisplay").innerText = actUser;
    
    // Status Jaringan
    function updateNetworkStatus() {
        const icon = document.getElementById("networkStatusIcon"); if(!icon) return;
        if (navigator.onLine) { icon.className = "bi bi-wifi ms-1 net-status-icon net-online"; icon.title = "Daring"; } 
        else { icon.className = "bi bi-wifi-off ms-1 net-status-icon net-offline"; icon.title = "Luring"; }
    }
    window.addEventListener('online', updateNetworkStatus); window.addEventListener('offline', updateNetworkStatus); updateNetworkStatus();

    // Siklus Tema
    const themes = ['light', 'dark', 'system']; const themeIcons = ['bi-sun-fill text-warning', 'bi-moon-stars-fill text-light', 'bi-display text-info'];
    let currentThemeIndex = themes.indexOf(localStorage.getItem('aecTheme') || 'system'); if (currentThemeIndex === -1) currentThemeIndex = 2;
    function applyThemeVisuals(index) {
        const t = themes[index]; localStorage.setItem('aecTheme', t);
        if (t === 'system') { document.documentElement.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        } else { document.documentElement.setAttribute('data-theme', t); }
        const iconEl = document.getElementById("themeIconDisplay");
        if(iconEl) { iconEl.className = `bi ${themeIcons[index]} fs-4 text-white`; void iconEl.offsetWidth; iconEl.classList.add("theme-icon-animate"); }
    }
    applyThemeVisuals(currentThemeIndex);
    if(document.getElementById("btnCycleTheme")) document.getElementById("btnCycleTheme").onclick = () => { currentThemeIndex = (currentThemeIndex + 1) % 3; applyThemeVisuals(currentThemeIndex); };

    // Waktu Nyata
    function updateClock() {
        const el = document.getElementById('headClockDate'); if(!el) return; const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
        el.innerText = `${dateStr}\n${timeStr} WIB`;
    }
    setInterval(updateClock, 1000); updateClock();

    // Fungsi Logout Global
    if(document.getElementById("btnLogoutOffcanvas")) { 
        document.getElementById("btnLogoutOffcanvas").onclick = (e) => { 
            e.preventDefault(); 
            if(confirm("Keluar dari sistem keamanan AEC Hub?")) { localStorage.clear(); window.location.replace("index.html"); } 
        }; 
    }

    // Variabel Penampung Data Global Pangkalan Data
    let currentSchoolId = ""; let rawKurikulum = {}; let rawMasterSiswa = ""; let dataLengkap = []; let masterTugasWA = [];
    let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
    let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

    function bersihkanListener() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; masterTugasWA = []; }

    // ==========================================
    // BLOK KHUSUS: ADMINISTRATOR (SUPERUSER)
    // ==========================================
    if (actRole === 'admin' && document.getElementById("adminTabs")) {
        
        onSnapshot(collection(db, "schools"), (snap) => { 
            globalAllSchools = []; let archivedSchools = [];
            snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); else archivedSchools.push({ id: d.id, ...d.data() }); }); 
            renderModernSchoolSelect(); renderOverviewCards(); kalkulasiSiswaGlobal();
            
            const listArsip = document.getElementById("listArsipSekolah");
            if(listArsip) {
                listArsip.innerHTML = "";
                if(archivedSchools.length === 0) listArsip.innerHTML = "<div class='text-muted small text-center p-3'>Belum ada riwayat arsip sekolah.</div>";
                archivedSchools.forEach(s => { listArsip.innerHTML += `<div class="list-group-item d-flex justify-content-between align-items-center bg-white border mb-1 rounded"><div class="fw-bold text-dark text-sm">${s.namaSekolah}</div><button class="btn btn-sm btn-outline-primary py-0 px-3 rounded-pill fw-bold" onclick="window.lihatLogbookArsip('${s.id}')">Lihat Riwayat</button></div>`; });
            }
        });

        window.lihatLogbookArsip = async function(schoolId) {
            const area = document.getElementById("areaLogbookArsip"); const konten = document.getElementById("kontenLogbookArsip");
            if(!area || !konten) return; document.getElementById("judulArsipLogbook").innerText = "Logbook: " + schoolId; area.classList.remove("d-none"); konten.innerHTML = '<div class="text-center small text-muted">Memuat...</div>';
            try {
                const logsSnap = await getDocs(query(collection(db, "logbooks"), where("schoolId", "==", schoolId))); let arrLogs = [];
                logsSnap.forEach(d => arrLogs.push({id: d.id, ...d.data()})); arrLogs.sort((a,b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
                if(arrLogs.length === 0) { konten.innerHTML = '<div class="text-center text-muted mt-2">Tidak ada pencatatan logbook.</div>'; return; }
                let htmlLogs = ''; arrLogs.forEach(d => { htmlLogs += `<div class="p-2 border rounded mb-2 bg-white shadow-sm"><div class="fw-bold text-wa border-bottom pb-1 mb-1">${d.nama.toUpperCase()} <span class="badge bg-secondary rounded-pill float-end">${d.kelas}</span></div><div class="text-dark mt-1 text-xs">📖 Materi: ${d.materi?.join(', ')}</div></div>`; }); konten.innerHTML = htmlLogs;
            } catch (error) { konten.innerHTML = '<div class="text-danger text-center">Gagal memuat arsip.</div>'; }
        };

        function renderOverviewCards() {
            const container = document.getElementById("overviewCardsContainer"); const pesertaContainer = document.getElementById("trackerPesertaList");
            if (!container) return; container.innerHTML = ""; let totalPesertaGlobal = 0;
            if (globalAllSchools.length === 0) { container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif.</div></div>`; if(pesertaContainer) pesertaContainer.innerHTML = "0 Peserta"; return; }
            globalAllSchools.forEach(s => {
                let jmlSiswa = 0; if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').filter(n => n.trim() !== "").length; } }); }
                totalPesertaGlobal += jmlSiswa; const jmlTutor = (s.assignedMentors || []).length;
                container.innerHTML += `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-1" style="cursor: pointer; border-left: 4px solid var(--wa-primary) !important;" onclick="window.langsungKeSekolah('${s.id}')"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Tanggal Mulai:</span><span class="text-xs fw-bold text-dark">${s.waktuUpdate ? s.waktuUpdate.toDate().toLocaleDateString('id-ID') : '-'}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Hari Berjalan:</span><span class="badge bg-wa text-white rounded-pill">Hari ke-${s.hariBerjalan||0}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Jumlah Mentor:</span><span class="badge bg-light text-dark border rounded-pill">${jmlTutor} Orang</span></div><div class="d-flex justify-content-between align-items-center"><span class="text-secondary text-xs fw-bold">Jumlah Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jmlSiswa} Peserta</span></div></div></div></div>`;
            });
            if(pesertaContainer) pesertaContainer.innerHTML = `<h5 class="fw-bold text-wa mb-1">${totalPesertaGlobal}</h5><span class="text-xs text-muted fw-bold">TOTAL PESERTA GLOBAL</span>`;
        }

        function renderModernSchoolSelect() {
            const container = document.getElementById("modernSchoolSelect"); if (!container) return;
            let htmlContent = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value=""><i class="bi bi-globe"></i><span class="tab-label">GLOBAL</span></button><button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa active-pill' : 'btn-outline-success'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW"><i class="bi bi-plus-circle"></i><span class="tab-label">BARU</span></button>`;
            globalAllSchools.forEach(s => { const isAct = (currentSchoolId === s.id); htmlContent += `<button class="btn btn-sm ${isAct ? 'btn-wa active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}"><i class="bi bi-building"></i><span class="tab-label">${s.namaSekolah}</span></button>`; });
            container.innerHTML = htmlContent;
            container.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.currentTarget.getAttribute('data-value')); }; });
        }

        window.langsungKeSekolah = function(val) {
            bersihkanListener(); currentSchoolId = val; renderModernSchoolSelect();
            if(!val) {
                if(document.getElementById("adminLogbookList")) document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Pilih sekolah aktif untuk melihat laporan terperinci.</div>`;
                if(document.getElementById("leaderboardTutor")) document.getElementById("leaderboardTutor").innerHTML = `<div class="text-muted small text-center">Silakan pilih sekolah untuk memuat peringkat kinerja.</div>`;
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-sekolah"]')).show(); kalkulasiSiswaGlobal();
            } else if(val === "NEW") {
                if(document.getElementById("inputIdSchool")) {
                    document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = "";
                    document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
                }
                currentAssignedMentors = []; renderMentorChecklist(); 
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#setup-spesifik"]')).show();
            } else {
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show();
                muatDataSekolah(val);
            }
        }

        function muatDataSekolah(sid) {
            unsubSchool = onSnapshot(doc(db, "schools", sid), (docSnap) => {
                if(!docSnap.exists()) return; const data = docSnap.data();
                if(document.getElementById('inputIdSchool')) {
                    document.getElementById('inputIdSchool').value = sid; document.getElementById('inputIdSchool').readOnly = true;
                    document.getElementById('inputSekolah').value = data.namaSekolah || ""; document.getElementById('inputTotalHari').value = data.totalHari || 5; document.getElementById('inputHariKe').value = data.hariBerjalan || 0; document.getElementById('inputMasterKelas').value = data.masterKelas || ""; document.getElementById('inputBriefing').value = data.briefing || ""; document.getElementById('inputJadwal').value = data.jadwal || ""; document.getElementById('inputGoal').value = data.goal || ""; document.getElementById('inputMasterSiswa').value = data.masterSiswa || "";
                    rawKurikulum = data.kurikulum || {}; 
                    document.getElementById('inputVocab').value = rawKurikulum.vocab ? rawKurikulum.vocab.join('\n') : ""; document.getElementById('inputSpeaking').value = rawKurikulum.speaking ? rawKurikulum.speaking.join('\n') : ""; document.getElementById('inputGrammar').value = rawKurikulum.grammar ? rawKurikulum.grammar.join('\n') : ""; document.getElementById('inputPractice').value = rawKurikulum.practice ? rawKurikulum.practice.join('\n') : "";
                }
                currentAssignedMentors = data.assignedMentors || []; renderMentorChecklist();
                const arrKelas = (data.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                const sels = ['filterKelasHistori', 'waTarget', 'filterWA'];
                sels.forEach(id => { const el = document.getElementById(id); if(!el) return; el.innerHTML = ""; if(id === 'waTarget') el.innerHTML += `<option value="GLOBAL (Semua Ruang)">GLOBAL</option>`; else el.innerHTML += `<option value="SEMUA">Semua Kelas</option>`; arrKelas.forEach(k => el.innerHTML += `<option value="${k}">${k}</option>`); });
            });

            unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { dataLengkap = []; snap.forEach(doc => dataLengkap.push({ id: doc.id, ...doc.data() })); dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); ekstrakHariLogbook(); renderListLogbookAdmin(); kalkulasiKinerjaTutor(); });
            unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() })); chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0)); const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = ""; chats.forEach(c => { if (c.type === 'global') { const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time} <i class="bi bi-trash ms-2 text-danger" style="cursor:pointer;" onclick="window.hapusPesanObrolan('${c.id}')"></i></div></div>`; } }); box.scrollTop = box.scrollHeight; });
            unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push({ id: doc.id, ...doc.data() })); masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); renderRiwayatTugasWA(); });
        }

        if(document.getElementById("btnSimpanRoadmap")) {
            document.getElementById("btnSimpanRoadmap").onclick = async () => { const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim(); if(!w || !j) return window.showModernAlert("Peringatan", "Waktu Target dan Judul Kegiatan wajib diisi!"); try { await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() }); window.showModernAlert("Berhasil", "Roadmap Program Harian berhasil disimpan!", "success"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = ""; } catch(e) { window.showModernAlert("Kesalahan", e.message); } };
        }

        onSnapshot(collection(db, "users"), (snap) => {
            globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = "";
            snap.forEach(d => {
                const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud}); let btnStatus = ""; let btnHapus = "";
                if (ud.role === 'admin') { btnStatus = `<span class="badge bg-secondary p-1 text-xs" style="font-size:0.6rem !important;"><i class="bi bi-shield-lock-fill"></i> Admin</span>`; btnHapus = `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1 rounded-pill" disabled><i class="bi bi-trash"></i></button>`; } else { const statusIcon = ud.status === 'aktif' ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'; const nextStatus = ud.status === 'aktif' ? 'nonaktif' : 'aktif'; btnStatus = `<button class="btn btn-sm bg-transparent border-0 p-0" onclick="window.ubahStatusPengguna('${uid}', '${nextStatus}')"><i class="bi ${statusIcon} fs-4"></i></button>`; btnHapus = `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.hapusPenggunaPermanen('${uid}')"><i class="bi bi-trash"></i></button>`; }
                const btnEdit = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.siapSuntingPengguna('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')"><i class="bi bi-pencil"></i></button>`;
                tbody.innerHTML += `<tr><td class="text-start ps-2"><b>${uid}</b><br><small class="text-muted">${ud.julukan}</small></td><td class="text-uppercase fw-bold text-xs">${ud.role}<br><span class="text-danger font-monospace">${ud.pin}</span></td><td><div class="d-flex justify-content-center align-items-center gap-1">${btnStatus}${btnEdit}${btnHapus}</div></td></tr>`;
            }); renderMentorChecklist();
        });

        window.ubahStatusPengguna = async function(uid, statusBaru) { await updateDoc(doc(db, "users", uid), { status: statusBaru }); };
        window.hapusPenggunaPermanen = async function(uid) { if(confirm(`Apakah Anda yakin ingin menghapus akun tutor ${uid} secara permanen?`)) await deleteDoc(doc(db, "users", uid)); };
        window.siapSuntingPengguna = function(uid, nama, role, pin) { document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; document.getElementById("newPin").value = pin; document.getElementById("newName").value = nama; document.getElementById("newRole").value = role; };

        if(document.getElementById("btnAddUser")) {
            document.getElementById("btnAddUser").onclick = async () => { const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value.trim(); const n = document.getElementById("newName").value.trim(); const r = document.getElementById("newRole").value; if(!u || !p || !n) return window.showModernAlert("Peringatan", "Formulir Pendaftaran wajib dilengkapi!"); await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); window.showModernAlert("Berhasil", "Data Akun Pengguna berhasil disimpan.", "success"); document.getElementById("newUser").readOnly = false; document.getElementById("newUser").value = ""; document.getElementById("newPin").value = ""; document.getElementById("newName").value = ""; };
        }

        function renderMentorChecklist() { const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = ""; globalAllUsers.filter(u => u.status === 'aktif').forEach(u => { const isChecked = currentAssignedMentors.includes(u.id) ? "checked" : ""; setupMentorList.innerHTML += `<div class="col-6"><div class="form-check border p-1 bg-white rounded shadow-sm"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${isChecked}><label class="form-check-label ms-1 text-xs fw-bold" for="chk_${u.id}">${u.julukan}</label></div></div>`; }); }

        if(document.getElementById("btnSaveSchool")) {
            document.getElementById("btnSaveSchool").onclick = async () => {
                const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return window.showModernAlert("Kesalahan", "Identitas Handle Sekolah wajib diisi!");
                const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
                const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
                try { await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); window.showModernAlert("Berhasil", "Konfigurasi profil sekolah berhasil diperbarui!", "success"); window.langsungKeSekolah(sid); } catch (e) { window.showModernAlert("Kesalahan", e.message); }
            };
        }

        if(document.getElementById("btnArsipSekolah")) { document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW') { if(confirm("Anda yakin ingin menyembunyikan dan mengarsipkan data sekolah ini?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); window.showModernAlert("Berhasil", "Sekolah Resmi Diarsipkan.", "success"); window.langsungKeSekolah(""); } } }; }

        if(document.getElementById('btnImportExcel')) {
            document.getElementById('btnImportExcel').onclick = function() {
                const file = document.getElementById('excelSiswa').files[0]; if(!file) return window.showModernAlert("Peringatan", "Silakan lampirkan format berkas Excel terlebih dahulu!");
                const reader = new FileReader(); reader.onload = function(e) { try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } }); let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); } document.getElementById('inputMasterSiswa').value = output.join('\n'); window.showModernAlert("Berhasil", "Penguraian (Impor) Data Excel Berhasil!", "success"); } catch(error) { window.showModernAlert("Gagal", "Format Berkas Tidak Valid."); } }; reader.readAsArrayBuffer(file);
            };
        }

        function ekstrakHariLogbook() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Log Kehadiran</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1}</option>`; }); }
        function renderListLogbookAdmin() { const container = document.getElementById("adminLogbookList"); if(!container) return; container.innerHTML = ""; const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value; let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dataTampil = dataTampil.filter(d => d.kelas === fKelas); if(dataTampil.length === 0) { container.innerHTML = `<div class="alert alert-secondary text-center small border-0">Pencatatan Kosong.</div>`; return; } dataTampil.forEach(d => { container.innerHTML += `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs text-dark"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><b class="text-wa">${d.nama.toUpperCase()}</b><span class="badge bg-secondary rounded-pill">${d.kelas}</span></div><div class="mb-1">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div class="mb-1">📝 <b>Catatan:</b> ${d.laporanSiswa || '-'}</div><div class="text-end mt-2"><button class="btn btn-xs btn-outline-danger py-0 px-3 rounded-pill fw-bold" onclick="window.hapusLaporanLogbook('${d.id}')">Hapus Laporan</button></div></div>`; }); }
        window.hapusLaporanLogbook = async function(id) { if(confirm("Hapus laporan pengajaran ini secara permanen? Data nilai siswa yang terkait akan ikut terhapus.")) await deleteDoc(doc(db, "logbooks", id)); };
        if(document.getElementById('filterHari')) document.getElementById('filterHari').addEventListener('change', renderListLogbookAdmin); 
        if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').addEventListener('change', renderListLogbookAdmin);

        function kalkulasiKinerjaTutor() { let rekapMentor = {}; dataLengkap.forEach(log => { if(!rekapMentor[log.nama]) rekapMentor[log.nama] = 0; rekapMentor[log.nama]++; }); const board = document.getElementById("leaderboardTutor"); if(!board) return; board.innerHTML = ""; Object.entries(rekapMentor).sort((a,b)=>b[1]-a[1]).forEach(([nm, ct], idx) => { let med = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : "🏅"); board.innerHTML += `<div class="d-flex justify-content-between p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark">${med} ${nm}</div><div class="badge bg-wa rounded-pill">${ct} Logbook</div></div>`; }); }

        async function kalkulasiSiswaGlobal() {
            const tabelNilai = document.getElementById("tabelNilaiGlobal"); const labelHadir = document.getElementById("containerKehadiranGlobal"); const trackPrestasi = document.getElementById("trackerPrestasiList");
            if(!tabelNilai || !labelHadir || !trackPrestasi) return; tabelNilai.innerHTML = `<tr><td colspan="6" class="text-muted"><div class="spinner-border spinner-border-sm"></div> Memuat data global...</td></tr>`;
            let rekapSiswaGlobal = {}; let totalKehadiranGlobal = { h: 0, a: 0, s: 0, i: 0 };
            let activeIds = globalAllSchools.map(s => s.id);
            if(activeIds.length === 0) { tabelNilai.innerHTML = `<tr><td colspan="6" class="text-muted">Tidak ada data aktif.</td></tr>`; labelHadir.innerHTML = `<div class="alert alert-light border small text-center text-muted">Belum ada aktivitas sekolah.</div>`; trackPrestasi.innerHTML = `<div class="text-center text-muted small p-3">Data prestasi kosong.</div>`; return; }
            try {
                const logbooksSnap = await getDocs(collection(db, "logbooks"));
                logbooksSnap.forEach(doc => { const data = doc.data(); if(activeIds.includes(data.schoolId) && data.dataSiswa) { data.dataSiswa.forEach(siswa => { const identitas = `${siswa.nama} (${data.kelas})`; if(!rekapSiswaGlobal[identitas]) rekapSiswaGlobal[identitas] = { vocab: '-', speak: '-', grammar: '-', prac: '-', poinTotal: 0 }; let nilaiHuruf = (siswa.nilai || "").toUpperCase(); if(nilaiHuruf === 'A' || nilaiHuruf === 'B' || nilaiHuruf === 'C') { let mStr = (data.materi || []).join(' ').toLowerCase(); if(mStr.includes('vocab')) rekapSiswaGlobal[identitas].vocab = nilaiHuruf; if(mStr.includes('speak')) rekapSiswaGlobal[identitas].speak = nilaiHuruf; if(mStr.includes('gram')) rekapSiswaGlobal[identitas].grammar = nilaiHuruf; if(mStr.includes('prac')) rekapSiswaGlobal[identitas].prac = nilaiHuruf; } if(nilaiHuruf === 'A' || nilaiHuruf === 'A+') rekapSiswaGlobal[identitas].poinTotal += 90; else if(parseInt(nilaiHuruf) > 0) rekapSiswaGlobal[identitas].poinTotal += parseInt(nilaiHuruf); if(siswa.kehadiran === 'h') totalKehadiranGlobal.h++; if(siswa.kehadiran === 'a') totalKehadiranGlobal.a++; if(siswa.kehadiran === 's') totalKehadiranGlobal.s++; if(siswa.kehadiran === 'i') totalKehadiranGlobal.i++; }); } });
                let barisHtml = ""; let nomor = 1; let arrPrestasi = []; for (const [nama, nl] of Object.entries(rekapSiswaGlobal)) { arrPrestasi.push({ nama, poin: nl.poinTotal }); barisHtml += `<tr><td class="text-muted">${nomor++}</td><td class="text-start fw-bold text-dark text-xs">${nama}</td><td class="fw-bold ${nl.vocab==='A'?'text-success':(nl.vocab==='B'?'text-primary':'text-danger')}">${nl.vocab}</td><td class="fw-bold ${nl.speak==='A'?'text-success':(nl.speak==='B'?'text-primary':'text-danger')}">${nl.speak}</td><td class="fw-bold ${nl.grammar==='A'?'text-success':(nl.grammar==='B'?'text-primary':'text-danger')}">${nl.grammar}</td><td class="fw-bold ${nl.prac==='A'?'text-success':(nl.prac==='B'?'text-primary':'text-danger')}">${nl.prac}</td></tr>`; } tabelNilai.innerHTML = barisHtml || `<tr><td colspan="6" class="text-muted">Data nilai masih kosong.</td></tr>`; labelHadir.innerHTML = `<div class="row g-2 text-center mt-2"><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-success mb-1">${totalKehadiranGlobal.h}</h3><span class="text-xs text-muted fw-bold">TOTAL HADIR</span></div></div><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-danger mb-1">${totalKehadiranGlobal.a}</h3><span class="text-xs text-muted fw-bold">TOTAL ALFA</span></div></div><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-warning mb-1">${totalKehadiranGlobal.s}</h3><span class="text-xs text-muted fw-bold">TOTAL SAKIT</span></div></div><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-info mb-1">${totalKehadiranGlobal.i}</h3><span class="text-xs text-muted fw-bold">TOTAL IZIN</span></div></div></div>`;
                arrPrestasi.sort((a,b) => b.poin - a.poin).slice(0, 10); let presHtml = ""; arrPrestasi.forEach((item, idx) => { let badge = idx === 0 ? "bg-warning text-dark" : (idx === 1 ? "bg-secondary text-white" : "bg-wa text-white"); presHtml += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-light text-sm"><div class="fw-bold text-dark"><span class="badge ${badge} me-2 rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`; }); trackPrestasi.innerHTML = presHtml || `<div class="text-center text-muted small p-3">Data prestasi kosong.</div>`;
            } catch (e) { tabelNilai.innerHTML = `<tr><td colspan="6" class="text-danger">Gagal memuat rekapitulasi data.</td></tr>`; }
        }

        if(document.getElementById("btnExportPDF")) { document.getElementById("btnExportPDF").onclick = () => { if(!currentSchoolId || currentSchoolId==='NEW') return window.showModernAlert("Peringatan", "Harap pilih lokasi sekolah di bilah atas untuk dicetak laporannya!"); const fHari = document.getElementById("filterHari").value; let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); const printDiv = document.createElement("div"); printDiv.style.fontFamily = "Arial, sans-serif"; printDiv.style.padding = "20px"; let htmlString = `<h3 style="text-align:center; font-family: Arial, sans-serif; margin-bottom: 20px;">LAPORAN LOGBOOK MENTOR<br><small style="font-size:12px; font-weight:normal;">Sekolah: ${document.getElementById('inputSekolah').value} | Rekam: ${fHari}</small></h3><table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: Arial, sans-serif;" border="1"><tr style="background-color: #f2f2f2; text-align: center;"><th style="padding:5px;">WAKTU</th><th style="padding:5px;">MENTOR</th><th style="padding:5px;">KELAS / JAM</th><th style="padding:5px; width: 35%;">MATERI & LAPORAN</th><th style="padding:5px; width: 35%;">RAPOR SISWA</th></tr>`; dataTampil.forEach(d => { const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'; let dJam = (d.jamKe||"").replace('Jam ','Jam ke-'); let ds = d.dataSiswa && d.dataSiswa.length > 0 ? `<table style="width:100%; font-size:9px; border-collapse: collapse;"><tr style="border-bottom:1px solid #ddd;"><th>Nama</th><th>Absen</th><th>Nilai</th></tr>` + d.dataSiswa.map(s => `<tr><td>${s.nama}</td><td style="text-align:center;">${s.kehadiran.toUpperCase()}</td><td style="text-align:center; font-weight:bold;">${s.nilai || '-'}</td></tr>`).join('') + `</table>` : 'Kosong'; htmlString += `<tr><td style="padding:5px; text-align:center;">${w}</td><td style="padding:5px; text-align:center; font-weight:bold;">${d.nama}</td><td style="padding:5px; text-align:center;">${d.kelas}<br><b>${dJam}</b></td><td style="padding:5px;"><b>Materi:</b> ${d.materi.join(', ')}<br><b>Catatan Kelas:</b> ${d.laporanSiswa}<br><b>Tugas Mandiri:</b> ${d.tugasSiswa}</td><td style="padding:5px;">${ds}</td></tr>`; }); htmlString += `</table>`; printDiv.innerHTML = htmlString; html2pdf().set({ margin: 0.3, filename: `Laporan_AEC_${currentSchoolId}_${fHari.replace(/\//g, "-")}.pdf`, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }}).from(printDiv).save(); }; }

        if(document.getElementById("btnKirimTugasWA")) { document.getElementById("btnKirimTugasWA").onclick = async () => { const i = document.getElementById("waInstruksi").value; if(!i) return window.showModernAlert("Peringatan", "Bilah instruksi tugas teks wajib diisi!"); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: document.getElementById("waTarget").value || "GLOBAL", linkGambar: document.getElementById("waGambar").value, instruksi: i, waktu: serverTimestamp() }); window.showModernAlert("Berhasil", "Instruksi Tugas WhatsApp Berhasil Direkam!", "success"); document.getElementById("waInstruksi").value = ""; document.getElementById("waGambar").value = ""; }; }
        function renderRiwayatTugasWA() { const listSemua = document.getElementById("listTugasWAHistory"); if(!listSemua) return; listSemua.innerHTML = ""; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); let htmlSemua = ""; dt.forEach((d) => { const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 120px; object-fit: cover;">` : ''; htmlSemua += `<div class="card card-custom p-3 mb-3 bg-white shadow-sm border"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm font-monospace" style="white-space: pre-line; color:var(--wa-text-main);">${d.instruksi}</div><button class="btn btn-outline-danger btn-sm mt-3 rounded-pill fw-bold" onclick="window.tarikTugasWA('${d.id}')"><i class="bi bi-trash"></i> Tarik Tugas</button></div>`; }); listSemua.innerHTML = htmlSemua || `<div class="alert text-center border-0 text-muted bg-transparent mt-3">Riwayat Penugasan Kosong.</div>`; }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderRiwayatTugasWA;
        window.tarikTugasWA = async function(id) { if (confirm(`Apakah Anda yakin ingin menarik/menghapus instruksi penugasan ini secara permanen?`)) await deleteDoc(doc(db, "tugas_wa", id)); };

        if(document.getElementById("btnSaveMateri")) { document.getElementById("btnSaveMateri").onclick = async () => { const j = document.getElementById("materiJudul").value.trim(); const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value.trim(); if(!j || !l) return window.showModernAlert("Peringatan", "Penyematan Judul dan Tautan Modul wajib diisi!"); await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() }); window.showModernAlert("Berhasil", "Materi berhasil diunggah ke awan!", "success"); document.getElementById("materiJudul").value = ""; document.getElementById("materiLink").value = ""; }; }
        window.hapusModulMateri = async function(id) { if(confirm("Menghapus materi secara permanen dari perpustakaan awan?")) await deleteDoc(doc(db, "materials", id)); }
        
        window.hapusPesanObrolan = async function(cid) { if(confirm("Tindakan Administrator: Hapus pesan ini dari ruang diskusi secara permanen?")) await deleteDoc(doc(db, "chats", cid)); };
        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg) return; let targetSchool = currentSchoolId; if(currentSchoolId === "" || currentSchoolId === "NEW") { targetSchool = "GLOBAL_ROOM"; } await addDoc(collection(db, "chats"), { schoolId: targetSchool, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "admin" }); document.getElementById("inputChat").value = ""; }; }
    }

    // ==========================================
    // BLOK KHUSUS: DIREKTUR
    // ==========================================
    if (actRole === 'direktur' && window.location.pathname.includes("direktur.html")) {
        
        onSnapshot(collection(db, "schools"), (snap) => {
            let schools = []; snap.forEach(d => { if(d.data().status !== 'archived') schools.push({ id: d.id, ...d.data() }); });
            const c1 = document.getElementById("modernSchoolSelect"); const c2 = document.getElementById("overviewCardsContainer");
            if(c1) { c1.innerHTML = `<option value="">Pilih Sekolah Pengawasan...</option>` + schools.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join(''); c1.onchange = (e) => window.langsungKeSekolah(e.target.value); }
            if(c2) {
                if (schools.length === 0) { c2.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah yang beroperasi aktif.</div></div>`; return; }
                c2.innerHTML = schools.map(s => { let jSiswa=0; if(s.masterSiswa) s.masterSiswa.split('\n').forEach(l=>{if(l.includes(':')) jSiswa+=l.split(':')[1].split(',').filter(n=>n.trim()!=="").length;}); return `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 bg-white p-1" style="border-left: 4px solid var(--wa-primary) !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6><div class="d-flex justify-content-between mb-2"><span class="text-xs text-muted fw-bold">Hari Berjalan:</span><span class="badge bg-wa rounded-pill">${s.hariBerjalan||0}/${s.totalHari||0}</span></div><div class="d-flex justify-content-between"><span class="text-xs text-muted fw-bold">Kapasitas Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jSiswa} Peserta</span></div></div></div></div>`; }).join('');
            }
        });

        window.langsungKeSekolah = function(sid) {
            currentSchoolId = sid;
            if(!sid) { if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.add("d-none"); return; }
            if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none");
            
            onSnapshot(doc(db, "schools", sid), (s) => {
                if(!s.exists()) return; const d = s.data();
                const filledArr = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
                const hBerjalan = parseInt(d.hariBerjalan) || 0; const tHari = parseInt(d.totalHari) || 5; const timelineText = `${(hBerjalan > 0 && hBerjalan <= 20) ? filledArr[hBerjalan - 1] : hBerjalan}/${tHari}`;
                if(document.getElementById('headSekolah')) document.getElementById('headSekolah').innerText = d.namaSekolah; if(document.getElementById("headTimeline")) document.getElementById("headTimeline").innerText = timelineText;
                if(document.getElementById('tutorBriefing')) document.getElementById('tutorBriefing').innerText = d.briefing || "-"; if(document.getElementById('dirBriefing')) document.getElementById('dirBriefing').value = d.briefing || "";
                if(document.getElementById('tutorJadwal')) document.getElementById('tutorJadwal').innerText = d.jadwal || "-"; if(document.getElementById('dirJadwal')) document.getElementById('dirJadwal').value = d.jadwal || "";
                if(document.getElementById('tutorGoal')) document.getElementById('tutorGoal').innerText = d.goal || "-"; if(document.getElementById('dirGoal')) document.getElementById('dirGoal').value = d.goal || "";
                
                let jadwalLive = "Tidak ada jadwal.";
                if (d.jadwal && d.jadwal !== "-") { const lines = d.jadwal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes(); for (let line of lines) { const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/); if (match) { const st = parseInt(match[1]) * 60 + parseInt(match[2]); const en = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= st && cur <= en) { jadwalLive = line; break; } } } if(jadwalLive === "Tidak ada jadwal.") jadwalLive = "Di luar jam kelas operasional."; }
                if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = jadwalLive;
                
                rawKurikulum = d.kurikulum || {}; const arrKelas = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                const sels = ['filterKelasSiswa', 'trackerKelas', 'filterKelasHistori', 'filterWA']; sels.forEach(id => { const el = document.getElementById(id); if(el) { el.innerHTML = `<option value="SEMUA">Semua Kelas</option>` + arrKelas.map(k => `<option value="${k}">${k}</option>`).join(''); } });
            });

            onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { dataLengkap = []; snap.forEach(d => dataLengkap.push({id: d.id, ...d.data()})); dataLengkap.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); ekstrakHariLogbook(); renderListLogbookDir(); renderTracker(); kalkulasiDataSiswa(); });
            onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let chats = []; snap.forEach(doc => chats.push(doc.data())); chats.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0)); const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = ""; chats.forEach(c => { if(c.type === 'global') { const isMe = c.sender === myName; const isDir = c.role === 'direktur'; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${isDir?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time}</div></div>`; } }); box.scrollTop = box.scrollHeight; });
            onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push(doc.data())); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); renderTugasWAPantauan(); });
        }

        if(document.getElementById("btnSaveDirBriefing")) { document.getElementById("btnSaveDirBriefing").onclick = async () => { if(!currentSchoolId) return window.showModernAlert("Peringatan", "Pilih sekolah di bilah atas terlebih dahulu."); await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value, jadwal: document.getElementById("dirJadwal").value, goal: document.getElementById("dirGoal").value }); window.showModernAlert("Berhasil", "Arahan Instruksi pembaruan berhasil dikirim secara langsung ke perangkat Mentor lapangan.", "success"); }; }
        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "direktur" }); document.getElementById("inputChat").value = ""; }; }

        function ekstrakHariLogbook() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Waktu Logbook</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1}</option>`; }); }
        function renderListLogbookDir() { const container = document.getElementById("logbookList"); if(!container) return; container.innerHTML = ""; const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value; let dt = dataLengkap; if (fHari !== "SEMUA") dt = dt.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dt = dt.filter(d => d.kelas === fKelas); if(dt.length === 0) { container.innerHTML = `<div class="text-center text-muted small p-3 border rounded bg-light">Belum ada catatan aktivitas di filter ini.</div>`; return; } dt.forEach(d => { container.innerHTML += `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs"><div class="fw-bold text-wa border-bottom pb-1 mb-1">${d.nama.toUpperCase()} <span class="badge bg-secondary rounded-pill float-end">${d.kelas}</span></div><div class="mt-1">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div>📝 <b>Catatan Kelas:</b> ${d.laporanSiswa || '-'}</div></div>`; }); }
        if(document.getElementById('filterHari')) document.getElementById('filterHari').addEventListener('change', renderListLogbookDir); if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').addEventListener('change', renderListLogbookDir);

        if(document.getElementById("btnExportPDF")) { document.getElementById("btnExportPDF").onclick = () => { if(!currentSchoolId || currentSchoolId==='NEW') return window.showModernAlert("Peringatan", "Pilih lokasi sekolah terlebih dahulu untuk mencetak PDF laporan."); const fHari = document.getElementById("filterHari").value; let dt = dataLengkap; if (fHari !== "SEMUA") dt = dt.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); const printDiv = document.createElement("div"); printDiv.style.fontFamily = "Arial, sans-serif"; printDiv.style.padding = "20px"; let html = `<h3 style="text-align:center;">LAPORAN LOGBOOK DIREKTUR<br><small style="font-size:12px; font-weight:normal;">Sekolah: ${document.getElementById('headSekolah').innerText} | Rekam: ${fHari}</small></h3><table style="width: 100%; border-collapse: collapse; font-size: 10px;" border="1"><tr style="background-color: #f2f2f2; text-align: center;"><th style="padding:5px;">WAKTU</th><th style="padding:5px;">MENTOR</th><th style="padding:5px;">KELAS / JAM</th><th style="padding:5px; width: 35%;">MATERI & LAPORAN</th><th style="padding:5px; width: 35%;">RAPOR SISWA</th></tr>`; dt.forEach(d => { const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'; let dJam = (d.jamKe||"").replace('Jam ','Jam ke-'); let ds = d.dataSiswa && d.dataSiswa.length > 0 ? `<table style="width:100%; font-size:9px; border-collapse: collapse;"><tr style="border-bottom:1px solid #ddd;"><th>Nama</th><th>Absen</th><th>Nilai</th></tr>` + d.dataSiswa.map(s => `<tr><td>${s.nama}</td><td style="text-align:center;">${s.kehadiran.toUpperCase()}</td><td style="text-align:center; font-weight:bold;">${s.nilai || '-'}</td></tr>`).join('') + `</table>` : 'Pencatatan belum dilakukan'; html += `<tr><td style="padding:5px; text-align:center;">${w}</td><td style="padding:5px; text-align:center; font-weight:bold;">${d.nama}</td><td style="padding:5px; text-align:center;">${d.kelas}<br><b>${dJam}</b></td><td style="padding:5px;"><b>Materi:</b> ${d.materi.join(', ')}<br><b>Catatan Kelas:</b> ${d.laporanSiswa}</td><td style="padding:5px;">${ds}</td></tr>`; }); html += `</table>`; printDiv.innerHTML = html; html2pdf().set({ margin: 0.3, filename: `AEC_Pengawasan_${currentSchoolId}.pdf`, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }}).from(printDiv).save(); }; }

        function renderTracker() { const area = document.getElementById("areaTracker"); const kelasAktif = document.getElementById("trackerKelas").value; if(!area || !rawKurikulum.vocab) return; let materiSelesai = new Set(); dataLengkap.forEach(log => { if (log.kelas === kelasAktif && log.materi) log.materi.forEach(m => materiSelesai.add(m)); }); const renderBlok = (judul, arrayMateri, warna) => { if(!arrayMateri || arrayMateri.length === 0) return ''; let listHtml = ""; arrayMateri.forEach(mat => { const isDone = materiSelesai.has(mat); const icon = isDone ? `<i class="bi bi-check-circle-fill text-${warna}"></i>` : `<i class="bi bi-circle text-secondary opacity-50"></i>`; const bg = isDone ? `bg-${warna} bg-opacity-10 border-${warna}` : 'bg-transparent text-muted border'; listHtml += `<div class="p-1 mb-1 rounded text-xs d-flex justify-content-between ${bg}"><span class="${isDone ? 'fw-bold' : ''}">${mat}</span> <span>${icon}</span></div>`; }); return `<div class="mb-2"><h6 class="text-xs fw-bold text-${warna} mb-1 border-bottom pb-1">${judul}</h6>${listHtml}</div>`; }; area.innerHTML = renderBlok("KOSAKATA", rawKurikulum.vocab, "primary") + renderBlok("BERBICARA", rawKurikulum.speaking, "success") + renderBlok("TATA BAHASA", rawKurikulum.grammar, "danger") + renderBlok("PRAKTIK KELAS", rawKurikulum.practice, "warning"); }
        if(document.getElementById('trackerKelas')) document.getElementById('trackerKelas').addEventListener('change', renderTracker);

        function kalkulasiDataSiswa() { const kls = document.getElementById("filterKelasSiswa").value; let rekap = {}; dataLengkap.forEach(log => { if(log.kelas === kls && log.dataSiswa) { log.dataSiswa.forEach(s => { if(!rekap[s.nama]) rekap[s.nama] = { poin:0 }; let nStr = (s.nilai || "").toString().toLowerCase().trim(); if(nStr === 'a' || nStr === 'a+') rekap[s.nama].poin += 90; else if(parseInt(nStr) > 0) rekap[s.nama].poin += parseInt(nStr); }); } }); const listTop = document.getElementById("listTop10"); if(listTop) { listTop.innerHTML = ""; let arrPeringkat = Object.entries(rekap).map(([nama, data]) => ({ nama, poin: data.poin })).sort((a,b) => b.poin - a.poin).slice(0, 10); if(arrPeringkat.length===0){listTop.innerHTML="<div class='small text-center text-muted p-3 border rounded bg-light'>Siswa belum memiliki nilai poin evaluasi.</div>"; return;} arrPeringkat.forEach((item, idx) => { let badge = idx === 0 ? "bg-warning text-dark" : (idx === 1 ? "bg-secondary text-white" : "bg-wa text-white"); listTop.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark"><span class="badge ${badge} me-2 rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`; }); } }
        if(document.getElementById('filterKelasSiswa')) document.getElementById('filterKelasSiswa').addEventListener('change', kalkulasiDataSiswa);

        function renderTugasWAPantauan() { const list = document.getElementById("listTugasWAHistory"); if(!list) return; list.innerHTML = ""; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); let html = ""; dt.forEach((d) => { const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 100px; object-fit: cover;">` : ''; html += `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div></div>`; }); list.innerHTML = html || `<div class="text-muted text-center small mt-3">Tidak ada riwayat instruksi tugas WA dari Admin.</div>`; }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").addEventListener('change', renderTugasWAPantauan);
    }

    // ==========================================
    // BLOK KHUSUS: MENTOR (EKSEKUTOR)
    // ==========================================
    if (actRole === 'mentor' && window.location.pathname.includes("mentor.html")) {
        
        onSnapshot(collection(db, "schools"), (snap) => {
            let listSekolah = []; snap.forEach(doc => { if(doc.data().status !== 'archived') listSekolah.push({ id: doc.id, ...doc.data() }); });
            const tugasSekolahku = listSekolah.find(s => s.assignedMentors && s.assignedMentors.includes(actUser));
            const pesanKosong = document.getElementById("pesanKosong"); const utamaKonten = document.getElementById("utamaMentorContent"); const infoBar = document.getElementById("schoolInfoBar");
            if(tugasSekolahku) { currentSchoolId = tugasSekolahku.id; if(pesanKosong) pesanKosong.classList.add("d-none"); if(utamaKonten) utamaKonten.classList.remove("d-none"); muatDataSekolahMentor(tugasSekolahku.id); } else { if(pesanKosong) pesanKosong.classList.remove("d-none"); if(utamaKonten) utamaKonten.classList.add("d-none"); if(infoBar) infoBar.classList.add("d-none"); }
        });

        function muatDataSekolahMentor(sid) {
            onSnapshot(doc(db, "schools", sid), (docSnap) => {
                if(!docSnap.exists()) return; const d = docSnap.data();
                const filledArr = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"]; const hBerjalan = parseInt(d.hariBerjalan) || 0; const tHari = parseInt(d.totalHari) || 5; const timelineText = `${(hBerjalan > 0 && hBerjalan <= 20) ? filledArr[hBerjalan - 1] : hBerjalan}/${tHari}`;
                let jadwalLive = "Tidak ada jadwal kelas."; if (d.jadwal && d.jadwal !== "-") { const lines = d.jadwal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes(); for (let line of lines) { const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/); if (match) { const s = parseInt(match[1]) * 60 + parseInt(match[2]); const e = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= s && cur <= e) return line; } } jadwalLive = "Di luar jam kelas operasional."; }
                
                if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none"); if(document.getElementById("headSekolah")) document.getElementById("headSekolah").innerText = d.namaSekolah; if(document.getElementById("headTimeline")) document.getElementById("headTimeline").innerText = timelineText; if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = jadwalLive;
                if(document.getElementById("tutorBriefing")) document.getElementById("tutorBriefing").innerText = d.briefing || "-"; if(document.getElementById("tutorJadwal")) document.getElementById("tutorJadwal").innerText = d.jadwal || "-"; if(document.getElementById("tutorGoal")) document.getElementById("tutorGoal").innerText = d.goal || "-";
                
                rawKurikulum = d.kurikulum || {}; rawMasterSiswa = d.masterSiswa || "";
                renderStrukturFormLogbookMentor(d.masterKelas); renderDinamicMateriMentor(jadwalLive); renderFormAbsenMentor();
                
                const arrKelas = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!==""); const filWA = document.getElementById("filterWA"); if(filWA) { filWA.innerHTML = `<option value="SEMUA">Semua Kelas Tergabung</option>` + arrKelas.map(k => `<option value="${k}">${k}</option>`).join(''); }
            });

            onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
                let chats = []; snap.forEach(doc => chats.push(doc.data())); chats.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0)); const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = "";
                chats.forEach(c => { if(c.type === 'global') { const isMe = c.sender === myName; const isDir = c.role === 'direktur'; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${isDir?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time}</div></div>`; } }); box.scrollTop = box.scrollHeight;
            });

            onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push(doc.data())); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); renderTugasWAEksekusiMentor(); });
        }

        function renderTugasWAEksekusiMentor() {
            const list = document.getElementById("listTugasWAHarian"); if(!list) return; list.innerHTML = "";
            const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); let html = "";
            dt.forEach((d) => { const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 200px; object-fit: cover;">` : ''; html += `<div class="card card-custom p-3 mb-3 bg-white shadow-sm border"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3 py-1 shadow-sm">${d.targetKelas}</span><span class="text-xs text-muted fw-bold">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm mb-3 font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-wa btn-sm w-100 fw-bold rounded-pill shadow-sm" onclick="window.kirimKeWAMentor('${encodeURIComponent(d.instruksi)}')"><i class="bi bi-whatsapp me-2"></i> Distribusikan Pesan (Broadcast)</button></div>`; });
            list.innerHTML = html || `<div class="text-muted text-center small p-4 border rounded bg-light">Belum ada tugas distribusi instruksi WhatsApp dari Administrator pusat hari ini.</div>`;
        }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").addEventListener('change', renderTugasWAEksekusiMentor);
        window.kirimKeWAMentor = function(encodedText) { window.open(`https://wa.me/?text=${encodedText}`, '_blank'); }

        function renderStrukturFormLogbookMentor(masterKelas) {
            const formBox = document.getElementById("formLogbook"); if(!formBox) return;
            if(document.getElementById("inputKelas")) { const arrKelas = (masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!==""); const currentSelected = document.getElementById("inputKelas").value; let htmlOptions = arrKelas.map(k => `<option value="${k}" ${k===currentSelected?'selected':''}>${k}</option>`).join(''); document.getElementById("inputKelas").innerHTML = htmlOptions; return; }
            const arrKelas = (masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!==""); let htmlOptions = arrKelas.map(k => `<option value="${k}">${k}</option>`).join('');
            formBox.innerHTML = `<h6 class="fw-bold text-primary mb-3"><i class="bi bi-journal-check me-2"></i> Input Sesi Kelas</h6><div class="row g-2 mb-3"><div class="col-6"><label class="text-xs fw-bold text-secondary mb-1">PILIH KELAS</label><select id="inputKelas" class="form-select form-select-sm rounded-pill border-primary fw-bold text-dark">${htmlOptions}</select></div><div class="col-6"><label class="text-xs fw-bold text-secondary mb-1">SESI / JAM KE</label><select id="inputJam" class="form-select form-select-sm rounded-pill border-primary fw-bold text-dark"><option value="Jam 1">Sesi 1</option><option value="Jam 2">Sesi 2</option><option value="Jam 3">Sesi 3</option><option value="Jam 4">Sesi 4</option><option value="Jam 5">Sesi 5</option></select></div></div><div class="p-2 border rounded bg-light mb-3"><h6 class="text-xs fw-bold text-wa mb-2 border-bottom pb-1"><i class="bi bi-list-check me-1"></i> CENTANG MATERI SESI INI:</h6><div id="wadahVocab" class="mb-2 d-none"><span class="badge bg-primary mb-1 shadow-sm px-3">Vocab</span><div id="checkVocab" class="row g-1 text-xs px-1"></div></div><div class="mb-2 d-none" id="wadahSpeaking"><span class="badge bg-success mb-1 shadow-sm px-3">Speaking</span><div id="checkSpeaking" class="row g-1 text-xs px-1"></div></div><div class="mb-2 d-none" id="wadahGrammar"><span class="badge bg-danger mb-1 shadow-sm px-3">Grammar</span><div id="checkGrammar" class="row g-1 text-xs px-1"></div></div><div class="mb-2 d-none" id="wadahPractice"><span class="badge bg-warning text-dark mb-1 shadow-sm px-3">Practice</span><div id="checkPractice" class="row g-1 text-xs px-1"></div></div></div><div class="mb-3"><label class="text-xs fw-bold text-secondary mb-1">CATATAN KELAS (EVALUASI)</label><textarea id="inputCatatan" class="form-control text-sm border-secondary" rows="3" placeholder="Sampaikan kendala, pertanyaan siswa, dan keberhasilan kelas..."></textarea></div><div class="mb-3"><label class="text-xs fw-bold text-secondary mb-1">TUGAS MANDIRI / PR (OPSIONAL)</label><textarea id="inputTugasSiswa" class="form-control text-sm border-secondary" rows="2" placeholder="Tugas yang harus dikerjakan di rumah..."></textarea></div><div class="p-2 border rounded bg-white shadow-sm mb-3"><h6 class="border-bottom pb-1 mb-2"><b>👥 DAFTAR PESERTA & NILAI:</b></h6><div id="listAbsenSiswa" class="space-y-2"></div></div><button id="btnSubmitLogbook" class="btn btn-wa w-100 fw-bold rounded-pill py-2 shadow-sm"><i class="bi bi-send-fill me-2"></i> KIRIM DATA LAPORAN (LOGBOOK)</button>`;
            document.getElementById('inputKelas').addEventListener('change', renderFormAbsenMentor); document.getElementById("btnSubmitLogbook").addEventListener('click', eksekusiKirimLogbookMentor);
        }

        function renderDinamicMateriMentor(jadwalLive) {
            const low = jadwalLive.toLowerCase(); const v = document.getElementById("wadahVocab"); const s = document.getElementById("wadahSpeaking"); const g = document.getElementById("wadahGrammar"); const p = document.getElementById("wadahPractice"); const cv = document.getElementById("checkVocab"); const cs = document.getElementById("checkSpeaking"); const cg = document.getElementById("checkGrammar"); const cp = document.getElementById("checkPractice");
            if(!v) return; v.classList.add('d-none'); s.classList.add('d-none'); g.classList.add('d-none'); p.classList.add('d-none'); cv.innerHTML = ""; cs.innerHTML = ""; cg.innerHTML = ""; cp.innerHTML = "";
            const builder = (arr, container) => { if(!arr) return; arr.forEach((m) => { container.innerHTML += `<div class="col-12"><div class="form-check p-2 border rounded bg-white shadow-sm mb-1 d-flex align-items-center"><input class="form-check-input ms-1 cek-materi" type="checkbox" value="${m.replace(/"/g, '&quot;')}"><label class="form-check-label text-dark text-xs ms-2 fw-bold w-100">${m}</label></div></div>`; }); };
            let matched = false;
            if(low.includes("vocab")) { v.classList.remove('d-none'); builder(rawKurikulum.vocab, cv); matched = true; } if(low.includes("speak")) { s.classList.remove('d-none'); builder(rawKurikulum.speaking, cs); matched = true; } if(low.includes("gram")) { g.classList.remove('d-none'); builder(rawKurikulum.grammar, cg); matched = true; } if(low.includes("prac")) { p.classList.remove('d-none'); builder(rawKurikulum.practice, cp); matched = true; }
            if(!matched) { v.classList.remove('d-none'); builder(rawKurikulum.vocab, cv); s.classList.remove('d-none'); builder(rawKurikulum.speaking, cs); g.classList.remove('d-none'); builder(rawKurikulum.grammar, cg); p.classList.remove('d-none'); builder(rawKurikulum.practice, cp); }
        }

        function renderFormAbsenMentor() {
            const klsEl = document.getElementById('inputKelas'); const list = document.getElementById('listAbsenSiswa'); if(!list || !klsEl) return; const kls = klsEl.value; list.innerHTML = ""; let arrSiswa = [];
            rawMasterSiswa.split('\n').forEach(line => { if(line.startsWith(kls + ":")) { arrSiswa = line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== ""); } });
            if(arrSiswa.length === 0) { list.innerHTML = `<div class="text-center text-muted small p-3 border rounded bg-light">Data absen peserta (mahasiswa) belum diunggah secara sistem oleh Admin untuk ruang kelas ini.</div>`; return; }
            arrSiswa.forEach((nama) => { list.innerHTML += `<div class="d-flex align-items-center justify-content-between p-2 border rounded bg-light siswa-row mb-2 shadow-sm"><div class="fw-bold text-dark text-xs text-truncate w-50 nama-siswa">${nama}</div><div class="d-flex gap-2 justify-content-end w-50"><select class="form-select form-select-sm absen-siswa p-1 text-center fw-bold border-success text-success shadow-sm" style="width:55px; font-size:0.75rem;"><option value="h">✔ (Hadir)</option><option value="a">✖ (Alfa)</option><option value="s">S (Sakit)</option><option value="i">I (Izin)</option></select><input type="text" class="form-control form-control-sm nilai-siswa p-1 text-center text-xs border-primary fw-bold shadow-sm" style="width:50px;" placeholder="Nilai"></div></div>`; });
        }

        async function eksekusiKirimLogbookMentor() {
            const btn = document.getElementById("btnSubmitLogbook"); const kelas = document.getElementById("inputKelas").value; const jam = document.getElementById("inputJam").value; const catatan = document.getElementById("inputCatatan").value; const tugas = document.getElementById("inputTugasSiswa").value;
            let flatMateri = []; document.querySelectorAll('.cek-materi:checked').forEach(el => flatMateri.push(el.value));
            if(flatMateri.length === 0) { return window.showModernAlert("Peringatan Sistem", "Harap centang minimal satu materi yang diajarkan pada sesi ini sebelum memproses pengiriman data!"); }
            let dataSiswa = []; document.querySelectorAll('.siswa-row').forEach(row => { dataSiswa.push({ nama: row.querySelector('.nama-siswa').innerText, kehadiran: row.querySelector('.absen-siswa').value, nilai: row.querySelector('.nilai-siswa').value.trim() }); });
            btn.innerHTML = '<span class="spinner-border spinner-border-sm text-white"></span> Menyinkronkan...'; btn.disabled = true;
            try { await addDoc(collection(db, "logbooks"), { schoolId: currentSchoolId, mentorId: actUser, nama: myName, kelas, jamKe: jam, materi: flatMateri, laporanSiswa: catatan, dataSiswa, tugasSiswa: tugas, waktu: serverTimestamp() }); window.showModernAlert("Transmisi Berhasil", "Seluruh data laporan aktivitas (Logbook) Anda telah terekam aman secara global dan terenkripsi di dalam pangkalan data.", "success"); document.getElementById("inputCatatan").value = ""; document.getElementById("inputTugasSiswa").value = ""; document.querySelectorAll('.cek-materi').forEach(el => el.checked = false); document.querySelectorAll('.nilai-siswa').forEach(el => el.value = ""); document.querySelectorAll('.absen-siswa').forEach(el => el.value = "h"); } catch(e) { window.showModernAlert("Gagal Mentransmisikan", "Kegagalan teknis saat menghubungkan: " + e.message); }
            btn.innerHTML = '<i class="bi bi-send-fill me-2"></i> KIRIM DATA LAPORAN (LOGBOOK)'; btn.disabled = false;
        }

        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "mentor" }); document.getElementById("inputChat").value = ""; }; }
        
        if(document.getElementById("btnKirimLapor")) { document.getElementById("btnKirimLapor").onclick = () => { const detail = document.getElementById("laporDetail").value.trim(); if(!detail) return window.showModernAlert("Peringatan", "Mohon lengkapi detail kendala Anda secara spesifik."); const text = `🚨 *LAPORAN KENDALA LAPANGAN (AEC HUB)* 🚨\n\n*Pelapor:* ${myName}\n*Role:* Mentor Eksekutor\n*Kendala:* ${detail}`; window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(text)}`, '_blank'); document.getElementById("laporDetail").value = ""; }; }
    }

    // PUSTAKA GUDANG MATERI CLOUD (GLOBAL UNTUK SEMUA ROLE JIKA ADA ID)
    onSnapshot(collection(db, "materials"), (snap) => {
        const list = document.getElementById("listGudangMateri"); if(!list) return; list.innerHTML = ""; let html = "";
        snap.forEach(d => { const data = d.data(); html += `<div class="d-flex justify-content-between align-items-center p-3 border rounded mb-2 bg-white shadow-sm border-start border-info border-4"><div><div class="fw-bold text-dark text-sm mb-1">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div></div><a href="${data.link}" target="_blank" class="btn btn-sm btn-primary py-1 px-4 rounded-pill fw-bold shadow-sm">Akses Modul</a></div>`; });
        list.innerHTML = html || "<div class='text-muted text-center small mt-2 p-3 border rounded bg-light'>Belum ada transmisi modul materi eksternal pembelajaran (pustaka) dari ruang Administrator pusat.</div>";
    });
    
    // ROADMAP GLOBAL MENTOR & DIREKTUR READ ONLY
    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const list = document.getElementById("sistemRoadmapList"); if(!list) return; list.innerHTML = "";
        let arr = []; snap.forEach(d => arr.push(d.data())); arr.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        if(arr.length === 0) list.innerHTML = `<li class="timeline-item"><div class="timeline-desc text-muted">Belum ada roadmap program instruksi.</div></li>`;
        arr.forEach(r => list.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`);
    });
}
