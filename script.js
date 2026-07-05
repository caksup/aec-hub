// ==============================================================
// FITUR GLOBAL UI, MODALS, & AUTH (v4.0-WA-Ultimate)
// Paste kodingan iki neng paling ngisor file script.js-mu
// ==============================================================

// 1. Fungsi Cek Login Otomatis (Anti-crot)
export function cekAutoLogin() {
    const loggedUser = localStorage.getItem("loggedInUser");
    const role = localStorage.getItem("userRole");
    
    if (loggedUser && role) {
        if (role === 'admin') {
            window.location.replace("superuser.html");
        } else if (role === 'direktur') {
            window.location.replace("direktur.html");
        } else {
            window.location.replace("mentor.html");
        }
    }
}

// 2. Fungsi Proses Login Utama (Awet nganggo localStorage)
export async function prosesLogin(usernameInput, pinInput) {
    const u = usernameInput.toLowerCase().trim();
    const p = pinInput.trim();

    if (!u || !p) {
        alert("Username lan PIN ora entuk kosong, bolo!");
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", u));
        
        if (!userDoc.exists()) {
            alert("Username ora kedaftar!");
            return;
        }

        const userData = userDoc.data();

        if (userData.status !== "aktif") {
            alert("Akun sampeyan wis dinonaktifkan karo Admin!");
            return;
        }

        if (userData.pin === p) {
            // Ganti nggunakake localStorage ben nempel terus
            localStorage.setItem("loggedInUser", u);
            localStorage.setItem("loggedInName", userData.julukan);
            localStorage.setItem("userRole", userData.role);

            // Alirkan sesuai jatah role
            if (userData.role === "admin") {
                window.location.replace("superuser.html");
            } else if (userData.role === "direktur") {
                window.location.replace("direktur.html");
            } else {
                window.location.replace("mentor.html");
            }
        } else {
            alert("PIN sing mbok lebokke salah, cuk!");
        }
    } catch (error) {
        alert("Error Database: " + error.message);
    }
}

// 3. Inisialisasi UI Global (Modals & Theme) disuntik otomatis ke kabeh Page
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

// 4. Global Window Functions kanggo Modal sing disuntikake
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
