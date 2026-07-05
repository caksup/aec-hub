/* ==================================================
   script.js - AEC HUB (V14.1 / v4.0 Ultimate - Multi School + Anti Bocor)
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js'); }); }

// FUNGSI VERIFY LOGIN LAMA (Tetap disimpan untuk kompatibilitas jika dibutuhkan)
export async function verifyLogin(username, pin) {
    const userDoc = await getDoc(doc(db, "users", username));
    if (userDoc.exists()) {
        const data = userDoc.data();
        if(data.status !== "aktif") throw new Error("Akses Ditolak: Akun dinonaktifkan!");
        if(data.pin !== pin) throw new Error("Gagal Masuk: PIN Keamanan salah!");
        return data;
    } else {
        const fallback = { "sup": { pin: "7777", julukan: "Mr. Sup", role: "admin", status: "aktif" }, "afif": { pin: "6666", julukan: "Mr. Afif", role: "direktur", status: "aktif" }, "anam": { pin: "1111", julukan: "Mr. Anam", role: "mentor", status: "aktif" } };
        if(fallback[username]) { if(fallback[username].pin !== pin) throw new Error("Gagal Masuk: PIN salah!"); await setDoc(doc(db, "users", username), fallback[username]); return fallback[username]; }
        throw new Error("Peringatan: Username tidak terdaftar!");
    }
}

export function generateTimelineHTML(totalHari, hariBerjalan) {
    const outlined = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
    const filled   = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
    let result = `<div class="d-flex flex-wrap align-items-center mt-1">`; let t = parseInt(totalHari) || 5; let b = parseInt(hariBerjalan) || 0;
    for(let i=0; i<t; i++) { if(i < 20) { if (i < b) result += `<span style="font-size: 1.4rem; margin: 0 2px;" class="text-danger">${filled[i]}</span>`; else result += `<span style="font-size: 1rem; margin: 0 2px; opacity: 0.5;">${outlined[i]}</span>`; } }
    return result + `</div>`;
}

export function getActiveSchedule(jadwalGlobal) {
    if (!jadwalGlobal || jadwalGlobal === "-") return "Tidak ada jadwal kelas.";
    const lines = jadwalGlobal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes();
    for (let line of lines) {
        const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
        if (match) { const start = parseInt(match[1]) * 60 + parseInt(match[2]); const end = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= start && cur <= end) return line; }
    } return "Di luar jam kelas / Istirahat.";
}

export function startClock(clockId, dateId) {
    function update() { const now = new Date(); if (document.getElementById(clockId)) document.getElementById(clockId).innerText = now.toLocaleTimeString('id-ID'); if (document.getElementById(dateId)) document.getElementById(dateId).innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    setInterval(update, 1000); update();
}

// ==========================================
// FUNGSI MULTI SEKOLAH (RETURN UNSUBSCRIBE)
// ==========================================

export function listenToSchools(callback) { 
    return onSnapshot(collection(db, "schools"), (snap) => { 
        let list = []; snap.forEach(doc => { if(doc.data().status !== 'archived') list.push({ id: doc.id, ...doc.data() }); }); callback(list); 
    }); 
}
export async function saveSchool(schoolId, dataData) { await setDoc(doc(db, "schools", schoolId), { ...dataData, waktuUpdate: serverTimestamp(), status: 'aktif' }, {merge:true}); }
export async function archiveSchool(schoolId) { await setDoc(doc(db, "schools", schoolId), { status: 'archived' }, {merge:true}); }

export function listenToSingleSchool(schoolId, callback) {
    if(!schoolId) return null;
    return onSnapshot(doc(db, "schools", schoolId), (docSnap) => { if(docSnap.exists()) callback(docSnap.data()); else callback(null); });
}

export function listenToLogbooks(schoolId, callback) { 
    if(!schoolId) return null;
    const q = query(collection(db, "logbooks"), where("schoolId", "==", schoolId));
    return onSnapshot(q, { includeMetadataChanges: true }, (snap) => { 
        let list = []; snap.forEach(doc => { list.push({ id: doc.id, ...doc.data(), isPending: doc.metadata.hasPendingWrites }); }); 
        list.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); callback(list); 
    }); 
}
export async function sendLogbook(schoolId, mentorId, namaMentor, kelas, jamKe, materiGroup, flatMateri, laporanSiswa, catatanKendala, arraySiswa, tugasSiswa) { return await addDoc(collection(db, "logbooks"), { schoolId, mentorId, nama: namaMentor, kelas, jamKe, materiGroup: materiGroup || { vocab:[], speaking:[], grammar:[] }, materi: flatMateri || [], laporanSiswa, catatanKendala, dataSiswa: arraySiswa || [], tugasSiswa: tugasSiswa || "", waktu: serverTimestamp() }); }
export async function updateLogbook(docId, dataBaru) { return await updateDoc(doc(db, "logbooks", docId), dataBaru); }
export async function deleteLogbook(docId) { return await deleteDoc(doc(db, "logbooks", docId)); }

export function listenToChats(schoolId, callback) {
    if(!schoolId) return null;
    const q = query(collection(db, "chats"), where("schoolId", "==", schoolId));
    return onSnapshot(q, (snap) => { 
        let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); 
        list.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0)); callback(list); 
    });
}
export async function sendJapri(schoolId, dariNama, keUsername, isiPesan, roleSender) { return await addDoc(collection(db, "chats"), { schoolId, sender: dariNama, receiver: keUsername, message: isiPesan, waktu: serverTimestamp(), type: 'private', role: roleSender }); }
export async function sendGlobalChat(schoolId, dariNama, isiPesan, roleSender) { return await addDoc(collection(db, "chats"), { schoolId, sender: dariNama, message: isiPesan, waktu: serverTimestamp(), type: 'global', role: roleSender }); }
export async function deleteChat(chatId) { return await deleteDoc(doc(db, "chats", chatId)); }

export function listenToTugasWA(schoolId, callback) { 
    if(!schoolId) return null;
    const q = query(collection(db, "tugas_wa"), where("schoolId", "==", schoolId));
    return onSnapshot(q, (snap) => { 
        let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); 
        list.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); callback(list); 
    }); 
}
export async function sendTugasWA(schoolId, targetKelas, linkGambar, instruksi) { return await addDoc(collection(db, "tugas_wa"), { schoolId, targetKelas, linkGambar, instruksi, waktu: serverTimestamp() }); }
export async function deleteTugasWA(docId) { return await deleteDoc(doc(db, "tugas_wa", docId)); }


// ==============================================================
// 4. LOGIKA LOGIN & UI GLOBAL (v4.0-Ultimate) - TAMBAHAN ANYAR
// ==============================================================

// Fungsi Cek Login Otomatis (Anti-crot, nggunakake localStorage)
export function cekAutoLogin() {
    const loggedUser = localStorage.getItem("loggedInUser");
    const role = localStorage.getItem("userRole");
    if (loggedUser && role) {
        if (role === 'admin') window.location.replace("superuser.html");
        else if (role === 'direktur') window.location.replace("direktur.html");
        else window.location.replace("mentor.html");
    }
}

// Fungsi Proses Login Utama (Awet nganggo localStorage)
export async function prosesLogin(usernameInput, pinInput) {
    const u = usernameInput.toLowerCase().trim();
    const p = pinInput.trim();
    
    if (!u || !p) {
        alert("Username lan PIN ora entuk kosong, bolo!");
        return;
    }
    
    try {
        const userDoc = await getDoc(doc(db, "users", u));
        
        // Yen data neng database kosong, panggil fallback kaya kodingan lawasmu ben ora ke-lock out
        if (!userDoc.exists()) {
            const fallback = { "sup": { pin: "7777", julukan: "Mr. Sup", role: "admin", status: "aktif" }, "afif": { pin: "6666", julukan: "Mr. Afif", role: "direktur", status: "aktif" }, "anam": { pin: "1111", julukan: "Mr. Anam", role: "mentor", status: "aktif" } };
            if(fallback[u]) {
                if(fallback[u].pin !== p) { alert("Gagal Masuk: PIN salah!"); return; }
                // Simpan menyang database
                await setDoc(doc(db, "users", u), fallback[u]);
                // Simpan login menyang local storage
                localStorage.setItem("loggedInUser", u);
                localStorage.setItem("loggedInName", fallback[u].julukan);
                localStorage.setItem("userRole", fallback[u].role);
                
                if (fallback[u].role === "admin") window.location.replace("superuser.html");
                else if (fallback[u].role === "direktur") window.location.replace("direktur.html");
                else window.location.replace("mentor.html");
                return;
            }
            alert("Username ora kedaftar!");
            return;
        }
        
        const userData = userDoc.data();
        
        if (userData.status !== "aktif") {
            alert("Akun sampeyan wis dinonaktifkan karo Admin!");
            return;
        }
        
        if (userData.pin === p) {
            // Login sukses, simpen neng localStorage ben nempel terus
            localStorage.setItem("loggedInUser", u);
            localStorage.setItem("loggedInName", userData.julukan);
            localStorage.setItem("userRole", userData.role);
            
            if (userData.role === "admin") window.location.replace("superuser.html");
            else if (userData.role === "direktur") window.location.replace("direktur.html");
            else window.location.replace("mentor.html");
        } else {
            alert("PIN sing mbok lebokke salah, cuk!");
        }
    } catch (error) {
        alert("Error Database: " + error.message);
    }
}

// Inisialisasi UI Global (Modals & Theme) disuntik otomatis ke kabeh Page
export function initGlobalUI() {
    const globalModals = `
    <!-- Modal Tema -->
    <div class="modal fade" id="modalTema" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header bg-wa text-white py-2 border-0">
                    <h6 class="modal-title fw-bold"><i class="bi bi-palette-fill me-2"></i>Pilih Tema</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-2 bg-light">
                    <div class="list-group list-group-flush text-sm rounded border">
                        <button class="list-group-item list-group-item-action fw-bold" onclick="setTema('light')"><i class="bi bi-sun-fill text-warning me-2"></i> Terang</button>
                        <button class="list-group-item list-group-item-action fw-bold" onclick="setTema('dark')"><i class="bi bi-moon-stars-fill text-primary me-2"></i> Gelap</button>
                        <button class="list-group-item list-group-item-action fw-bold" onclick="setTema('system')"><i class="bi bi-phone-fill text-secondary me-2"></i> Ikuti Sistem HP</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Roadmap -->
    <div class="modal fade" id="modalRoadmap" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-wa text-white py-2 border-0">
                    <h6 class="modal-title fw-bold"><i class="bi bi-signpost-split-fill me-2"></i>Roadmap Program</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light">
                    <ul class="timeline" id="roadmapTimeline">
                        <li class="timeline-item"><div class="timeline-date">Segera</div><div class="timeline-title">Fitur Input Roadmap</div><div class="timeline-desc">Admin akan segera menambahkan timeline di sini.</div></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Panduan -->
    <div class="modal fade" id="modalPanduan" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-wa text-white py-2 border-0">
                    <h6 class="modal-title fw-bold"><i class="bi bi-book-half me-2"></i>Buku Panduan</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-sm bg-light">
                    <div class="alert alert-info border-0 shadow-sm">Panduan penggunaan aplikasi untuk Mentor dan Direktur sedang disusun. Pantau terus update selanjutnya!</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Tentang -->
    <div class="modal fade" id="modalTentang" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-wa text-white py-2 border-0">
                    <h6 class="modal-title fw-bold"><i class="bi bi-info-circle-fill me-2"></i>Tentang Aplikasi</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center p-4 bg-light">
                    <i class="bi bi-rocket-takeoff-fill text-wa" style="font-size: 3rem;"></i>
                    <h5 class="fw-bold mt-2 mb-0 text-dark">AEC Hub</h5>
                    <p class="text-muted text-xs mb-3">Versi 4.0-WA (Mutakhir)</p>
                    <div class="text-start text-xs bg-white p-3 rounded border mb-3 text-dark shadow-sm" style="max-height: 150px; overflow-y:auto;">
                        <b>Riwayat Update:</b><br>
                        - v4.0: Centralized UI, WA Bottom Nav, LocalStorage.<br>
                        - v3.0: Gudang Materi, Import Excel & WA Broadcast.<br>
                        - v2.0: Auto Dark Mode WhatsApp.<br>
                        - v1.0: Rilis Perdana.
                    </div>
                    <button class="btn btn-sm btn-outline-success rounded-pill fw-bold w-100" onclick="alert('Anda sudah menggunakan versi terbaru!')"><i class="bi bi-arrow-clockwise me-1"></i> Cek Pembaruan</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Lapor Admin -->
    <div class="modal fade" id="modalLapor" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white py-2 border-0">
                    <h6 class="modal-title fw-bold"><i class="bi bi-headset me-2"></i>Lapor Admin</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light">
                    <div class="mb-2">
                        <label class="form-label text-xs fw-bold mb-1 text-secondary">Nama Anda</label>
                        <input type="text" id="laporNama" class="form-control form-control-sm rounded-pill" value="${localStorage.getItem('loggedInName') || ''}" readonly>
                    </div>
                    <div class="mb-2">
                        <label class="form-label text-xs fw-bold mb-1 text-secondary">Jenis Kendala</label>
                        <select id="laporJenis" class="form-select form-select-sm rounded-pill">
                            <option value="Aplikasi Error/Bug">Kendala Aplikasi / Error</option>
                            <option value="Data Tidak Sesuai">Kendala Data / Jadwal</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label text-xs fw-bold mb-1 text-secondary">Detail Laporan</label>
                        <textarea id="laporDetail" class="form-control text-sm rounded-3" rows="3" placeholder="Jelaskan masalahnya..."></textarea>
                    </div>
                    <button class="btn btn-danger btn-sm w-100 fw-bold rounded-pill shadow-sm" onclick="window.kirimLaporan()"><i class="bi bi-send-fill me-1"></i> Kirim Laporan</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Pasang HTML modal menyang njero body nek durung ana
    if (!document.getElementById('modalTema')) {
        document.body.insertAdjacentHTML('beforeend', globalModals);
    }

    // Load Tema saka localStorage
    const savedTheme = localStorage.getItem('aecTheme') || 'system';
    window.setTema(savedTheme, false); // false ben modal ra usah ditutup pas load awal

    // Logic Logout (Anti Crot - Metu resik)
    const btnLogout = document.getElementById("btnLogout");
    if(btnLogout) {
        btnLogout.onclick = (e) => {
            e.preventDefault();
            if(confirm("Yakin ingin keluar dari aplikasi?")) {
                localStorage.clear();
                window.location.replace("index.html");
            }
        };
    }
}

// Global Window Functions kanggo Modal sing disuntikake
window.setTema = function(theme, closeUI = true) {
    localStorage.setItem('aecTheme', theme);
    const root = document.documentElement;
    if (theme === 'system') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', theme);
    }
    
    if (closeUI) {
        const modalEl = document.getElementById('modalTema');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
        }
    }
};

window.kirimLaporan = function() {
    const nama = document.getElementById("laporNama").value;
    const jenis = document.getElementById("laporJenis").value;
    const detail = document.getElementById("laporDetail").value;
    if(!detail) return alert("Isi detail laporan dulu, bolo!");
    
    const text = `🚨 *LAPORAN KENDALA AEC HUB* 🚨\n\n*Nama:* ${nama}\n*Kendala:* ${jenis}\n*Detail:* ${detail}`;
    // Ganti 6281234567890 iki dadi nomer WA-ne admin (Mas Afif/Agus)
    const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`; 
    window.open(waUrl, '_blank');
    
    document.getElementById("laporDetail").value = "";
    const modalEl = document.getElementById('modalLapor');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
    }
};
