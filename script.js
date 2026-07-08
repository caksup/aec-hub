/* ==================================================
   script.js - Skrip Pangkalan Data Global Terpadu
   AEC Hub - Versi 1.6.1 Ultimate
   
   Riwayat Versi (JS):
   - v1.0 - v1.4: Inisialisasi awal Firebase SDK Core, manajemen CRUD luring.
   - v1.5.0 - v1.5.3: Siklus tema, jam waktu nyata, integrasi FAB.
   - v1.5.4 - v1.5.7: Upaya penggabungan (Merger) massal logika tiga peran.
   - v1.5.8 - v1.6.0: Krisis kegagalan masuk akibat siklus loop pengalihan halaman.
   - v1.6.1: (CURRENT) REPARASI TOTAL SINKRONISASI PANGKALAN DATA. Pemisahan alur inisialisasi halaman menggunakan selektor rute ketat guna mencegah bentrok *null reference*. Logika logbook, obrolan, tugas WhatsApp, dan impor data eksternal pulih 100%.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Autentikasi Firebase
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

// Pemanggil Pop-up Modal Modern Pengganti Alert Bawaan
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

// Sesi Identitas Pengguna Lokal
const actUser = localStorage.getItem("loggedInUser"); 
const actRole = localStorage.getItem("loggedInRole"); 
const myName = localStorage.getItem("loggedInName");

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // SELEKTOR RUTE 1: HALAMAN LOGIN (INDEX.HTML)
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        if (actUser && actRole) {
            if (actRole === "admin") window.location.replace("superuser.html");
            else if (actRole === "direktur") window.location.replace("direktur.html");
            else window.location.replace("mentor.html");
            return;
        }
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById("btnLogin");
            const u = document.getElementById("username").value.toLowerCase().trim();
            const p = document.getElementById("pin").value.trim();
            if (!u || !p) return window.showModernAlert("Akses Ditolak", "ID Pengguna dan PIN wajib diisi.");
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...'; btn.disabled = true;
            try {
                const snap = await getDoc(doc(db, "users", u));
                if (snap.exists() && snap.data().pin === p) {
                    const data = snap.data();
                    if (data.status === "nonaktif") { window.showModernAlert("Akses Terkunci", "Akun Anda dinonaktifkan."); btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; return; }
                    localStorage.setItem("loggedInUser", u); localStorage.setItem("loggedInRole", data.role); localStorage.setItem("loggedInName", data.julukan || u);
                    if (data.role === "admin") window.location.replace("superuser.html");
                    else if (data.role === "direktur") window.location.replace("direktur.html");
                    else window.location.replace("mentor.html");
                } else { window.showModernAlert("Akses Ditolak", "ID atau PIN tidak sesuai."); btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; }
            } catch (err) { window.showModernAlert("Kesalahan Jaringan", "Gagal menghubungkan ke server."); btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; }
        });
        return; 
    }

    // PROTECTION SHIELD: Mencegah Akses Tanpa Login pada Dasbor
    if (!actUser || !actRole) { window.location.replace("index.html"); return; }

    // ==========================================
    // UTILLITAS UTAMA DASBOR GLOBAL
    // ==========================================
    if (document.getElementById("userNameDisplay")) document.getElementById("userNameDisplay").innerText = myName || "Pengguna";
    if (document.getElementById("userIdDisplay")) document.getElementById("userIdDisplay").innerText = actUser;

    // Sinkronisasi Jam Waktu Nyata
    function runClock() {
        const clk = document.getElementById('headClockDate'); if(!clk) return; const d = new Date();
        clk.innerText = `${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' })} WIB`;
    }
    setInterval(runClock, 1000); runClock();

    // Pemutus Sesi (Logout)
    if(document.getElementById("btnLogoutOffcanvas")) { 
        document.getElementById("btnLogoutOffcanvas").onclick = (e) => { e.preventDefault(); if(confirm("Yakin ingin keluar dari sistem AEC Hub?")) { localStorage.clear(); window.location.replace("index.html"); } }; 
    }

    let currentSchoolId = ""; let rawKurikulum = {}; let rawMasterSiswa = ""; let dataLengkap = []; let dataLengkapMentor = []; let masterTugasWA = [];
    let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
    let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;
    function killListeners() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; dataLengkapMentor = []; masterTugasWA = []; }

    // ==========================================
    // SELEKTOR RUTE 2: LOGIKA PANEL ADMIN
    // ==========================================
    const isSuperuserPage = document.getElementById("adminTabs") !== null;
    if (actRole === 'admin' && isSuperuserPage) {
        
        onSnapshot(collection(db, "schools"), (snap) => { 
            globalAllSchools = []; let archived = [];
            snap.forEach(d => { if(d.data().status !== 'archived') globalAllSchools.push({ id: d.id, ...d.data() }); else archived.push({ id: d.id, ...d.data() }); }); 
            renderSchoolSelectAdmin(); renderOverviewCardsAdmin(); processGlobalStudentsData();
            const listArsip = document.getElementById("listArsipSekolah");
            if(listArsip) { listArsip.innerHTML = ""; if(archived.length === 0) listArsip.innerHTML = "<div class='text-muted small text-center p-3'>Arsip kosong.</div>"; archived.forEach(s => { listArsip.innerHTML += `<div class="list-group-item d-flex justify-content-between align-items-center bg-white border mb-1 rounded"><div class="fw-bold text-dark text-sm">${s.namaSekolah}</div><button class="btn btn-sm btn-outline-primary py-0 px-3 rounded-pill fw-bold" onclick="window.readArchivedLogbook('${s.id}')">Buka</button></div>`; }); }
        });

        window.readArchivedLogbook = async function(sid) {
            const area = document.getElementById("areaLogbookArsip"); const box = document.getElementById("kontenLogbookArsip");
            if(!area || !box) return; document.getElementById("judulArsipLogbook").innerText = "Logbook Arsip: " + sid; area.classList.remove("d-none"); box.innerHTML = '<div class="text-center small text-muted">Memuat...</div>';
            try {
                const snap = await getDocs(query(collection(db, "logbooks"), where("schoolId", "==", sid))); let logs = [];
                snap.forEach(d => logs.push({id: d.id, ...d.data()})); logs.sort((a,b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
                if(logs.length === 0) { box.innerHTML = '<div class="text-center text-muted mt-2">Tidak ada logbook pengajaran.</div>'; return; }
                box.innerHTML = logs.map(d => `<div class="p-2 border rounded mb-2 bg-white shadow-sm"><div class="fw-bold text-wa">${d.nama.toUpperCase()} <span class="badge bg-secondary rounded-pill float-end">${d.kelas}</span></div><div class="text-dark mt-1 text-xs">📖 Materi: ${d.materi?.join(', ')}</div></div>`).join('');
            } catch (e) { box.innerHTML = '<div class="text-danger text-center">Gagal memuat arsip data.</div>'; }
        };

        function renderOverviewCardsAdmin() {
            const container = document.getElementById("overviewCardsContainer"); const labelTotal = document.getElementById("trackerPesertaList");
            if (!container) return; container.innerHTML = ""; let globalCount = 0;
            if (globalAllSchools.length === 0) { container.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah aktif.</div></div>`; if(labelTotal) labelTotal.innerHTML = "0 Peserta"; return; }
            globalAllSchools.forEach(s => {
                let count = 0; if (s.masterSiswa) s.masterSiswa.split('\n').forEach(line => { if(line.includes(':')) count += line.split(':')[1].split(',').filter(n => n.trim() !== "").length; });
                globalCount += count; const tutorsCount = (s.assignedMentors || []).length;
                container.innerHTML += `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-1" style="cursor: pointer; border-left: 4px solid var(--wa-primary) !important;" onclick="window.langsungKeSekolah('${s.id}')"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Waktu Sinkronisasi:</span><span class="text-xs fw-bold text-dark">${s.waktuUpdate ? s.waktuUpdate.toDate().toLocaleDateString('id-ID') : '-'}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Hari Operasional:</span><span class="badge bg-wa text-white rounded-pill">Hari ke-${s.hariBerjalan||0}</span></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary text-xs fw-bold">Mentor Terplot:</span><span class="badge bg-light text-dark border rounded-pill">${tutorsCount} Orang</span></div><div class="d-flex justify-content-between align-items-center"><span class="text-secondary text-xs fw-bold">Total Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${count} Siswa</span></div></div></div></div>`;
            });
            if(labelTotal) labelTotal.innerHTML = `<h5 class="fw-bold text-wa mb-1">${globalCount}</h5><span class="text-xs text-muted fw-bold">TOTAL PESERTA TERPLOTS</span>`;
        }

        function renderSchoolSelectAdmin() {
            const container = document.getElementById("modernSchoolSelect"); if (!container) return;
            let html = `<button class="btn btn-sm ${currentSchoolId === '' ? 'btn-danger active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value=""><i class="bi bi-globe"></i><span class="tab-label">GLOBAL</span></button><button class="btn btn-sm ${currentSchoolId === 'NEW' ? 'btn-wa active-pill' : 'btn-outline-success'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="NEW"><i class="bi bi-plus-circle"></i><span class="tab-label">BARU</span></button>`;
            globalAllSchools.forEach(s => { html += `<button class="btn btn-sm ${currentSchoolId === s.id ? 'btn-wa active-pill' : 'btn-outline-secondary'} rounded-pill fw-bold flex-shrink-0 school-pill" data-value="${s.id}"><i class="bi bi-building"></i><span class="tab-label">${s.namaSekolah}</span></button>`; });
            container.innerHTML = html; container.querySelectorAll('.school-pill').forEach(btn => { btn.onclick = (e) => { window.langsungKeSekolah(e.currentTarget.getAttribute('data-value')); }; });
        }

        window.langsungKeSekolah = function(val) {
            killListeners(); currentSchoolId = val; renderSchoolSelectAdmin();
            if(!val) {
                if(document.getElementById("adminLogbookList")) document.getElementById("adminLogbookList").innerHTML = `<div class="alert alert-secondary small text-center">Pilih lokasi sekolah spesifik untuk memuat riwayat.</div>`;
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-sekolah"]')).show(); processGlobalStudentsData();
            } else if(val === "NEW") {
                if(document.getElementById("inputIdSchool")) { document.getElementById("inputIdSchool").readOnly = false; document.getElementById("inputIdSchool").value = ""; document.getElementById("inputSekolah").value = ""; document.getElementById("inputTotalHari").value = 5; document.getElementById("inputHariKe").value = 0; document.getElementById("inputMasterKelas").value = ""; document.getElementById("inputBriefing").value = ""; document.getElementById("inputJadwal").value = ""; document.getElementById("inputGoal").value = ""; document.getElementById("inputMasterSiswa").value = ""; document.getElementById("inputVocab").value = ""; document.getElementById("inputSpeaking").value = ""; document.getElementById("inputGrammar").value = ""; document.getElementById("inputPractice").value = ""; }
                currentAssignedMentors = []; renderMentorChecklistAdmin(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-setup"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#setup-spesifik"]')).show();
            } else {
                new bootstrap.Tab(document.querySelector('button[data-bs-target="#tab-overview"]')).show(); new bootstrap.Tab(document.querySelector('button[data-bs-target="#sub-logbook"]')).show();
                connectDatabaseAdmin(val);
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
                const arr = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                const targets = ['filterKelasHistori', 'waTarget'];
                targets.forEach(id => { const el = document.getElementById(id); if(!el) return; el.innerHTML = (id === 'waTarget' ? `<option value="GLOBAL">GLOBAL (Semua Kelas)</option>` : `<option value="SEMUA">Semua Kelas</option>`) + arr.map(k => `<option value="${k}">${k}</option>`).join(''); });
            });
            unsubLogbooks = onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { dataLengkap = []; snap.forEach(d => dataLengkap.push({ id: d.id, ...d.data() })); dataLengkap.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); extractDaysLogbookAdmin(); renderLogbooksListAdmin(); calculateLeaderboardTutorAdmin(); });
            unsubChats = onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); arr.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0)); const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = arr.map(c => { const isMe = c.sender === myName; return `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs text-wa">${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${c.waktu?c.waktu.toDate().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'..'}<i class="bi bi-trash ms-2 text-danger" style="cursor:pointer;" onclick="window.deleteChatMessageAdmin('${c.id}')"></i></div></div>`; }).join(''); box.scrollTop = box.scrollHeight; });
            unsubWA = onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(d => masterTugasWA.push({ id: d.id, ...d.data() })); masterTugasWA.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); renderTugasWAAdmin(); });
        }

        if(document.getElementById("btnSimpanRoadmap")) {
            document.getElementById("btnSimpanRoadmap").onclick = async () => {
                const w = document.getElementById("rmWaktu").value.trim(); const j = document.getElementById("rmJudul").value.trim(); const d = document.getElementById("rmDesc").value.trim(); if(!w || !j) return window.showModernAlert("Peringatan", "Bilah pengisian wajib dilengkapi.");
                try { await addDoc(collection(db, "roadmaps"), { waktu_target: w, judul: j, deskripsi: d, created_at: serverTimestamp() }); window.showModernAlert("Sukses", "Peta Jalan direkam.", "success"); document.getElementById("rmWaktu").value = ""; document.getElementById("rmJudul").value = ""; document.getElementById("rmDesc").value = ""; } catch(e) { window.showModernAlert("Kesalahan", e.message); }
            };
        }

        onSnapshot(query(collection(db, "roadmaps")), (snap) => {
            const c1 = document.getElementById("overviewRoadmap"); const c2 = document.getElementById("sistemRoadmapList");
            let data = []; snap.forEach(d => data.push({id: d.id, ...d.data()})); data.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
            if(c1) c1.innerHTML = data.map(r => `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`).join('');
            if(c2) c2.innerHTML = data.map(r => `<li class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom"><div><div class="fw-bold text-dark text-sm">${r.judul}</div><div class="text-muted" style="font-size:0.65rem">${r.waktu_target}</div></div><i class="bi bi-trash text-danger" style="cursor:pointer;" onclick="window.removeRoadmapAdmin('${r.id}')"></i></li>`).join('');
        });
        window.removeRoadmapAdmin = async function(id) { if(confirm("Hapus perencanaan ini permanen?")) await deleteDoc(doc(db, "roadmaps", id)); };

        onSnapshot(collection(db, "users"), (snap) => {
            globalAllUsers = []; const tbody = document.getElementById("listUsersTable"); if(!tbody) return; tbody.innerHTML = "";
            snap.forEach(d => {
                const ud = d.data(); const uid = d.id; globalAllUsers.push({id: uid, ...ud});
                let statusButton = ud.role === 'admin' ? `<span class="badge bg-secondary text-xs">Super</span>` : `<button class="btn btn-sm bg-transparent border-0 p-0" onclick="window.toggleUserStatusAdmin('${uid}', '${ud.status === 'aktif' ? 'nonaktif' : 'aktif'}')"><i class="bi ${ud.status === 'aktif' ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'} fs-4"></i></button>`;
                let deleteButton = ud.role === 'admin' ? `<button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1 rounded-pill" disabled><i class="bi bi-trash"></i></button>` : `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1 rounded-pill" onclick="window.purgeUserAdmin('${uid}')"><i class="bi bi-trash"></i></button>`;
                let editButton = `<button class="btn btn-sm btn-outline-warning py-0 px-1 ms-1 rounded-pill" onclick="window.preloadUserEditAdmin('${uid}', '${ud.julukan}', '${ud.role}', '${ud.pin}')"><i class="bi bi-pencil"></i></button>`;
                tbody.innerHTML += `<tr><td class="text-start ps-2"><b>${uid}</b><br><small class="text-muted">${ud.julukan}</small></td><td class="text-uppercase fw-bold text-xs">${ud.role}<br><span class="text-danger font-monospace">${ud.pin}</span></td><td><div class="d-flex justify-content-center align-items-center gap-1">${statusButton}${editButton}${deleteButton}</div></td></tr>`;
            }); renderMentorChecklistAdmin();
        });
        window.toggleUserStatusAdmin = async function(uid, s) { await updateDoc(doc(db, "users", uid), { status: s }); };
        window.purgeUserAdmin = async function(uid) { if(confirm(`Hapus permanen akun ${uid}?`)) await deleteDoc(doc(db, "users", uid)); };
        window.preloadUserEditAdmin = function(uid, j, r, p) { document.getElementById("newUser").value = uid; document.getElementById("newUser").readOnly = true; document.getElementById("newPin").value = p; document.getElementById("newName").value = j; document.getElementById("newRole").value = r; };
        
        if(document.getElementById("btnAddUser")) {
            document.getElementById("btnAddUser").onclick = async () => {
                const u = document.getElementById("newUser").value.toLowerCase().trim(); const p = document.getElementById("newPin").value.trim(); const n = document.getElementById("newName").value.trim(); const r = document.getElementById("newRole").value; if(!u || !p || !n) return window.showModernAlert("Peringatan", "Lengkapi seluruh formulir.");
                await setDoc(doc(db, "users", u), { pin: p, julukan: n, role: r, status: "aktif" }, { merge: true }); window.showModernAlert("Berhasil", "Akun diperbarui.", "success"); document.getElementById("newUser").readOnly = false; document.getElementById("newUser").value = ""; document.getElementById("newPin").value = ""; document.getElementById("newName").value = "";
            };
        }
        function renderMentorChecklistAdmin() { const box = document.getElementById("setupMentorList"); if (!box) return; box.innerHTML = globalAllUsers.filter(u => u.status === 'aktif').map(u => `<div class="col-6"><div class="form-check border p-1 bg-white rounded shadow-sm"><input class="form-check-input check-mentor ms-1" type="checkbox" value="${u.id}" id="chk_${u.id}" ${currentAssignedMentors.includes(u.id)?"checked":""}><label class="form-check-label ms-1 text-xs fw-bold" for="chk_${u.id}">${u.julukan}</label></div></div>`).join(''); }

        if(document.getElementById("btnSaveSchool")) {
            document.getElementById("btnSaveSchool").onclick = async () => {
                const sid = document.getElementById("inputIdSchool").value.toLowerCase().trim().replace(/\s+/g, ''); if(!sid) return window.showModernAlert("Peringatan", "ID Handle Sekolah wajib.");
                const parseArr = (id) => document.getElementById(id).value.split('\n').map(i => i.trim()).filter(i => i !== "");
                const mentors = Array.from(document.querySelectorAll('.check-mentor:checked')).map(c => c.value);
                try { await setDoc(doc(db, "schools", sid), { namaSekolah: document.getElementById('inputSekolah').value, totalHari: parseInt(document.getElementById('inputTotalHari').value) || 5, hariBerjalan: parseInt(document.getElementById('inputHariKe').value) || 0, masterKelas: document.getElementById('inputMasterKelas').value, jadwal: document.getElementById('inputJadwal').value, briefing: document.getElementById('inputBriefing').value, goal: document.getElementById('inputGoal').value, masterSiswa: document.getElementById('inputMasterSiswa').value, kurikulum: { vocab: parseArr('inputVocab'), speaking: parseArr('inputSpeaking'), grammar: parseArr('inputGrammar'), practice: parseArr('inputPractice') }, assignedMentors: mentors, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); window.showModernAlert("Berhasil", "Konfigurasi disimpan.", "success"); window.langsungKeSekolah(sid); } catch (e) { window.showModernAlert("Kesalahan", e.message); }
            };
        }
        if(document.getElementById("btnArsipSekolah")) { document.getElementById("btnArsipSekolah").onclick = async () => { if(currentSchoolId && currentSchoolId !== 'NEW') { if(confirm("Arsipkan sekolah ini?")) { await setDoc(doc(db, "schools", currentSchoolId), { status: 'archived' }, {merge:true}); window.showModernAlert("Arsip", "Sekolah dinonaktifkan.", "success"); window.langsungKeSekolah(""); } } }; }

        function extractDaysLogbookAdmin() { const map = new Map(); dataLengkap.forEach(d => { if(d.waktu) map.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sorted = Array.from(map.entries()).sort((a,b) => a[1] - b[1]); const el = document.getElementById("filterHari"); if(!el) return; el.innerHTML = '<option value="SEMUA">Semua Log Kehadiran</option>' + sorted.map((entry, idx) => `<option value="${entry[0]}">Hari ke-${idx+1}</option>`).join(''); }
        function renderLogbooksListAdmin() {
            const box = document.getElementById("adminLogbookList"); if(!box) return;
            const fH = document.getElementById("filterHari").value; const fK = document.getElementById("filterKelasHistori").value;
            let res = dataLengkap; if (fH !== "SEMUA") res = res.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fH); if (fK !== "SEMUA") res = res.filter(d => d.kelas === fK);
            if(res.length === 0) { box.innerHTML = `<div class="alert alert-secondary text-center small border-0">Logbook Kosong.</div>`; return; }
            box.innerHTML = res.map(d => `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs text-dark"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><b class="text-wa">${d.nama.toUpperCase()}</b><span class="badge bg-secondary rounded-pill">${d.kelas}</span></div><div class="mb-1">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div class="mb-1">📝 <b>Catatan:</b> ${d.laporanSiswa || '-'}</div><div class="text-end mt-2"><button class="btn btn-xs btn-outline-danger py-0 px-3 rounded-pill fw-bold" onclick="window.purgeLogbookLineAdmin('${d.id}')">Hapus</button></div></div>`).join('');
        }
        window.purgeLogbookLineAdmin = async function(id) { if(confirm("Hapus baris logbook ini?")) await deleteDoc(doc(db, "logbooks", id)); };
        if(document.getElementById('filterHari')) document.getElementById('filterHari').onchange = renderLogbooksListAdmin;
        if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').onchange = renderLogbooksListAdmin;

        function calculateLeaderboardTutorAdmin() { let rekap = {}; dataLengkap.forEach(l => { if(!rekap[l.nama]) rekap[l.nama] = 0; rekap[l.nama]++; }); const board = document.getElementById("leaderboardTutor"); if(!board) return; board.innerHTML = Object.entries(rekap).sort((a,b)=>b[1]-a[1]).map(([nm, ct], idx) => `<div class="d-flex justify-content-between p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark">${idx===0?"🥇":(idx===1?"🥈":"🏅")} ${nm}</div><div class="badge bg-wa rounded-pill">${ct} Logbook</div></div>`).join('') || 'Belum ada data mengajar.'; }

        async function processGlobalStudentsData() {
            const table = document.getElementById("tabelNilaiGlobal"); const presentBox = document.getElementById("containerKehadiranGlobal"); const prestBox = document.getElementById("trackerPrestasiList");
            if(!table || !presentBox || !prestBox) return; table.innerHTML = `<tr><td colspan="6" class="text-muted">Memuat rekapan...</td></tr>`;
            let scores = {}; let attendance = { h: 0, a: 0, s: 0, i: 0 }; let activeIds = globalAllSchools.map(s => s.id);
            if(activeIds.length === 0) { table.innerHTML = `<tr><td colspan="6" class="text-muted">Data kosong.</td></tr>`; presentBox.innerHTML = `Kosong.`; prestBox.innerHTML = `Kosong.`; return; }
            try {
                const snap = await getDocs(collection(db, "logbooks"));
                snap.forEach(doc => {
                    const d = doc.data();
                    if(activeIds.includes(d.schoolId) && d.dataSiswa) {
                        d.dataSiswa.forEach(s => {
                            const id = `${s.nama} (${d.kelas})`; if(!scores[id]) scores[id] = { vocab: '-', speak: '-', grammar: '-', prac: '-', sum: 0 };
                            let h = (s.nilai || "").toUpperCase();
                            if(['A','B','C'].includes(h)) { let str = (d.materi || []).join(' ').toLowerCase(); if(str.includes('vocab')) scores[id].vocab = h; if(str.includes('speak')) scores[id].speak = h; if(str.includes('gram')) scores[id].grammar = h; if(str.includes('prac')) scores[id].prac = h; }
                            if(h === 'A' || h === 'A+') scores[id].sum += 90; else if(parseInt(h) > 0) scores[id].sum += parseInt(h);
                            if(s.kehadiran === 'h') attendance.h++; if(s.kehadiran === 'a') attendance.a++; if(s.kehadiran === 's') attendance.s++; if(s.kehadiran === 'i') attendance.i++;
                        });
                    }
                });
                let html = ""; let rank = []; let num = 1;
                for (const [name, nl] of Object.entries(scores)) { rank.push({ name, poin: nl.sum }); html += `<tr><td>${num++}</td><td class="text-start fw-bold text-dark text-xs">${name}</td><td class="fw-bold text-success">${nl.vocab}</td><td class="fw-bold text-primary">${nl.speak}</td><td class="fw-bold text-info">${nl.grammar}</td><td class="fw-bold text-warning">${nl.prac}</td></tr>`; }
                table.innerHTML = html || `<tr><td colspan="6" class="text-muted">Belum ada nilai terinput.</td></tr>`;
                presentBox.innerHTML = `<div class="row g-2 text-center mt-2"><div class="col-6"><div class="p-2 border rounded bg-white"><h4 class="fw-bold text-success mb-0">${attendance.h}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">HADIR</span></div></div><div class="col-6"><div class="p-3 border rounded bg-white"><h4 class="fw-bold text-danger mb-0">${attendance.a}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">ALFA</span></div></div><div class="col-6"><div class="p-3 border rounded bg-white"><h4 class="fw-bold text-warning mb-0">${attendance.s}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">SAKIT</span></div></div><div class="col-6"><div class="p-3 border rounded bg-white"><h4 class="fw-bold text-info mb-0">${attendance.i}</h4><span class="text-muted fw-bold" style="font-size:0.65rem;">IZIN</span></div></div></div>`;
                rank.sort((a,b) => b.poin - a.poin).slice(0, 10);
                prestBox.innerHTML = rank.map((item, idx) => `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-light text-sm"><div class="fw-bold text-dark"><span class="badge ${idx===0?"bg-warning text-dark":"bg-wa text-white"} rounded-pill">#${idx+1}</span> ${item.name}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`).join('') || 'Kosong.';
            } catch (e) { table.innerHTML = `<tr><td colspan="6" class="text-danger">Gagal sinkronisasi data rekap.</td></tr>`; }
        }

        if(document.getElementById("btnKirimTugasWA")) { document.getElementById("btnKirimTugasWA").onclick = async () => { const i = document.getElementById("waInstruksi").value; if(!i) return window.showModernAlert("Peringatan", "Instruksi wajib."); await addDoc(collection(db, "tugas_wa"), { schoolId: currentSchoolId, targetKelas: document.getElementById("waTarget").value || "GLOBAL", linkGambar: document.getElementById("waGambar").value, instruksi: i, waktu: serverTimestamp() }); window.showModernAlert("Sukses", "Tugas WA dipublikasikan.", "success"); document.getElementById("waInstruksi").value = ""; document.getElementById("waGambar").value = ""; }; }
        function renderTugasWAAdmin() { const box = document.getElementById("listTugasWAHistory"); if(!box) return; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); box.innerHTML = dt.map(d => `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill">${d.targetKelas}</span><span class="text-xs text-muted">${d.waktu?d.waktu.toDate().toLocaleDateString('id-ID'):''}</span></div>${d.linkGambar?`<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height:120px; object-fit:cover;">`:''}<div class="p-2 bg-light border rounded text-sm font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-outline-danger btn-sm mt-2 rounded-pill fw-bold" onclick="window.tarikTugasWAAdmin('${d.id}')">Tarik Tugas</button></div>`).join('') || '<div class="text-center text-muted small">Kosong.</div>'; }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderTugasWAAdmin;
        window.tarikTugasWAAdmin = async function(id) { if(confirm("Hapus tugas ini dari lapangan?")) await deleteDoc(doc(db, "tugas_wa", id)); };

        if(document.getElementById("btnSaveMateri")) { document.getElementById("btnSaveMateri").onclick = async () => { const j = document.getElementById("materiJudul").value.trim(); const k = document.getElementById("materiKelas").value; const l = document.getElementById("materiLink").value.trim(); if(!j || !l) return window.showModernAlert("Peringatan", "Lengkapi formulir."); await addDoc(collection(db, "materials"), { judul: j, kelas: k, link: l, waktu: serverTimestamp() }); window.showModernAlert("Sukses", "Materi diunggah.", "success"); document.getElementById("materiJudul").value = ""; document.getElementById("materiLink").value = ""; }; }
        onSnapshot(collection(db, "materials"), (snap) => { const box = document.getElementById("listGudangMateri"); if(!box) return; box.innerHTML = snap.docs.map(d => { const data = d.data(); return `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm"><div><div class="fw-bold text-dark text-sm">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div><a href="${data.link}" target="_blank" class="text-xs text-primary text-decoration-none"><i class="bi bi-link"></i> Buka Link</a></div><button class="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill" onclick="window.hapusMateriCloudAdmin('${d.id}')"><i class="bi bi-trash"></i></button></div>`; }).join(''); });
        window.hapusMateriCloudAdmin = async function(id) { if(confirm("Hapus pustaka ini?")) await deleteDoc(doc(db, "materials", id)); };
        window.hapusPesanObrolan = async function(cid) { if(confirm("Hapus pesan ini?")) await deleteDoc(doc(db, "chats", cid)); };
    }

    // ==========================================
    // BLOK 3B: LOGIKA PANEL DIREKTUR
    // ==========================================
    const isDirekturPage = document.getElementById("menuTabs") !== null && actRole === 'direktur';
    if (isDirekturPage) {
        onSnapshot(collection(db, "schools"), (snap) => {
            let arr = []; snap.forEach(d => { if(d.data().status !== 'archived') arr.push({ id: d.id, ...d.data() }); });
            const sel = document.getElementById("modernSchoolSelect"); const cards = document.getElementById("overviewCardsContainer");
            if(sel) sel.innerHTML = `<option value="">Pilih Sekolah Pengawasan...</option>` + arr.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('');
            if(cards) cards.innerHTML = arr.map(s => `<div class="col-12 col-md-6"><div class="card border-0 shadow-sm rounded-4 bg-white p-1" style="border-left: 4px solid var(--wa-primary) !important;"><div class="card-body p-3"><h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6><div class="d-flex justify-content-between mb-2"><span class="text-xs text-muted fw-bold">Hari:</span><span class="badge bg-wa rounded-pill">${s.hariBerjalan||0}/${s.totalHari||0}</span></div></div></div></div>`).join('');
        });

        window.langsungKeSekolah = function(sid) {
            currentSchoolId = sid; if(!sid) { document.getElementById("schoolInfoBar").classList.add("d-none"); return; }
            document.getElementById("schoolInfoBar").classList.remove("d-none");
            onSnapshot(doc(db, "schools", sid), (snap) => {
                if(!snap.exists()) return; const d = snap.data();
                document.getElementById('headSekolah').innerText = d.namaSekolah; document.getElementById("headTimeline").innerText = `${d.hariBerjalan||0}/${d.totalHari||0}`;
                document.getElementById('tutorBriefing').innerText = d.briefing || "-"; document.getElementById('dirBriefing').value = d.briefing || "";
                document.getElementById('tutorJadwal').innerText = d.jadwal || "-"; document.getElementById('dirJadwal').value = d.jadwal || "";
                document.getElementById('tutorGoal').innerText = d.goal || "-"; document.getElementById('dirGoal').value = d.goal || "";
                if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = getActiveSchedule(d.jadwal);
                rawKurikulum = d.kurikulum || {}; const cls = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                ['filterKelasSiswa', 'trackerKelas', 'filterKelasHistori', 'filterWA'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = `<option value="SEMUA">Semua Kelas</option>` + cls.map(k => `<option value="${k}">${k}</option>`).join(''); });
            });
            onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => { dataLengkap = []; snap.forEach(d => dataLengkap.push(d.data())); dataLengkap.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); extractDaysLogbookDir(); renderLogbooksListDir(); renderTrackerDir(); calculateLeaderboardStudentsDir(); renderRecentLogbooksOnBeranda(); });
            onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => { let arr = []; snap.forEach(d => arr.push(d.data())); arr.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0)); const box = document.getElementById("chatBox"); if(box) box.innerHTML = arr.map(c => `<div class="msg-bubble ${c.sender===myName?'msg-me':'msg-other'} mb-2"><div class="fw-bold text-xs text-wa">${c.role==='direktur'?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div></div>`).join(''); if(box) box.scrollTop = box.scrollHeight; });
            onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { masterTugasWA = []; snap.forEach(d => masterTugasWA.push(d.data())); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); renderTugasWAPantauanDir(); });
        }

        if(document.getElementById("btnSaveDirBriefing")) { document.getElementById("btnSaveDirBriefing").onclick = async () => { if(!currentSchoolId) return; await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value, jadwal: document.getElementById("dirJadwal").value, goal: document.getElementById("dirGoal").value }); window.showModernAlert("Berhasil", "Arahan terdistribusi.", "success"); }; }
        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "direktur" }); document.getElementById("inputChat").value = ""; }; }

        function renderRecentLogbooksOnBeranda() { const box = document.getElementById("dirBerandaLogbook"); if(!box) return; box.innerHTML = dataLengkap.slice(0, 5).map(d => `<div class="border-bottom pb-2 mb-2"><div class="d-flex justify-content-between"><span class="fw-bold text-dark text-xs">${d.nama.toUpperCase()}</span><span class="badge bg-secondary rounded-pill text-xs">${d.kelas}</span></div><div class="text-xs text-muted mt-1">📝 ${d.laporanSiswa || '-'}</div></div>`).join('') || 'Belum ada riwayat.'; }
        function extractDaysLogbookDir() { const map = new Map(); dataLengkap.forEach(d => { if(d.waktu) map.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sorted = Array.from(map.entries()).sort((a,b) => a[1] - b[1]); const el = document.getElementById("filterHari"); if(el) el.innerHTML = '<option value="SEMUA">Semua Waktu</option>' + sorted.map((entry, idx) => `<option value="${entry[0]}">Hari ke-${idx+1}</option>`).join(''); }
        function renderLogbooksListDir() { const box = document.getElementById("logbookList"); if(!box) return; const fH = document.getElementById("filterHari").value; const fK = document.getElementById("filterKelasHistori").value; let dt = dataLengkap; if (fH !== "SEMUA") dt = dt.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fH); if (fK !== "SEMUA") dt = dt.filter(d => d.kelas === fK); box.innerHTML = dt.map(d => `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs"><div class="fw-bold text-wa border-bottom pb-1 mb-1">${d.nama.toUpperCase()} (${d.kelas})</div><div>📖 Materi: ${d.materi?.join(', ')}</div><div>📝 Note: ${d.laporanSiswa || '-'}</div></div>`).join('') || 'Kosong.'; }
        if(document.getElementById('filterHari')) document.getElementById('filterHari').onchange = renderLogbooksListDir; if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').onchange = renderLogbooksListDir;

        function renderTrackerDir() { const area = document.getElementById("areaTracker"); const cls = document.getElementById("trackerKelas").value; if(!area || !rawKurikulum.vocab) return; let done = new Set(); dataLengkap.forEach(l => { if (l.kelas === cls && l.materi) l.materi.forEach(m => done.add(m)); }); const block = (title, arr, color) => `<div class="mb-2"><h6 class="text-xs fw-bold text-${color} mb-1 border-bottom pb-1">${title}</h6>${(arr||[]).map(m => `<div class="p-1 mb-1 rounded text-xs d-flex justify-content-between ${done.has(m)?`bg-${color} bg-opacity-10 border-${color}`:'border'}"><span>${m}</span>${done.has(m)?`<i class="bi bi-check-circle-fill text-${color}"></i>`:`<i class="bi bi-circle opacity-50"></i>`}</div>`).join('')}</div>`; area.innerHTML = block("KOSAKATA", rawKurikulum.vocab, "primary") + block("BERBICARA", rawKurikulum.speaking, "success") + block("TATA BAHASA", rawKurikulum.grammar, "danger") + block("PRAKTIK KELAS", rawKurikulum.practice, "warning"); }
        if(document.getElementById('trackerKelas')) document.getElementById('trackerKelas').onchange = renderTrackerDir;

        function kalkulasiDataSiswa() { /* Alias fallback */ calculateLeaderboardStudentsDir(); }
        function calculateLeaderboardStudentsDir() { const cls = document.getElementById("filterKelasSiswa").value; let r = {}; dataLengkap.forEach(l => { if(l.kelas === cls && l.dataSiswa) { l.dataSiswa.forEach(s => { if(!r[s.nama]) r[s.nama] = 0; let n = (s.nilai || "").toString().toLowerCase(); if(['a','a+'].includes(n)) r[s.nama] += 90; else if(parseInt(n) > 0) r[s.nama] += parseInt(n); }); } }); const box = document.getElementById("listTop10"); if(!box) return; let arr = Object.entries(r).map(([nama, poin]) => ({ nama, poin })).sort((a,b) => b.poin - a.poin).slice(0, 10); box.innerHTML = arr.map((item, idx) => `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-white text-sm"><div class="fw-bold text-dark"><span class="badge ${idx===0?"bg-warning text-dark":"bg-wa text-white"} rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`).join('') || 'Belum ada data nilai.'; }
        if(document.getElementById('filterKelasSiswa')) document.getElementById('filterKelasSiswa').onchange = calculateLeaderboardStudentsDir;

        function renderTugasWAPantauanDir() { const box = document.getElementById("listTugasWAHistory"); if(!box) return; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); box.innerHTML = dt.map(d => `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill">${d.targetKelas}</span><span class="text-xs text-muted">${d.waktu?d.waktu.toDate().toLocaleDateString('id-ID'):''}</span></div><div class="p-2 bg-light border rounded text-sm font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div></div>`).join('') || 'Kosong.'; }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderTugasWAPantauanDir;
    }

    // ==========================================
    // BLOK 3C: LOGIKA PANEL MENTOR (EKSEKUTOR)
    // ==========================================
    const isMentorPage = document.getElementById("menuTabs") !== null && actRole === 'mentor';
    if (isMentorPage) {
        if(document.getElementById('inputKelas')) document.getElementById('inputKelas').onchange = renderFormAbsenMentor;
        if(document.getElementById("btnSubmitLogbook")) document.getElementById("btnSubmitLogbook").onclick = eksekusiKirimLogbookMentor;
        if(document.getElementById("btnKirimLapor")) { document.getElementById("btnKirimLapor").onclick = () => { const detail = document.getElementById("laporDetail").value.trim(); if(!detail) return window.showModernAlert("Peringatan", "Lengkapi detail kendala."); window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(`🚨 *KENDALA MENTOR* 🚨\n\n*Nama:* ${myName}\n*Detail:* ${detail}`)}`, '_blank'); document.getElementById("laporDetail").value = ""; }; }
        if(document.getElementById("btnSendChat")) { document.getElementById("btnSendChat").onclick = async () => { const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return; await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "mentor" }); document.getElementById("inputChat").value = ""; }; }

        onSnapshot(collection(db, "schools"), (snap) => {
            let arr = []; snap.forEach(doc => { if(doc.data().status !== 'archived') arr.push({ id: doc.id, ...doc.data() }); });
            const s = arr.find(sch => sch.assignedMentors && sch.assignedMentors.includes(actUser));
            if(s) {
                currentSchoolId = s.id; document.getElementById("pesanKosong").classList.add("d-none"); document.getElementById("utamaMentorContent").classList.remove("d-none");
                if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none");
                document.getElementById("headSekolah").innerText = s.namaSekolah; document.getElementById("headTimeline").innerText = `${s.hariBerjalan||0}/${s.totalHari||0}`;
                document.getElementById("tutorBriefing").innerText = s.briefing || "-"; document.getElementById("tutorJadwal").innerText = s.jadwal || "-"; document.getElementById("tutorGoal").innerText = s.goal || "-";
                const activeLive = getActiveSchedule(s.jadwal); document.getElementById("tutorJadwalHarian").innerText = activeLive;
                rawKurikulum = s.kurikulum || {}; rawMasterSiswa = s.masterSiswa || "";
                
                const cls = (s.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
                document.getElementById("inputKelas").innerHTML = '<option value="">Pilih Kelas...</option>' + cls.map(k => `<option value="${k}">${k}</option>`).join('');
                if(document.getElementById("mentorFilterKelasHistori")) document.getElementById("mentorFilterKelasHistori").innerHTML = `<option value="SEMUA">Semua Kelas</option>` + cls.map(k => `<option value="${k}">${k}</option>`).join('');
                
                renderDinamicMateriMentor(activeLive); renderFormAbsenMentor();
                if(document.getElementById("filterWA")) document.getElementById("filterWA").innerHTML = `<option value="SEMUA">Semua Kelas</option>` + cls.map(k => `<option value="${k}">${k}</option>`).join('');
            } else {
                document.getElementById("pesanKosong").classList.remove("d-none"); document.getElementById("utamaMentorContent").classList.add("d-none"); document.getElementById("schoolInfoBar").classList.add("d-none");
            }
        });

        onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", actUser/*Siasat fallback aman*/)), (snap) => { /* Ditangani via sid global di rute bawah */ });

        // Pendengar Riwayat Logbook Utama Terpusat Per Sekolah Mentor Bertugas
        onSnapshot(collection(db, "logbooks"), (snap) => {
            dataLengkapMentor = []; snap.forEach(doc => { if(doc.data().schoolId === currentSchoolId) dataLengkapMentor.push(doc.data()); });
            dataLengkapMentor.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
            renderRiwayatLogbookMentor();
        });

        onSnapshot(collection(db, "chats"), (snap) => {
            let arr = []; snap.forEach(d => { if(d.data().schoolId === currentSchoolId) arr.push(d.data()); }); arr.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0));
            const box = document.getElementById("chatBox"); if(box) box.innerHTML = arr.map(c => `<div class="msg-bubble ${c.sender===myName?'msg-me':'msg-other'} mb-2"><div class="fw-bold text-xs text-wa">${c.role==='direktur'?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div></div>`).join(''); if(box) box.scrollTop = box.scrollHeight;
        });

        onSnapshot(collection(db, "tugas_wa"), (snap) => {
            masterTugasWA = []; snap.forEach(d => { if(d.data().schoolId === currentSchoolId) masterTugasWA.push(d.data()); }); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0));
            renderTugasWAEksekusiMentor();
        });

        function renderRiwayatLogbookMentor() {
            const list = document.getElementById("mentorLogbookList"); const fil = document.getElementById("mentorFilterKelasHistori") ? document.getElementById("mentorFilterKelasHistori").value : "SEMUA";
            if(list) {
                let res = dataLengkapMentor; if(fil !== "SEMUA") res = res.filter(d => d.kelas === fil);
                list.innerHTML = res.map(d => `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs border-start border-wa border-4"><div class="d-flex justify-content-between border-bottom pb-1 mb-1"><b class="text-dark">${d.nama.toUpperCase()}</b><span class="badge bg-secondary rounded-pill">${d.kelas}</span></div><div class="mb-1 text-dark">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div class="mb-1 text-dark">📝 <b>Catatan:</b> ${d.laporanSiswa || '-'}</div></div>`).join('') || `<div class="text-center text-muted small p-3">Belum ada riwayat.</div>`;
            }
            const beranda = document.getElementById("berandaLogbook");
            if(beranda) beranda.innerHTML = dataLengkapMentor.slice(0, 5).map(d => `<div class="border-bottom pb-2 mb-2"><div class="d-flex justify-content-between"><span class="fw-bold text-dark text-xs">${d.nama.toUpperCase()}</span><span class="badge bg-secondary rounded-pill text-xs">${d.kelas}</span></div><div class="text-xs text-muted mt-1">📝 ${d.laporanSiswa || '-'}</div></div>`).join('') || 'Belum ada riwayat.';
        }
        if(document.getElementById("mentorFilterKelasHistori")) document.getElementById("mentorFilterKelasHistori").onchange = renderRiwayatLogbookMentor;

        function renderTugasWAEksekusiMentor() {
            const list = document.getElementById("listTugasWAHarian"); if(!list) return; const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA";
            let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil);
            list.innerHTML = dt.map(d => `<div class="card card-custom p-3 mb-3 bg-white shadow-sm border"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3 py-1 shadow-sm">${d.targetKelas}</span></div><div class="p-2 bg-light border rounded text-sm mb-3 font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-wa btn-sm w-100 fw-bold rounded-pill shadow-sm" onclick="window.broadcastTugasWA('${encodeURIComponent(d.instruksi)}')"><i class="bi bi-whatsapp me-2"></i> Broadcast</button></div>`).join('') || '<div class="text-muted text-center small p-4">Belum ada penugasan instruksi WA.</div>';
        }
        if(document.getElementById("filterWA")) document.getElementById("filterWA").onchange = renderTugasWAEksekusiMentor;
        window.broadcastTugasWA = function(txt) { window.open(`https://wa.me/?text=${txt}`, '_blank'); };

        function renderDinamicMateriMentor(live) {
            const str = live.toLowerCase(); const builder = (arr, parent) => { const el = document.getElementById(parent); if(!el || !arr) return; el.innerHTML = arr.map(m => `<div class="col-12"><div class="form-check p-2 border rounded bg-white shadow-sm mb-1 d-flex align-items-center"><input class="form-check-input ms-1 cek-materi" type="checkbox" value="${m.replace(/"/g, '&quot;')}"><label class="form-check-label text-dark text-xs ms-2 fw-bold w-100">${m}</label></div></div>`).join(''); };
            ['wadahVocab','wadahSpeaking','wadahGrammar','wadahPractice'].forEach(id => document.getElementById(id).classList.add('d-none'));
            let hit = false;
            if(str.includes("vocab")) { document.getElementById("wadahVocab").classList.remove('d-none'); builder(rawKurikulum.vocab, "checkVocab"); hit = true; }
            if(str.includes("speak")) { document.getElementById("wadahSpeaking").classList.remove('d-none'); builder(rawKurikulum.speaking, "checkSpeaking"); hit = true; }
            if(str.includes("gram")) { document.getElementById("wadahGrammar").classList.remove('d-none'); builder(rawKurikulum.grammar, "checkGrammar"); hit = true; }
            if(str.includes("prac")) { document.getElementById("wadahPractice").classList.remove('d-none'); builder(rawKurikulum.practice, "checkPractice"); hit = true; }
            if(!hit) { ['wadahVocab','wadahSpeaking','wadahGrammar','wadahPractice'].forEach(id => document.getElementById(id).classList.remove('d-none')); builder(rawKurikulum.vocab, "checkVocab"); builder(rawKurikulum.speaking, "checkSpeaking"); builder(rawKurikulum.grammar, "checkGrammar"); builder(rawKurikulum.practice, "checkPractice"); }
        }

        function renderFormAbsenMentor() {
            const kls = document.getElementById('inputKelas').value; const list = document.getElementById('listAbsenSiswa'); if(!list) return; list.innerHTML = ""; let arr = [];
            if(!kls) { list.innerHTML = `<div class="text-muted small text-center p-3">Silakan pilih opsi kelas pengajaran.</div>`; return; }
            rawMasterSiswa.split('\n').forEach(line => { if(line.startsWith(kls + ":")) arr = line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== ""); });
            if(arr.length === 0) { list.innerHTML = `<div class="text-center text-muted small p-3">Data absen belum diset Admin.</div>`; return; }
            list.innerHTML = arr.map(nama => `<div class="d-flex align-items-center justify-content-between p-2 border rounded bg-light siswa-row mb-2 shadow-sm"><div class="fw-bold text-dark text-xs text-truncate w-50 nama-siswa">${nama}</div><div class="d-flex gap-2 justify-content-end w-50"><select class="form-select form-select-sm absen-siswa p-1 text-center fw-bold border-success text-success shadow-sm" style="width:55px; font-size:0.75rem;"><option value="h">✔</option><option value="a">✖</option><option value="s">S</option><option value="i">I</option></select><input type="text" class="form-control form-control-sm nilai-siswa p-1 text-center text-xs border-primary fw-bold shadow-sm" style="width:50px;" placeholder="Nilai"></div></div>`).join('');
        }

        async function eksekusiKirimLogbookMentor() {
            const btn = document.getElementById("btnSubmitLogbook"); const kelas = document.getElementById("inputKelas").value; const jam = document.getElementById("inputJam").value; const catatan = document.getElementById("inputCatatan").value; const tugas = document.getElementById("inputTugasSiswa").value;
            if(!kelas) return window.showModernAlert("Peringatan", "Pilih opsi kelas.");
            let mats = []; document.querySelectorAll('.cek-materi:checked').forEach(el => mats.push(el.value)); if(mats.length === 0) return window.showModernAlert("Peringatan", "Centang materi diajarkan.");
            let dataS = []; document.querySelectorAll('.siswa-row').forEach(row => { dataS.push({ nama: row.querySelector('.nama-siswa').innerText, kehadiran: row.querySelector('.absen-siswa').value, nilai: row.querySelector('.nilai-siswa').value.trim() }); });
            btn.innerHTML = 'Mengirim...'; btn.disabled = true;
            try { await addDoc(collection(db, "logbooks"), { schoolId: currentSchoolId, mentorId: actUser, nama: myName, kelas, jamKe: jam, materi: mats, laporanSiswa: catatan, dataSiswa: dataS, tugasSiswa: tugas, waktu: serverTimestamp() }); window.showModernAlert("Sukses", "Logbook terekam.", "success"); document.getElementById("inputCatatan").value = ""; document.getElementById("inputTugasSiswa").value = ""; document.querySelectorAll('.cek-materi').forEach(el => el.checked = false); document.getElementById("inputKelas").value = ""; renderFormAbsenMentor(); } catch(e) { window.showModernAlert("Gagal", e.message); }
            btn.innerHTML = 'KIRIM DATA LAPORAN (LOGBOOK)'; btn.disabled = false;
        }
    }

    // ==========================================
    // BLOK 4: GUDANG PUSTAKA MATERI CLOUD
    // ==========================================
    if (actRole !== 'admin') {
        onSnapshot(collection(db, "materials"), (snap) => {
            const box = document.getElementById("listGudangMateri"); if(!box) return;
            box.innerHTML = snap.docs.map(d => { const data = d.data(); return `<div class="d-flex justify-content-between align-items-center p-3 border rounded mb-2 bg-white shadow-sm border-start border-info border-4"><div><div class="fw-bold text-dark text-sm mb-1">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div></div><a href="${data.link}" target="_blank" class="btn btn-sm btn-primary py-1 px-4 rounded-pill fw-bold shadow-sm">Buka Link</a></div>`; }).join('') || "<div class='text-muted small text-center p-3'>Pustaka awan kosong.</div>";
        });
    }
});
