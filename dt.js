/* ==================================================
   dt.js - Script Khusus Direktur (Panel Mas Afif)
   
   Riwayat Versi:
   - v4.1: Penambahan listener Roadmap untuk tab Overview.
   - v4.0 Ultimate: Pemisahan logika mandiri, integrasi fungsi Firebase, Adaptif UI Global.
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, onSnapshot, updateDoc, collection, query, where, getDocs, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Identitas
const myName = localStorage.getItem("loggedInName");
document.getElementById("userNameDisplay").innerText = myName;

// FUNGSI GLOBAL UI & MODAL
function initGlobalUI() {
    const globalModals = `
    <!-- Modal Tema -->
    <div class="modal fade" id="modalTema" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content"><div class="modal-header bg-wa text-white py-2"><h6 class="modal-title fw-bold">Pilih Tema</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-2"><button class="list-group-item w-100 p-2 mb-1 border rounded" onclick="setTema('light')">Terang</button><button class="list-group-item w-100 p-2 mb-1 border rounded" onclick="setTema('dark')">Gelap</button><button class="list-group-item w-100 p-2 border rounded" onclick="setTema('system')">Sistem</button></div></div></div></div>
    `;
    if (!document.getElementById('modalTema')) document.body.insertAdjacentHTML('beforeend', globalModals);
    
    // Tema & Logout logic
    const savedTheme = localStorage.getItem('aecTheme') || 'system';
    window.setTema(savedTheme, false);
    document.getElementById("btnLogout").onclick = (e) => { e.preventDefault(); if(confirm("Keluar dari aplikasi?")) { localStorage.clear(); window.location.replace("index.html"); } };
    
    // Listener Roadmap untuk Overview Direktur
    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const listOverview = document.getElementById("overviewRoadmap");
        if(!listOverview) return;
        listOverview.innerHTML = "";
        let dataRoadmap = [];
        snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); });
        dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        
        dataRoadmap.forEach(r => { 
            listOverview.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`; 
        });
        
        if(listOverview.innerHTML === "") listOverview.innerHTML = `<li class="timeline-item"><div class="timeline-desc text-muted">Belum ada roadmap program.</div></li>`;
    });
}

window.setTema = function(theme, closeUI = true) {
    localStorage.setItem('aecTheme', theme);
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    if (closeUI) { const modal = bootstrap.Modal.getInstance(document.getElementById('modalTema')); if(modal) modal.hide(); }
};

// LOGIKA DIREKTUR (Sisane padha kaya sadurunge)
let currentSchoolId = ""; let dataLengkap = [];

onSnapshot(collection(db, "schools"), (snap) => {
    let globalAllSchools = [];
    snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); });
    renderModernSchoolSelect(globalAllSchools);
    renderOverview(globalAllSchools);
});

function renderOverview(schools) {
    const container = document.getElementById("overviewCardsContainer");
    if (!container) return; container.innerHTML = "";
    if (schools.length === 0) { container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border shadow-sm text-muted">Belum ada sekolah yang aktif...</div></div>`; return; }

    schools.forEach(s => {
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

function renderModernSchoolSelect(schools) {
    const container = document.getElementById("modernSchoolSelect");
    let html = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger shadow-sm' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="">OVERVIEW GLOBAL</button>`;
    schools.forEach(s => {
        const btnClass = (currentSchoolId === s.id) ? 'btn-wa border-0 shadow-sm' : 'btn-outline-secondary';
        html += `<button class="btn btn-sm ${btnClass} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}">${s.namaSekolah}</button>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.school-pill').forEach(btn => btn.onclick = (e) => window.langsungKeSekolah(e.target.getAttribute('data-value')));
}

window.langsungKeSekolah = function(sid) {
    currentSchoolId = sid;
    if(!sid) { 
        document.getElementById("schoolInfoBar").classList.add("d-none"); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
        return; 
    }
    document.getElementById("schoolInfoBar").classList.remove("d-none");
    new bootstrap.Tab(document.querySelector('button[data-bs-target="#beranda"]')).show();
    
    onSnapshot(doc(db, "schools", sid), (s) => {
        if(!s.exists()) return;
        const d = s.data();
        document.getElementById('headSekolah').innerText = d.namaSekolah;
        document.getElementById('tutorBriefing').innerText = d.briefing || "-";
        document.getElementById('dirBriefing').value = d.briefing || "";
    });
    
    onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => {
        dataLengkap = []; snap.forEach(d => dataLengkap.push({id: d.id, ...d.data()}));
        renderLogbookList();
    });
}

document.getElementById("btnSaveDirBriefing").onclick = async () => {
    if(!currentSchoolId) return alert("Pilih sekolah dhisik!");
    await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value });
    alert("Briefing kasil disimpen!");
};

function renderLogbookList() {
    const list = document.getElementById("logbookList"); list.innerHTML = "";
    dataLengkap.forEach(d => {
        list.innerHTML += `<div class="p-2 border-bottom mb-2 text-xs"><b>${d.nama}</b>: ${d.laporanSiswa}</div>`;
    });
}

// Inisialisasi
document.addEventListener("DOMContentLoaded", initGlobalUI);
