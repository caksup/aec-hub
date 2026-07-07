/* ==================================================
   su.js - Script Pengendali Utama (Admin Panel)
   AEC Hub - Versi 1.5.3 Ultimate
   
   Riwayat Versi (JS):
   - v1.0: Setup inisialisasi awal Firebase Firestore core SDK.
   - v1.1: Penulisan fungsi otentikasi pin login & LocalStorage catcher.
   - v1.2: Penambahan CRUD management data sekolah, mentor, & import xlsx.
   - v1.3: Pemisahan script dadi modular (su.js) ben lancar offline mode.
   - v1.4: Pemindahan jalur simpan roadmap menyang database collection.
   - v1.5: Inisialisasi siklus 3 tema warna (Terang, Gelap, Sistem).
   - v1.5.1: Realtime Jam & Tanggal generator hulu, Offcanvas compatibility.
   - v1.5.2: Pembenahan query snapshot agar data sinkron rapi.
   - v1.5.3: (CURRENT) FIX TOTAL Sinkronisasi Tabel User (Edit/Hapus/OnOff), Pengunci OnOff Akun Admin, Dynamic Active-Pill Toggles, PWA Offline Persistence, dan Detektor Jaringan Wi-Fi.
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. INISIALISASI PANGKALAN DATA (Firebase Core & PWA Offline Persistence)
const firebaseConfig = { apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", authDomain: "special-mentor.firebaseapp.com", projectId: "special-mentor", storageBucket: "special-mentor.firebasestorage.app", messagingSenderId: "1075582532703", appId: "1:1075582532703:web:969365cefff8999335efea" };
const app = initializeApp(firebaseConfig); export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => { console.warn("PWA Offline mode peringatan:", err.code); });

// 2. PEMERIKSAAN OTENTIKASI & IDENTITAS
const actUser = localStorage.getItem("loggedInUser"); const myName = localStorage.getItem("loggedInName");
if (actUser !== "sup" && actUser !== "afif") window.location.replace("index.html");
document.getElementById("userNameDisplay").innerText = myName || "Admin AEC";
document.getElementById("userIdDisplay").innerText = actUser || "admin";
document.getElementById("laporNama").value = myName || "Admin AEC";

// 3. DETEKTOR JARINGAN (Status Wi-Fi)
function updateNetworkStatus() {
    const icon = document.getElementById("networkStatusIcon");
    if(!icon) return;
    if (navigator.onLine) {
        icon.className = "bi bi-wifi ms-1 net-status-icon net-online";
        icon.title = "Aplikasi Daring (Online)";
    } else {
        icon.className = "bi bi-wifi-off ms-1 net-status-icon net-offline";
        icon.title = "Aplikasi Luring (Offline - Data Disimpan Secara Lokal)";
    }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

// 4. KONTROL TEMA SIKLUS TERINTEGRASI
const themes = ['light', 'dark', 'system'];
const themeIcons = ['bi-sun-fill text-warning', 'bi-moon-stars-fill text-light', 'bi-display text-info'];
let currentThemeIndex = themes.indexOf(localStorage.getItem('aecTheme') || 'system');
if (currentThemeIndex === -1) currentThemeIndex = 2;

function applyThemeVisuals(index) {
    const t = themes[index]; localStorage.setItem('aecTheme', t);
    if (t === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else { document.documentElement.setAttribute('data-theme', t); }
    const iconEl = document.getElementById("themeIconDisplay");
    if(iconEl) { iconEl.className = `bi ${themeIcons[index]} fs-4`; void iconEl.offsetWidth; iconEl.classList.add("theme-icon-animate"); }
}
applyThemeVisuals(currentThemeIndex);

const btnCycleTheme = document.getElementById("btnCycleTheme");
if(btnCycleTheme) { btnCycleTheme.onclick = () => { currentThemeIndex = (currentThemeIndex + 1) % 3; applyThemeVisuals(currentThemeIndex); }; }

// 5. PENUNJUK WAKTU NYATA (JAM & TANGGAL)
function updateClock() {
    const el = document.getElementById('headClockDate'); if(!el) return; const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
    el.innerText = `${dateStr}\n${timeStr} WIB`;
}
setInterval(updateClock, 1000); updateClock();

// 6. FUNGSI ANTARMUKA GLOBAL (Log Out, Roadmap, Pelaporan)
function initGlobalUI() {
    const eksekusiLogout = (e) => { e.preventDefault(); if(confirm("Anda yakin ingin keluar dari aplikasi?")) { localStorage.clear(); window.location.replace("index.html"); } };
    if(document.getElementById("btnLogoutOffcanvas")) document.getElementById("btnLogoutOffcanvas").onclick = eksekusiLogout;
    
    // Fitur Pengiriman WhatsApp Pelaporan Masalah
    const btnLapor = document.getElementById("btnKirimLapor");
    if(btnLapor) {
        btnLapor.onclick = () => {
            const detail = document.getElementById("laporDetail").value.trim(); 
            if(!detail) return alert("Mohon lengkapi detail kendala Anda!");
            const text = `🚨 *LAPORAN KENDALA SISTEM (AEC HUB)* 🚨\n\n*Pelapor:* ${myName}\n*Role:* Admin\n*Kendala:* ${detail}`;
            window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(text)}`, '_blank'); // Admin IT Number
            document.getElementById("laporDetail").value = "";
        };
    }

    // Eksekusi Simpan Roadmap
    document.getElementById("btnSimpanRoadmap").onclick = async () => {
        const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim();
        if(!w || !j) return alert("Bilah Waktu dan Judul wajib diisi!");
        try { await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() }); alert("Roadmap berhasil direkam ke dalam sistem!"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = ""; } catch(e) { alert(e.message); }
    };
    
    // Penarik Data Roadmap Real-time
    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const listOverview = document.getElementById("overviewRoadmap"); const listSistem = document.getElementById("sistemRoadmapList");
        if(listOverview) listOverview.innerHTML = ""; if(listSistem) listSistem.innerHTML = "";
        let dataRoadmap = []; snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); });
        dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        dataRoadmap.forEach(r => { 
            if(listOverview) listOverview.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`; 
            if(listSistem) listSistem.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center"><div><div class="fw-bold text-dark">${r.judul}</div><div class="text-muted text-xs">${r.waktu_target}</div></div><i class="bi bi-trash text-danger" style="cursor:pointer;" onclick="window.hapusRoadmap('${r.id}')" title="Hapus Roadmap"></i></li>`;
        });
    });
}
window.hapusRoadmap = async function(id) { if(confirm("Hapus rincian peta jalan (roadmap) ini?")) await deleteDoc(doc(db, "roadmaps", id)); }

// ================= LOGIKA INTI DATABASE ADMIN =================
let currentSchoolId = ""; let rawKurikulum = {}; let dataLengkap = []; let masterTugasWA = [];
let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

function bersihkanListener() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; masterTugasWA = []; }

// Penarik Data Sekolah Real-time
onSnapshot(collection(db, "schools"), (snap) => { globalAllSchools = []; snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); }); renderModernSchoolSelect(); renderOverview(); });

function renderOverview() {
    const container = document.getElementById("overviewCardsContainer"); if (!container) return; container.innerHTML = "";
    globalAllSchools.forEach(s => {
        let jmlSiswa = 0; if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== "").length; } }); }
        container.innerHTML += `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-1 cursor-pointer" onclick="window.langsungKeSekolah('${s.id}')" style="border-left: 4px solid #128C7E !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate"><i class="bi bi-building-check text-wa me-2"></i>${s.namaSekolah}</h6><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Hari:</span><span class="badge bg-wa text-white rounded-pill">${s.hariBerjalan||0} / ${s.totalHari||0}</span></div><div class="d-flex justify-content-between"><span class="text-secondary text-xs fw-bold">Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jmlSiswa} Peserta</span></div></div></div></div>`;
    });
}

function renderModernSchoolSelect() {
    const container = document.getElementById("modernSchoolSelect"); if (!container) return;
    container.innerHTML = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value=""><i class="bi bi-globe"></i><span class="tab-label">GLOBAL</span></button>`;
    container.innerHTML += `<button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa active-pill' : 'btn-outline-success'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW"><i class="bi bi-plus-circle"></i><span class="tab-label">BARU</span></button>`;
    globalAllSchools.forEach(s => { 
        const isAct = (currentSchoolId === s.id);
        container.innerHTML += `<button class="btn btn-sm ${isAct ? 'btn-wa active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}"><i class="bi bi-building"></i><span class="tab-label">${s.namaSekolah}</span></button>`; 
    });
    container.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.currentTarget.getAttribute('data-value')); }; });
}

window.langsungKeSekolah = function(val) {
    bersihkanListener(); currentSchoolId = val; renderModernSchoolSelect();
    if(!val) {
        document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Silakan Pilih Sekolah Terlebih Dahulu.</div>`;
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
    } else if(val === "NEW") {
        document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = "";
        document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
        currentAssignedMentors = []; renderMentorChecklist(); renderModernSchoolSelect(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show();
    } else {
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show();
        muatDataSekolah(val);
    }
}

function muatDataSekolah(sid) {
    unsubSchool = onSnapshot(doc(db, "schools", sid), (docSnap) => {
        if(!docSnap.exists()) return; const data = docSnap.data();
        document.getElementById('inputSekolah').value = data.namaSekolah || ""; document.getElementById('inputTotalHari').value = data.totalHari || 5; document.getElementById('inputHariKe').value = data.hariBerjalan || 0; document.getElementById('inputMasterKelas').value = data.masterKelas || ""; document.getElementById('inputBriefing').value = data.briefing || ""; document.getElementById('inputJadwal').value = data.jadwal || ""; document.getElementById('inputGoal').value = data.goal || ""; document.getElementById('inputMasterSiswa').value = data.masterSiswa || "";
        rawKurikulum = data.kurikulum || { vocab: [], speaking: [], grammar: [], practice: [] }; 
        document.getElementById('inputVocab').value = rawKurikulum.vocab ? rawKurikulum.vocab.join('\n') : ""; document.getElementById('inputSpeaking').value = rawKurikulum.speaking ? rawKurikulum.speaking.join('\n') : ""; document.getElementById('inputGrammar').value = rawKurikulum.grammar ? rawKurikulum.grammar.join('\n') : ""; document.getElementById('inputPractice').value = rawKurikulum.practice ? rawKurikulum.practice.join('\n') : "";
        currentAssignedMentors = data.assignedMentors || []; renderMentorChecklist();
        const arrKelas = (data.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
        const sels = ['filterKelasSiswa', 'trackerKelas', 'filterKelasHistori', 'waTarget', 'filterWA'];
        sels.forEach(id => { const el = document.getElementById(id); if(!el) return; el.innerHTML = ""; if(id==='waTarget') el.innerHTML+=`<option value="GLOBAL (Semua Ruang)">GLOBAL</option>`; else el.innerHTML+=`<option value="SEMUA">Semua Kelas</option>`; arrKelas.forEach(k => el.innerHTML+=`<option value="${k}">${k}</option>`); });
        renderTracker();
    });
    unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { dataLengkap = []; snap.forEach(doc => dataLengkap.push({ id: doc.id, ...doc.data() })); dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); ekstrakHari(); renderListAdmin(); renderTracker(); kalkulasiDataSiswa(); kalkulasiKinerjaMentor(); });
    unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
        let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() })); chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = ""; 
        chats.forEach(c => {
            if (c.type === 'global') {
                const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; 
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div><b>${c.sender}</b>: ${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time} <i class="bi bi-trash ms-2 text-danger" style="cursor:pointer;" onclick="window.hapusPesan('${c.id}')"></i></div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });
    unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push({ id: doc.id, ...doc.data() })); masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); renderTugasWA(); });
}
window.hapusPesan = async function(cid) { if(confirm("Hapus pesan ini dari ruang diskusi?")) await deleteDoc(doc(db, "chats", cid)); };

// 7. TAB TUTOR SINKRON (ADMIN KEBAL PENGHAPUSAN)
onSnapshot(collection(db, "users"), (snap) => {
    globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = "";
    snap.forEach(d => {
        const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud});
        let btnStatus = ""; let btnHapus = "";
        
        if (ud.role === 'admin') {
            btnStatus = `<span class="badge bg-secondary p-1 text-xs" style="font-size:0.65rem !important;"><i class="bi bi-shield-lock-fill"></i> Admin</span>`;
            btnHapus = `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1 rounded-pill" disabled title="Terkunci"><i class="bi bi-trash"></i></button>`;
        } else {
            const statusIcon = ud.status === 'aktif' ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted';
            const nextStatus = ud.status === 'aktif' ? 'nonaktif' : 'aktif';
            btnStatus = `<button class="btn btn-sm bg-transparent border-0 p-0" onclick="window.toggleUser('${uid}', '${nextStatus}')" title="Ubah Status Aktif"><i class="bi ${statusIcon} fs-4"></i></button>`;
            btnHapus = `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.hapusUserPermanen('${uid}')" title="Hapus Permanen Akun"><i class="bi bi-trash"></i></button>`;
        }
        const btnEdit = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.siapEditUser('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')" title="Ubah Data"><i class="bi bi-pencil"></i></button>`;
        tbody.innerHTML += `<tr><td class="text-start ps-2"><b>${uid}</b><br><small class="text-muted">${ud.julukan}</small></td><td class="text-uppercase fw-bold text-xs">${ud.role}<br><span class="text-danger font-monospace">${ud.pin}</span></td><td><div class="d-flex justify-content-center align-items-center gap-1">${btnStatus}${btnEdit}${btnHapus}</div></td></tr>`;
    }); renderMentorChecklist();
});

window.toggleUser = async function(uid, st) { await updateDoc(doc(db, "users", uid), { status: st }); };
window.hapusUserPermanen = async function(uid) { if(confirm(`Apakah Anda yakin ingin menghapus akun ${uid} secara permanen?`)) await deleteDoc(doc(db, "users", uid)); };
window.siapEditUser = function(uid, nama, role, pin) { document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; document.getElementById("newPin").value = pin; document.getElementById("newName").value = nama; document.getElementById("newRole").value = role; };

document.getElementById("btnAddUser").onclick = async () => { const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value; const n = document.getElementById("newName").value; const r = document.getElementById("newRole").value; if(!u || !p || !n) return alert("Mohon Lengkapi Formulir Pendaftaran!"); await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); alert("Data Akun Berhasil Disimpan!"); document.getElementById("newUser").readOnly = false; document.getElementById("newUser").value=""; document.getElementById("newPin").value=""; document.getElementById("newName").value=""; };

// 8. MANAJEMEN SEKOLAH & FITUR EXCEL
document.getElementById("btnSaveSchool").onclick = async () => {
    const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return alert("ID Handle Sekolah tidak boleh kosong!");
    const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
    const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
    try { await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); alert("Konfigurasi Sekolah Tersimpan!"); window.langsungKeSekolah(sid); } catch (e) { alert("Penyimpanan Gagal."); }
};
document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW' && confirm("Anda yakin ingin menyembunyikan arsip sekolah ini?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); alert("Sekolah Diarsipkan!"); window.langsungKeSekolah(""); } };

document.getElementById('btnImportExcel').onclick = function() {
    const file = document.getElementById('excelSiswa').files[0]; if(!file) return alert("Silakan lampirkan format file excel!");
    const reader = new FileReader(); reader.onload = function(e) {
        try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } }); let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); } document.getElementById('inputMasterSiswa').value = output.join('\n'); alert("Impor Data Excel Berhasil!"); } catch(error) { alert("Format Gagal Dibaca Oleh Sistem."); }
    }; reader.readAsArrayBuffer(file);
};

// 9. KALKULASI LAPORAN (LOGBOOK, RAPOR SISWA, PDF)
function ekstrakHari() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Log Data</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1}</option>`; }); }
function renderListAdmin() { const container = document.getElementById("adminLogbookList"); if(!container) return; container.innerHTML = ""; const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value; let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dataTampil = dataTampil.filter(d => d.kelas === fKelas); if(dataTampil.length === 0) { container.innerHTML = `<div class="alert alert-secondary text-center small">Pencatatan Kosong.</div>`; return; } dataTampil.forEach(d => { container.innerHTML += `<div class="p-2 border rounded bg-white mb-2 text-xs text-dark"><b>${d.nama.toUpperCase()}</b> (${d.kelas})<br>📖 Materi: ${d.materi?.join(', ')}<br>📝 Note: ${d.laporanSiswa || '-'}<div class="text-end"><button class="btn btn-xs btn-outline-danger py-0 px-2 rounded-pill" onclick="window.aksidminHapus('${d.id}')">Hapus Laporan</button></div></div>`; }); }
window.aksidminHapus = async function(id) { if(confirm("Hapus laporan pengajaran ini secara permanen?")) await deleteDoc(doc(db, "logbooks", id)); };
document.getElementById('filterHari').onchange = () => renderListAdmin(); document.getElementById('filterKelasHistori').onchange = () => renderListAdmin();

function renderTracker() { const area = document.getElementById("areaTracker"); const kelasAktif = document.getElementById("trackerKelas").value; if(!area || !rawKurikulum || Object.keys(rawKurikulum).length === 0) return; let materiSelesai = new Set(); dataLengkap.forEach(log => { if (log.kelas === kelasAktif && log.materi) { log.materi.forEach(m => materiSelesai.add(m)); } }); const renderBlok = (judul, arrayMateri, warna) => { if(!arrayMateri || arrayMateri.length === 0) return ''; let listHtml = ""; arrayMateri.forEach(mat => { const isDone = materiSelesai.has(mat); const icon = isDone ? `<i class="bi bi-check-circle-fill text-${warna}"></i>` : `<i class="bi bi-circle text-secondary opacity-50"></i>`; const bg = isDone ? `bg-${warna} bg-opacity-10 border-${warna}` : 'bg-transparent text-muted border'; listHtml += `<div class="p-1 mb-1 rounded text-xs d-flex justify-content-between ${bg}"><span class="${isDone ? 'fw-bold' : ''}">${mat}</span> <span>${icon}</span></div>`; }); return `<div class="mb-2"><h6 class="text-xs fw-bold text-${warna} mb-1 border-bottom pb-1">${judul}</h6>${listHtml}</div>`; }; area.innerHTML = renderBlok("KOSAKATA", rawKurikulum.vocab, "primary") + renderBlok("BERBICARA", rawKurikulum.speaking, "success") + renderBlok("TATA BAHASA", rawKurikulum.grammar, "danger") + renderBlok("PRAKTIK KELAS", rawKurikulum.practice, "warning"); }
document.getElementById('trackerKelas').onchange = () => renderTracker();

function kalkulasiDataSiswa() { const kls = document.getElementById("filterKelasSiswa").value; let rekap = {}; dataLengkap.forEach(log => { if(log.kelas === kls && log.dataSiswa) { log.dataSiswa.forEach(s => { if(!rekap[s.nama]) rekap[s.nama] = { h:0, a:0, s:0, i:0, poin:0 }; if(s.kehadiran === 'h') rekap[s.nama].h++; else if(s.kehadiran === 'a') rekap[s.nama].a++; else if(s.kehadiran === 's') rekap[s.nama].s++; else if(s.kehadiran === 'i') rekap[s.nama].i++; let nStr = (s.nilai || "").toString().toLowerCase().trim(); if(nStr === 'a' || nStr === 'a+') rekap[s.nama].poin += 90; else if(parseInt(nStr) > 0) rekap[s.nama].poin += parseInt(nStr); }); } }); const tBody = document.getElementById("tabelRekapSiswa"); if(tBody) { tBody.innerHTML = ""; Object.keys(rekap).sort().forEach((nm, idx) => { const r = rekap[nm]; tBody.innerHTML += `<tr><td>${idx+1}</td><td class="text-start fw-bold text-dark">${nm}</td><td class="text-dark">${r.h}</td><td class="text-dark">${r.a}</td><td class="text-dark">${r.s}</td><td class="text-dark">${r.i}</td><td class="fw-bold text-success">${r.poin}</td></tr>`; }); } const listTop = document.getElementById("listTop10"); if(listTop) { listTop.innerHTML = ""; let arrPeringkat = Object.entries(rekap).map(([nama, data]) => ({ nama, poin: data.poin })).sort((a,b) => b.poin - a.poin).slice(0, 10); arrPeringkat.forEach((item, idx) => { let badge = idx === 0 ? "bg-warning text-dark" : (idx === 1 ? "bg-secondary text-white" : "bg-wa text-white"); listTop.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-light text-sm"><div class="fw-bold text-dark"><span class="badge ${badge} me-2 rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`; }); } }
document.getElementById('filterKelasSiswa').onchange = () => kalkulasiDataSiswa();

function kalkulasiKinerjaMentor() { let rekapMentor = {}; dataLengkap.forEach(log => { if(!rekapMentor[log.nama]) rekapMentor[log.nama] = 0; rekapMentor[log.nama]++; }); const board = document.getElementById("leaderboardTutor"); if(!board) return; board.innerHTML = ""; Object.entries(rekapMentor).sort((a,b)=>b[1]-a[1]).forEach(([nm, ct], idx) => { let med = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : "🏅"); board.innerHTML += `<div class="d-flex justify-content-between p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark">${med} ${nm}</div><div class="badge bg-wa rounded-pill">${ct} Logbook</div></div>`; }); }

document.getElementById("btnExportPDF").onclick = () => {
    if(!currentSchoolId || currentSchoolId==='NEW') return alert("Pilih lokasi sekolah di bilah atas!");
    const fHari = document.getElementById("filterHari").value; let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari);
    const printDiv = document.createElement("div"); printDiv.style.fontFamily = "Arial, sans-serif"; printDiv.style.padding = "20px";
    let htmlString = `<h3 style="text-align:center; font-family: Arial, sans-serif; margin-bottom: 20px;">LAPORAN LOGBOOK MENTOR<br><small style="font-size:12px; font-weight:normal;">Sekolah: ${document.getElementById('inputSekolah').value} | Rekam: ${fHari}</small></h3><table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: Arial, sans-serif;" border="1"><tr style="background-color: #f2f2f2; text-align: center;"><th style="padding:5px;">WAKTU</th><th style="padding:5px;">MENTOR</th><th style="padding:5px;">KELAS / JAM</th><th style="padding:5px; width: 35%;">MATERI & LAPORAN</th><th style="padding:5px; width: 35%;">RAPOR SISWA</th></tr>`;
    dataTampil.forEach(d => {
        const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'; let dJam = (d.jamKe||"").replace('Jam ','Jam ke-'); let ds = d.dataSiswa && d.dataSiswa.length > 0 ? `<table style="width:100%; font-size:9px; border-collapse: collapse;"><tr style="border-bottom:1px solid #ddd;"><th>Nama</th><th>Abs</th><th>Nilai</th></tr>` + d.dataSiswa.map(s => `<tr><td>${s.nama}</td><td style="text-align:center;">${s.kehadiran.toUpperCase()}</td><td style="text-align:center;">${s.nilai || '-'}</td></tr>`).join('') + `</table>` : 'Belum ada input';
        htmlString += `<tr><td style="padding:5px; text-align:center;">${w}</td><td style="padding:5px; text-align:center; font-weight:bold;">${d.nama}</td><td style="padding:5px; text-align:center;">${d.kelas}<br><b>${dJam}</b></td><td style="padding:5px;"><b>Materi:</b> ${d.materi.join(', ')}<br><b>Class Note:</b> ${d.laporanSiswa}<br><b>Tugas:</b> ${d.tugasSiswa}</td><td style="padding:5px;">${ds}</td></tr>`;
    }); htmlString += `</table>`; printDiv.innerHTML = htmlString;
    html2pdf().set({ margin: 0.3, filename: `AEC_Report_${currentSchoolId}_${fHari.replace(/\//g, "-")}.pdf`, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }}).from(printDiv).save();
};

// 10. TUGAS WA & MATERI CLOUD
document.getElementById("btnKirimTugasWA").onclick = async () => { const i = document.getElementById("waInstruksi").value; if(!i) return alert("Instruksi tugas wajib diisi!"); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: document.getElementById("waTarget").value, linkGambar: document.getElementById("waGambar").value, instruksi: i, waktu: serverTimestamp() }); alert("Instruksi Tugas WA Terkirim ke Dasbor Mentor!"); document.getElementById("waInstruksi").value = ""; document.getElementById("waGambar").value = ""; };
function renderTugasWA() { const listHariIni = document.getElementById("listTugasWAHarian"); const listSemua = document.getElementById("listTugasWAHistory"); const fil = document.getElementById("filterWA").value; if(!listHariIni || !listSemua) return; listHariIni.innerHTML = ""; listSemua.innerHTML = ""; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); let htmlSemua = ""; dt.forEach((d) => { const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 100px; object-fit: cover;">` : ''; htmlSemua += `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm font-monospace" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-outline-danger btn-sm mt-2 rounded-pill" onclick="window.aksidminHapusTugas('${d.id}')"><i class="bi bi-trash"></i> Tarik Tugas</button></div>`; }); listSemua.innerHTML = htmlSemua || `<div class="alert text-center border-0 text-muted bg-transparent mt-3">Kosong.</div>`; }
window.aksidminHapusTugas = async function(id) { if (confirm(`Hapus template tugas instruksi ini?`)) await deleteDoc(doc(db, "tugas_wa", id)); };
document.getElementById("filterWA").onchange = () => renderTugasWA();

document.getElementById("btnSaveMateri").onclick = async () => { const j = document.getElementById("materiJudul").value; const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value; if(!j || !l) return alert("Penyematan Judul dan Tautan wajib diisi!"); await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() }); alert("Materi tersimpan di Awan!"); document.getElementById("materiJudul").value = ""; document.getElementById("materiLink").value = ""; };
onSnapshot(collection(db, "materials"), (snap) => { const list = document.getElementById("listGudangMateri"); if(!list) return; list.innerHTML = ""; snap.forEach(d => { const data = d.data(); list.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm"><div><div class="fw-bold text-dark text-sm">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div><a href="${data.link}" target="_blank" class="text-xs text-primary text-decoration-none"><i class="bi bi-link-45deg"></i> Buka Tautan</a></div><button class="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill" onclick="window.hapusMateri('${d.id}')"><i class="bi bi-trash"></i></button></div>`; }); });
window.hapusMateri = async function(id) { if(confirm("Menghapus materi secara permanen dari perpustakaan?")) await deleteDoc(doc(db, "materials", id)); }

function renderMentorChecklist() { const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = ""; globalAllUsers.filter(u => u.status === 'aktif').forEach(u => { const isChecked = currentAssignedMentors.includes(u.id) ? "checked" : ""; setupMentorList.innerHTML += `<div class="col-6"><div class="form-check border p-1 bg-white rounded"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${isChecked}><label class="form-check-label ms-1" for="chk_${u.id}">${u.julukan}</label></div></div>`; }); }
document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "admin" }); document.getElementById("inputChat").value = ""; };

// Eksekusi Pemicu UI Awal
document.addEventListener("DOMContentLoaded", () => { initGlobalUI(); });
