/* ==================================================
   script.js - Skrip Pangkalan Data Global Terpadu
   AEC Hub - Versi 1.6.5 Ultimate
   
   Riwayat Versi (JS):
   - v1.0 - v1.6.3: Inisialisasi Firebase dan manajemen operasi dasbor.
   - v1.6.4: Upaya pemantapan fungsionalitas Firebase.
   - v1.6.5: (CURRENT) PERBAIKAN TOTAL 1/1 (FUNGSI LOGIN). Menghapus pembungkus 'DOMContentLoaded' yang bentrok dengan 'type=module'. Mengizinkan skrip mengeksekusi pendengar formulir secara seketika.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. KONFIGURASI FIREBASE & MODE LURING
// ==========================================
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

// ==========================================
// 2. FUNGSI PERINGATAN MODAL MODERN
// ==========================================
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

// ==========================================
// 3. TEMA GELAP & IDENTITAS SESI GLOBAL
// ==========================================
const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

const actUser = localStorage.getItem("loggedInUser"); 
const actRole = localStorage.getItem("loggedInRole"); 
const myName = localStorage.getItem("loggedInName");

// ==========================================
// 4. LOGIKA HALAMAN LOGIN (LANGSUNG DIEKSEKUSI)
// ==========================================
// Skrip 'type="module"' sudah 'deferred', jadi DOM pasti sudah siap saat skrip ini dibaca.
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    // Jika Pengguna Sudah Login, Alihkan Rute Secara Paksa
    if (actUser && actRole) {
        if (actRole === "admin") window.location.replace("superuser.html");
        else if (actRole === "direktur") window.location.replace("direktur.html");
        else window.location.replace("mentor.html");
    }

    // Pendengar Tombol "Masuk Sistem"
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById("btnLogin");
        const u = document.getElementById("username").value.toLowerCase().trim();
        const p = document.getElementById("pin").value.trim();
        
        if (!u || !p) return window.showModernAlert("Akses Ditolak", "ID Pengguna dan PIN wajib diisi.");
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...'; 
        btn.disabled = true;
        
        try {
            const snap = await getDoc(doc(db, "users", u));
            if (snap.exists() && snap.data().pin === p) {
                const data = snap.data();
                if (data.status === "nonaktif") { 
                    window.showModernAlert("Akses Terkunci", "Akun dinonaktifkan Admin."); 
                    btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; return; 
                }
                
                // Merekam Sesi
                localStorage.setItem("loggedInUser", u); 
                localStorage.setItem("loggedInRole", data.role); 
                localStorage.setItem("loggedInName", data.julukan || u);
                
                // Mengalihkan Rute
                if (data.role === "admin") window.location.replace("superuser.html");
                else if (data.role === "direktur") window.location.replace("direktur.html");
                else window.location.replace("mentor.html");
            } else { 
                window.showModernAlert("Akses Ditolak", "ID atau PIN tidak sesuai."); 
                btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; 
            }
        } catch (err) { 
            window.showModernAlert("Kesalahan Jaringan", "Gagal menghubungkan ke server Firebase."); 
            btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false; 
        }
    });

} 
// ==========================================
// 5. LOGIKA DASBOR (JIKA BUKAN HALAMAN LOGIN)
// ==========================================
else {
    
    // Pagar Keamanan: Lempar ke luar jika belum masuk
    if (!actUser || !actRole) { 
        window.location.replace("index.html"); 
    }

    // Pengaturan Identitas Visual Dasbor
    if (document.getElementById("userNameDisplay")) document.getElementById("userNameDisplay").innerText = myName || "Pengguna";
    if (document.getElementById("userIdDisplay")) document.getElementById("userIdDisplay").innerText = actUser;

    function runClock() {
        const clk = document.getElementById('headClockDate'); if(!clk) return; const d = new Date();
        clk.innerText = `${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' })} WIB`;
    }
    setInterval(runClock, 1000); runClock();

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
        if (t === 'system') document.documentElement.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); else document.documentElement.setAttribute('data-theme', t);
        const iconEl = document.getElementById("themeIconDisplay"); if(iconEl) { iconEl.className = `bi ${themeIcons[index]} fs-4 text-white`; void iconEl.offsetWidth; iconEl.classList.add("theme-icon-animate"); }
    }
    applyThemeVisuals(currentThemeIndex);
    if(document.getElementById("btnCycleTheme")) document.getElementById("btnCycleTheme").onclick = () => { currentThemeIndex = (currentThemeIndex + 1) % 3; applyThemeVisuals(currentThemeIndex); };

    // Fungsi Logout
    if(document.getElementById("btnLogoutOffcanvas")) { 
        document.getElementById("btnLogoutOffcanvas").onclick = (e) => { 
            e.preventDefault(); 
            if(confirm("Yakin ingin keluar dari sistem AEC Hub?")) { localStorage.clear(); window.location.replace("index.html"); } 
        }; 
    }

    // Variabel Sesi Pangkalan Data Global
    let currentSchoolId = ""; let rawKurikulum = {}; let rawMasterSiswa = ""; let dataLengkap = []; let dataLengkapMentor = []; let masterTugasWA = [];
    let globalAllSchools = []; let globalAllUsers = []; let currentAssignedMentors = []; 
    let unsubSchool = null; let unsubLogbooks = null; let unsubChats = null; let unsubWA = null;

    function killListeners() { if(unsubSchool) unsubSchool(); if(unsubLogbooks) unsubLogbooks(); if(unsubChats) unsubChats(); if(unsubWA) unsubWA(); dataLengkap = []; dataLengkapMentor = []; masterTugasWA = []; }

    export function getActiveSchedule(jadwalGlobal) {
        if (!jadwalGlobal || jadwalGlobal === "-") return "Tidak ada jadwal kelas.";
        const lines = jadwalGlobal.split('\n'); const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes();
        for (let line of lines) { const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/); if (match) { const s = parseInt(match[1]) * 60 + parseInt(match[2]); const e = parseInt(match[3]) * 60 + parseInt(match[4]); if (cur >= s && cur <= e) return line; } } return "Di luar jam operasional.";
    }

    // --- STRUKTUR UNTUK PANEL ADMIN, DIREKTUR, MENTOR AKAN DIPASANG DI SINI PADA TAHAP SELANJUTNYA ---
    // (Pangkalan data Dasbor akan dirakit kembali setelah Anda memastikan Login berfungsi sempurna).
}
