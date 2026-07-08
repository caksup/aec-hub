/* ==================================================
   dt.js - Skrip Pengendali Utama (Panel Direktur)
   AEC Hub - Versi 1.5.3 Ultimate
   
   Riwayat Versi (JS):
   - v1.0 - v1.3: Logika inti (Core logic) Firebase Direktur.
   - v1.4: Listener pemantauan Peta Jalan (Roadmap).
   - v1.5: Siklus tema warna terintegrasi.
   - v1.5.1: Offcanvas Logout Logic.
   - v1.5.2: Uji coba pemuatan tab adaptif.
   - v1.5.3: (CURRENT) FIX TOTAL. Semua ID diselaraskan dengan tata letak HTML terbaru. Implementasi Modern Alert, dukungan penuh PWA luring, dan penarikan tugas WA menjadi pemantauan read-only.
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, onSnapshot, updateDoc, collection, query, where, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", authDomain: "special-mentor.firebaseapp.com", projectId: "special-mentor", storageBucket: "special-mentor.firebasestorage.app", messagingSenderId: "1075582532703", appId: "1:1075582532703:web:969365cefff8999335efea" };
const app = initializeApp(firebaseConfig); export const db = getFirestore(app);

// Aktifkan penyimpanan luring
enableIndexedDbPersistence(db).catch(err => console.warn("Peringatan PWA Luring:", err.code));

const actUser = localStorage.getItem("loggedInUser"); const myName = localStorage.getItem("loggedInName");
if (!actUser) window.location.replace("index.html");

if(document.getElementById("userNameDisplay")) document.getElementById("userNameDisplay").innerText = myName || "Direktur";
if(document.getElementById("userIdDisplay")) document.getElementById("userIdDisplay").innerText = actUser || "direktur";

// Fungsi Pop-up Modern
function showModernAlert(title, message, type = 'error') {
    const titleEl = document.getElementById('alertTitle'); const msgEl = document.getElementById('alertMessage'); const iconEl = document.getElementById('alertIcon'); const modalEl = document.getElementById('modernAlertModal');
    if(!titleEl || !msgEl || !iconEl || !modalEl) return alert(message);
    titleEl.innerText = title; msgEl.innerText = message;
    if (type === 'error') iconEl.className = 'bi bi-x-circle-fill text-danger mb-3 d-block'; 
    else if (type === 'success') iconEl.className = 'bi bi-check-circle-fill text-success mb-3 d-block'; 
    else iconEl.className = 'bi bi-info-circle-fill text-primary mb-3 d-block';
    new bootstrap.Modal(modalEl).show();
}

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
if(document.getElementById("btnCycleTheme")) document.getElementById("btnCycleTheme").onclick = () => { currentThemeIndex = (currentThemeIndex + 1) % 3; applyThemeVisuals(currentThemeIndex); };

function updateClock() {
    const el = document.getElementById('headClockDate'); if(!el) return; const now = new Date();
    el.innerText = `${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' })} WIB`;
}
setInterval(updateClock, 1000); updateClock();

if(document.getElementById("btnLogoutOffcanvas")) {
    document.getElementById("btnLogoutOffcanvas").onclick = (e) => { e.preventDefault(); if(confirm("Keluar dari aplikasi sistem AEC Hub?")) { localStorage.clear(); window.location.replace("index.html"); } };
}

let currentSchoolId = ""; let dataLengkap = []; let masterTugasWA = []; let rawKurikulum = {};

// DATA SEKOLAH & OVERVIEW CARD
onSnapshot(collection(db, "schools"), (snap) => {
    let schools = []; snap.forEach(d => { if(d.data().status !== 'archived') schools.push({ id: d.id, ...d.data() }); });
    const c1 = document.getElementById("modernSchoolSelect"); const c2 = document.getElementById("overviewCardsContainer");
    
    if(c1) {
        c1.innerHTML = `<option value="">Pilih Sekolah Pengawasan...</option>` + schools.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('');
        c1.onchange = (e) => window.langsungKeSekolah(e.target.value);
    }
    
    if(c2) {
        if (schools.length === 0) { c2.innerHTML = `<div class="col-12"><div class="alert alert-light text-center small border text-muted">Belum ada sekolah yang beroperasi aktif.</div></div>`; return; }
        c2.innerHTML = schools.map(s => { 
            let jSiswa=0; if(s.masterSiswa) s.masterSiswa.split('\n').forEach(l=>{if(l.includes(':')) jSiswa+=l.split(':')[1].split(',').filter(n=>n.trim()!=="").length;}); 
            return `
            <div class="col-12 col-md-6">
                <div class="card border-0 shadow-sm rounded-4 bg-white p-1" style="border-left: 4px solid var(--wa-primary) !important;">
                    <div class="card-body p-3">
                        <h6 class="fw-bold text-dark mb-3 text-truncate">${s.namaSekolah}</h6>
                        <div class="d-flex justify-content-between mb-2"><span class="text-xs text-muted fw-bold">Hari Berjalan:</span><span class="badge bg-wa rounded-pill">${s.hariBerjalan||0}/${s.totalHari||0}</span></div>
                        <div class="d-flex justify-content-between"><span class="text-xs text-muted fw-bold">Kapasitas Siswa:</span><span class="badge bg-light text-dark border rounded-pill">${jSiswa} Peserta</span></div>
                    </div>
                </div>
            </div>`; 
        }).join('');
    }
});

// ROADMAP DIREKTUR (Read Only)
onSnapshot(query(collection(db, "roadmaps")), (snap) => {
    const list = document.getElementById("sistemRoadmapList"); if(!list) return; list.innerHTML = "";
    let arr = []; snap.forEach(d => arr.push(d.data())); arr.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    if(arr.length === 0) list.innerHTML = `<li class="timeline-item"><div class="timeline-desc text-muted">Belum ada roadmap program.</div></li>`;
    arr.forEach(r => list.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`);
});

window.langsungKeSekolah = function(sid) {
    currentSchoolId = sid;
    if(!sid) { 
        if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.add("d-none"); 
        return; 
    }
    if(document.getElementById("schoolInfoBar")) document.getElementById("schoolInfoBar").classList.remove("d-none");
    
    // Tarik Dokumen Sekolah Spesifik
    onSnapshot(doc(db, "schools", sid), (s) => {
        if(!s.exists()) return; const d = s.data();
        const filledArr = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
        const hBerjalan = parseInt(d.hariBerjalan) || 0; const tHari = parseInt(d.totalHari) || 5;
        const timelineText = `${(hBerjalan > 0 && hBerjalan <= 20) ? filledArr[hBerjalan - 1] : hBerjalan}/${tHari}`;
        
        if(document.getElementById('headSekolah')) document.getElementById('headSekolah').innerText = d.namaSekolah;
        if(document.getElementById("headTimeline")) document.getElementById("headTimeline").innerText = timelineText;
        
        if(document.getElementById('tutorBriefing')) document.getElementById('tutorBriefing').innerText = d.briefing || "-"; 
        if(document.getElementById('dirBriefing')) document.getElementById('dirBriefing').value = d.briefing || "";
        
        if(document.getElementById('tutorJadwal')) document.getElementById('tutorJadwal').innerText = d.jadwal || "-"; 
        if(document.getElementById('dirJadwal')) document.getElementById('dirJadwal').value = d.jadwal || "";
        
        if(document.getElementById('tutorGoal')) document.getElementById('tutorGoal').innerText = d.goal || "-"; 
        if(document.getElementById('dirGoal')) document.getElementById('dirGoal').value = d.goal || "";
        
        // Deteksi Jam Live (Fungsi Get Active Schedule)
        let jadwalLive = "Tidak ada jadwal.";
        if (d.jadwal && d.jadwal !== "-") {
            const lines = d.jadwal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes();
            for (let line of lines) { const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/); if (match) { const st = parseInt(match[1]) * 60 + parseInt(match[2]); const en = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= st && cur <= en) { jadwalLive = line; break; } } } if(jadwalLive === "Tidak ada jadwal.") jadwalLive = "Di luar jam kelas operasional.";
        }
        if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = jadwalLive;
        
        rawKurikulum = d.kurikulum || {};
        const arrKelas = (d.masterKelas || "").split(',').map(k=>k.trim()).filter(k=>k!=="");
        const sels = ['filterKelasSiswa', 'trackerKelas', 'filterKelasHistori', 'filterWA'];
        sels.forEach(id => { const el = document.getElementById(id); if(el) { el.innerHTML = `<option value="SEMUA">Semua Kelas</option>` + arrKelas.map(k => `<option value="${k}">${k}</option>`).join(''); } });
    });

    // Tarik Logbook untuk tab History
    onSnapshot(query(collection(db, "logbooks"), where("schoolId", "==", sid)), (snap) => {
        dataLengkap = []; snap.forEach(d => dataLengkap.push({id: d.id, ...d.data()})); dataLengkap.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0));
        ekstrakHariLogbook(); renderListLogbookDir(); renderTracker(); kalkulasiDataSiswa();
    });

    // Tarik Obrolan Chat
    onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
        let chats = []; snap.forEach(doc => chats.push(doc.data())); chats.sort((a,b)=>(a.waktu?.toMillis()||0)-(b.waktu?.toMillis()||0));
        const box = document.getElementById("chatBox"); if(!box) return; box.innerHTML = "";
        chats.forEach(c => {
            if(c.type === 'global') {
                const isMe = c.sender === myName; const isDir = c.role === 'direktur'; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..';
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs" style="color:var(--wa-primary);">${isDir?'⭐ ':''}${c.sender}</div><div class="mt-1 text-sm">${c.message}</div><div class="text-end text-muted mt-1" style="font-size:0.6rem;">${time}</div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });

    // Tarik Tugas WA Admin (Pemantauan Saja)
    onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => { 
        masterTugasWA = []; snap.forEach(doc => masterTugasWA.push(doc.data())); masterTugasWA.sort((a,b)=>(b.waktu?.toMillis()||0)-(a.waktu?.toMillis()||0)); 
        renderTugasWAPantauan(); 
    });
}

// SETUP ARAHAN DIREKTUR
if(document.getElementById("btnSaveDirBriefing")) {
    document.getElementById("btnSaveDirBriefing").onclick = async () => {
        if(!currentSchoolId) return showModernAlert("Peringatan", "Pilih sekolah di bilah atas terlebih dahulu.");
        await updateDoc(doc(db, "schools", currentSchoolId), { briefing: document.getElementById("dirBriefing").value, jadwal: document.getElementById("dirJadwal").value, goal: document.getElementById("dirGoal").value });
        showModernAlert("Berhasil", "Arahan Instruksi pembaruan berhasil dikirim secara langsung ke perangkat Mentor lapangan.", "success");
    };
}

if(document.getElementById("btnSendChat")) {
    document.getElementById("btnSendChat").onclick = async () => {
        const msg = document.getElementById("inputChat").value.trim(); if(!msg || !currentSchoolId) return;
        await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "direktur" });
        document.getElementById("inputChat").value = "";
    };
}

// FUNGSI PANTAU LOGBOOK & CETAK PDF
function ekstrakHariLogbook() { const daysMap = new Map(); dataLengkap.forEach(d => { if(d.waktu) daysMap.set(d.waktu.toDate().toLocaleDateString('id-ID'), d.waktu.toDate()); }); const sortedDays = Array.from(daysMap.entries()).sort((a,b) => a[1] - b[1]); const selHari = document.getElementById("filterHari"); if(!selHari) return; selHari.innerHTML = '<option value="SEMUA">Semua Waktu Logbook</option>'; sortedDays.forEach((entry, idx) => { selHari.innerHTML += `<option value="${entry[0]}">Hari ke-${idx+1}</option>`; }); }
function renderListLogbookDir() { 
    const container = document.getElementById("logbookList"); if(!container) return; container.innerHTML = ""; 
    const fHari = document.getElementById("filterHari").value; const fKelas = document.getElementById("filterKelasHistori").value; 
    let dt = dataLengkap; if (fHari !== "SEMUA") dt = dt.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari); if (fKelas !== "SEMUA") dt = dt.filter(d => d.kelas === fKelas); 
    if(dt.length === 0) { container.innerHTML = `<div class="text-center text-muted small p-3 border rounded bg-light">Belum ada catatan aktivitas di filter ini.</div>`; return; } 
    dt.forEach(d => { container.innerHTML += `<div class="p-2 border rounded bg-white shadow-sm mb-2 text-xs"><div class="fw-bold text-wa border-bottom pb-1 mb-1">${d.nama.toUpperCase()} <span class="badge bg-secondary rounded-pill float-end">${d.kelas}</span></div><div class="mt-1">📖 <b>Materi:</b> ${d.materi?.join(', ')}</div><div>📝 <b>Catatan Kelas:</b> ${d.laporanSiswa || '-'}</div></div>`; }); 
}
if(document.getElementById('filterHari')) document.getElementById('filterHari').addEventListener('change', renderListLogbookDir); 
if(document.getElementById('filterKelasHistori')) document.getElementById('filterKelasHistori').addEventListener('change', renderListLogbookDir);

if(document.getElementById("btnExportPDF")) {
    document.getElementById("btnExportPDF").onclick = () => {
        if(!currentSchoolId || currentSchoolId==='NEW') return showModernAlert("Peringatan", "Pilih lokasi sekolah terlebih dahulu untuk mencetak PDF laporan.");
        const fHari = document.getElementById("filterHari").value; let dt = dataLengkap; if (fHari !== "SEMUA") dt = dt.filter(d => d.waktu && d.waktu.toDate().toLocaleDateString('id-ID') === fHari);
        const printDiv = document.createElement("div"); printDiv.style.fontFamily = "Arial, sans-serif"; printDiv.style.padding = "20px";
        let html = `<h3 style="text-align:center;">LAPORAN LOGBOOK DIREKTUR<br><small style="font-size:12px; font-weight:normal;">Sekolah: ${document.getElementById('headSekolah').innerText} | Rekam: ${fHari}</small></h3><table style="width: 100%; border-collapse: collapse; font-size: 10px;" border="1"><tr style="background-color: #f2f2f2; text-align: center;"><th style="padding:5px;">WAKTU</th><th style="padding:5px;">MENTOR</th><th style="padding:5px;">KELAS / JAM</th><th style="padding:5px; width: 35%;">MATERI & LAPORAN</th><th style="padding:5px; width: 35%;">RAPOR SISWA</th></tr>`;
        dt.forEach(d => { const w = d.waktu ? d.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-'; let dJam = (d.jamKe||"").replace('Jam ','Jam ke-'); let ds = d.dataSiswa && d.dataSiswa.length > 0 ? `<table style="width:100%; font-size:9px; border-collapse: collapse;"><tr style="border-bottom:1px solid #ddd;"><th>Nama</th><th>Absen</th><th>Nilai</th></tr>` + d.dataSiswa.map(s => `<tr><td>${s.nama}</td><td style="text-align:center;">${s.kehadiran.toUpperCase()}</td><td style="text-align:center; font-weight:bold;">${s.nilai || '-'}</td></tr>`).join('') + `</table>` : 'Pencatatan belum dilakukan'; html += `<tr><td style="padding:5px; text-align:center;">${w}</td><td style="padding:5px; text-align:center; font-weight:bold;">${d.nama}</td><td style="padding:5px; text-align:center;">${d.kelas}<br><b>${dJam}</b></td><td style="padding:5px;"><b>Materi:</b> ${d.materi.join(', ')}<br><b>Catatan Kelas:</b> ${d.laporanSiswa}</td><td style="padding:5px;">${ds}</td></tr>`; }); html += `</table>`; printDiv.innerHTML = html;
        html2pdf().set({ margin: 0.3, filename: `AEC_Pengawasan_${currentSchoolId}.pdf`, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }}).from(printDiv).save();
    };
}

// FUNGSI PANTAU TRACKER & TOP 10
function renderTracker() { 
    const area = document.getElementById("areaTracker"); const kelasAktif = document.getElementById("trackerKelas").value; 
    if(!area || !rawKurikulum.vocab) return; let materiSelesai = new Set(); 
    dataLengkap.forEach(log => { if (log.kelas === kelasAktif && log.materi) log.materi.forEach(m => materiSelesai.add(m)); }); 
    const renderBlok = (judul, arrayMateri, warna) => { 
        if(!arrayMateri || arrayMateri.length === 0) return ''; 
        let listHtml = ""; arrayMateri.forEach(mat => { const isDone = materiSelesai.has(mat); const icon = isDone ? `<i class="bi bi-check-circle-fill text-${warna}"></i>` : `<i class="bi bi-circle text-secondary opacity-50"></i>`; const bg = isDone ? `bg-${warna} bg-opacity-10 border-${warna}` : 'bg-transparent text-muted border'; listHtml += `<div class="p-1 mb-1 rounded text-xs d-flex justify-content-between ${bg}"><span class="${isDone ? 'fw-bold' : ''}">${mat}</span> <span>${icon}</span></div>`; }); 
        return `<div class="mb-2"><h6 class="text-xs fw-bold text-${warna} mb-1 border-bottom pb-1">${judul}</h6>${listHtml}</div>`; 
    }; 
    area.innerHTML = renderBlok("KOSAKATA", rawKurikulum.vocab, "primary") + renderBlok("BERBICARA", rawKurikulum.speaking, "success") + renderBlok("TATA BAHASA", rawKurikulum.grammar, "danger") + renderBlok("PRAKTIK KELAS", rawKurikulum.practice, "warning"); 
}
if(document.getElementById('trackerKelas')) document.getElementById('trackerKelas').addEventListener('change', renderTracker);

function kalkulasiDataSiswa() { 
    const kls = document.getElementById("filterKelasSiswa").value; let rekap = {}; 
    dataLengkap.forEach(log => { 
        if(log.kelas === kls && log.dataSiswa) { 
            log.dataSiswa.forEach(s => { 
                if(!rekap[s.nama]) rekap[s.nama] = { poin:0 }; 
                let nStr = (s.nilai || "").toString().toLowerCase().trim(); 
                if(nStr === 'a' || nStr === 'a+') rekap[s.nama].poin += 90; else if(parseInt(nStr) > 0) rekap[s.nama].poin += parseInt(nStr); 
            }); 
        } 
    }); 
    const listTop = document.getElementById("listTop10"); 
    if(listTop) { 
        listTop.innerHTML = ""; let arrPeringkat = Object.entries(rekap).map(([nama, data]) => ({ nama, poin: data.poin })).sort((a,b) => b.poin - a.poin).slice(0, 10); 
        if(arrPeringkat.length===0){listTop.innerHTML="<div class='small text-center text-muted p-3 border rounded bg-light'>Siswa belum memiliki nilai poin evaluasi.</div>"; return;} 
        arrPeringkat.forEach((item, idx) => { let badge = idx === 0 ? "bg-warning text-dark" : (idx === 1 ? "bg-secondary text-white" : "bg-wa text-white"); listTop.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-white shadow-sm text-sm"><div class="fw-bold text-dark"><span class="badge ${badge} me-2 rounded-pill">#${idx+1}</span> ${item.nama}</div><div class="fw-bold text-success">${item.poin} Pts</div></div>`; }); 
    } 
}
if(document.getElementById('filterKelasSiswa')) document.getElementById('filterKelasSiswa').addEventListener('change', kalkulasiDataSiswa);

// FUNGSI PANTAU TUGAS WA (Hanya Membaca - Read Only)
function renderTugasWAPantauan() { 
    const list = document.getElementById("listTugasWAHistory"); if(!list) return; list.innerHTML = ""; 
    const fil = document.getElementById("filterWA") ? document.getElementById("filterWA").value : "SEMUA"; 
    let dt = masterTugasWA; if(fil !== "SEMUA") dt = dt.filter(d => d.targetKelas === fil); 
    let html = ""; 
    dt.forEach((d) => { 
        const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja'; let imgTag = d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100" style="max-height: 100px; object-fit: cover;">` : ''; 
        html += `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa rounded-pill px-3">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${imgTag}<div class="p-2 bg-light border rounded text-sm font-monospace text-dark" style="white-space: pre-line;">${d.instruksi}</div></div>`; 
    }); 
    list.innerHTML = html || `<div class="text-muted text-center small mt-3">Tidak ada riwayat instruksi tugas WA dari Admin.</div>`; 
}
if(document.getElementById("filterWA")) document.getElementById("filterWA").addEventListener('change', renderTugasWAPantauan);

// FUNGSI GUDANG MATERI
onSnapshot(collection(db, "materials"), (snap) => { 
    const list = document.getElementById("listGudangMateri"); if(!list) return; list.innerHTML = ""; 
    snap.forEach(d => { const data = d.data(); list.innerHTML += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm"><div><div class="fw-bold text-dark text-sm">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div></div><a href="${data.link}" target="_blank" class="btn btn-sm btn-primary py-0 px-3 rounded-pill fw-bold"><i class="bi bi-eye"></i> Buka Tautan</a></div>`; }); 
});
