/* ==================================================
   dt.js - Script Khusus Direktur (Panel Mas Afif)
   
   Riwayat Versi (JS):
   - v1.0 - v3.0: Core logic Firebase Direktur.
   - v4.0: Pemisahan file (dt.js) & Auto-login handler.
   - v4.1: Listener Roadmap Sistem.
   - v5.0: Tombol Tema Siklus Header.
   - v5.1: (CURRENT) Offcanvas Logout Logic terintegrasi.
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, onSnapshot, updateDoc, collection, query, where, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", authDomain: "special-mentor.firebaseapp.com", projectId: "special-mentor", storageBucket: "special-mentor.firebasestorage.app", messagingSenderId: "1075582532703", appId: "1:1075582532703:web:969365cefff8999335efea" };
const app = initializeApp(firebaseConfig); export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(err => console.warn(err.code));

const actUser = localStorage.getItem("loggedInUser"); const myName = localStorage.getItem("loggedInName");
if (!actUser) window.location.replace("index.html");
if(document.getElementById("userNameDisplay")) document.getElementById("userNameDisplay").innerText = myName;

// FUNGSI TEMA SIKLUS (V5.1)
const themes = ['light', 'dark', 'system'];
const themeIcons = ['bi-sun-fill text-warning', 'bi-moon-stars-fill text-white', 'bi-display text-info'];
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
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if(themes[currentThemeIndex] === 'system') applyThemeVisuals(currentThemeIndex); });

// UI GLOBAL MODALS & LOGOUT OFFCANVAS
function initGlobalUI() {
    const globalModals = `
    <div class="modal fade" id="modalTentang" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-info-circle-fill me-2"></i>Tentang</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body text-center p-4 bg-light"><i class="bi bi-rocket-takeoff-fill text-wa" style="font-size: 3rem;"></i><h5 class="fw-bold mt-2 mb-0 text-dark">AEC Hub</h5><p class="text-muted text-xs mb-3">Versi 5.1 (Ultimate Cycle Theme)</p></div></div></div></div>
    <div class="modal fade" id="modalPanduan" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-book-half me-2"></i>Panduan</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light text-sm"><div class="alert alert-info border-0 shadow-sm">Buku panduan Direktur sedang disusun.</div></div></div></div></div>
    `;
    if (!document.getElementById('modalTentang')) document.body.insertAdjacentHTML('beforeend', globalModals);

    const logOutFunc = (e) => { e.preventDefault(); if(confirm("Keluar dari aplikasi?")) { localStorage.clear(); window.location.replace("index.html"); } };
    if(document.getElementById("btnLogoutOffcanvas")) document.getElementById("btnLogoutOffcanvas").onclick = logOutFunc;
}
initGlobalUI();

// SISTEM KONTROL: Moco Roadmap
onSnapshot(query(collection(db, "roadmaps")), (snap) => {
    const list = document.getElementById("sistemRoadmapList"); if(!list) return; list.innerHTML = "";
    let arr = []; snap.forEach(d => arr.push({id: d.id, ...d.data()}));
    arr.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    arr.forEach(r => list.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`);
    if(list.innerHTML==="") list.innerHTML = `<li class="timeline-item"><div class="timeline-desc text-muted">Belum ada roadmap.</div></li>`;
});

// LOGIKA UTAMA DIREKTUR
let currentSchoolId = ""; let dataLengkap = [];
onSnapshot(collection(db, "schools"), (snap) => {
    let schools = []; snap.forEach(d => { if(d.data().status !== 'archived') schools.push({ id: d.id, ...d.data() }); });
    const c1 = document.getElementById("modernSchoolSelect"); const c2 = document.getElementById("overviewCardsContainer");
    if(c1) {
        c1.innerHTML = `<button class="btn btn-sm ${currentSchoolId===''?'btn-danger':'btn-outline-secondary'} rounded-pill fw-bold school-pill" data-value="">GLOBAL</button>` + schools.map(s => `<button class="btn btn-sm ${currentSchoolId===s.id?'btn-wa border-0':'btn-outline-secondary'} rounded-pill fw-bold school-pill" data-value="${s.id}">${s.namaSekolah}</button>`).join('');
        c1.querySelectorAll('.school-pill').forEach(btn => btn.onclick = (e) => window.langsungKeSekolah(e.target.getAttribute('data-value')));
    }
    if(c2) {
        if (schools.length === 0) { c2.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif...</div></div>`; return; }
        c2.innerHTML = schools.map(s => { let jTutor=(s.assignedMentors||[]).length; let jSiswa=0; if(s.masterSiswa){s.masterSiswa.split('\n').forEach(l=>{if(l.includes(':'))jSiswa+=l.split(':')[1].split(',').filter(n=>n.trim()!=="").length;});} return `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white cursor-pointer" onclick="window.langsungKeSekolah('${s.id}')" style="border-left: 4px solid var(--wa-primary) !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate"><i class="bi bi-building-check text-wa me-2"></i>${s.namaSekolah}</h6><div class="d-flex justify-content-between mb-2"><span class="text-xs fw-bold"><i class="bi bi-calendar-event"></i> Hari:</span><span class="badge bg-wa rounded-pill">${s.hariBerjalan||0}/${s.totalHari||0}</span></div><div class="d-flex justify-content-between"><span class="text-xs fw-bold"><i class="bi bi-people"></i> Peserta:</span><span class="badge bg-light text-dark border rounded-pill">${jSiswa}</span></div></div></div></div>`; }).join('');
    }
});

window.langsungKeSekolah = function(sid) {
    currentSchoolId = sid;
    if(!sid) { 
        if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.add("d-none"); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); return; 
    }
    if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none");
    new bootstrap.Tab(document.querySelector('button[data-bs-target="#beranda"]')).show();
    
    onSnapshot(doc(db, "schools", sid), (s) => {
        if(!s.exists()) return; const d = s.data();
        if(document.getElementById('headSekolah')) document.getElementById('headSekolah').innerText = d.namaSekolah;
        if(document.getElementById('tutorBriefing')) document.getElementById('tutorBriefing').innerText = d.briefing || "-";
        if(document.getElementById('dirBriefing')) document.getElementById('dirBriefing').value = d.briefing || "";
        if(document.getElementById('tutorJadwal')) document.getElementById('tutorJadwal').innerText = d.jadwal || "-";
        if(document.getElementById('dirJadwal')) document.getElementById('dirJadwal').value = d.jadwal || "";
        if(document.getElementById('tutorGoal')) document.getElementById('tutorGoal').innerText = d.goal || "-";
        if(document.getElementById('dirGoal')) document.getElementById('dirGoal').value = d.goal || "";
    });

    onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => {
        dataLengkap = []; snap.forEach(d => dataLengkap.push({id: d.id, ...d.data()}));
        const list = document.getElementById("logbookList"); if(!list) return; list.innerHTML = "";
        dataLengkap.forEach(d => list.innerHTML += `<div class="p-2 border-bottom mb-2 text-xs"><b>${d.nama} (${d.kelas})</b>: ${d.laporanSiswa}</div>`);
    });

    onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
        let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() })); chats.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0));
        const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = "";
        chats.forEach(c => {
            if(c.type === 'global') {
                const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..';
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs ${isMe?'text-wa':'text-primary'}">${c.sender}</div><div class="mt-1">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time}</div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });
}

if(document.getElementById("btnSaveDirBriefing")) {
    document.getElementById("btnSaveDirBriefing").onclick = async () => {
        if(!currentSchoolId) return alert("Pilih sekolah dhisik!");
        await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value, jadwal: document.getElementById("dirJadwal").value, goal: document.getElementById("dirGoal").value });
        alert("Setup kasil disimpen!");
    };
}
if(document.getElementById("btnSendChat")) {
    document.getElementById("btnSendChat").onclick = async () => {
        const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return;
        await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "direktur" });
        document.getElementById("inputChat").value = "";
    };
}
