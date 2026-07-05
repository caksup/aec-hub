/* ==================================================
   script.js - AEC HUB (V14.1 - Multi School + Anti Bocor)
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
