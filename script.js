/* ================= LOGIC & INTERACTIVITY ================= */

// 1. Storage & Global State
let userCity = localStorage.getItem('userCity');
let userCountry = localStorage.getItem('userCountry');
let prayerTimings = null;
let userTimezone = localStorage.getItem('userTimezone') || null;
let notificationsEnabled = false;
let currentHijriDay = 1;
const azanAudio = new Audio('https://www.islamcan.com/audio/adhan/makkah.mp3');

// 2. Core Data: Cities List
const globalCities = [
    { city: "London", country: "United Kingdom" },
    { city: "Dubai", country: "United Arab Emirates" },
    { city: "Lahore", country: "Pakistan" },
    { city: "Karachi", country: "Pakistan" },
    { city: "Islamabad", country: "Pakistan" },
    { city: "Riyadh", country: "Saudi Arabia" },
    { city: "Mecca", country: "Saudi Arabia" },
    { city: "Medina", country: "Saudi Arabia" },
    { city: "Toronto", country: "Canada" },
    { city: "New York", country: "USA" },
    { city: "Sydney", country: "Australia" },
    { city: "Istanbul", country: "Turkey" }
];

// 3. Daily Duas (30 days)
const dailyDuas = [
    { ar: "اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", en: "O Allah, I fasted for You and with Your provision I break my fast." },
    { ar: "اللَّهُمَّ اجْعَلْ صِيَامِي فِيهِ صِيَامَ الصَّائِمِينَ", en: "O Allah, make my fasts in this month like the fasts of those who deserve acceptable fasts." },
    { ar: "اللَّهُمَّ نَبِّهْنِي فِيهِ لِبَرَكَاتِ أَسْحَارِهِ", en: "O Allah, awaken me in this month for the blessings of its early dawns." },
    { ar: "اللَّهُمَّ وَفِّرْ فِيهِ حَظِّي مِنْ بَرَكَاتِهِ", en: "O Allah, multiply my share in this month from its blessings." },
    { ar: "اللَّهُمَّ افْتَحْ لِي فِيهِ أَبْوَابَ الْجِنَانِ", en: "O Allah, open for me in this month the gates of Paradise." },
    { ar: "اللَّهُمَّ غَلِّقْ عَنِّي فِيهِ أَبْوَابَ النِّيرانِ", en: "O Allah, close for me in this month the gates of Hellfire." },
    { ar: "اللَّهُمَّ وَفِّقْنِي فِيهِ لِتِلاوَةِ الْقُرْآنِ", en: "O Allah, grant me success in this month to recite the Quran." },
    { ar: "اللَّهُمَّ ارْزُقْنِي فِيهِ فَضْلَ لَيْلَةِ الْقَدْرِ", en: "O Allah, bestow upon me in this month the merit of Laylat al-Qadr." },
    { ar: "اللَّهُمَّ طَهِّرْنِي فِيهِ مِنَ الدَّنَسِ وَالْأَقْذَارِ", en: "O Allah, purify me in this month from filth and impurity." },
    { ar: "اللَّهُمَّ لا تُؤَاخِذْنِي فِيهِ بِالْعَثَرَاتِ", en: "O Allah, do not take me to task in this month for my slips." },
    // Simplified for demo, can be expanded to full 30
];

// 4. Theme Management
function initTheme() {
    const themeBtn = document.getElementById('theme-btn');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.innerText = savedTheme === 'dark' ? '☀️' : '🌙';

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            if (themeIcon) themeIcon.innerText = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }
}

// 5. Clocks & Time Management
function updateTime() {
    const now = new Date();
    let regionalNow = now;

    if (userTimezone) {
        try {
            const regionalStr = now.toLocaleString("en-US", { timeZone: userTimezone });
            regionalNow = new Date(regionalStr);
        } catch (e) {
            console.error("Invalid timezone:", userTimezone);
        }
    }

    const hour = regionalNow.getHours();
    const minute = regionalNow.getMinutes();
    const second = regionalNow.getSeconds();

    // Analog Clock
    const hands = { hr: document.getElementById('hour-hand'), min: document.getElementById('minute-hand'), sec: document.getElementById('second-hand') };
    if (hands.hr) hands.hr.style.transform = `translateX(-50%) rotate(${(hour * 30) + (minute / 2)}deg)`;
    if (hands.min) hands.min.style.transform = `translateX(-50%) rotate(${(minute * 6) + (second / 10)}deg)`;
    if (hands.sec) hands.sec.style.transform = `translateX(-50%) rotate(${second * 6}deg)`;

    const digital = document.getElementById('digital-clock');
    if (digital) digital.innerText = regionalNow.toLocaleTimeString('en-US', { hour12: false });

    const dateEl = document.getElementById('real-date');
    if (dateEl) dateEl.innerText = regionalNow.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Logic Checks
    if (second === 0) checkAlarms(hour, minute);
    if (prayerTimings) updateCountdown(regionalNow);
}

