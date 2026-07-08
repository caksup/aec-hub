/* ==================================================
   script.js - Skrip Pangkalan Data Global Terpadu
   AEC Hub - Versi 1.5.8 Ultimate
   
   Riwayat Versi (JS):
   - v1.0 - v1.4: Inisialisasi Firebase dan manajemen CRUD terpisah.
   - v1.5.4 - v1.5.7: Upaya penggabungan (Merger) yang menyebabkan konflik.
   - v1.5.8: (CURRENT) PERBAIKAN TOTAL 1/1. Pembersihan seluruh konflik DOM. Fokus eksklusif pada pemulihan fondasi autentikasi pengguna dan pemuatan peringatan modal modern secara aman.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. INISIALISASI PANGKALAN DATA (FIREBASE)
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

// Mengaktifkan fitur luring (PWA Offline Persistence)
enableIndexedDbPersistence(db).catch((err) => { 
    console.warn("Sistem gagal mengaktifkan mode luring:", err.code); 
});

// ==========================================
// 2. FUNGSI PERINGATAN (MODERN ALERT) AMAN
// ==========================================
window.showModernAlert = function(title, message, type = 'error') {
    const titleEl = document.getElementById('alertTitle'); 
    const msgEl = document.getElementById('alertMessage'); 
    const iconEl = document.getElementById('alertIcon'); 
    const modalEl = document.getElementById('modernAlertModal');
    
    // Fallback aman jika elemen HTML tidak ditemukan
    if(!titleEl || !msgEl || !iconEl || !modalEl) { 
        alert(title + "\n" + message); 
        return; 
    }
    
    titleEl.innerText = title; 
    msgEl.innerText = message;
    
    if (type === 'error') { 
        iconEl.className = 'bi bi-x-circle-fill text-danger mb-3 d-block'; 
    } else if (type === 'success') { 
        iconEl.className = 'bi bi-check-circle-fill text-success mb-3 d-block'; 
    } else { 
        iconEl.className = 'bi bi-info-circle-fill text-primary mb-3 d-block'; 
    }
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};

// ==========================================
// 3. DETEKSI TEMA GELAP (DARK MODE) OTOMATIS
// ==========================================
const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

// ==========================================
// 4. LOGIKA AUTENTIKASI PENGGUNA (LOGIN)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Memastikan skrip ini hanya berjalan jika berada di halaman login
    const loginForm = document.getElementById("loginForm");
    
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById("btnLogin");
            const inputUser = document.getElementById("username").value.toLowerCase().trim();
            const inputPin = document.getElementById("pin").value.trim();
            
            if (!inputUser || !inputPin) {
                return window.showModernAlert("Akses Ditolak", "ID Pengguna dan PIN keamanan wajib diisi secara lengkap.");
            }
            
            // Status pemuatan (Loading)
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...'; 
            btn.disabled = true;

            try {
                // Membaca pangkalan data pengguna
                const snap = await getDoc(doc(db, "users", inputUser));
                
                if (snap.exists() && snap.data().pin === inputPin) {
                    const data = snap.data();
                    
                    // Validasi Pemblokiran Akun
                    if (data.status === "nonaktif") {
                        window.showModernAlert("Akses Terkunci", "Akun Anda saat ini sedang dinonaktifkan oleh Administrator. Silakan hubungi pihak terkait.");
                        btn.innerHTML = 'MASUK SISTEM'; 
                        btn.disabled = false; 
                        return;
                    }
                    
                    // Merekam Sesi
                    localStorage.setItem("loggedInUser", inputUser);
                    localStorage.setItem("loggedInRole", data.role);
                    localStorage.setItem("loggedInName", data.julukan || inputUser);
                    
                    // Pengalihan Rute Aman
                    if (data.role === "admin") {
                        window.location.replace("superuser.html");
                    } else if (data.role === "direktur") {
                        window.location.replace("direktur.html");
                    } else {
                        window.location.replace("mentor.html");
                    }
                } else {
                    window.showModernAlert("Akses Ditolak", "Kombinasi ID Pengguna atau PIN tidak ditemukan dalam sistem.");
                    btn.innerHTML = 'MASUK SISTEM'; 
                    btn.disabled = false;
                }
            } catch (err) {
                window.showModernAlert("Kesalahan Jaringan", "Gagal terhubung ke pangkalan data. Harap periksa koneksi internet Anda.");
                btn.innerHTML = 'MASUK SISTEM'; 
                btn.disabled = false;
            }
        });
    }
});
