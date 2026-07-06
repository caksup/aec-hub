/* ==================================================
   su.js - Script Pengendali Utama (Admin Panel)
   
   Riwayat Versi:
   - v1.0: Setup inisialisasi awal Firebase Firestore core SDK.
   - v2.0: Penulisan fungsi otentikasi pin login & LocalStorage catcher.
   - v3.0: Penambahan CRUD management data sekolah, mentor, & import xlsx.
   - v4.0: Pemisahan script dadi modular (su.js) ben lancar offline mode.
   - v4.1: Pemindahan jalur simpan roadmap menyang database collection.
   - v5.0: Inisialisasi siklus 3 tema warna (Terang, Gelap, Sistem).
   - v5.1: (CURRENT) Realtime Jam|Tanggal generator neng hulu, Hook Offcanvas logout trigger, Fix DOM rendering.
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIG FIREBASE CORE
const firebaseConfig = { apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", authDomain: "special-mentor.firebaseapp.com", projectId: "special-mentor", storageBucket: "special-mentor.firebasestorage.app", messagingSenderId: "1075582532703", appId: "1:1075582532703:web:969365cefff8999335efea" };
const app = initializeApp(firebaseConfig); export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => { console.warn("Offline mode active:", err.code); });

// 2. PRIVILEGE SYSTEM CHECK
const actUser = localStorage.getItem("loggedInUser"); const myName = localStorage.getItem("loggedInName");
if (actUser !== "sup" && actUser !== "afif") window.location.replace("index.html");
document.getElementById("userNameDisplay").innerText = myName;

// 3. LOGIKA KONTROL TEMA SIKLUS (V5.1 - 1 Tombol Muter-muter)
const themes = ['light', 'dark', 'system'];
const themeIcons = ['bi-sun-fill text-warning', 'bi-moon-stars-fill text-white', 'bi-display text-info'];
let currentThemeIndex = themes.indexOf(localStorage.getItem('aecTheme') || 'system');
if (currentThemeIndex === -1) currentThemeIndex = 2;

function applyThemeVisuals(index) {
    const t = themes[index]; localStorage.setItem('aecTheme', t);
    if (t === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', t);
    }
    const iconEl = document.getElementById("themeIconDisplay");
    if(iconEl) {
        iconEl.className = `bi ${themeIcons[index]} fs-4`; 
        void iconEl.offsetWidth; // Force Reflow Animasi
        iconEl.classList.add("theme-icon-animate");
    }
}
applyThemeVisuals(currentThemeIndex);

const btnCycleTheme = document.getElementById("btnCycleTheme");
if(btnCycleTheme) {
    btnCycleTheme.onclick = () => {
        currentThemeIndex = (currentThemeIndex + 1) % 3;
        applyThemeVisuals(currentThemeIndex);
    };
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if(themes[currentThemeIndex] === 'system') applyThemeVisuals(currentThemeIndex);
});

// 4. GENERATOR JAM & TANGGAL REALTIME HEADER (V5.1)
function runRealtimeClock() {
    const clockEl = document.getElementById('headClockDate'); if(!clockEl) return;
    const kini = new Date();
    const tglStr = kini.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const jamStr = kini.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
    clockEl.innerText = `${tglStr}\n${jamStr} WIB`;
}
setInterval(runRealtimeClock, 1000); runRealtimeClock();

// 5. INJEKSI MODAL & LOGOUT STRATEGY (V5.1 Offcanvas Compatibility)
function initGlobalUI() {
    const globalModals = `
    <div class="modal fade" id="modalTentang" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-info-circle-fill me-2"></i>Tentang</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body text-center p-4 bg-light"><i class="bi bi-rocket-takeoff-fill text-wa" style="font-size: 3rem;"></i><h5 class="fw-bold mt-2 mb-0 text-dark">AEC Hub</h5><p class="text-muted text-xs mb-3">Versi 5.1 (Ultimate Cycle Theme)</p></div></div></div></div>
    <div class="modal fade" id="modalPanduan" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-book-half me-2"></i>Panduan</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light text-sm"><div class="alert alert-info border-0 shadow-sm">Buku panduan Admin sedang disusun oleh pusat.</div></div></div></div></div>
    <div class="modal fade" id="modalArsipSekolah" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white border-0"><h5 class="modal-title fs-6 fw-bold"><i class="bi bi-archive-fill me-2"></i> Arsip Sekolah & Logbook</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body p-3 bg-light">
                    <div class="alert alert-warning text-xs border-0 py-2 shadow-sm"><i class="bi bi-info-circle-fill me-1"></i> Sekolah diarsip (disembunyikan).</div>
                    <div id="listArsipSekolah" class="list-group mb-3" style="max-height: 200px; overflow-y: auto;"></div>
                    <div id="areaLogbookArsip" class="d-none border rounded p-2 bg-white shadow-sm"><div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1"><h6 class="fw-bold text-dark text-xs mb-0" id="judulArsipLogbook">Logbook:-</h6><button class="btn btn-sm btn-outline-secondary py-0 px-2 text-xs rounded-pill" onclick="document.getElementById('areaLogbookArsip').classList.add('d-none');">Tutup</button></div><div id="kontenLogbookArsip" class="overflow-auto" style="max-height: 250px; font-size: 0.75rem;"></div></div>
                </div>
            </div>
        </div>
    </div>`;
    if (!document.getElementById('modalArsipSekolah')) document.body.insertAdjacentHTML('beforeend', globalModals);

    const eksekusiLogout = (e) => { e.preventDefault(); if(confirm("Metu saiki bolo?")) { localStorage.clear(); window.location.replace("index.html"); } };
    if(document.getElementById("btnLogoutOffcanvas")) document.getElementById("btnLogoutOffcanvas").onclick = eksekusiLogout;
    
    document.getElementById("btnSimpanRoadmap").onclick = async () => {
        const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim();
        if(!w || !j) return alert("Waktu & Judul wajib isi!");
        try {
            await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() });
            alert("Roadmap kesimpen bolo! 🔥"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = "";
        } catch(e) { alert("Err: " + e.message); }
    };
    
    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const listSistem = document.getElementById("sistemRoadmapList"); if(!listSistem) return; listSistem.innerHTML = "";
        let dataRoadmap = []; snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); });
        dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        dataRoadmap.forEach(r => { 
            listSistem.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center bg-white"><div><div class="fw-bold text-dark text-sm">${r.judul}</div><div class="text-muted" style="font-size:0.65rem">${r.waktu_target} - ${r.deskripsi||''}</div></div><i class="bi bi-trash text-danger" style="cursor:pointer;" onclick="window.hapusRoadmap('${r.id}')"></i></li>`;
        });
        if(listSistem.innerHTML === "") listSistem.innerHTML = `<li class="list-group-item text-muted text-center">Belum ada roadmap data.</li>`;
    });
}
window.hapusRoadmap = async function(id) { if(confirm("Hapus item roadmap iki?")) await deleteDoc(doc(db, "roadmaps", id)); }

// ================= LOGIKA DATABASE BACKEND (STABIL JAYA) =================
let currentSchoolId = ""; let rawKurikulum = {}; let dataLengkap = []; let masterTugasWA = [];
let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

function bersihkanListener() {
    if(unsubSchool) { unsubSchool(); unsubSchool = null; } if(unsubLogbooks) { unsubLogbooks(); unsubLogbooks = null; }
    if(unsubChats) { unsubChats(); unsubChats = null; } if(unsubWA) { unsubWA(); unsubWA = null; }
    dataLengkap = []; masterTugasWA = [];
}

onSnapshot(collection(db, "schools"), (snap) => { 
    globalAllSchools = []; snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); }); 
    renderModernSchoolSelect(); renderOverview(); 
});

function renderOverview() {
    const container = document.getElementById("overviewCardsContainer"); if (!container) return; container.innerHTML = "";
    if (globalAllSchools.length === 0) { container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif...</div></div>`; return; }
    globalAllSchools.forEach(s => {
        const hBerjalan = s.hariBerjalan || 0; const tHari = s.totalHari || 0; const jmlTutor = (s.assignedMentors || []).length;
        let jmlSiswa = 0; if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== "").length; } }); }
        container.innerHTML += `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white cursor-pointer p-1" onclick="window.langsungKeSekolah('${s.id}')" style="border-left: 4px solid var(--wa-primary) !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate"><i class="bi bi-building-check text-wa me-2"></i>${s.namaSekolah}</h6><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Hari ke:</span><span class="badge bg-wa text-white rounded-pill">${hBerjalan} / ${tHari}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jmlSiswa} Anak</span></div><div class="d-flex justify-content-between align-items-center"><span class="text-secondary text-xs fw-bold">Mentor:</span><span class="badge bg-light text-dark border rounded-pill">${jmlTutor} Orang</span></div></div></div></div>`;
    });
}

function renderModernSchoolSelect() {
    const container = document.getElementById("modernSchoolSelect"); if (!container) return;
    let html = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger shadow-sm' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="">GLOBAL</button>`;
    html += `<button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa border-0 shadow-sm' : 'btn-outline-wa'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW" style="color:var(--wa-primary); border: 1px solid var(--wa-primary);">+ BUAT BARU</button>`;
    globalAllSchools.forEach(s => { const btnClass = (currentSchoolId === s.id) ? 'btn-wa border-0 shadow-sm' : 'btn-outline-secondary'; html += `<button class="btn btn-sm ${btnClass} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}">${s.namaSekolah}</button>`; });
    container.innerHTML = html; document.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.target.getAttribute('data-value')); }; });
}

window.langsungKeSekolah = function(val) {
    bersihkanListener();
    if(!val) {
        currentSchoolId = ""; document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Pilih Sekolah Dulu.</div>`;
        renderModernSchoolSelect(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
    } else if(val === "NEW") {
        currentSchoolId = "NEW"; document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = "";
        document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
        currentAssignedMentors = []; renderMentorChecklist(); renderModernSchoolSelect(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show();
    } else {
        currentSchoolId = val; document.getElementById("inputIdSchool").value = val; document.getElementById("inputIdSchool").readOnly = true;
        renderModernSchoolSelect(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show();
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

    unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { 
        dataLengkap = []; snap.forEach(doc => dataLengkap.push({ id: doc.id, ...doc.data() })); 
        dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        ekstrakHari(); renderListAdmin(); renderTracker(); kalkulasiDataSiswa(); kalkulasiKinerjaMentor(); 
    });
    
    unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
        let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() })); chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = ""; 
        chats.forEach(c => {
            if (c.type === 'global') {
                const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; 
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div><b>${c.sender}</b>: ${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time}</div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });

    unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { 
        masterTugasWA = []; snap.forEach(doc => masterTugasWA.push({ id: doc.id, ...doc.data() })); masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        renderTugasWA(); 
    });
}

document.getElementById("btnSaveSchool").onclick = async () => {
    const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return alert("ID Handle kosong!");
    const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
    const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
    try {
        await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); 
        alert("Handle School Disimpan!"); window.langsungKeSekolah(sid);
    } catch (e) { alert("Gagal update."); }
};

document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW' && confirm("Arsip sekolah iki?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); alert("Diarsipkan!"); window.langsungKeSekolah(""); } };

document.getElementById('btnImportExcel').onclick = function() {
    const file = document.getElementById('excelSiswa').files[0]; if(!file) return alert("Pilih file excel!");
    const reader = new FileReader(); reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } });
            let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); }
            document.getElementById('inputMasterSiswa').value = output.join('\n'); alert("Excel Sukses Diimport!");
        } catch(error) { alert("Format gagal read."); }
    }; reader.readAsArrayBuffer(file);
};

function ekstrakHari() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; const valSkg = selHari.value; selHari.innerHTML = '<option value="SEMUA">Semua Data (Global)</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1} (${entry[0]})</option>`; }); if (Array.from(selHari.options).some(o=>o.value===valSkg) && valSkg !== "SEMUA") selHari.value = valSkg; else if (sortedDays.length > 0) selHari.value = sortedDays[sortedDays.length-1][0]; }
function renderListAdmin() {
    const container = document.getElementById("adminLogbookList"); if(!container) return; container.innerHTML = ""; const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value;
    let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dataTampil = dataTampil.filter(d => d.kelas === fKelas);
    if(dataTampil.length === 0) { container.innerHTML = `<div class="alert alert-secondary text-center small">Kosong.</div>`; return; }
    dataTampil.forEach(d => {
        let displayJam = (d.jamKe || "").replace('Jam ', 'Sesi '); let displayMateri = d.materi && d.materi.length > 0 ? d.materi.join(', ') : '-';
        container.innerHTML += `<div class="p-2 border rounded bg-white mb-2 text-xs"><b>${d.nama.toUpperCase()} (${d.kelas} - ${displayJam})</b><br>📖 Materi: ${displayMateri}<br>📝 Note: ${d.laporanSiswa || '-'}<div class="text-end mt-1"><button class="btn btn-xs btn-outline-danger py-0 px-2 rounded-pill" onclick="window.aksidminHapus('${d.id}')">Hapus</button></div></div>`;
    });
}
window.aksidminHapus = async function(id) { if (confirm(`Hapus permanen logbook iki?`)) await deleteDoc(doc(db, "logbooks", id)); };

function renderTracker() { const area = document.getElementById("areaTracker"); const kelasAktif = document.getElementById("trackerKelas").value; if(!area || !rawKurikulum || Object.keys(rawKurikulum).length === 0) return; let materiSelesai = new Set(); dataLengkap.forEach(log => { if (log.kelas === kelasAktif && log.materi) { log.materi.forEach(m => materiSelesai.add(m)); } }); const renderBlok = (judul, arrayMateri, warna) => { if(!arrayMateri || arrayMateri.length === 0) return ''; let listHtml = ""; arrayMateri.forEach(mat => { const isDone = materiSelesai.has(mat); const icon = isDone ? `✔` : `⭕`; listHtml += `<div class="p-1 mb-1 rounded text-xs d-flex justify-content-between bg-light border"><span>${mat}</span> <span>${icon}</span></div>`; }); return `<div class="mb-2"><b>${judul}</b>${listHtml}</div>`; }; area.innerHTML = renderBlok("VOCABULARY", rawKurikulum.vocab, "primary") + renderBlok("SPEAKING", rawKurikulum.speaking, "success") + renderBlok("GRAMMAR", rawKurikulum.grammar, "danger"); }
function kalkulasiDataSiswa() { const kls = document.getElementById("filterKelasSiswa").value; let rekap = {}; dataLengkap.forEach(log => { if(log.kelas === kls && log.dataSiswa) { log.dataSiswa.forEach(s => { if(!rekap[s.nama]) rekap[s.nama] = { h:0, a:0, s:0, i:0, poin:0 }; if(s.kehadiran === 'h') rekap[s.nama].h++; else if(s.kehadiran === 'a') rekap[s.nama].a++; let nStr = (s.nilai || "").toString(); if(parseInt(nStr) > 0) rekap[s.nama].poin += parseInt(nStr); }); } }); const tBody = document.getElementById("tabelRekapSiswa"); if(!tBody) return; tBody.innerHTML = ""; Object.keys(rekap).sort().forEach((nm, idx) => { const r = rekap[nm]; tBody.innerHTML += `<tr><td>${idx+1}</td><td class="text-start">${nm}</td><td>${r.h}</td><td>${r.a}</td><td>${r.s}</td><td>${r.i}</td><td class="fw-bold text-success">${r.poin}</td></tr>`; }); }
function kalkulasiKinerjaMentor() { let rekapMentor = {}; dataLengkap.forEach(log => { if(!rekapMentor[log.nama]) rekapMentor[log.nama] = 0; rekapMentor[log.nama]++; }); const board = document.getElementById("leaderboardTutor"); if(!board) return; board.innerHTML = ""; Object.entries(rekapMentor).sort((a,b)=>b[1]-a[1]).forEach(([nm, ct]) => { board.innerHTML += `<div class="p-1 bg-light border mb-1 rounded text-xs"><b>${nm}</b>: ${ct} Logbook</div>`; }); }

document.getElementById("btnKirimTugasWA").onclick = async () => { if(!currentSchoolId || currentSchoolId==='NEW') return alert("Pilih sekolah dulu!"); const t = document.getElementById("waTarget").value; const g = document.getElementById("waGambar").value; const i = document.getElementById("waInstruksi").value; if(!i) return alert("Instruksi wajib!"); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: t, linkGambar: g, instruksi: i, waktu: serverTimestamp() }); alert("Tugas WA Dibuat!"); document.getElementById("waInstruksi").value = ""; };
function renderTugasWA() { const listHariIni = document.getElementById("listTugasWAHarian"); const listSemua = document.getElementById("listTugasWAHistory"); if(!listHariIni || !listSemua) return; listHariIni.innerHTML = ""; listSemua.innerHTML = ""; masterTugasWA.forEach(d => { listSemua.innerHTML += `<div class="p-2 border rounded mb-2 bg-light text-xs"><b>Target: ${d.targetKelas}</b><br>${d.instruksi}</div>`; }); }
window.kirimKeWA = function(text) { window.open(`https://wa.me/?text=${text}`, '_blank'); }

document.getElementById("btnSendChat").onclick = async () => { if(!currentSchoolId || currentSchoolId==='NEW') return; const msg = document.getElementById("inputChat").value.trim(); if(!msg) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "admin" }); document.getElementById("inputChat").value = ""; };

function renderMentorChecklist() { const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = ""; globalAllUsers.filter(u => u.status === 'aktif').forEach(u => { const isChecked = currentAssignedMentors.includes(u.id) ? "checked" : ""; setupMentorList.innerHTML += `<div class="col-6"><div class="form-check border p-1 bg-white rounded"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${isChecked}><label class="form-check-label ms-1" for="chk_${u.id}">${u.julukan}</label></div></div>`; }); }

onSnapshot(collection(db, "users"), (snap) => { globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = ""; snap.forEach(d => { const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud}); tbody.innerHTML += `<tr><td><b>${uid}</b><br><small>${ud.julukan}</small></td><td>${ud.role} (${ud.pin})</td><td><button class="btn btn-xs btn-outline-danger rounded-pill px-2 py-0" onclick="window.toggleUser('${uid}', 'nonaktif')">X</button></td></tr>`; }); renderMentorChecklist(); });
window.toggleUser = async function(uid, st) { await updateDoc(doc(db, "users", uid), { status: st }); };

document.getElementById("btnAddUser").onclick = async () => { const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value; const n = document.getElementById("newName").value; const r = document.getElementById("newRole").value; if(!u || !p || !n) return alert("Lengkapi Form!"); await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); alert("Akun Disimpan!"); window.batalEditUser(); };
window.batalEditUser = function() { document.getElementById("newUser").value = ""; document.getElementById("newPin").value = ""; document.getElementById("newName").value = ""; };

document.getElementById("btnSaveMateri").onclick = async () => { const j = document.getElementById("materiJudul").value; const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value; if(!j || !l) return alert("Isi Data!"); await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() }); alert("Materi Masuk!"); };
onSnapshot(collection(db, "materials"), (snap) => { const list = document.getElementById("listGudangMateri"); if(!list) return; list.innerHTML = ""; snap.forEach(d => { const data = d.data(); list.innerHTML += `<div class="p-1 mb-1 border rounded text-xs bg-light"><b>${data.judul}</b> (${data.kelas})</div>`; }); });

document.addEventListener("DOMContentLoaded", () => { initGlobalUI(); });