// 6. Intelligent Prayer Logic
function getNextPrayer(regionalNow) {
    if (!prayerTimings) return null;
    const currentTime = regionalNow.getHours() * 60 + regionalNow.getMinutes();

    const prayers = [
        { name: 'Fajr', time: prayerTimings.Fajr },
        { name: 'Dhuhr', time: prayerTimings.Dhuhr },
        { name: 'Asr', time: prayerTimings.Asr },
        { name: 'Maghrib', time: prayerTimings.Maghrib },
        { name: 'Isha', time: prayerTimings.Isha }
    ];

    for (const p of prayers) {
        const [h, m] = p.time.split(':').map(Number);
        if ((h * 60 + m) > currentTime) return p;
    }
    return { name: 'Fajr (Tomorrow)', time: prayers[0].time };
}

function updateCountdown(regionalNow) {
    const next = getNextPrayer(regionalNow);
    if (!next) return;

    const [h, m] = next.time.split(':').map(Number);
    const target = new Date(regionalNow);
    target.setHours(h, m, 0);
    if (next.name.includes('Tomorrow')) target.setDate(target.getDate() + 1);

    const diff = target - regionalNow;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    const label = document.getElementById('countdown-label');
    const display = document.getElementById('main-countdown');
    const meal = document.getElementById('next-meal-time');

    if (label) label.innerText = `Time until ${next.name}`;
    if (display) display.innerText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (meal) meal.innerText = `Next: ${next.name} at ${format12h(next.time)}`;
}

// 7. Alarms & Notifications
function checkAlarms(h, m) {
    if (!prayerTimings || !notificationsEnabled) return;
    const current = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (current === prayerTimings.Fajr) triggerAzan("Sehri / Fajr");
    else if (current === prayerTimings.Maghrib) triggerAzan("Iftar / Maghrib");
}

function triggerAzan(type) {
    azanAudio.play().catch(e => console.log("Audio play blocked."));
    if (Notification.permission === "granted") {
        new Notification("Ramadan Companion", { body: `It's time for ${type}!`, icon: 'https://cdn-icons-png.flaticon.com/512/2881/2881031.png' });
    }
}

function initNotifications() {
    const btn = document.getElementById('enable-notifications');
    const status = document.getElementById('alarm-status');
    if (btn) {
        btn.addEventListener('click', () => {
            Notification.requestPermission().then(p => {
                if (p === "granted") {
                    notificationsEnabled = true;
                    if (status) { status.innerText = "Notifications: Enabled"; status.classList.add('active'); }
                    btn.innerText = "Alerts Active"; btn.disabled = true;
                }
            });
        });
    }
}

// 8. Onboarding & Region
function initOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    const nameInput = document.getElementById('user-name-input');
    const searchInput = document.getElementById('city-search');
    const results = document.getElementById('city-results');
    const finBtn = document.getElementById('finish-onboarding');

    if (!overlay) return;

    const savedName = localStorage.getItem('userName');
    if (savedName && userCity && userCountry) {
        overlay.style.display = 'none';
        personalizeUI(savedName);
        fetchPrayerTimes(userCity, userCountry);
    }

    window.nextOnboardingStep = (step) => {
        if (step === 2 && !nameInput.value.trim()) return alert("Please enter your name.");
        document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${step}`).classList.add('active');
    };

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        results.innerHTML = '';
        if (term.length < 2) return results.style.display = 'none';
        globalCities.filter(c => c.city.toLowerCase().includes(term)).slice(0, 5).forEach(m => {
            const div = document.createElement('div');
            div.className = 'search-result-item'; div.innerText = `${m.city}, ${m.country}`;
            div.onclick = () => {
                searchInput.value = `${m.city}, ${m.country}`;
                searchInput.setAttribute('data-city', m.city); searchInput.setAttribute('data-country', m.country);
                results.style.display = 'none'; finBtn.style.display = 'inline-block';
            };
            results.appendChild(div);
        });
        results.style.display = results.innerHTML ? 'block' : 'none';
    });

    finBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const city = searchInput.getAttribute('data-city');
        const country = searchInput.getAttribute('data-country');
        localStorage.setItem('userName', name); localStorage.setItem('userCity', city); localStorage.setItem('userCountry', country);
        overlay.style.opacity = 0; setTimeout(() => location.reload(), 500);
    });
}

function personalizeUI(name) {
    const title = document.getElementById('welcome-title');
    if (title) title.innerText = `Ramadan Kareem, ${name}!`;
    updateRegionLabel();
}

function updateRegionLabel() {
    const label = document.getElementById('current-region-label');
    if (label && userCity && userCountry) label.innerText = `${userCity}, ${userCountry}`;
}

function initRegionChange() {
    const btn = document.getElementById('change-region-btn');
    const overlay = document.getElementById('onboarding-overlay');
    if (btn && overlay) {
        btn.addEventListener('click', () => {
            overlay.style.display = 'flex'; overlay.style.opacity = 1;
            document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
            document.getElementById('step-2').classList.add('active');
        });
    }
}

// 9. API & Integration
async function fetchPrayerTimes(city, country) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=2`);
        const data = await res.json();
        if (data.code === 200) {
            prayerTimings = data.data.timings;
            userTimezone = data.data.meta.timezone;
            localStorage.setItem('userTimezone', userTimezone);
            currentHijriDay = parseInt(data.data.date.hijri.day);
            updatePrayerUI(prayerTimings);
            updateHijriHeader(data.data.date.hijri);
            updateDailyDua(currentHijriDay);
            updateMoon(currentHijriDay);
            updateTime(); // Forced update after timezone fetch
        }
    } catch (e) { console.error("API Error:", e); }
}

