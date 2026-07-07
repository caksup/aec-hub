/* ==================================================
   su.js - Skrip Pengendali Utama (Panel Admin)
   AEC Hub - Versi 1.5.3 Ultimate
   
   Riwayat Versi (JS):
   - v1.0: Pengaturan inisialisasi awal Firebase Firestore.
   - v1.1: Fungsi autentikasi masuk (login).
   - v1.2: CRUD manajemen data sekolah, mentor, & impor XLSX.
   - v1.3: Pemisahan skrip modular.
   - v1.4: Pemindahan jalur simpan Peta Jalan.
   - v1.5: Inisialisasi siklus tema antarmuka.
   - v1.5.1: Penghasil waktu nyata & Offcanvas.
   - v1.5.2: Pembenahan kueri untuk sinkronisasi rapi.
   - v1.5.3: (CURRENT) Restrukturisasi logika mengikuti pembaruan DOM HTML terbaru. Penggabungan logika Nilai A, B, C global, penggabungan Setup, penarikan Arsip Sekolah ke dalam Tab Overview.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", authDomain: "special-mentor.firebaseapp.com", projectId: "special-mentor", storageBucket: "special-mentor.firebasestorage.app", messagingSenderId: "1075582532703", appId: "1:1075582532703:web:969365cefff8999335efea" };
const app = initializeApp(firebaseConfig); export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => { console.warn("PWA Offline mode:", err.code); });

const actUser = localStorage.getItem("loggedInUser"); const myName = localStorage.getItem("loggedInName");
if (actUser !== "sup" && actUser !== "afif") window.location.replace("index.html");
document.getElementById("userNameDisplay").innerText = myName || "Admin AEC";
document.getElementById("userIdDisplay").innerText = actUser || "admin";

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
    if (t === 'system') { document.documentElement.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else { document.documentElement.setAttribute('data-theme', t); }
    const iconEl = document.getElementById("themeIconDisplay");
    if(iconEl) { iconEl.className = `bi ${themeIcons[index]} fs-4 text-white`; void iconEl.offsetWidth; iconEl.classList.add("theme-icon-animate"); }
}
applyThemeVisuals(currentThemeIndex);

const btnCycleTheme = document.getElementById("btnCycleTheme");
if(btnCycleTheme) { btnCycleTheme.onclick = () => { currentThemeIndex = (currentThemeIndex + 1) % 3; applyThemeVisuals(currentThemeIndex); }; }

function updateClock() {
    const el = document.getElementById('headClockDate'); if(!el) return; const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
    el.innerText = `${dateStr}\n${timeStr} WIB`;
}
setInterval(updateClock, 1000); updateClock();

const btnLogoutOffcanvas = document.getElementById("btnLogoutOffcanvas");
if(btnLogoutOffcanvas) { btnLogoutOffcanvas.onclick = (e) => { e.preventDefault(); if(confirm("Keluar dari sistem keamanan AEC Hub?")) { localStorage.clear(); window.location.replace("index.html"); } }; }

let currentSchoolId = ""; let rawKurikulum = {}; let dataLengkap = []; let masterTugasWA = [];
let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

function bersihkanListener() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; masterTugasWA = []; }

// MANAJEMEN SEKOLAH & TINJAUAN (OVERVIEW)
onSnapshot(collection(db, "schools"), (snap) => { 
    globalAllSchools = []; let archivedSchools = [];
    snap.forEach(d => { 
        if(d.data().status !== 'archived') { globalAllSchools.push({ id: d.id, ...d.data() }); }
        else { archivedSchools.push({ id: d.id, ...d.data() }); }
    }); 
    renderModernSchoolSelect(); renderOverviewCards(); kalkulasiSiswaGlobal();
    
    // Rendering Arsip di tab Overview -> Logbook -> Arsip
    const listArsip = document.getElementById("listArsipSekolah");
    if(listArsip) {
        listArsip.innerHTML = "";
        if(archivedSchools.length === 0) listArsip.innerHTML = "<div class='text-muted small text-center'>Belum ada arsip.</div>";
        archivedSchools.forEach(s => {
            listArsip.innerHTML += `<div class="list-group-item d-flex justify-content-between align-items-center bg-white border mb-1 rounded"><div class="fw-bold text-dark text-sm">${s.namaSekolah}</div><button class="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill" onclick="window.lihatLogbookArsip('${s.id}')">Lihat</button></div>`;
        });
    }
});

window.lihatLogbookArsip = async function(schoolId) {
    const area = document.getElementById("areaLogbookArsip"); const konten = document.getElementById("kontenLogbookArsip");
    document.getElementById("judulArsipLogbook").innerText = "Riwayat: " + schoolId; area.classList.remove("d-none");
    konten.innerHTML = '<div class="text-center small text-muted">Memuat...</div>';
    try {
        const logsSnap = await getDocs(query(collection(db, "logbooks"), where("schoolId", "==", schoolId))); let arrLogs = [];
        logsSnap.forEach(d => arrLogs.push({id: d.id, ...d.data()})); arrLogs.sort((a,b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        if(arrLogs.length === 0) { konten.innerHTML = '<div class="text-center text-muted mt-2">Tidak ada logbook.</div>'; return; }
        let htmlLogs = ''; arrLogs.forEach(d => { htmlLogs += `<div class="p-2 border rounded mb-2 bg-light"><div class="fw-bold text-wa">${d.nama.toUpperCase()}</div><div class="text-dark">Materi: ${d.materi?.join(', ')}</div></div>`; });
        konten.innerHTML = htmlLogs;
    } catch (error) { konten.innerHTML = '<div class="text-danger text-center">Gagal memuat logbook arsip.</div>'; }
};

function renderOverviewCards() {
    const container = document.getElementById("overviewCardsContainer"); 
    const pesertaContainer = document.getElementById("trackerPesertaList");
    
    if (!container) return; container.innerHTML = ""; let totalPesertaGlobal = 0;

    if (globalAllSchools.length === 0) { 
        container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif.</div></div>`; 
        if(pesertaContainer) pesertaContainer.innerHTML = "0 Peserta"; return; 
    }

    globalAllSchools.forEach(s => {
        let jmlSiswa = 0; 
        if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').filter(n => n.trim() !== "").length; } }); }
        totalPesertaGlobal += jmlSiswa; const jmlTutor = (s.assignedMentors || []).length;

        container.innerHTML += `
            <div class="col-12 col-md-6">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-1" style="cursor: pointer; border-left: 4px solid #128C7E !important;" onclick="window.langsungKeSekolah('${s.id}')">
                    <div class="card-body p-3">
                        <h6 class="fw-bold text-dark mb-3 text-truncate"><i class="bi bi-building-check text-wa me-2"></i>${s.namaSekolah}</h6>
                        <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Tanggal Mulai:</span><span class="text-xs fw-bold text-dark">${s.waktuUpdate ? s.waktuUpdate.toDate().toLocaleDateString('id-ID') : '-'}</span></div>
                        <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Hari Berjalan:</span><span class="badge bg-wa text-white rounded-pill">Hari ke-${s.hariBerjalan||0}</span></div>
                        <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Jumlah Mentor:</span><span class="badge bg-light text-dark border rounded-pill">${jmlTutor} Orang</span></div>
                        <div class="d-flex justify-content-between align-items-center"><span class="text-secondary text-xs fw-bold">Jumlah Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jmlSiswa} Peserta</span></div>
                    </div>
                </div>
            </div>`;
    });

    if(pesertaContainer) pesertaContainer.innerHTML = `<h5 class="fw-bold text-wa">${totalPesertaGlobal}</h5><span class="text-xs text-muted">Total peserta keseluruhan sekolah.</span>`;
}

function renderModernSchoolSelect() {
    const container = document.getElementById("modernSchoolSelect"); if (!container) return;
    let htmlContent = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value=""><i class="bi bi-globe"></i><span class="tab-label">GLOBAL</span></button>`;
    htmlContent += `<button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa active-pill' : 'btn-outline-success'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW"><i class="bi bi-plus-circle"></i><span class="tab-label">BARU</span></button>`;
    globalAllSchools.forEach(s => { const isAct = (currentSchoolId === s.id); htmlContent += `<button class="btn btn-sm ${isAct ? 'btn-wa active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}"><i class="bi bi-building"></i><span class="tab-label">${s.namaSekolah}</span></button>`; });
    container.innerHTML = htmlContent;
    container.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.currentTarget.getAttribute('data-value')); }; });
}

window.langsungKeSekolah = function(val) {
    bersihkanListener(); currentSchoolId = val; renderModernSchoolSelect();
    if(!val) {
        document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Pilih sekolah spesifik untuk detail laporan.</div>`;
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); kalkulasiSiswaGlobal();
    } else if(val === "NEW") {
        document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = "";
        document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
        currentAssignedMentors = []; renderMentorChecklist(); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#setup-spesifik"]')).show();
    } else {
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#logbook-aktif"]')).show();
        muatDataSekolah(val);
    }
}

function muatDataSekolah(sid) {
    unsubSchool = onSnapshot(doc(db, "schools", sid), (docSnap) => {
        if(!docSnap.exists()) return; const data = docSnap.data();
        document.getElementById('inputIdSchool').value = sid; document.getElementById('inputIdSchool').readOnly = true;
        document.getElementById('inputSekolah').value = data.namaSekolah || ""; document.getElementById('inputTotalHari').value = data.totalHari || 5; document.getElementById('inputHariKe').value = data.hariBerjalan || 0; document.getElementById('inputMasterKelas').value = data.masterKelas || ""; document.getElementById('inputBriefing').value = data.briefing || ""; document.getElementById('inputJadwal').value = data.jadwal || ""; document.getElementById('inputGoal').value = data.goal || ""; document.getElementById('inputMasterSiswa').value = data.masterSiswa || "";
        rawKurikulum = data.kurikulum || {}; 
        document.getElementById('inputVocab').value = rawKurikulum.vocab ? rawKurikulum.vocab.join('\n') : ""; document.getElementById('inputSpeaking').value = rawKurikulum.speaking ? rawKurikulum.speaking.join('\n') : ""; document.getElementById('inputGrammar').value = rawKurikulum.grammar ? rawKurikulum.grammar.join('\n') : ""; document.getElementById('inputPractice').value = rawKurikulum.practice ? rawKurikulum.practice.join('\n') : "";
        currentAssignedMentors = data.assignedMentors || []; renderMentorChecklist();
        
        const arrKelas = (data.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
        const sels = ['filterKelasHistori', 'waTarget', 'filterWA'];
        sels.forEach(id => { const el = document.getElementById(id); if(!el) return; el.innerHTML = ""; if(id === 'waTarget') el.innerHTML += `<option value="GLOBAL (Semua Ruang)">GLOBAL</option>`; else el.innerHTML += `<option value="SEMUA">Semua Kelas</option>`; arrKelas.forEach(k => el.innerHTML += `<option value="${k}">${k}</option>`); });
    });

    unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { 
        dataLengkap = []; snap.forEach(doc => dataLengkap.push({ id: doc.id, ...doc.data() })); dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); 
        ekstrakHariLogbook(); renderListLogbookAdmin(); kalkulasiKinerjaTutor(); 
    });
    
    unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
        let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() })); chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = ""; 
        chats.forEach(c => {
            if (c.type === 'global') {
                const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; 
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time} <i class="bi bi-trash ms-2 text-danger" style="cursor:pointer;" onclick="window.hapusPesanObrolan('${c.id}')"></i></div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });

    unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(doc => masterTugasWA.push({ id: doc.id, ...doc.data() })); masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); renderRiwayatTugasWA(); });
}

// LOGIKA PETA JALAN (ROADMAP) - Tampil di Overview dan Input di Setup
document.getElementById("btnSimpanRoadmap").onclick = async () => {
    const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim();
    if(!w || !j) return alert("Waktu dan Judul wajib diisi!");
    try { await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() }); alert("Roadmap disimpan!"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = ""; } catch(e) { alert(e.message); }
};

onSnapshot(query(collection(db, "roadmaps")), (snap) => {
    const listOverview = document.getElementById("overviewRoadmap"); const listSistem = document.getElementById("sistemRoadmapList");
    if(listOverview) listOverview.innerHTML = ""; if(listSistem) listSistem.innerHTML = "";
    let dataRoadmap = []; snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); }); dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    dataRoadmap.forEach(r => { 
        if(listOverview) listOverview.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`; 
        if(listSistem) listSistem.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom"><div><div class="fw-bold text-dark text-sm">${r.judul}</div><div class="text-muted" style="font-size:0.65rem">${r.waktu_target}</div></div><i class="bi bi-trash text-danger" style="cursor:pointer;" onclick="window.hapusRoadmap('${r.id}')"></i></li>`;
    });
});
window.hapusRoadmap = async function(id) { if(confirm("Hapus roadmap ini?")) await deleteDoc(doc(db, "roadmaps", id)); };

// MANAJEMEN TUTOR
onSnapshot(collection(db, "users"), (snap) => {
    globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = "";
    snap.forEach(d => {
        const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud});
        let btnStatus = ""; let btnHapus = "";
        if (ud.role === 'admin') {
            btnStatus = `<span class="badge bg-secondary p-1 text-xs" style="font-size:0.6rem !important;"><i class="bi bi-shield-lock-fill"></i> Kebal</span>`;
            btnHapus = `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1 rounded-pill" disabled><i class="bi bi-trash"></i></button>`;
        } else {
            const statusIcon = ud.status === 'aktif' ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted';
            const nextStatus = ud.status === 'aktif' ? 'nonaktif' : 'aktif';
            btnStatus = `<button class="btn btn-sm bg-transparent border-0 p-0" onclick="window.ubahStatusPengguna('${uid}', '${nextStatus}')"><i class="bi ${statusIcon} fs-4"></i></button>`;
            btnHapus = `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.hapusPenggunaPermanen('${uid}')"><i class="bi bi-trash"></i></button>`;
        }
        const btnEdit = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.siapSuntingPengguna('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')"><i class="bi bi-pencil"></i></button>`;
        tbody.innerHTML += `<tr><td class="text-start ps-2"><b>${uid}</b><br><small class="text-muted">${ud.julukan}</small></td><td class="text-uppercase fw-bold text-xs">${ud.role}<br><span class="text-danger font-monospace">${ud.pin}</span></td><td><div class="d-flex justify-content-center align-items-center gap-1">${btnStatus}${btnEdit}${btnHapus}</div></td></tr>`;
    }); renderMentorChecklist();
});

window.ubahStatusPengguna = async function(uid, statusBaru) { await updateDoc(doc(db, "users", uid), { status: statusBaru }); };
window.hapusPenggunaPermanen = async function(uid) { if(confirm(`Hapus permanen akun ${uid}?`)) await deleteDoc(doc(db, "users", uid)); };
window.siapSuntingPengguna = function(uid, nama, role, pin) { document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; document.getElementById("newPin").value = pin; document.getElementById("newName").value = nama; document.getElementById("newRole").value = role; };
document.getElementById("btnAddUser").onclick = async () => { const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value.trim(); const n = document.getElementById("newName").value.trim(); const r = document.getElementById("newRole").value; if(!u || !p || !n) return alert("Lengkapi form!"); await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); alert("Disimpan!"); document.getElementById("newUser").readOnly = false; document.getElementById("newUser").value = ""; document.getElementById("newPin").value = ""; document.getElementById("newName").value = ""; };
function renderMentorChecklist() { const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = ""; globalAllUsers.filter(u => u.status === 'aktif').forEach(u => { const isChecked = currentAssignedMentors.includes(u.id) ? "checked" : ""; setupMentorList.innerHTML += `<div class="col-6"><div class="form-check border p-1 bg-white rounded shadow-sm"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${isChecked}><label class="form-check-label ms-1 text-xs fw-bold" for="chk_${u.id}">${u.julukan}</label></div></div>`; }); }

// PENGATURAN SEKOLAH (SETUP)
document.getElementById("btnSaveSchool").onclick = async () => {
    const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return alert("ID Sekolah wajib!");
    const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
    const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
    try { await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); alert("Sekolah disimpan!"); window.langsungKeSekolah(sid); } catch (e) { alert(e.message); }
};
document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW') { if(confirm("Arsipkan sekolah ini?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); alert("Diarsipkan!"); window.langsungKeSekolah(""); } } };
document.getElementById('btnImportExcel').onclick = function() {
    const file = document.getElementById('excelSiswa').files[0]; if(!file) return alert("Pilih Excel!");
    const reader = new FileReader(); reader.onload = function(e) {
        try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } }); let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); } document.getElementById('inputMasterSiswa').value = output.join('\n'); alert("Impor Berhasil!"); } catch(error) { alert("Format gagal dibaca."); }
    }; reader.readAsArrayBuffer(file);
};

// REKAPITULASI
function ekstrakHariLogbook() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Log</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1}</option>`; }); }
function renderListLogbookAdmin() { 
    const container = document.getElementById("adminLogbookList"); if(!container) return; container.innerHTML = ""; 
    const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value; 
    let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dataTampil = dataTampil.filter(d => d.kelas === fKelas); 
    if(dataTampil.length === 0) { container.innerHTML = `<div class="alert alert-secondary text-center small border-0">Logbook Kosong.</div>`; return; } 
    dataTampil.forEach(d => { container.innerHTML += `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs text-dark"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><b class="text-wa">${d.nama.toUpperCase()}</b><span class="badge bg-secondary rounded-pill">${d.kelas}</span></div><div class="mb-1">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div class="mb-1">📝 <b>Catatan:</b> ${d.laporanSiswa || '-'}</div><div class="text-end mt-2"><button class="btn btn-xs btn-outline-danger py-0 px-3 rounded-pill fw-bold" onclick="window.hapusLaporanLogbook('${d.id}')">Hapus Laporan</button></div></div>`; }); 
}
window.hapusLaporanLogbook = async function(id) { if(confirm("Hapus laporan pengajaran ini secara permanen?")) await deleteDoc(doc(db, "logbooks", id)); };
document.getElementById('filterHari').addEventListener('change', renderListLogbookAdmin); document.getElementById('filterKelasHistori').addEventListener('change', renderListLogbookAdmin);

function kalkulasiKinerjaTutor() { let rekapMentor = {}; dataLengkap.forEach(log => { if(!rekapMentor[log.nama]) rekapMentor[log.nama] = 0; rekapMentor[log.nama]++; }); const board = document.getElementById("leaderboardTutor"); if(!board) return; board.innerHTML = ""; Object.entries(rekapMentor).sort((a,b)=>b[1]-a[1]).forEach(([nm, ct], idx) => { let med = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : "🏅"); board.innerHTML += `<div class="d-flex justify-content-between p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark">${med} ${nm}</div><div class="badge bg-wa rounded-pill">${ct} Logbook</div></div>`; }); }

async function kalkulasiSiswaGlobal() {
    const tabelNilai = document.getElementById("tabelNilaiGlobal"); const labelHadir = document.getElementById("containerKehadiranGlobal");
    if(!tabelNilai || !labelHadir) return; tabelNilai.innerHTML = `<tr><td colspan="6" class="text-muted">Memuat data global...</td></tr>`;
    let rekapSiswaGlobal = {}; let totalKehadiranGlobal = { h: 0, a: 0, s: 0, i: 0 };
    let activeIds = globalAllSchools.map(s => s.id);
    if(activeIds.length === 0) { tabelNilai.innerHTML = `<tr><td colspan="6" class="text-muted">Tidak ada data.</td></tr>`; labelHadir.innerHTML = `Belum ada aktivitas.`; return; }
    try {
        const logbooksSnap = await getDocs(collection(db, "logbooks"));
        logbooksSnap.forEach(doc => {
            const data = doc.data();
            if(activeIds.includes(data.schoolId) && data.dataSiswa) {
                data.dataSiswa.forEach(siswa => {
                    const identitas = `${siswa.nama} (${data.kelas})`;
                    if(!rekapSiswaGlobal[identitas]) rekapSiswaGlobal[identitas] = { vocab: '-', speak: '-', grammar: '-', prac: '-' };
                    let nilaiHuruf = (siswa.nilai || "").toUpperCase();
                    if(nilaiHuruf === 'A' || nilaiHuruf === 'B' || nilaiHuruf === 'C') {
                        let mStr = (data.materi || []).join(' ').toLowerCase();
                        if(mStr.includes('vocab')) rekapSiswaGlobal[identitas].vocab = nilaiHuruf;
                        if(mStr.includes('speak')) rekapSiswaGlobal[identitas].speak = nilaiHuruf;
                        if(mStr.includes('gram')) rekapSiswaGlobal[identitas].grammar = nilaiHuruf;
                        if(mStr.includes('prac')) rekapSiswaGlobal[identitas].prac = nilaiHuruf;
                    }
                    if(siswa.kehadiran === 'h') totalKehadiranGlobal.h++; if(siswa.kehadiran === 'a') totalKehadiranGlobal.a++; if(siswa.kehadiran === 's') totalKehadiranGlobal.s++; if(siswa.kehadiran === 'i') totalKehadiranGlobal.i++;
                });
            }
        });
        let barisHtml = ""; let nomor = 1;
        for (const [nama, nl] of Object.entries(rekapSiswaGlobal)) { barisHtml += `<tr><td class="text-muted">${nomor++}</td><td class="text-start fw-bold text-dark text-xs">${nama}</td><td class="fw-bold ${nl.vocab==='A'?'text-success':(nl.vocab==='B'?'text-primary':'text-danger')}">${nl.vocab}</td><td class="fw-bold ${nl.speak==='A'?'text-success':(nl.speak==='B'?'text-primary':'text-danger')}">${nl.speak}</td><td class="fw-bold ${nl.grammar==='A'?'text-success':(nl.grammar==='B'?'text-primary':'text-danger')}">${nl.grammar}</td><td class="fw-bold ${nl.prac==='A'?'text-success':(nl.prac==='B'?'text-primary':'text-danger')}">${nl.prac}</td></tr>`; }
        tabelNilai.innerHTML = barisHtml || `<tr><td colspan="6" class="text-muted">Kosong.</td></tr>`;
        labelHadir.innerHTML = `<div class="row g-2 text-center mt-2"><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-success mb-1">${totalKehadiranGlobal.h}</h3><span class="text-xs text-muted fw-bold">TOTAL HADIR</span></div></div><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-danger mb-1">${totalKehadiranGlobal.a}</h3><span class="text-xs text-muted fw-bold">TOTAL ALFA</span></div></div><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-warning mb-1">${totalKehadiranGlobal.s}</h3><span class="text-xs text-muted fw-bold">TOTAL SAKIT</span></div></div><div class="col-6"><div class="p-3 border rounded shadow-sm bg-white"><h3 class="fw-bold text-info mb-1">${totalKehadiranGlobal.i}</h3><span class="text-xs text-muted fw-bold">TOTAL IZIN</span></div></div></div>`;
    } catch (e) { tabelNilai.innerHTML = `<tr><td colspan="6" class="text-danger">Gagal memuat rekap.</td></tr>`; }
}

document.getElementById("btnExportPDF").onclick = () => {
    if(!currentSchoolId || currentSchoolId==='NEW') return alert("Pilih lokasi sekolah terlebih dahulu!");
    const fHari = document.getElementById("filterHari").value; let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari);
    const printDiv = document.createElement("div"); printDiv.style.fontFamily = "Arial, sans-serif"; printDiv.style.padding = "20px";
    let htmlString = `<h3 style="text-align:center; font-family: Arial, sans-serif; margin-bottom: 20px;">LAPORAN LOGBOOK MENTOR<br><small style="font-size:12px; font-weight:normal;">Sekolah: ${document.getElementById('inputSekolah').value} | Rekam: ${fHari}</small></h3><table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: Arial, sans-serif;" border="1"><tr style="background-color: #f2f2f2; text-align: center;"><th style="padding:5px;">WAKTU</th><th style="padding:5px;">MENTOR</th><th style="padding:5px;">KELAS / JAM</th><th style="padding:5px; width: 35%;">MATERI & LAPORAN</th><th style="padding:5px; width: 35%;">RAPOR SISWA</th></tr>`;
    dataTampil.forEach(d => { const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'; let dJam = (d.jamKe||"").replace('Jam ','Jam ke-'); let ds = d.dataSiswa && d.dataSiswa.length > 0 ? `<table style="width:100%; font-size:9px; border-collapse: collapse;"><tr style="border-bottom:1px solid #ddd;"><th>Nama</th><th>Absen</th><th>Nilai</th></tr>` + d.dataSiswa.map(s => `<tr><td>${s.nama}</td><td style="text-align:center;">${s.kehadiran.toUpperCase()}</td><td style="text-align:center; font-weight:bold;">${s.nilai || '-'}</td></tr>`).join('') + `</table>` : 'Kosong'; htmlString += `<tr><td style="padding:5px; text-align:center;">${w}</td><td style="padding:5px; text-align:center; font-weight:bold;">${d.nama}</td><td style="padding:5px; text-align:center;">${d.kelas}<br><b>${dJam}</b></td><td style="padding:5px;"><b>Materi:</b> ${d.materi.join(', ')}<br><b>Catatan Kelas:</b> ${d.laporanSiswa}<br><b>Tugas Mandiri:</b> ${d.tugasSiswa}</td><td style="padding:5px;">${ds}</td></tr>`; }); htmlString += `</table>`; printDiv.innerHTML = htmlString;
    html2pdf().set({ margin: 0.3, filename: `Laporan_AEC_${currentSchoolId}_${fHari.replace(/\//g, "-")}.pdf`, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }}).from(printDiv).save();
};

// TUGAS WA & MATERI
document.getElementById("btnKirimTugasWA").onclick = async () => { const i = document.getElementById("waInstruksi").value; if(!i) return alert("Instruksi wajib!"); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: document.getElementById("waTarget").value || "GLOBAL", linkGambar: document.getElementById("waGambar").value, instruksi: i, waktu: serverTimestamp() }); alert("Tugas WA Terkirim!"); document.getElementById("waInstruksi").value = ""; document.getElementById("waGambar").value = ""; };
function renderRiwayatTugasWA() { const listSemua = document.getElementById("listTugasWAHistory"); if(!listSemua) return; listSemua.innerHTML = ""; let dt = masterTugasWA; let htmlSemua = ""; dt.forEach((d) => { const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 120px; object-fit: cover;">` : ''; htmlSemua += `<div class="card card-custom p-3 mb-3 bg-white shadow-sm border"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm font-monospace" style="white-space: pre-line; color:var(--wa-text-main);">${d.instruksi}</div><button class="btn btn-outline-danger btn-sm mt-3 rounded-pill fw-bold" onclick="window.tarikTugasWA('${d.id}')"><i class="bi bi-trash"></i> Tarik Tugas</button></div>`; }); listSemua.innerHTML = htmlSemua || `<div class="alert text-center border-0 text-muted bg-transparent mt-3">Riwayat Kosong.</div>`; }
window.tarikTugasWA = async function(id) { if (confirm(`Hapus instruksi ini secara permanen?`)) await deleteDoc(doc(db, "tugas_wa", id)); };

document.getElementById("btnSaveMateri").onclick = async () => { const j = document.getElementById("materiJudul").value.trim(); const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value.trim(); if(!j || !l) return alert("Judul dan Tautan wajib!"); await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() }); alert("Materi diunggah!"); document.getElementById("materiJudul").value = ""; document.getElementById("materiLink").value = ""; };
onSnapshot(collection(db, "materials"), (snap) => { const list = document.getElementById("listGudangMateri"); if(!list) return; list.innerHTML = ""; snap.forEach(d => { const data = d.data(); list.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm"><div><div class="fw-bold text-dark text-sm">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div><a href="${data.link}" target="_blank" class="text-xs text-primary text-decoration-none"><i class="bi bi-link-45deg"></i> Buka Tautan</a></div><button class="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill" onclick="window.hapusModulMateri('${d.id}')"><i class="bi bi-trash"></i></button></div>`; }); });
window.hapusModulMateri = async function(id) { if(confirm("Hapus materi ini?")) await deleteDoc(doc(db, "materials", id)); }

// OBROLAN
window.hapusPesanObrolan = async function(cid) { if(confirm("Hapus pesan ini?")) await deleteDoc(doc(db, "chats", cid)); };
document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg) return; let targetSchool = currentSchoolId; if(currentSchoolId === "" || currentSchoolId === "NEW") { targetSchool = "GLOBAL_ROOM"; } await addDoc(collection(db, "chats"), { schoolId: targetSchool, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "admin" }); document.getElementById("inputChat").value = ""; };
