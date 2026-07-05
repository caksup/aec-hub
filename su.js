
/* ==================================================
   su.js - Script Khusus Superuser (Admin AEC Hub)
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIG FIREBASE (Saka kodingan aslimu)
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
enableIndexedDbPersistence(db).catch((err) => { console.warn("Offline mode err:", err.code); });

// 2. CEK LOGIN (ANTI-CROT)
const actUser = localStorage.getItem("loggedInUser");
const myName = localStorage.getItem("loggedInName");
if (actUser !== "sup" && actUser !== "afif") {
    window.location.replace("index.html");
}

document.getElementById("userNameDisplay").innerText = myName;
document.getElementById("identitasMenu").innerText = "ID: " + actUser;

// 3. INISIALISASI MODAL GLOBAL & ROADMAP
function initGlobalUI() {
    const globalModals = `
    <!-- Modal Tema -->
    <div class="modal fade" id="modalTema" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-palette-fill me-2"></i>Pilih Tema</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-2 bg-light"><button class="list-group-item list-group-item-action fw-bold w-100 p-2 mb-1 border rounded shadow-sm text-center" onclick="setTema('light')">Terang</button><button class="list-group-item list-group-item-action fw-bold w-100 p-2 mb-1 border rounded shadow-sm text-center" onclick="setTema('dark')">Gelap</button><button class="list-group-item list-group-item-action fw-bold w-100 p-2 border rounded shadow-sm text-center" onclick="setTema('system')">Ikuti Sistem HP</button></div></div></div></div>

    <!-- Modal Input Roadmap (KHUSUS ADMIN) -->
    <div class="modal fade" id="modalInputRoadmap" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white py-2 border-0">
                    <h6 class="modal-title fw-bold"><i class="bi bi-pen-fill me-2"></i>Input Roadmap Sistem</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light">
                    <div class="mb-2"><label class="form-label text-xs fw-bold mb-1">Waktu Target</label><input type="text" id="rmWaktu" class="form-control form-control-sm" placeholder="Cth: Agustus 2026"></div>
                    <div class="mb-2"><label class="form-label text-xs fw-bold mb-1">Judul Fitur</label><input type="text" id="rmJudul" class="form-control form-control-sm" placeholder="Cth: Export PDF"></div>
                    <div class="mb-3"><label class="form-label text-xs fw-bold mb-1">Deskripsi</label><textarea id="rmDesc" class="form-control text-sm" rows="3" placeholder="Penjelasan fitur..."></textarea></div>
                    <button class="btn btn-primary btn-sm w-100 fw-bold rounded-pill shadow-sm" id="btnSimpanRoadmap"><i class="bi bi-save me-1"></i> Simpan Roadmap</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Lihat Roadmap -->
    <div class="modal fade" id="modalRoadmap" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-signpost-split-fill me-2"></i>Roadmap Program</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light"><ul class="timeline" id="roadmapTimeline"><li class="timeline-item"><div class="timeline-desc text-muted">Memuat...</div></li></ul></div></div></div></div>
    
    <!-- Modal Tentang & Panduan -->
    <div class="modal fade" id="modalTentang" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-info-circle-fill me-2"></i>Tentang</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body text-center p-4 bg-light"><i class="bi bi-rocket-takeoff-fill text-wa" style="font-size: 3rem;"></i><h5 class="fw-bold mt-2 mb-0 text-dark">AEC Hub</h5><p class="text-muted text-xs mb-3">Versi 4.0-WA (Mutakhir)</p></div></div></div></div>
    <div class="modal fade" id="modalPanduan" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-book-half me-2"></i>Buku Panduan</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light"><div class="alert alert-info border-0 shadow-sm text-sm">Panduan sedang disusun...</div></div></div></div></div>
    
    <!-- Modal Arsip Sekolah (KHUSUS ADMIN) -->
    <div class="modal fade" id="modalArsipSekolah" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white border-0">
                    <h5 class="modal-title fs-6 fw-bold"><i class="bi bi-archive-fill me-2"></i> Arsip Sekolah & Logbook</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-3 bg-light">
                    <div class="alert alert-warning text-xs border-0 py-2 shadow-sm"><i class="bi bi-info-circle-fill me-1"></i> Data di bawah ini adalah sekolah yang disembunyikan (diarsipkan).</div>
                    <div id="listArsipSekolah" class="list-group mb-3" style="max-height: 250px; overflow-y: auto;"><div class="text-center small text-muted">Mencari data arsip...</div></div>
                    <div id="areaLogbookArsip" class="d-none border rounded p-2 bg-white shadow-sm">
                        <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                            <h6 class="fw-bold text-dark text-xs mb-0" id="judulArsipLogbook">Logbook: -</h6>
                            <button class="btn btn-sm btn-outline-secondary py-0 px-2 text-xs rounded-pill" onclick="document.getElementById('areaLogbookArsip').classList.add('d-none');"><i class="bi bi-x-circle"></i> Tutup</button>
                        </div>
                        <div id="kontenLogbookArsip" class="overflow-auto" style="max-height: 300px; font-size: 0.75rem;"></div>
                    </div>
                </div>
                <div class="modal-footer p-2 border-0">
                    <button type="button" class="btn btn-secondary btn-sm rounded-pill fw-bold" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    if (!document.getElementById('modalTema')) {
        document.body.insertAdjacentHTML('beforeend', globalModals);
    }

    const savedTheme = localStorage.getItem('aecTheme') || 'system';
    window.setTema(savedTheme, false);

    document.getElementById("btnLogout").onclick = (e) => { 
        e.preventDefault(); 
        if(confirm("Yakin ingin keluar dari aplikasi?")) { 
            localStorage.clear(); window.location.replace("index.html"); 
        } 
    };
    
    // Fungsi Simpan Roadmap (Titik Tiga)
    document.getElementById("btnSimpanRoadmap").onclick = async () => {
        const w = document.getElementById("rmWaktu").value; const j = document.getElementById("rmJudul").value; const d = document.getElementById("rmDesc").value;
        if(!w || !j) return alert("Waktu dan Judul wajib diisi!");
        try {
            await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() });
            alert("Roadmap berhasil disimpan!"); 
            document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = "";
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalInputRoadmap'));
            if(modal) modal.hide();
        } catch(e) { alert("Error: " + e.message); }
    };
    
    // Listener Data Roadmap
    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const list = document.getElementById("roadmapTimeline"); list.innerHTML = "";
        let dataRoadmap = [];
        snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); });
        // Urutke berdasar timestamp (nek ana)
        dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        
        dataRoadmap.forEach(r => { 
            list.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target} <i class="bi bi-trash text-danger ms-2 cursor-pointer" onclick="window.hapusRoadmap('${r.id}')" title="Hapus"></i></div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`; 
        });
        if(list.innerHTML === "") list.innerHTML = `<li class="timeline-item"><div class="timeline-desc text-muted">Belum ada roadmap program.</div></li>`;
    });
}

// Global functions
window.setTema = function(theme, closeUI = true) {
    localStorage.setItem('aecTheme', theme);
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    if (closeUI) { const modal = bootstrap.Modal.getInstance(document.getElementById('modalTema')); if(modal) modal.hide(); }
};
window.hapusRoadmap = async function(id) { if(confirm("Hapus roadmap ini?")) await deleteDoc(doc(db, "roadmaps", id)); }


// 4. VARIABEL & LISTENER STATE
let currentSchoolId = ""; let rawKurikulum = {}; let dataLengkap = []; let masterTugasWA = [];
let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

function bersihkanListener() {
    if(unsubSchool) { unsubSchool(); unsubSchool = null; }
    if(unsubLogbooks) { unsubLogbooks(); unsubLogbooks = null; }
    if(unsubChats) { unsubChats(); unsubChats = null; }
    if(unsubWA) { unsubWA(); unsubWA = null; }
    dataLengkap = []; masterTugasWA = [];
}

// 5. RENDER SEKOLAH (OVERVIEW)
onSnapshot(collection(db, "schools"), (snap) => { 
    globalAllSchools = []; 
    snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); }); 
    renderModernSchoolSelect(); renderOverview(); 
});

function renderOverview() {
    const container = document.getElementById("overviewCardsContainer");
    if (!container) return; container.innerHTML = "";
    if (globalAllSchools.length === 0) { container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border shadow-sm text-muted">Belum ada sekolah yang aktif...</div></div>`; return; }

    globalAllSchools.forEach(s => {
        const hBerjalan = s.hariBerjalan || 0; const tHari = s.totalHari || 0;
        const jmlTutor = (s.assignedMentors && Array.isArray(s.assignedMentors)) ? s.assignedMentors.length : 0;
        let jmlSiswa = 0;
        if (s.masterSiswa) { s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) { jmlSiswa += line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== "").length; } }); }

        container.innerHTML += `
        <div class="col-12 col-md-6 col-lg-6">
            <div class="card border-0 shadow-sm rounded-4 h-100 bg-white cursor-pointer" onclick="window.langsungKeSekolah('${s.id}')" style="border-left: 4px solid var(--wa-primary) !important;">
                <div class="card-body p-3">
                    <h6 class="fw-bold text-dark mb-3 text-truncate" title="${s.namaSekolah}"><i class="bi bi-building-check text-wa me-2"></i>${s.namaSekolah}</h6>
                    <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold"><i class="bi bi-calendar-event me-1"></i> Hari ke:</span><span class="badge bg-wa text-white fw-bold px-2 py-1 rounded-pill">${hBerjalan} / ${tHari}</span></div>
                    <div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold"><i class="bi bi-mortarboard me-1"></i> Jumlah Siswa:</span><span class="badge bg-light text-dark fw-bold px-2 py-1 rounded-pill border">${jmlSiswa} Peserta</span></div>
                    <div class="d-flex justify-content-between align-items-center"><span class="text-secondary text-xs fw-bold"><i class="bi bi-person-video3 me-1"></i> Tutor Bertugas:</span><span class="badge bg-light text-dark fw-bold px-2 py-1 rounded-pill border">${jmlTutor} Tutor</span></div>
                </div>
            </div>
        </div>`;
    });
}

function renderModernSchoolSelect() {
    const container = document.getElementById("modernSchoolSelect"); if (!container) return;
    let html = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger shadow-sm' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="">OVERVIEW GLOBAL</button>`;
    html += `<button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa border-0 shadow-sm' : 'btn-outline-wa'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW" style="color:var(--wa-primary); border: 1px solid var(--wa-primary);">+ BUAT BARU</button>`;
    globalAllSchools.forEach(s => {
        const btnClass = (currentSchoolId === s.id) ? 'btn-wa border-0 shadow-sm' : 'btn-outline-secondary';
        html += `<button class="btn btn-sm ${btnClass} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}">${s.namaSekolah}</button>`;
    });
    container.innerHTML = html;
    document.querySelectorAll('.school-pill').forEach(btn => {
        btn.addEventListener('click', (e) => { window.langsungKeSekolah(e.target.getAttribute('data-value')); });
    });
}

// 6. MANAJEMEN SEKOLAH (PILIH, SIMPAN, ARSIP)
window.langsungKeSekolah = function(val) {
    bersihkanListener();
    if(!val) {
        currentSchoolId = "";
        document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center bg-transparent border">Pilih Sekolah di atas.</div>`;
        document.getElementById("chatBox").innerHTML = ""; document.getElementById("listTugasWAHarian").innerHTML = "Pilih sekolah dulu"; document.getElementById("listTugasWAHistory").innerHTML = "Pilih sekolah dulu";
        document.getElementById("leaderboardTutor").innerHTML = "Pilih sekolah dulu.";
        renderModernSchoolSelect(); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-cards"]')).show();
    } else if(val === "NEW") {
        currentSchoolId = "NEW"; 
        document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = "";
        document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0;
        document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = "";
        document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = "";
        document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = "";
        currentAssignedMentors = []; renderMentorChecklist(); 
        document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-warning small text-center">Simpan Handle School terlebih dahulu.</div>`;
        renderModernSchoolSelect(); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show();
    } else {
        currentSchoolId = val; 
        document.getElementById("inputIdSchool").value = val; document.getElementById("inputIdSchool").readOnly = true;
        renderModernSchoolSelect(); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show();
        muatDataSekolah(val);
    }
}

function muatDataSekolah(sid) {
    unsubSchool = onSnapshot(doc(db, "schools", sid), (docSnap) => {
        if(!docSnap.exists()) return;
        const data = docSnap.data();
        document.getElementById('inputSekolah').value = data.namaSekolah || ""; document.getElementById('inputTotalHari').value = data.totalHari || 5; document.getElementById('inputHariKe').value = data.hariBerjalan || 0; document.getElementById('inputMasterKelas').value = data.masterKelas || "";
        document.getElementById('inputBriefing').value = data.briefing || ""; document.getElementById('inputJadwal').value = data.jadwal || ""; document.getElementById('inputGoal').value = data.goal || ""; document.getElementById('inputMasterSiswa').value = data.masterSiswa || "";
        rawKurikulum = data.kurikulum || { vocab: [], speaking: [], grammar: [], practice: [] }; 
        document.getElementById('inputVocab').value = rawKurikulum.vocab ? rawKurikulum.vocab.join('\n') : ""; 
        document.getElementById('inputSpeaking').value = rawKurikulum.speaking ? rawKurikulum.speaking.join('\n') : ""; 
        document.getElementById('inputGrammar').value = rawKurikulum.grammar ? rawKurikulum.grammar.join('\n') : "";
        document.getElementById('inputPractice').value = rawKurikulum.practice ? rawKurikulum.practice.join('\n') : "";
        
        currentAssignedMentors = data.assignedMentors || []; renderMentorChecklist();

        const arrKelas = (data.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
        const sels = ['filterKelasSiswa', 'trackerKelas', 'filterKelasHistori', 'waTarget', 'filterWA'];
        sels.forEach(id => { 
            const el = document.getElementById(id); if(!el) return; el.innerHTML = ""; 
            if(id==='waTarget') el.innerHTML+=`<option value="GLOBAL (Semua Ruang)">GLOBAL</option>`; 
            else el.innerHTML+=`<option value="SEMUA">Semua Kelas</option>`; 
            arrKelas.forEach(k => el.innerHTML+=`<option value="${k}">${k}</option>`); 
        });
        renderTracker();
    });

    const qLog = query(collection(db, "logbooks"), where("schoolId", "==", sid));
    unsubLogbooks = onSnapshot(qLog, (snap) => { 
        dataLengkap = []; snap.forEach(doc => dataLengkap.push({ id: doc.id, ...doc.data() })); 
        dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        ekstrakHari(); renderListAdmin(); renderTracker(); kalkulasiDataSiswa(); kalkulasiKinerjaMentor(); 
    });
    
    const qChat = query(collection(db, "chats"), where("schoolId", "==", sid));
    unsubChats = onSnapshot(qChat, (snap) => {
        let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() }));
        chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        const box = document.getElementById("chatBox"); box.innerHTML = ""; 
        chats.forEach(c => {
            if (c.type === 'global') {
                const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..'; 
                let nameColor = isMe ? 'text-wa' : 'text-primary'; 
                let roleBadge = ""; if(c.role === "admin") { nameColor = 'text-danger'; roleBadge = '<i class="bi bi-shield-lock-fill ms-1"></i>'; } else if(c.role === "direktur") { nameColor = 'text-warning'; roleBadge = '<i class="bi bi-star-fill ms-1 text-dark"></i>'; } 
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="d-flex justify-content-between align-items-start"><div class="fw-bold text-xs ${nameColor}">${c.sender} ${roleBadge}</div><i class="bi bi-trash del-chat-btn ms-2" onclick="window.hapusPesan('${c.id}')"></i></div><div style="word-wrap: break-word;" class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size: 0.6rem;">${time} ${isMe ? '<i class="bi bi-check2-all text-info ms-1"></i>' : ''}</div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });

    const qWA = query(collection(db, "tugas_wa"), where("schoolId", "==", sid));
    unsubWA = onSnapshot(qWA, (snap) => { 
        masterTugasWA = []; snap.forEach(doc => masterTugasWA.push({ id: doc.id, ...doc.data() })); 
        masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        renderTugasWA(); 
    });
}

document.getElementById("btnSaveSchool").onclick = async () => {
    const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return alert("ID Handle tidak boleh kosong!");
    const getArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
    const selectedMentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
    try {
        await setDoc(doc(db, "schools", sid), { 
            namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: getArr('inputVocab'), speaking: getArr('inputSpeaking'), grammar: getArr('inputGrammar'), practice: getArr('inputPractice') }, assignedMentors: selectedMentors, waktuUpdate: serverTimestamp(), status: 'aktif' 
        }, {merge:true}); 
        alert("Handle School Sukses Disimpan!"); window.langsungKeSekolah(sid);
    } catch (e) { alert("Gagal update."); }
};

document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW' && confirm("Yakin arsipkan sekolah ini?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); alert("Diarsipkan!"); window.langsungKeSekolah(""); } };

// Import Excel
document.getElementById('btnImportExcel').addEventListener('click', function() {
    const file = document.getElementById('excelSiswa').files[0]; if(!file) return alert("Pilih file excel (.xlsx/.xls) dhisik!");
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            let grouped = {}; jsonData.forEach(row => { let kls = row['Kelas']; let nama = row['Nama']; if(kls && nama) { if(!grouped[kls]) grouped[kls] = []; grouped[kls].push(nama); } });
            let output = []; for(let k in grouped) { output.push(`${k}: ${grouped[k].join(', ')}`); }
            document.getElementById('inputMasterSiswa').value = output.join('\n'); alert("Berhasil import data siswa!");
        } catch(error) { alert("Gagal membaca Excel. Pastikan format kolom: Kelas | No | Nama"); }
    }; reader.readAsArrayBuffer(file);
});

// 7. RENDER LOGBOOK & FILTER
function ekstrakHari() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) { daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); } }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); const valSkg = selHari.value; selHari.innerHTML = '<option value="SEMUA">Semua Data (Global)</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1} (${entry[0]})</option>`; }); if (Array.from(selHari.options).some(o=>o.value===valSkg) && valSkg !== "SEMUA") selHari.value = valSkg; else if (sortedDays.length > 0 && valSkg === "SEMUA" && selHari.options.length <= 2) selHari.value = sortedDays[sortedDays.length-1][0]; }

function renderListAdmin() {
    const container = document.getElementById("adminLogbookList"); container.innerHTML = ""; const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value;
    let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dataTampil = dataTampil.filter(d => d.kelas === fKelas);
    if(dataTampil.length === 0) { container.innerHTML = `<div class="alert alert-secondary text-center small bg-transparent border">Kosong.</div>`; return; }
    dataTampil.forEach(d => {
        const w = d.waktu ? d.waktu.toDate().toLocaleString('id-ID', {dateStyle:'short', timeStyle:'short'}) : '-'; 
        let txtNilai = d.dataSiswa && d.dataSiswa.length > 0 ? d.dataSiswa.map(s => { let ikon = s.kehadiran === 'h' ? '✔' : (s.kehadiran === 'a' ? '✖' : s.kehadiran.toUpperCase()); return `<b>${s.nama}</b>(${ikon}, ${s.nilai||'-'})`; }).join(' | ') : 'Belum ada data';
        let displayJam = (d.jamKe || "").replace('Jam ', 'Sesi '); let displayMateri = d.materi && d.materi.length > 0 ? d.materi.join(', ') : '-';
        container.innerHTML += `<div class="p-3 bg-white rounded-3 border mb-2 shadow-sm text-xs"><div class="d-flex justify-content-between border-bottom pb-1 mb-2"><span class="fw-bold text-wa"><i class="bi bi-person-fill"></i> ${d.nama.toUpperCase()}</span><span class="text-muted" style="font-size:0.7rem;">${w}</span></div><div class="mb-1"><span class="badge bg-wa me-1 rounded-pill">${d.kelas}</span><span class="badge bg-dark rounded-pill">${displayJam}</span></div><div class="mb-1 mt-2 text-dark">📖 Materi: <b>${displayMateri}</b></div><div class="mb-1 mt-2 text-danger">📝 <b>Note:</b><br><span class="text-dark">${d.laporanSiswa || '-'}</span></div><div class="mb-1 text-success">🎯 <b>Tugas:</b><br><span class="text-dark">${d.tugasSiswa || '-'}</span></div><div class="p-2 mt-2 bg-light border rounded mb-2">📊 <b>Rapor:</b> <br><span class="text-dark">${txtNilai}</span></div><div class="text-end"><button class="btn btn-xs btn-outline-danger py-0 rounded-pill px-3" onclick="window.aksidminHapus('${d.id}')"><i class="bi bi-trash"></i> Hapus</button></div></div>`;
    });
}
window.aksidminHapus = async function(id) { if (confirm(`Hapus permanen sesi ini?`)) await deleteDoc(doc(db, "logbooks", id)); };
window.hapusPesan = async function(cid) { if(confirm("Hapus pesan ini?")) await deleteDoc(doc(db, "chats", cid)); };

// Filter listener
document.getElementById('filterHari').onchange = () => renderListAdmin(); document.getElementById('filterKelasHistori').onchange = () => renderListAdmin(); document.getElementById('trackerKelas').onchange = () => renderTracker(); document.getElementById('filterKelasSiswa').onchange = () => kalkulasiDataSiswa(); if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = () => renderTugasWA();

// 8. KINERJA, TRACKER & SISWA
function renderTracker() { const area = document.getElementById("areaTracker"); const kelasAktif = document.getElementById("trackerKelas").value; if(!rawKurikulum || Object.keys(rawKurikulum).length === 0) { area.innerHTML = "<div class='small text-muted'>Kosong.</div>"; return; } let materiSelesai = new Set(); dataLengkap.forEach(log => { if (log.kelas === kelasAktif && log.materi) { log.materi.forEach(m => materiSelesai.add(m)); } }); const renderBlok = (judul, arrayMateri, warna) => { if(!arrayMateri || arrayMateri.length === 0) return ''; let listHtml = ""; arrayMateri.forEach(mat => { const isDone = materiSelesai.has(mat); const icon = isDone ? `<i class="bi bi-check-circle-fill text-${warna}"></i>` : `<i class="bi bi-circle text-secondary opacity-50"></i>`; const bg = isDone ? `bg-${warna} bg-opacity-10 border-${warna}` : 'bg-transparent text-muted border'; listHtml += `<div class="d-flex justify-content-between align-items-center p-2 mb-1 rounded text-xs ${bg}"><span class="${isDone ? 'fw-bold' : ''}">${mat}</span> <span>${icon}</span></div>`; }); return `<div class="mb-3"><h6 class="text-xs fw-bold text-${warna} mb-1 border-bottom pb-1">${judul}</h6>${listHtml}</div>`; }; area.innerHTML = renderBlok("VOCABULARY", rawKurikulum.vocab, "primary") + renderBlok("SPEAKING", rawKurikulum.speaking, "success") + renderBlok("GRAMMAR", rawKurikulum.grammar, "danger") + renderBlok("PRACTICE CLASS", rawKurikulum.practice, "warning"); }
function kalkulasiDataSiswa() { const kls = document.getElementById("filterKelasSiswa").value; let rekap = {}; dataLengkap.forEach(log => { if(log.kelas === kls && log.dataSiswa) { log.dataSiswa.forEach(s => { if(!rekap[s.nama]) rekap[s.nama] = { h:0, a:0, s:0, i:0, poin:0 }; if(s.kehadiran === 'h') rekap[s.nama].h++; else if(s.kehadiran === 'a') rekap[s.nama].a++; else if(s.kehadiran === 's') rekap[s.nama].s++; else if(s.kehadiran === 'i') rekap[s.nama].i++; let nStr = (s.nilai || "").toString().toLowerCase().trim(); if(nStr === 'a' || nStr === 'a+') rekap[s.nama].poin += 90; else if(parseInt(nStr) > 0) rekap[s.nama].poin += parseInt(nStr); }); } }); const tBody = document.getElementById("tabelRekapSiswa"); tBody.innerHTML = ""; let arrSiswa = Object.keys(rekap).sort(); arrSiswa.forEach((nm, idx) => { const r = rekap[nm]; tBody.innerHTML += `<tr><td>${idx+1}</td><td class="text-start fw-bold text-dark">${nm}</td><td class="text-dark">${r.h}</td><td class="text-dark">${r.a}</td><td class="text-dark">${r.s}</td><td class="text-dark">${r.i}</td><td class="fw-bold text-success">${r.poin}</td></tr>`; }); const listTop = document.getElementById("listTop10"); listTop.innerHTML = ""; let arrPeringkat = Object.entries(rekap).map(([nama, data]) => ({ nama, poin: data.poin })).sort((a,b) => b.poin - a.poin).slice(0, 10); if(arrPeringkat.length === 0) { listTop.innerHTML = "<div class='text-muted small'>Belum ada data.</div>"; return; } arrPeringkat.forEach((item, idx) => { let badge = idx === 0 ? "bg-warning text-dark" : (idx === 1 ? "bg-secondary text-white" : "bg-wa text-white"); listTop.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-light text-sm"><div class="fw-bold text-dark"><span class="badge ${badge} me-2 rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`; }); }
function kalkulasiKinerjaMentor() { let rekapMentor = {}; dataLengkap.forEach(log => { if(!rekapMentor[log.nama]) rekapMentor[log.nama] = 0; rekapMentor[log.nama]++; }); const board = document.getElementById("leaderboardTutor"); board.innerHTML = ""; let arrMentor = Object.entries(rekapMentor).map(([nama, count]) => ({nama, count})).sort((a,b) => b.count - a.count); arrMentor.forEach((m, idx) => { let med = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : "🏅"); board.innerHTML += `<div class="d-flex justify-content-between p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark">${med} ${m.nama}</div><div class="badge bg-wa rounded-pill">${m.count} Logbook</div></div>`; }); }

// 9. WA TUGAS & CHAT
window.aksidminHapusTugas = async function(id) { if (confirm(`Hapus template tugas ini?`)) await deleteDoc(doc(db, "tugas_wa", id)); };
document.getElementById("btnKirimTugasWA").onclick = async () => { 
    if(!currentSchoolId || currentSchoolId==='NEW') return alert("Pilih sekolah dulu!"); 
    const t = document.getElementById("waTarget").value; const g = document.getElementById("waGambar").value; const i = document.getElementById("waInstruksi").value; 
    if(!i) return alert("Instruksi wajib!"); 
    await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: t, linkGambar: g, instruksi: i, waktu: serverTimestamp() });
    alert("Tugas WA Dibuat!"); document.getElementById("waInstruksi").value = ""; document.getElementById("waGambar").value = ""; 
    new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-wa-hari"]')).show();
};
function renderTugasWA() { 
    const listHariIni = document.getElementById("listTugasWAHarian"); const listSemua = document.getElementById("listTugasWAHistory"); const fil = document.getElementById("filterWA").value; 
    listHariIni.innerHTML = ""; listSemua.innerHTML = ""; let dt = masterTugasWA; 
    if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); 
    let currentHariValue = document.getElementById("filterHari").options.length > 1 ? document.getElementById("filterHari").options[document.getElementById("filterHari").options.length-1].value : "SEMUA";
    let htmlSemua = ""; let htmlHarian = ""; 
    dt.forEach((d, i) => { 
        const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; 
        let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 200px; object-fit: cover;">` : ''; 
        let itemHtml = `<div class="card card-custom p-3 mb-3 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm mb-2 font-monospace" id="txtWA_${i}" style="white-space: pre-line;">${d.instruksi}</div><div class="d-flex gap-2"><button class="btn btn-wa btn-sm flex-fill fw-bold rounded-pill" onclick="window.kirimKeWA('${encodeURIComponent(d.instruksi)}')"><i class="bi bi-whatsapp me-1"></i> Kirim ke WA</button><button class="btn btn-outline-danger btn-sm rounded-pill" onclick="window.aksidminHapusTugas('${d.id}')"><i class="bi bi-trash"></i></button></div></div>`; 
        htmlSemua += itemHtml; if(d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === currentHariValue) htmlHarian += itemHtml; 
    }); 
    listSemua.innerHTML = htmlSemua || `<div class="alert text-center border-0 text-muted bg-transparent mt-3">Kosong.</div>`; listHariIni.innerHTML = htmlHarian || `<div class="alert text-center border-0 text-muted bg-transparent mt-3">Kosong. Cek tab History.</div>`; 
} 
window.kirimKeWA = function(encodedText) { window.open(`https://wa.me/?text=${encodedText}`, '_blank'); }

document.getElementById("btnSendChat").onclick = async () => { 
    if(!currentSchoolId || currentSchoolId==='NEW') return alert("Pilih sekolah dulu!"); 
    const msg = document.getElementById("inputChat").value.trim(); if(!msg) return; 
    await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "admin" });
    document.getElementById("inputChat").value = ""; 
}; 
document.getElementById("inputChat").addEventListener("keypress", function(e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("btnSendChat").click(); } });

// 10. MANAJEMEN TUTOR (USER)
function renderMentorChecklist() {
    const setupMentorList = document.getElementById("setupMentorList"); if (!setupMentorList) return; setupMentorList.innerHTML = "";
    const mentorsAktif = globalAllUsers.filter(u => u.status === 'aktif');
    if(mentorsAktif.length === 0) { setupMentorList.innerHTML = "<span class='text-muted'>Belum ada akun mentor aktif...</span>"; return; }
    mentorsAktif.forEach(u => {
        const isChecked = currentAssignedMentors.includes(u.id) ? "checked" : "";
        setupMentorList.innerHTML += `<div class="col-6 col-md-4"><div class="form-check border p-1 rounded bg-white shadow-sm"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${isChecked}><label class="form-check-label fw-bold ms-1 text-dark" style="font-size:0.8rem; cursor:pointer;" for="chk_${u.id}">${u.julukan}</label></div></div>`;
    });
}

onSnapshot(collection(db, "users"), (snap) => { 
    globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); tbody.innerHTML = ""; 
    snap.forEach(d => { 
        const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud});
        let btnStatus = ud.status === 'aktif' ? `<button class="btn btn-sm btn-outline-danger py-0 px-1 rounded-pill" title="Nonaktifkan" onclick="window.toggleUser('${uid}', 'nonaktif')"><i class="bi bi-person-dash"></i></button>` : `<button class="btn btn-sm btn-outline-success py-0 px-1 rounded-pill" title="Aktifkan" onclick="window.toggleUser('${uid}', 'aktif')"><i class="bi bi-person-check"></i></button>`; 
        const btnEdit = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.siapEditUser('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')"><i class="bi bi-pencil"></i></button>`;
        let btnHapus = `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.hapusUserPermanen('${uid}')"><i class="bi bi-trash"></i></button>`;
        if(ud.role === 'admin') { btnStatus = `<span class="badge bg-secondary">Kebal</span>`; btnHapus = ``; }
        tbody.innerHTML += `<tr><td class="text-start ps-2"><div class="fw-bold text-wa">${uid}</div><div class="small text-muted">${ud.julukan}</div></td><td><div class="text-uppercase text-dark fw-bold text-xs">${ud.role}</div><div class="font-monospace text-danger fw-bold text-xs">${ud.pin}</div></td><td>${btnStatus}${btnEdit}${btnHapus}</td></tr>`; 
    }); renderMentorChecklist();
});

window.siapEditUser = function(uid, nama, role, pin) {
    document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; 
    document.getElementById("newPin").value = pin; document.getElementById("newName").value = nama; document.getElementById("newRole").value = role;
    const btn = document.getElementById("btnAddUser"); btn.innerText = "Update Akun"; btn.classList.replace("btn-wa", "btn-warning");
    if(!document.getElementById("btnBatalEditUser")) { const btnBatal = document.createElement("button"); btnBatal.id = "btnBatalEditUser"; btnBatal.className = "btn btn-sm btn-secondary w-100 mt-2 fw-bold rounded-pill"; btnBatal.innerText = "Batal Edit"; btnBatal.onclick = window.batalEditUser; btn.parentNode.appendChild(btnBatal); } else { document.getElementById("btnBatalEditUser").style.display = "block"; }
};
window.batalEditUser = function() {
    document.getElementById("newUser").value = ""; document.getElementById("newUser").readOnly = false; 
    document.getElementById("newPin").value = ""; document.getElementById("newName").value = ""; document.getElementById("newRole").value = "mentor";
    const btn = document.getElementById("btnAddUser"); btn.innerText = "Simpan Akun"; btn.classList.replace("btn-warning", "btn-wa");
    if(document.getElementById("btnBatalEditUser")) document.getElementById("btnBatalEditUser").style.display = "none";
};
window.hapusUserPermanen = async function(uid) { if(confirm(`Tenanan arep mbusak permanen akun: ${uid}?`)) { await deleteDoc(doc(db, "users", uid)); alert("Akun kasil dibusak!"); } };
window.toggleUser = async function(uid, setStatus) { await setDoc(doc(db, "users", uid), { status: setStatus }, {merge: true}); };

document.getElementById("btnAddUser").onclick = async () => { 
    const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value; const n = document.getElementById("newName").value; const r = document.getElementById("newRole").value; 
    if(!u || !p || !n) return alert("Isi form dhisik!"); 
    await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); alert("Data Akun Disimpen!"); window.batalEditUser();
}; 

// 11. GUDANG MATERI & ARSIP
document.getElementById("btnSaveMateri").onclick = async () => {
    const j = document.getElementById("materiJudul").value; const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value;
    if(!j || !l) return alert("Judul dan Link wajib diisi!");
    await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() });
    alert("Materi tersimpan!"); document.getElementById("materiJudul").value = ""; document.getElementById("materiLink").value = "";
};
onSnapshot(collection(db, "materials"), (snap) => {
    const list = document.getElementById("listGudangMateri"); list.innerHTML = ""; let html = "";
    snap.forEach(d => { const data = d.data(); const id = d.id; html += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm"><div><div class="fw-bold text-dark text-sm">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div><a href="${data.link}" target="_blank" class="text-xs text-primary text-decoration-none"><i class="bi bi-link-45deg"></i> Buka Link</a></div><button class="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill" onclick="window.hapusMateri('${id}')"><i class="bi bi-trash"></i></button></div>`; });
    list.innerHTML = html || "<div class='text-muted text-center small mt-2'>Belum ada materi.</div>";
});
window.hapusMateri = async function(id) { if(confirm("Hapus materi ini?")) await deleteDoc(doc(db, "materials", id)); }

document.getElementById("btnBukaArsip").onclick = async () => {
    const myModal = new bootstrap.Modal(document.getElementById('modalArsipSekolah')); myModal.show();
    const listContainer = document.getElementById("listArsipSekolah"); listContainer.innerHTML = '<div class="text-center small text-muted"><div class="spinner-border spinner-border-sm text-wa" role="status"></div> Mengambil data arsip...</div>';
    document.getElementById("areaLogbookArsip").classList.add("d-none");
    try {
        const allSchoolsSnap = await getDocs(collection(db, "schools")); const activeIds = globalAllSchools.map(s => s.id); let archivedSchools = [];
        allSchoolsSnap.forEach(d => { if(!activeIds.includes(d.id)) { archivedSchools.push({id: d.id, ...d.data()}); } });
        if(archivedSchools.length === 0) { listContainer.innerHTML = '<div class="alert alert-light text-center small border mb-0 text-muted">Belum ada sekolah yang diarsipkan.</div>'; return; }
        let htmlList = ''; archivedSchools.forEach(s => { htmlList += `<div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-white border mb-1 rounded"><div><div class="fw-bold text-dark text-sm">${s.namaSekolah || s.id}</div><div class="text-muted" style="font-size:0.65rem;">ID: ${s.id}</div></div><div><button class="btn btn-sm btn-wa rounded-pill py-0 px-3 fw-bold" onclick="window.lihatLogbookArsip('${s.id}', '${s.namaSekolah}')">Lihat History</button></div></div>`; });
        listContainer.innerHTML = htmlList;
    } catch (error) { listContainer.innerHTML = '<div class="alert alert-danger text-center small">Gagal memuat arsip.</div>'; }
};
window.lihatLogbookArsip = async function(schoolId, schoolName) {
    const area = document.getElementById("areaLogbookArsip"); const konten = document.getElementById("kontenLogbookArsip"); document.getElementById("judulArsipLogbook").innerText = "Logbook: " + (schoolName || schoolId);
    area.classList.remove("d-none"); konten.innerHTML = '<div class="text-center small text-muted"><div class="spinner-border spinner-border-sm text-wa" role="status"></div> Mengambil logbook...</div>';
    try {
        const logsSnap = await getDocs(query(collection(db, "logbooks"), where("schoolId", "==", schoolId))); let arrLogs = [];
        logsSnap.forEach(d => arrLogs.push({id: d.id, ...d.data()})); arrLogs.sort((a,b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        if(arrLogs.length === 0) { konten.innerHTML = '<div class="text-center text-muted mt-2">Tidak ada logbook.</div>'; return; }
        let htmlLogs = ''; arrLogs.forEach(d => { const w = d.waktu ? d.waktu.toDate().toLocaleString('id-ID', {dateStyle:'short', timeStyle:'short'}) : '-'; let displayJam = (d.jamKe || "").replace('Jam ', 'Sesi '); let displayMateri = d.materi && d.materi.length > 0 ? d.materi.join(', ') : '-'; htmlLogs += `<div class="p-2 border rounded mb-2 bg-white shadow-sm"><div class="d-flex justify-content-between mb-1 border-bottom pb-1"><span class="fw-bold text-wa">${d.nama.toUpperCase()}</span><span class="text-muted" style="font-size:0.65rem;">${w}</span></div><div class="mb-1"><span class="badge bg-wa rounded-pill">${d.kelas}</span> <span class="badge bg-dark rounded-pill">${displayJam}</span></div><div class="text-dark">📖 <span class="fw-bold">Materi:</span> ${displayMateri}</div></div>`; });
        konten.innerHTML = htmlLogs;
    } catch (error) { konten.innerHTML = '<div class="text-danger text-center">Gagal memuat logbook.</div>'; }
};

// 12. EXPORT PDF
document.getElementById("btnExportPDF").onclick = () => {
    if(!currentSchoolId || currentSchoolId==='NEW') return alert("Pilih sekolah dulu di bagian atas!");
    const fHari = document.getElementById("filterHari").value; let dataTampil = dataLengkap; if (fHari !== "SEMUA") dataTampil = dataTampil.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari);
    const printDiv = document.createElement("div"); printDiv.style.fontFamily = "Arial, sans-serif"; printDiv.style.padding = "20px";
    let htmlString = `<h3 style="text-align:center; font-family: Arial, sans-serif; margin-bottom: 20px;">LAPORAN LOGBOOK MENTOR<br><small style="font-size:12px; font-weight:normal;">Sekolah: ${document.getElementById('inputSekolah').value} | Filter: ${fHari}</small></h3>`;
    htmlString += `<table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: Arial, sans-serif;" border="1"><tr style="background-color: #f2f2f2; text-align: center;"><th style="padding:5px;">WAKTU</th><th style="padding:5px;">MENTOR</th><th style="padding:5px;">KELAS / JAM</th><th style="padding:5px; width: 35%;">MATERI & LAPORAN</th><th style="padding:5px; width: 35%;">RAPOR SISWA (Hadir & Nilai)</th></tr>`;
    dataTampil.forEach(d => {
        const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'; let dJam = (d.jamKe||"").replace('Jam ','Jam ke-');
        let ds = d.dataSiswa && d.dataSiswa.length > 0 ? `<table style="width:100%; font-size:9px; border-collapse: collapse;"><tr style="border-bottom:1px solid #ddd;"><th>Nama</th><th>Abs</th><th>Nilai</th></tr>` + d.dataSiswa.map(s => `<tr><td>${s.nama}</td><td style="text-align:center;">${s.kehadiran.toUpperCase()}</td><td style="text-align:center;">${s.nilai || '-'}</td></tr>`).join('') + `</table>` : 'Belum ada';
        htmlString += `<tr><td style="padding:5px; text-align:center;">${w}</td><td style="padding:5px; text-align:center; font-weight:bold;">${d.nama}</td><td style="padding:5px; text-align:center;">${d.kelas}<br><b>${dJam}</b></td><td style="padding:5px;"><b>Materi:</b> ${d.materi.join(', ')}<br><b>Class Note:</b> ${d.laporanSiswa}<br><b>Tugas:</b> ${d.tugasSiswa}</td><td style="padding:5px;">${ds}</td></tr>`;
    }); htmlString += `</table>`; printDiv.innerHTML = htmlString;
    html2pdf().set({ margin: 0.3, filename: `AEC_Report_${currentSchoolId}_${fHari.replace(/\//g, "-")}.pdf`, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }}).from(printDiv).save();
};

document.addEventListener("DOMContentLoaded", () => { initGlobalUI(); setInterval(() => { const now = new Date(); if(document.getElementById('headClock')) document.getElementById('headClock').innerText = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}); }, 1000); });
