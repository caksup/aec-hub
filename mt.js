/* ==================================================
   mt.js - Script Khusus Mentor Panel (AEC Hub)
   
   Riwayat Versi (JS):
   - v4.2: Fix injeksi HTML ke 3 Kartu Info (Briefing, Jadwal, Goal).
   - v4.1: Penambahan listener Roadmap.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, onSnapshot, addDoc, collection, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const actUser = localStorage.getItem("loggedInUser");
const myName = localStorage.getItem("loggedInName"); 

if (!actUser) window.location.replace("index.html");

function initGlobalUI() {
    const globalModals = `
    <div class="modal fade" id="modalTema" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-palette-fill me-2"></i>Pilih Tema</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-2 bg-light"><button class="list-group-item w-100 p-2 mb-1 border rounded shadow-sm text-center fw-bold" onclick="setTema('light')">Terang</button><button class="list-group-item w-100 p-2 mb-1 border rounded shadow-sm text-center fw-bold" onclick="setTema('dark')">Gelap</button><button class="list-group-item w-100 p-2 border rounded shadow-sm text-center fw-bold" onclick="setTema('system')">Ikuti Sistem HP</button></div></div></div></div>
    <div class="modal fade" id="modalPanduan" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-book-half me-2"></i>Buku Panduan</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light"><div class="alert alert-info border-0 shadow-sm text-sm">Panduan mentor sedang disusun oleh Direktur...</div></div></div></div></div>
    <div class="modal fade" id="modalTentang" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-wa text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-info-circle-fill me-2"></i>Tentang</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body text-center p-4 bg-light"><i class="bi bi-rocket-takeoff-fill text-wa" style="font-size: 3rem;"></i><h5 class="fw-bold mt-2 mb-0 text-dark">AEC Hub</h5><p class="text-muted text-xs mb-3">Versi 4.2-WA Mentor Premium</p></div></div></div></div>
    <div class="modal fade" id="modalLapor" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-danger text-white py-2 border-0"><h6 class="modal-title fw-bold"><i class="bi bi-headset me-2"></i>Lapor Admin</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body bg-light"><div class="mb-2"><label class="form-label text-xs fw-bold mb-1">Nama Anda</label><input type="text" id="laporNama" class="form-control form-control-sm" value="${myName}" readonly></div><div class="mb-3"><label class="form-label text-xs fw-bold mb-1">Detail Kendala</label><textarea id="laporDetail" class="form-control text-sm" rows="3" placeholder="Jelaskan masalah aplikasi..."></textarea></div><button class="btn btn-danger btn-sm w-100 fw-bold rounded-pill shadow-sm" id="btnKirimLapor"><i class="bi bi-send-fill me-1"></i> Kirim Laporan</button></div></div></div></div>
    `;
    if (!document.getElementById('modalTema')) document.body.insertAdjacentHTML('beforeend', globalModals);

    const savedTheme = localStorage.getItem('aecTheme') || 'system'; window.setTema(savedTheme, false);
    document.getElementById("btnLogout").onclick = (e) => { e.preventDefault(); if(confirm("Yakin ingin keluar bolo?")) { localStorage.clear(); window.location.replace("index.html"); } };
    document.getElementById("btnKirimLapor").onclick = () => {
        const detail = document.getElementById("laporDetail").value.trim(); if(!detail) return alert("Isi detail kendala dhisik, bolo!");
        const text = `🚨 *LAPORAN KENDALA AEC HUB (MENTOR)* 🚨\n\n*Nama:* ${myName}\n*Detail:* ${detail}`;
        window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(text)}`, '_blank'); document.getElementById("laporDetail").value = "";
    };

    onSnapshot(query(collection(db, "roadmaps")), (snap) => {
        const listInfo = document.getElementById("infoRoadmap"); if(!listInfo) return; listInfo.innerHTML = "";
        let dataRoadmap = []; snap.forEach(d => { dataRoadmap.push({id: d.id, ...d.data()}); });
        dataRoadmap.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        dataRoadmap.forEach(r => { listInfo.innerHTML += `<li class="timeline-item"><div class="timeline-date">${r.waktu_target}</div><div class="timeline-title">${r.judul}</div><div class="timeline-desc">${r.deskripsi}</div></li>`; });
        if(listInfo.innerHTML === "") listInfo.innerHTML = `<li class="timeline-item"><div class="timeline-desc text-muted">Belum ada roadmap program.</div></li>`;
    });
}

window.setTema = function(theme, closeUI = true) {
    localStorage.setItem('aecTheme', theme);
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
};

export function getActiveSchedule(jadwalGlobal) {
    if (!jadwalGlobal || jadwalGlobal === "-") return "Tidak ada jadwal kelas.";
    const lines = jadwalGlobal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes();
    for (let line of lines) {
        const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
        if (match) { const start = parseInt(match[1]) * 60 + parseInt(match[2]); const end = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= start && cur <= end) return line; }
    } return "Di luar jam kelas / Istirahat.";
}

let currentSchoolId = ""; let rawKurikulum = {}; let rawMasterSiswa = "";

onSnapshot(collection(db, "schools"), (snap) => {
    let listSekolah = []; snap.forEach(doc => { if(doc.data().status !== 'archived') listSekolah.push({ id: doc.id, ...doc.data() }); });
    const tugasSekolahku = listSekolah.find(s => s.assignedMentors && s.assignedMentors.includes(actUser));
    
    if(tugasSekolahku) {
        currentSchoolId = tugasSekolahku.id;
        document.getElementById("pesanKosong").classList.add("d-none");
        document.getElementById("utamaMentorContent").classList.remove("d-none");
        muatDataSekolah(tugasSekolahku.id);
    } else {
        document.getElementById("pesanKosong").classList.remove("d-none");
        document.getElementById("utamaMentorContent").classList.add("d-none");
        document.getElementById("schoolInfoBar").classList.add("d-none");
    }
});

function muatDataSekolah(sid) {
    onSnapshot(doc(db, "schools", sid), (docSnap) => {
        if(!docSnap.exists()) return; const d = docSnap.data();
        const filledArr = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
        const hBerjalan = parseInt(d.hariBerjalan) || 0; const tHari = parseInt(d.totalHari) || 5;
        const timelineText = `${(hBerjalan > 0 && hBerjalan <= 20) ? filledArr[hBerjalan - 1] : hBerjalan}/${tHari}`;
        const jadwalLive = getActiveSchedule(d.jadwal);
        
        // Iki sing penting: Ngisi info bar dhuwur lan 3 kotak siji-siji!
        const infoBar = document.getElementById("schoolInfoBar");
        if(infoBar) infoBar.classList.remove("d-none");
        
        if(document.getElementById("headSekolah")) document.getElementById("headSekolah").innerText = d.namaSekolah;
        if(document.getElementById("headTimeline")) document.getElementById("headTimeline").innerText = timelineText;
        if(document.getElementById("tutorJadwalHarian")) document.getElementById("tutorJadwalHarian").innerText = jadwalLive;

        if(document.getElementById("tutorBriefing")) document.getElementById("tutorBriefing").innerText = d.briefing || "-";
        if(document.getElementById("tutorJadwal")) document.getElementById("tutorJadwal").innerText = d.jadwal || "-";
        if(document.getElementById("tutorGoal")) document.getElementById("tutorGoal").innerText = d.goal || "-";
        
        rawKurikulum = d.kurikulum || { vocab: [], speaking: [], grammar: [], practice: [] }; rawMasterSiswa = d.masterSiswa || "";
        renderStrukturFormLogbook(d.masterKelas); renderDinamicMateri(jadwalLive); renderFormAbsen();
    });

    onSnapshot(query(collection(db, "chats"), where("schoolId", "==", sid)), (snap) => {
        let chats = []; snap.forEach(doc => chats.push({ id: doc.id, ...doc.data() }));
        chats.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        const box = document.getElementById("chatBox"); box.innerHTML = "";
        chats.forEach(c => {
            if(c.type === 'global') {
                const isMe = c.sender === myName; const time = c.waktu ? c.waktu.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '..';
                let nameColor = isMe ? 'text-wa' : 'text-primary'; if(c.role === "admin") nameColor = 'text-danger'; else if(c.role === "direktur") nameColor = 'text-warning';
                box.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'} mb-2"><div class="fw-bold text-xs ${nameColor}">${c.sender}</div><div class="mt-1" style="word-wrap: break-word;">${c.message}</div><div class="text-end text-muted mt-1" style="font-size: 0.6rem;">${time}</div></div>`;
            }
        }); box.scrollTop = box.scrollHeight;
    });

    onSnapshot(query(collection(db, "tugas_wa"), where("schoolId", "==", sid)), (snap) => {
        const list = document.getElementById("listTugasWAHarian"); list.innerHTML = ""; let html = "";
        snap.forEach(doc => {
            const d = doc.data(); const w = d.waktu ? d.waktu.toDate().toLocaleDateString('id-ID', { dateStyle: 'long'}) : 'Baru Saja';
            html += `<div class="card card-custom p-3 mb-2 bg-white"><div class="d-flex justify-content-between mb-2"><span class="badge bg-wa">${d.targetKelas}</span><span class="text-xs text-muted">${w}</span></div>${d.linkGambar ? `<img src="${d.linkGambar}" class="img-fluid rounded mb-2 border w-100">` : ''}<div class="p-2 bg-light border rounded text-sm mb-2 font-monospace" style="white-space: pre-line;">${d.instruksi}</div><button class="btn btn-wa btn-sm w-100 fw-bold rounded-pill" onclick="window.kirimKeWA('${encodeURIComponent(d.instruksi)}')"><i class="bi bi-whatsapp me-1"></i> Broadcast Tugas</button></div>`;
        });
        list.innerHTML = html || `<div class="text-muted text-center small p-4">Belum ada tugas WA harian.</div>`;
    });
}

function renderStrukturFormLogbook(masterKelas) {
    if(document.getElementById("inputKelas")) return; 
    const arrKelas = (masterKelas || "Kelas A").split(',').map(k=>k.trim()).filter(k=>k!=="");
    let htmlOptions = arrKelas.map(k => `<option value="${k}">${k}</option>`).join('');

    document.getElementById("formLogbook").innerHTML = `
        <h6 class="fw-bold text-primary mb-3"><i class="bi bi-journal-check me-2"></i> Input Sesi Kelas</h6>
        <div class="row g-2 mb-3"><div class="col-6"><label class="text-xs fw-bold text-secondary mb-1">PILIH KELAS</label><select id="inputKelas" class="form-select form-select-sm rounded-pill">${htmlOptions}</select></div><div class="col-6"><label class="text-xs fw-bold text-secondary mb-1">SESI / JAM KE</label><select id="inputJam" class="form-select form-select-sm rounded-pill"><option value="Jam 1">Sesi 1</option><option value="Jam 2">Sesi 2</option><option value="Jam 3">Sesi 3</option><option value="Jam 4">Sesi 4</option><option value="Jam 5">Sesi 5</option></select></div></div>
        <div class="p-2 border rounded bg-light mb-3"><h6 class="text-xs fw-bold text-wa mb-2 border-bottom pb-1"><i class="bi bi-list-check"></i> SILAKAN PILIH MATERI SESI INI:</h6><div id="wadahVocab" class="mb-2 d-none"><span class="badge bg-primary mb-1">Vocabulary</span><div id="checkVocab" class="row g-1 text-xs px-1"></div></div><div class="mb-2 d-none" id="wadahSpeaking"><span class="badge bg-success mb-1">Speaking</span><div id="checkSpeaking" class="row g-1 text-xs px-1"></div></div><div class="mb-2 d-none" id="wadahGrammar"><span class="badge bg-danger mb-1">Grammar</span><div id="checkGrammar" class="row g-1 text-xs px-1"></div></div><div class="mb-2 d-none" id="wadahPractice"><span class="badge bg-warning text-dark mb-1">Practice Class</span><div id="checkPractice" class="row g-1 text-xs px-1"></div></div></div>
        <div class="mb-3"><label class="text-xs fw-bold text-secondary mb-1">CATATAN PERKEMBANGAN KELAS</label><textarea id="inputCatatan" class="form-control text-sm" rows="2" placeholder="Tulis progres atau kendala mengajar..."></textarea></div>
        <div class="mb-3"><label class="text-xs fw-bold text-secondary mb-1">TEMPLATE TUGAS MANDIRI / PR</label><textarea id="inputTugasSiswa" class="form-control text-sm" rows="2" placeholder="Tulis PR siswa jika ada..."></textarea></div>
        <div class="p-2 border rounded bg-white shadow-sm mb-3"><h6><b>👥 DAFTAR MAHASISWA & NILAI:</b></h6><div id="listAbsenSiswa" class="space-y-2"></div></div>
        <button id="btnSubmitLogbook" class="btn btn-wa w-100 fw-bold rounded-pill py-2 shadow-sm"><i class="bi bi-send-fill me-2"></i> KIRIM LAPORAN LOGBOOK</button>
    `;
    document.getElementById('inputKelas').onchange = () => renderFormAbsen(); document.getElementById("btnSubmitLogbook").onclick = () => eksekusiKirimLogbook();
}

function renderDinamicMateri(jadwalLive) {
    const low = jadwalLive.toLowerCase(); const v = document.getElementById("wadahVocab"); const s = document.getElementById("wadahSpeaking"); const g = document.getElementById("wadahGrammar"); const p = document.getElementById("wadahPractice"); const cv = document.getElementById("checkVocab"); const cs = document.getElementById("checkSpeaking"); const cg = document.getElementById("checkGrammar"); const cp = document.getElementById("checkPractice");
    if(!v) return; v.classList.add('d-none'); s.classList.add('d-none'); g.classList.add('d-none'); p.classList.add('d-none'); cv.innerHTML = ""; cs.innerHTML = ""; cg.innerHTML = ""; cp.innerHTML = "";
    const builder = (arr, container) => { if(!arr) return; arr.forEach((m, idx) => { container.innerHTML += `<div class="col-6"><div class="form-check p-1 border rounded bg-white shadow-sm"><input class="form-check-input ms-1 cek-materi" type="checkbox" value="${m.replace(/"/g, '&quot;')}"><label class="form-check-label text-dark text-xs ms-1">${m}</label></div></div>`; }); };
    let matched = false;
    if(low.includes("vocab")) { v.classList.remove('d-none'); builder(rawKurikulum.vocab, cv); matched = true; } if(low.includes("speak")) { s.classList.remove('d-none'); builder(rawKurikulum.speaking, cs); matched = true; } if(low.includes("gram"))  { g.classList.remove('d-none'); builder(rawKurikulum.grammar, cg); matched = true; } if(low.includes("prac"))  { p.classList.remove('d-none'); builder(rawKurikulum.practice, cp); matched = true; }
    if(!matched) { v.classList.remove('d-none'); builder(rawKurikulum.vocab, cv); s.classList.remove('d-none'); builder(rawKurikulum.speaking, cs); g.classList.remove('d-none'); builder(rawKurikulum.grammar, cg); p.classList.remove('d-none'); builder(rawKurikulum.practice, cp); }
}

function renderFormAbsen() {
    const kls = document.getElementById('inputKelas').value; const list = document.getElementById('listAbsenSiswa'); if(!list) return; list.innerHTML = ""; let arrSiswa = [];
    rawMasterSiswa.split('\n').forEach(line => { if(line.startsWith(kls + ":")) { arrSiswa = line.split(':')[1].split(',').map(n => n.trim()).filter(n => n !== ""); } });
    if(arrSiswa.length === 0) { list.innerHTML = `<div class="text-center text-muted small p-2">Data siswa kelas iki isih kosong, bolo.</div>`; return; }
    arrSiswa.forEach((nama) => { list.innerHTML += `<div class="d-flex align-items-center justify-content-between p-2 border rounded bg-light siswa-row mb-1 shadow-sm"><div class="fw-bold text-dark text-xs text-truncate w-50 nama-siswa">${nama}</div><div class="d-flex gap-1 justify-content-end w-50"><select class="form-select form-select-sm absen-siswa p-1 text-center fw-bold" style="width:50px; font-size:0.75rem;"><option value="h">✔</option><option value="a">✖</option><option value="s">S</option><option value="i">I</option></select><input type="text" class="form-control form-control-sm nilai-siswa p-1 text-center text-xs" style="width:45px;" placeholder="Nilai"></div></div>`; });
}

async function eksekusiKirimLogbook() {
    const btn = document.getElementById("btnSubmitLogbook"); btn.innerHTML = '<div class="spinner-border spinner-border-sm text-white"></div> Mengirim...'; btn.disabled = true;
    const kelas = document.getElementById("inputKelas").value; const jam = document.getElementById("inputJam").value; const catatan = document.getElementById("inputCatatan").value; const tugas = document.getElementById("inputTugasSiswa").value;
    let flatMateri = []; document.querySelectorAll('.cek-materi:checked').forEach(el => flatMateri.push(el.value));
    if(flatMateri.length === 0) { alert("Pilih minimal siji materi sing mbok wulang dhisik bolo!"); btn.innerHTML = 'KIRIM LAPORAN LOGBOOK'; btn.disabled = false; return; }
    let dataSiswa = []; document.querySelectorAll('.siswa-row').forEach(row => { dataSiswa.push({ nama: row.querySelector('.nama-siswa').innerText, kehadiran: row.querySelector('.absen-siswa').value, nilai: row.querySelector('.nilai-siswa').value.trim() }); });
    try {
        await addDoc(collection(db, "logbooks"), { schoolId: currentSchoolId, mentorId: actUser, nama: myName, kelas, jamKe: jam, materi: flatMateri, laporanSiswa: catatan, dataSiswa, tugasSiswa: tugas, waktu: serverTimestamp() });
        alert("Logbook kasil dikirim! Mantap bolo 🔥");
        document.getElementById("inputCatatan").value = ""; document.getElementById("inputTugasSiswa").value = ""; document.querySelectorAll('.cek-materi').forEach(el => el.checked = false); document.querySelectorAll('.nilai-siswa').forEach(el => el.value = ""); document.querySelectorAll('.absen-siswa').forEach(el => el.value = "h");
    } catch(e) { alert("Gagal kirim logbook: " + e.message); }
    btn.innerHTML = '<i class="bi bi-send-fill me-2"></i> KIRIM LAPORAN LOGBOOK'; btn.disabled = false;
}

document.getElementById("btnSendChat").onclick = async () => {
    const msg = document.getElementById("inputChat").value.trim(); if(!msg) return;
    await addDoc(collection(db, "chats"), { schoolId: currentSchoolId, sender: myName, message: msg, waktu: serverTimestamp(), type: 'global', role: "mentor" });
    document.getElementById("inputChat").value = "";
};

onSnapshot(collection(db, "materials"), (snap) => {
    const list = document.getElementById("listGudangMateri"); if(!list) return; list.innerHTML = ""; let html = "";
    snap.forEach(d => { const data = d.data(); html += `<div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-white shadow-sm"><div><div class="fw-bold text-dark text-sm">${data.judul} <span class="badge bg-wa rounded-pill ms-1">${data.kelas}</span></div></div><a href="${data.link}" target="_blank" class="btn btn-sm btn-primary py-0 px-3 rounded-pill fw-bold"><i class="bi bi-eye"></i> Buka</a></div>`; });
    list.innerHTML = html || "<div class='text-muted text-center small mt-2'>Belum ada materi pembelajaran dari Cloud Admin.</div>";
});

window.kirimKeWA = function(encodedText) { window.open(`https://wa.me/?text=${encodedText}`, '_blank'); }

document.addEventListener("DOMContentLoaded", () => { initGlobalUI(); document.getElementById("userNameDisplay").innerText = myName; });
