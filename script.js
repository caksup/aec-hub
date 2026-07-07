/* ==================================================
   script.js - Logika Autentikasi Pengguna
   AEC Hub - Versi 1.5.3 Ultimate
   
   Riwayat Versi (JS):
   - v1.0: Inisialisasi Firebase dan logika masuk (login) dasar.
   - v1.1: Penambahan pengaturan pengalihan rute (redirect) berdasarkan peran (role).
   - v1.2: Pengelolaan dan penyimpanan data sesi di LocalStorage.
   - v1.3: Penghapusan window.alert() dan diganti dengan fungsi Pop-up Modal Modern.
   - v1.4: Penambahan fungsi deteksi mode gelap secara otomatis dari perangkat.
   - v1.5.3: (CURRENT) FIX TOTAL Evaluasi keamanan masuk, perlindungan akun nonaktif, dan pembenahan kueri ke pangkalan data.
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Pangkalan Data Firebase
const firebaseConfig = { 
    apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A", 
    authDomain: "special-mentor.firebaseapp.com", 
    projectId: "special-mentor", 
    storageBucket: "special-mentor.firebasestorage.app", 
    messagingSenderId: "1075582532703", 
    appId: "1:1075582532703:web:969365cefff8999335efea" 
};
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app);

// Fungsi Pemanggil Pop-up Modern (Pengganti Alert)
function showModernAlert(title, message, type = 'error') {
    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMessage').innerText = message;
    
    const icon = document.getElementById('alertIcon');
    if (type === 'error') { 
        icon.className = 'bi bi-x-circle-fill text-danger mb-3 d-block'; 
    } else if (type === 'success') { 
        icon.className = 'bi bi-check-circle-fill text-success mb-3 d-block'; 
    } else { 
        icon.className = 'bi bi-info-circle-fill text-primary mb-3 d-block'; 
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modernAlertModal'));
    modal.show();
}

// Deteksi Tema Gelap (Dark Mode) Secara Otomatis
const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

// Logika Validasi Masuk (Login)
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById("btnLogin");
    const u = document.getElementById("username").value.toLowerCase().trim();
    const p = document.getElementById("pin").value.trim();
    
    if (!u || !p) {
        return showModernAlert("Akses Ditolak", "ID Pengguna dan PIN keamanan wajib diisi secara lengkap.");
    }
    
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...'; 
    btn.disabled = true;

    try {
        const snap = await getDoc(doc(db, "users", u));
        
        if (snap.exists() && snap.data().pin === p) {
            const data = snap.data();
            
            // Validasi Akun Terkunci/Nonaktif
            if (data.status === "nonaktif") {
                showModernAlert("Akses Terkunci", "Akun Anda sedang dinonaktifkan oleh Administrator. Silakan hubungi pusat.");
                btn.innerHTML = 'MASUK SISTEM'; 
                btn.disabled = false; 
                return;
            }
            
            // Menyimpan Data Sesi Aktif
            localStorage.setItem("loggedInUser", u);
            localStorage.setItem("loggedInRole", data.role);
            localStorage.setItem("loggedInName", data.julukan || u);
            
            // Pengalihan Rute Berdasarkan Peran
            if (data.role === "admin") {
                window.location.replace("superuser.html");
            } else if (data.role === "direktur") {
                window.location.replace("direktur.html");
            } else {
                window.location.replace("mentor.html");
            }
        } else {
            showModernAlert("Akses Ditolak", "Kombinasi ID Pengguna atau PIN tidak valid.");
            btn.innerHTML = 'MASUK SISTEM'; 
            btn.disabled = false;
        }
    } catch (err) {
        showModernAlert("Kesalahan Jaringan", "Gagal terhubung ke pangkalan data. Harap periksa koneksi internet Anda.");
        btn.innerHTML = 'MASUK SISTEM'; 
        btn.disabled = false;
    }
});
