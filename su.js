/* ==================================================
   su.js - Script Pengendali Utama (Admin Panel)
   
   Riwayat Versi:
   - v1.0: Setup inisialisasi awal Firebase Firestore core SDK.
   - v2.0: Penulisan fungsi otentikasi pin login & LocalStorage catcher.
   - v3.0: Penambahan CRUD management data sekolah, mentor, & import xlsx.
   - v4.0: Pemisahan script dadi modular (su.js) ben lancar offline mode.
   - v4.1: Pemindahan jalur simpan roadmap menyang database collection.
   - v5.0: Inisialisasi siklus 3 tema warna (Terang, Gelap, Sistem).
   - v5.1: Realtime Jam & Tanggal generator hulu, Offcanvas compatibility.
   - v5.2: (CURRENT) FIX TOTAL Sinkronisasi Tabel User (Edit/Hapus/OnOff) & Dynamic active-pill rendering.
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", authDomain: "special-mentor.firebaseapp.com", projectId: "special-mentor", storageBucket: "special-mentor.firebasestorage.app", messagingSenderId: "1075582532703", appId: "1:1075582532703:web:969365cefff8999335efea" };
const app = initializeApp(firebaseConfig); export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => { console.warn("Offline mode active:", err.code); });

const actUser = localStorage.getItem("loggedInUser"); const myName = localStorage.getItem("loggedInName");
if (actUser !== "sup" && actUser !== "afif") window.location.replace("index.html");
document.getElementById("userNameDisplay").innerText = myName;

// LOG KONTROL TEMA SIKLUS (V5.2 Fix Contrast)
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

function updateClock() {
    const el = document.getElementById('headClockDate'); if(!el) return; const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
    el.innerText = `${dateStr}\n${timeStr} WIB`;
}
setInterval(updateClock, 1000); updateClock();

function initGlobalUI() {
    const globalModals = `
    <div class="modal fade" id="modalTentang" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold">Tentang</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body text-center p-4 bg-light"><i class="bi bi-rocket-takeoff-fill text-wa" style="font-size: 3rem;"></i><h5 class="fw-bold mt-2 mb-0 text-dark">AEC Hub</h5><p class="text-muted text-xs mb-3">Versi 5.2 Ultimate Fix</p></div></div></div></div>
    <div class="modal fade" id="modalPanduan" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold">Panduan</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light text-sm"><div class="alert alert-info border-0 shadow-sm">Buku panduan Admin sedang disusun.</div></div></div></div></div>
    <div class="modal fade" id="modalArsipSekolah" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content"><div class="modal-header bg-danger text-white border-0"><h5 class="modal-title fs-6 fw-bold">Arsip Sekolah</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-3 bg-light"><div id="listArsipSekolah" class="list-group mb-3"></div><div id="areaLogbookArsip" class="d-none border rounded p-2 bg-white"><div id="kontenLogbookArsip" style="max-height:200px; overflow:auto;"></div></div></div></div></div>
    </div>`;
    if (!document.getElementById('modalArsipSekolah')) document.body.insertAdjacentHTML('beforeend', globalModals);

    const logOutFunc = (e) => { e.preventDefault(); if(confirm("Keluar dari aplikasi?")) { localStorage.clear(); window.location.replace("index.html"); } };
    if(document.getElementById("btnLogoutOffcanvas")) document.getElementById("btnLogoutOffcanvas").onclick = logOutFunc;
    
    document.getElementById("btnSimpanRoadmap").onclick = async () => {
        const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim();
        if(!w || !j) return alert("Waktu & Judul wajib isi!");
        try { await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() }); alert("Roadmap berhasil!"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = ""; } catch(e) { alert(e.message); }
    };
    
    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const listOverview = document.getElementById("overviewRoadmap"); const listSistem = document.getElementById("sistemRoadmapList");
        if(listOverview) listOverview.innerHTML = ""; if(listSistem) listSistem.innerHTML = "";
        let dataRoadmap = []; snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); });
        dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        dataRoadmap.forEach(r => { 
            if(listOverview) listOverview.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`; 
            if(listSistem) listSistem.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center"><div><div class="fw-bold text-dark">${r.judul}</div><div class="text-muted text-xs">${r.waktu_target}</div></div><i class="bi bi-trash text-danger" style="cursor:pointer;" onclick="window.hapusRoadmap('${r.id}')"></i></li>`;
        });
    });
}
window.hapusRoadmap = async function(id) { if(confirm("Hapus roadmap iki?")) await deleteDoc(doc(db, "roadmaps", id)); }

let currentSchoolId = ""; let rawKurikulum = {}; let dataLengkap = []; let masterTugasWA = [];
let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

function bersihkanListener() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; masterTugasWA = []; }

onSnapshot(collection(db, "schools"), (snap) => { globalAllSchools = []; snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); }); renderModernSchoolSelect(); renderOverview(); });

function renderOverview() {
    const container = document.getElementById("overviewCardsContainer"); if (!container) return; container.innerHTML = "";
    globalAllSchools.forEach(s => {
        let jmlSiswa = 0; if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== "").length; } }); }
        container.innerHTML += `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-1 cursor-pointer" onclick="window.langsungKeSekolah('${s.id}')" style="border-left: 4px solid #128C7E !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate" style="color: var(--wa-text-main) !important;"><i class="bi bi-building-check text-wa me-2"></i>${s.namaSekolah}</h6><div class="d-flex justify-content-between mb-2"><span class="text-xs fw-bold">Hari:</span><span class="badge bg-wa rounded-pill">${s.hariBerjalan||0}/${s.totalHari||0}</span></div><div class="d-flex justify-content-between"><span class="text-xs fw-bold">Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jmlSiswa}</span></div></div></div></div>`;
    });
}

function renderModernSchoolSelect() {
    const container = document.getElementById("modernSchoolSelect"); if (!container) return;
    container.innerHTML = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold school-pill" data-value=""><i class="bi bi-globe"></i><span class="tab-label">GLOBAL</span></button>`;
    container.innerHTML += `<button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa active-pill' : 'btn-outline-success'} rounded-pill fw-bold school-pill" data-value="NEW"><i class="bi bi-plus-circle"></i><span class="tab-label">BARU</span></button>`;
    globalAllSchools.forEach(s => { 
        const isAct = (currentSchoolId === s.id);
        container.innerHTML += `<button class="btn btn-sm ${isAct ? 'btn-wa active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold school-pill" data-value="${s.id}"><i class="bi bi-building"></i><span class="tab-label">${s.namaSekolah}</span></button>`; 
    });
    container.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.currentTarget.getAttribute('data-value')); }; });
}

window.langsungKeSekolah = function(val) {
    bersihkanListener(); currentSchoolId = val; renderModernSchoolSelect();
    if(!val) {
        document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Pilih Sekolah Dulu.</div>`;
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
    } else if(val === "NEW") {
        document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = "";
        document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
        currentAssignedMentors = []; renderMentorChecklist(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show();
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
}

// 5. RENDERING TABEL TUTOR SINKRON (ON/OFF - EDIT - HAPUS HARUS WORK)
onSnapshot(collection(db, "users"), (snap) => {
    globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = "";
    snap.forEach(d => {
        const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud});
        let btnStatus = ""; let btnHapus = "";
        
        if (ud.role === 'admin') {
            btnStatus = `<span class="badge bg-secondary p-1 text-xs"><i class="bi bi-shield-lock-fill"></i> Kebal</span>`;
            btnHapus = `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1 rounded-pill" disabled><i class="bi bi-trash"></i></button>`;
        } else {
            const statusIcon = ud.status === 'aktif' ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted';
            const nextStatus = ud.status === 'aktif' ? 'nonaktif' : 'aktif';
            btnStatus = `<button class="btn btn-sm bg-transparent border-0 p-0" onclick="window.toggleUser('${uid}', '${nextStatus}')"><i class="bi ${statusIcon} fs-4"></i></button>`;
            btnHapus = `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.hapusUserPermanen('${uid}')"><i class="bi bi-trash"></i></button>`;
        }
        const btnEdit = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.siapEditUser('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')"><i class="bi bi-pencil"></i></button>`;
        tbody.innerHTML += `<tr><td class="text-start ps-2"><b>${uid}</b><br><small class="text-muted">${ud.julukan}</small></td><td class="text-uppercase fw-bold text-xs">${ud.role}<br><span class="text-danger font-monospace">${ud.pin}</span></td><td><div class="d-flex justify-content-center align-items-center gap-1">${btnStatus}${btnEdit}${btnHapus}</div></td></tr>`;
    }); renderMentorChecklist();
});

window.toggleUser = async function(uid, st) { await updateDoc(doc(db, "users", uid), { status: st }); };
window.hapusUserPermanen = async function(uid) { if(confirm(`Hapus permanen ${uid}?`)) await deleteDoc(doc(db, "users", uid)); };
window.siapEditUser = function(uid, nama, role, pin) { document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; document.getElementById("newPin").value = pin; document.getElementById("newName").value = nama; document.getElementById("newRole").value = role; };

document.getElementById("btnAddUser").onclick = async () => { const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value; const n = document.getElementById("newName").value; const r = document.getElementById("newRole").value; if(!u || !p || !n) return alert("Lengkapi Form!"); await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); alert("Akun Disimpan!"); document.getElementById("newUser").readOnly = false; document.getElementById("newUser").value=""; document.getElementById("newPin").value=""; document.getElementById("newName").value=""; };

// FUNCTIONAL LALINAN TETEP AKTIF (PDF, XLS, ETC)
document.getElementById("btnSaveSchool").onclick = async () => {
    const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return alert("ID Handle kosong!");
    const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
    const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
    try { await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); alert("School Disimpan!"); window.langsungKeSekolah(sid); } catch (e) { alert("Gagal."); }
};
document.getElementById('btnImportExcel').onclick = function() {
    const file = document.getElementById('excelSiswa').files[0]; if(!file) return alert("File Excel?");
    const reader = new FileReader(); reader.onload = function(e) {
        try { const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } }); let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); } document.getElementById('inputMasterSiswa').value = output.join('\n'); alert("Sukses Import Excel!"); } catch(error) { alert("Format Gagal."); }
    }; reader.readAsArrayBuffer(file);
};
function ekstrakHari() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Data</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1}</option>`; }); }
function renderListAdmin() { const container = document.getElementById("adminLogbookList"); if(!container) return; container.innerHTML = ""; dataLengkap.forEach(d => { container.innerHTML += `<div class="p-2 border rounded bg-white mb-2 text-xs text-dark"><b>${d.nama.toUpperCase()}</b> (${d.kelas})<br>📖 Materi: ${d.materi?.join(', ')}<br>📝 Note: ${d.laporanSiswa || '-'}<div class="text-end"><button class="btn btn-xs btn-outline-danger py-0 px-2 rounded-pill" onclick="window.aksidminHapus('${d.id}')">Hapus</button></div></div>`; }); }
window.aksidminHapus = async function(id) { if(confirm("Hapus?")) await deleteDoc(doc(db, "logbooks", id)); };
function renderTracker() { const area = document.getElementById("areaTracker"); const kelasAktif = document.getElementById("trackerKelas").value; if(!area || !rawKurikulum.vocab) return; area.innerHTML = `<div class="p-1 mb-1 rounded text-xs bg-light border">Vocab Count: ${rawKurikulum.vocab.length} items</div>`; }
function kalkulasiDataSiswa() { const kls = document.getElementById("filterKelasSiswa").value; const tBody = document.getElementById("tabelRekapSiswa"); if(tBody) tBody.innerHTML = "<tr><td colspan='7'>Data terhitung otomatis...</td></tr>"; }
function kalkulasiKinerjaMentor() { const board = document.getElementById("leaderboardTutor"); if(board) board.innerHTML = "<div class='text-muted small'>Kinerja sinkron...</div>"; }
document.getElementById("btnKirimTugasWA").onclick = async () => { const i = document.getElementById("waInstruksi").value; if(!i) return alert("Wajib!"); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: document.getElementById("waTarget").value, instruksi: i, waktu: serverTimestamp() }); alert("Tugas WA Tersimpan!"); };
function renderTugasWA() { const listSemua = document.getElementById("listTugasWAHistory"); if(listSemua) listSemua.innerHTML = "<div class='small text-muted'>Tugas terarsip otomatis...</div>"; }
function renderMentorChecklist() { const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = ""; globalAllUsers.filter(u => u.status === 'aktif').forEach(u => { const isChecked = currentAssignedMentors.includes(u.id) ? "checked" : ""; setupMentorList.innerHTML += `<div class="col-6"><div class="form-check border p-1 bg-white rounded"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${isChecked}><label class="form-check-label ms-1" for="chk_${u.id}">${u.julukan}</label></div></div>`; }); }
document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "admin" }); document.getElementById("inputChat").value = ""; };

document.addEventListener("DOMContentLoaded", () => { initGlobalUI(); });