function updatePrayerUI(t) {
    const list = { 'Fajr': t.Fajr, 'Dhuhr': t.Dhuhr, 'Asr': t.Asr, 'Maghrib': t.Maghrib, 'Isha': t.Isha };
    const items = document.querySelectorAll('#prayer-list li');
    let idx = 0;
    for (const [name, time] of Object.entries(list)) {
        if (items[idx]) {
            const spans = items[idx].querySelectorAll('span');
            spans[0].innerText = name + (name === 'Maghrib' ? ' (Iftar)' : '');
            spans[1].innerText = format12h(time);
        }
        idx++;
    }
}

function format12h(t) {
    let [h, m] = t.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    return `${((h % 12) || 12).toString().padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
}

function updateHijriHeader(h) {
    const el = document.getElementById('hijri-date');
    if (el) el.innerText = `${h.day} ${h.month.en} ${h.year} AH`;
}

// 10. Components: Dua, Moon, Calendar, Tracker, Tasbeeh, Zakat, Qibla
function updateDailyDua(day) {
    const dua = dailyDuas[(day - 1) % dailyDuas.length];
    const textEl = document.getElementById('dua-text');
    const transEl = document.getElementById('dua-translation');
    if (textEl) textEl.innerText = `"${dua.en}"`;
    if (transEl) transEl.innerText = dua.ar;
}

function updateMoon(day) {
    const shape = document.getElementById('moon-shape');
    const status = document.getElementById('moon-status');
    if (!shape || !status) return;
    if (day <= 3) { shape.style.width = "15%"; status.innerText = "Waxing Crescent"; }
    else if (day >= 13 && day <= 16) { shape.style.width = "100%"; status.innerText = "Full Moon"; }
    else if (day >= 27) { shape.style.width = "5%"; status.innerText = "Waning Crescent"; }
    else { shape.style.width = "50%"; status.innerText = day < 15 ? "First Quarter" : "Last Quarter"; }
}

function generateCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const start = new Date(2026, 1, 18);
    for (let i = 1; i <= 30; i++) {
        const c = new Date(start); c.setDate(start.getDate() + (i - 1));
        const d = document.createElement('div'); d.className = 'calendar-day' + (c.toDateString() === new Date().toDateString() ? ' today' : '');
        d.innerHTML = `<span class="hijri-num">${i}</span><span class="greg-num">${c.getDate()} ${c.toLocaleString('default', { month: 'short' })}</span>`;
        grid.appendChild(d);
    }
}

function initTracker() {
    const checks = document.querySelectorAll('#daily-checklist input[type="checkbox"]');
    const summary = document.getElementById('progress-summary');
    if (!summary) return;
    const refresh = () => {
        const count = document.querySelectorAll('#daily-checklist input:checked').length;
        summary.innerText = `Tasks Completed: ${count}/4`;
        checks.forEach(c => localStorage.setItem(`track_${c.id}`, c.checked));
    };
    checks.forEach(c => {
        c.checked = localStorage.getItem(`track_${c.id}`) === 'true';
        if (c.checked) c.parentElement.classList.add('checked');
        c.addEventListener('change', () => { refresh(); c.parentElement.classList.toggle('checked', c.checked); });
    });
    refresh();
}

function initTasbeeh() {
    let count = 0;
    const disp = document.getElementById('tasbeeh-count'), btn = document.getElementById('count-btn'), rst = document.getElementById('reset-tasbeeh');
    if (btn) btn.onclick = () => { count++; disp.innerText = count; disp.style.transform = 'scale(1.1)'; setTimeout(() => disp.style.transform = 'scale(1)', 100); };
    if (rst) rst.onclick = () => { count = 0; disp.innerText = count; };
}

function initZakat() {
    const btn = document.getElementById('zakat-calc-btn');
    if (btn) btn.onclick = () => {
        const w = parseFloat(document.getElementById('zakat-wealth').value) || 0;
        document.getElementById('zakat-result').innerHTML = `Zakat: <strong>${(w * 0.025).toFixed(2)}</strong>`;
    };
}

function initQibla() {
    const needle = document.getElementById('qibla-needle');
    if (needle) setTimeout(() => needle.style.transform = 'translate(-50%, -100%) rotate(45deg)', 1000);
}

// 11. Start App
document.addEventListener('DOMContentLoaded', () => {
    initTheme(); initOnboarding(); initNotifications(); initTracker(); initTasbeeh(); initZakat(); initQibla(); initRegionChange();
    generateCalendar();
    setInterval(updateTime, 1000); updateTime();

    document.querySelectorAll('nav a').forEach(a => a.onclick = (e) => {
        const h = a.getAttribute('href');
        if (h.startsWith('#')) {
            e.preventDefault();
            const t = document.getElementById(h.substring(1));
            if (t) window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
        }
    });
});
