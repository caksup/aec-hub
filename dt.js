/* ==================================================
   dt.js - Script Khusus Direktur (Panel Mas Afif)
   
   Riwayat Versi:
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
    <div class="modal fade" id="modalTema" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content"><div class="modal-header bg-wa text-white py-2"><h6 class="modal-title fw-bold">Pilih Tema</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-2"><button class="list-group-item w-100 p-2 mb-1 border rounded" onclick="setTema('light')">Terang</button><button class="list-group-item w-100 p-2 mb-1 border rounded" onclick="setTema('dark')">Gelap</button></div></div></div></div>
    <!-- Modal Tentang/Panduan/Roadmap singkat (Disuntik di sini...) -->
    `;
    document.body.insertAdjacentHTML('beforeend', globalModals);
    
    // Tema & Logout logic
    const savedTheme = localStorage.getItem('aecTheme') || 'system';
    window.setTema(savedTheme, false);
    document.getElementById("btnLogout").onclick = (e) => { e.preventDefault(); if(confirm("Keluar?")) { localStorage.clear(); window.location.replace("index.html"); } };
}

window.setTema = function(theme, closeUI = true) {
    localStorage.setItem('aecTheme', theme);
    document.documentElement.setAttribute('data-theme', theme === 'system' ? '' : theme);
};

// LOGIKA DIREKTUR
let currentSchoolId = ""; let dataLengkap = [];

// 1. Listen Schools
onSnapshot(collection(db, "schools"), (snap) => {
    let globalAllSchools = [];
    snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); });
    renderModernSchoolSelect(globalAllSchools);
    renderOverview(globalAllSchools);
});

function renderModernSchoolSelect(schools) {
    const container = document.getElementById("modernSchoolSelect");
    let html = `<button class="btn btn-sm btn-danger rounded-pill fw-bold school-pill" data-value="">OVERVIEW GLOBAL</button>`;
    schools.forEach(s => html += `<button class="btn btn-sm btn-outline-secondary rounded-pill fw-bold school-pill" data-value="${s.id}">${s.namaSekolah}</button>`);
    container.innerHTML = html;
    container.querySelectorAll('.school-pill').forEach(btn => btn.onclick = (e) => muatDataSekolah(e.target.getAttribute('data-value')));
}

function muatDataSekolah(sid) {
    currentSchoolId = sid;
    if(!sid) { 
        document.getElementById("schoolInfoBar").classList.add("d-none"); 
        new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show();
        return; 
    }
    document.getElementById("schoolInfoBar").classList.remove("d-none");
    
    // Listen Single School & Logbooks
    onSnapshot(doc(db, "schools", sid), (s) => {
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
    if(!currentSchoolId) return alert("Pilih sekolah!");
    await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value });
    alert("Briefing tersimpan!");
};

function renderLogbookList() {
    const list = document.getElementById("logbookList"); list.innerHTML = "";
    dataLengkap.forEach(d => {
        list.innerHTML += `<div class="p-2 border-bottom mb-2 text-xs"><b>${d.nama}</b>: ${d.laporanSiswa}</div>`;
    });
}

// Inisialisasi
document.addEventListener("DOMContentLoaded", initGlobalUI);
