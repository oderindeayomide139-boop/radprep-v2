// ==========================================
// RadPrep — script.js v3
// Review Deck + Image Questions + Enhanced Helper
// ==========================================
console.log("🔥 RadPrep v3 loaded");

// ==========================================
// CONFIG
// ==========================================
const SUPABASE_URL = 'https://puqxlbtdkajzlxgbtsnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wibge1aU64UKmHdchdkywA_jmZ2SNMp';

// ⚠️ GEMINI API KEY — LEAVE BLANK FOR LOCAL MATCHER MODE
// If you fill this in, ANYONE can view the key in their browser (View Source).
// Only use for personal testing. For production, use a proxy (Supabase Edge Function).
const GEMINI_API_KEY = '';
const GEMINI_MODEL = 'gemini-1.5-flash';

let supabaseClient = null;
if (window.supabase && !SUPABASE_URL.includes("your-project-id")) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase client initialised");
    } catch (err) { console.warn("Supabase init failed:", err); }
}

const $ = (id) => document.getElementById(id);
const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

let currentUser = null;
let authMode = 'login';
let activeLevel = '300L';
let activeCourseCode = null;

// ==========================================
// CURRICULUM DATA
// ==========================================
const curriculumData = {
    "100L": [
        { code: "BIO 101", title: "General Biology I", units: 3, desc: "Cell structure, genetics, and ecology foundations.", topics: ["Cell structure & organelles", "Cell division", "Basic genetics", "Ecology & ecosystems"] },
        { code: "CHM 101", title: "General Chemistry I", units: 3, desc: "Atomic structure, bonding, and radioactivity basics.", topics: ["Atomic structure", "Periodic table trends", "Chemical bonding", "Radioactivity & decay"] },
        { code: "PHY 101", title: "General Physics I", units: 3, desc: "Mechanics, waves, and the electromagnetic spectrum.", topics: ["Newtonian mechanics", "Work, energy & power", "Wave motion", "EM spectrum overview"] },
        { code: "MTH 101", title: "Elementary Mathematics I", units: 3, desc: "Algebra, trigonometry, and set theory.", topics: ["Algebra & equations", "Trigonometry", "Set theory", "Binomial theorem"] },
        { code: "CSC 101", title: "Intro to Computer Science", units: 2, desc: "Computer hardware, software, and digital literacy.", topics: ["Computer architecture", "Operating systems", "Application software", "Digital peripherals"] }
    ],
    "200L": [
        { code: "ANA 201", title: "Gross Anatomy (Upper Limb & Thorax)", units: 3, desc: "Regional anatomy of the upper limb, chest wall, and lungs.", topics: ["Osteology of upper limb", "Muscles of upper limb", "Thoracic wall", "Pleura & lungs"] },
        { code: "ANA 203", title: "Gross Anatomy (Abdomen & Pelvis)", units: 3, desc: "GI viscera, urogenital structures, and pelvic floor.", topics: ["Abdominal wall", "GI tract", "Kidneys & ureters", "Pelvic floor"] },
        { code: "PHS 201", title: "Human Physiology I", units: 4, desc: "Cell physiology, blood, and cardiovascular/respiratory systems.", topics: ["Cell physiology", "Blood composition", "Cardiovascular system", "Respiratory physiology"] },
        { code: "RDG 201", title: "Introductory Radiography", units: 1, desc: "Professional history, ethics, and patient care fundamentals.", topics: ["History of radiography", "Professional ethics", "Department layout", "Patient care basics"] },
        { code: "RDG 203", title: "Basic Physics of Radiology", units: 2, desc: "Electrostatics, induction, transformers, and X-ray circuits.", topics: ["Electrostatics", "Electromagnetic induction", "Transformers", "X-ray circuits"] }
    ],
    "300L": [
        { code: "RDG 301", title: "Radiation Physics & Protection", units: 3, desc: "X-ray production, photon interactions, dosimetry, ALARA.", topics: ["X-ray production", "Photon interactions", "Dosimetry units", "Biological effects", "ALARA & shielding"] },
        { code: "RDG 303", title: "Radiographic Anatomy & Pathology", units: 3, desc: "Cross-sectional anatomy paired with common disease presentations.", topics: ["Radiological anatomy", "Pathology basics", "Common presentations", "Image correlation"] },
        { code: "RDG 305", title: "Radiographic Technique I", units: 3, desc: "Positioning for extremities, spine, and thorax.", topics: ["Upper limb positioning", "Lower limb positioning", "Spine views", "Chest & thorax"] },
        { code: "RDG 309", title: "Radiographic Imaging & Equipment I", units: 3, desc: "Film, screens, processing, and generator circuits.", topics: ["X-ray film", "Intensifying screens", "Processing chemistry", "Generator circuits"] },
        { code: "RDG 311", title: "Diagnostic Clinical Posting I", units: 2, desc: "Initial hospital rotations.", topics: ["Department workflow", "Patient communication", "Observation log", "Professional conduct"] }
    ],
    "400L": [
        { code: "RDG 401", title: "Special Radiographic Procedures", units: 3, desc: "Contrast examinations including HSG, IVU, barium studies.", topics: ["Contrast media", "Barium studies", "IVU technique", "HSG & angiographic routes"] },
        { code: "RDG 403", title: "Computed Tomography (CT) Physics", units: 2, desc: "Data acquisition, reconstruction, Hounsfield units, artifacts.", topics: ["CT data acquisition", "Image reconstruction", "Hounsfield units", "Artifact types"] },
        { code: "RDG 405", title: "Medical Ultrasound Imaging I", units: 2, desc: "Acoustic physics, transducers, and pelvic sonography.", topics: ["Acoustic physics", "Transducer types", "Pelvic sonography", "First-trimester OB"] },
        { code: "RDG 407", title: "Magnetic Resonance Imaging (MRI) I", units: 2, desc: "Magnets, Larmor frequency, spatial encoding, T1/T2.", topics: ["MRI magnets", "Larmor frequency", "Spatial encoding", "T1/T2 relaxation", "MRI safety"] },
        { code: "RDG 413", title: "Diagnostic Clinical Posting II", units: 4, desc: "Intermediate hospital clinical training.", topics: ["Modality rotations", "Trauma imaging", "Portable radiography", "Case presentation"] }
    ],
    "500L": [
        { code: "RDG 501", title: "Advanced Radiotherapy & Oncology", units: 2, desc: "Beam characteristics, isodose curves, treatment planning.", topics: ["Ionizing therapy", "Beam characteristics", "Isodose curves", "Treatment planning"] },
        { code: "RDG 503", title: "Quality Assurance & Maintenance", units: 2, desc: "Acceptance testing, calibration, safety checks.", topics: ["Acceptance testing", "Equipment calibration", "Troubleshooting", "Safety checks"] },
        { code: "RDG 505", title: "Image Critique & Pattern Recognition", units: 2, desc: "Evaluating image quality and spotting pathology.", topics: ["Image quality metrics", "Fault identification", "Pathology spotting", "Artifact review"] },
        { code: "RDG 511", title: "Diagnostic Clinical Posting III", units: 3, desc: "Advanced clinical responsibilities and trauma imaging.", topics: ["Advanced radiography", "Trauma radiography", "Clinical responsibility", "Case documentation"] },
        { code: "RDG 514", title: "Final Year Research Project", units: 5, desc: "Independent research and thesis defense.", topics: ["Research design", "Literature review", "Data analysis", "Thesis writing"] }
    ]
};

// ==========================================
// QUESTION BANK
// ==========================================
// To add an image question, add: img: "https://your-image-url.jpg"
const quizBank = {
    "PHY 101": [
        { q: "The SI unit of frequency is the:", o: ["Hertz", "Newton", "Joule", "Watt"], a: 0, why: "Frequency is measured in hertz (Hz), defined as cycles per second." },
        { q: "Which region of the EM spectrum has the shortest wavelength?", o: ["Radio", "Infrared", "X-rays", "Gamma rays"], a: 3, why: "Gamma rays have the shortest wavelengths and highest energy." },
        { q: "Newton's second law is expressed as:", o: ["F = ma", "E = mc²", "V = IR", "P = IV"], a: 0, why: "Force equals mass times acceleration." }
    ],
    "CHM 101": [
        { q: "The atomic number of an element equals the number of:", o: ["Neutrons", "Protons", "Electrons + neutrons", "Mass number"], a: 1, why: "Atomic number (Z) equals the proton count." },
        { q: "Which type of radiation is stopped by a sheet of paper?", o: ["Alpha", "Beta", "Gamma", "X-ray"], a: 0, why: "Alpha particles are heavy and minimally penetrating." },
        { q: "Isotopes of an element differ in:", o: ["Protons", "Electrons", "Neutrons", "Charge"], a: 2, why: "Isotopes share proton count but differ in neutron count." }
    ],
    "RDG 301": [
        { q: "Which interaction predominates in soft tissue at diagnostic energies?", o: ["Photoelectric effect", "Compton scattering", "Pair production", "Coherent scattering"], a: 1, why: "Compton scattering dominates in soft tissue between roughly 30–150 keV." },
        { q: "The SI unit of equivalent dose is the:", o: ["Gray", "Becquerel", "Sievert", "Coulomb/kg"], a: 2, why: "Equivalent dose is measured in sieverts (Sv)." },
        { q: "The inverse square law states intensity is proportional to:", o: ["1/d", "1/d²", "d²", "d"], a: 1, why: "Intensity falls off as the square of distance from a point source." },
        { q: "The standard anode material in a diagnostic X-ray tube is:", o: ["Copper", "Tungsten", "Aluminium", "Molybdenum"], a: 1, why: "Tungsten has high atomic number and high melting point." },
        { q: "Increasing kVp primarily affects the beam by:", o: ["Raising quantity and quality", "Lowering quality only", "Only raising quantity", "No effect"], a: 0, why: "Higher kVp increases photon energy and number produced." },
        { q: "Which of these is NOT a cardinal radiation protection principle?", o: ["Time", "Distance", "Shielding", "Amplification"], a: 3, why: "The three pillars are time, distance, and shielding." },
        { q: "Characteristic X-rays are produced when:", o: ["Electrons decelerate in the nucleus field", "An outer-shell electron fills an inner-shell vacancy", "Two photons collide", "A nucleus splits"], a: 1, why: "Shell transitions produce photons of fixed, element-specific energy." },
        { q: "The annual occupational dose limit (ICRP, averaged) is:", o: ["1 mSv", "5 mSv", "20 mSv", "100 mSv"], a: 2, why: "ICRP recommends 20 mSv per year averaged over 5 years." },
        { q: "Filtration of the X-ray beam primarily:", o: ["Increases low-energy photons", "Removes low-energy photons", "Increases contrast", "Raises tube current"], a: 1, why: "Filtration removes low-energy photons that only add patient dose." },
        { q: "The photoelectric effect is most likely in:", o: ["Soft tissue at high kVp", "Bone at low kVp", "Air at any kVp", "Fat at any kVp"], a: 1, why: "Photoelectric absorption rises with atomic number and falls as photon energy increases." }
    ],
    "RDG 303": [
        { q: "The PA chest projection is taken at what standard SID?", o: ["100 cm", "150 cm", "180 cm", "200 cm"], a: 2, why: "180 cm SID reduces magnification of the heart." },
        { q: "Which view best demonstrates the acromioclavicular joint?", o: ["AP shoulder", "PA oblique with weights", "Axial shoulder", "Scapular Y"], a: 1, why: "Weighted PA view stresses the AC joint." },
        { q: "The occipitomental (Water's) view demonstrates the:", o: ["Mandible", "Facial bones and sinuses", "Cervical spine", "TMJ"], a: 1, why: "Water's view is the standard for facial bones and sinuses." },
        { q: "A right lateral decubitus abdomen is used to detect:", o: ["Free air", "Renal stones", "Bowel obstruction only", "Gallstones only"], a: 0, why: "Free air rises to the uppermost side." },
        { q: "The standard centring point for an AP knee is:", o: ["Patella", "1 cm distal to apex of patella", "Tibial tuberosity", "Femoral condyles"], a: 1, why: "Centring below the patellar apex aligns the joint space." },
        { q: "The Scapular Y view primarily assesses:", o: ["Glenohumeral alignment", "Clavicle fracture", "AC joint", "Elbow"], a: 0, why: "The Y view shows the humeral head relative to the scapular Y." },
        { q: "Which projection best demonstrates the cervical spine's intervertebral foramina?", o: ["AP", "Lateral", "Oblique", "PA"], a: 2, why: "Oblique views open the intervertebral foramina." },
        { q: "A KUB radiograph covers which region?", o: ["Chest only", "Kidneys, ureters, bladder", "Skull", "Ankle"], a: 1, why: "KUB stands for kidneys, ureters, and bladder." }
    ],
    "RDG 305": [
        { q: "The standard wrist PA projection is centred on the:", o: ["Radial styloid", "Mid-carpal region", "Ulnar styloid", "Base of 3rd metacarpal"], a: 1, why: "Centring on mid-carpal includes all carpal bones." },
        { q: "Which view is used to demonstrate the ankle mortise?", o: ["AP", "Lateral", "15° internal oblique", "Axial"], a: 2, why: "15° internal rotation shows the joint space clearly." },
        { q: "For a lateral lumbar spine, the patient is positioned:", o: ["Supine", "Lateral decubitus", "Standing or lateral recumbent", "Prone"], a: 2, why: "Standing/lateral recumbent best demonstrate disc spaces." },
        { q: "The AP foot projection is taken with the central ray angled:", o: ["0°", "15° cephalad", "15° caudad", "30° caudad"], a: 1, why: "15° cephalad opens the tarsometatarsal spaces." },
        { q: "A PA hand radiograph is performed with the hand:", o: ["Clenched", "Pronated flat on cassette", "Supinated", "In a fist"], a: 1, why: "Flat pronation keeps fingers parallel to the receptor." },
        { q: "The centring point for a lateral chest radiograph is:", o: ["Mid-sternum", "Mid-axillary line at T7", "Xiphisternum", "C7"], a: 1, why: "Mid-axillary at T7 includes both lungs." },
        { q: "Which immobilisation aid is used for a paediatric chest X-ray?", o: ["Sandbag", "Pigg-O-Stat", "Head clamp", "Compression band"], a: 1, why: "The Pigg-O-Stat holds infants upright and still." },
        { q: "For an AP mobile chest radiograph, the cassette is placed:", o: ["Behind the patient", "In front of the patient", "At the side", "Under the stretcher"], a: 0, why: "AP projection places the detector behind the patient." },
        {
            q: "In this PA hand projection, what is the correct central ray orientation?",
            o: ["Perpendicular to the cassette", "15° cephalad", "15° caudad", "45° medial"],
            a: 0,
            why: "The PA hand is taken with the CR perpendicular to the cassette, centred over the 3rd metacarpal head, to avoid foreshortening of the phalanges.",
            img: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280'%3E%3Crect width='400' height='280' fill='%23e5e7eb' rx='8'/%3E%3Ctext x='200' y='130' text-anchor='middle' font-family='Arial' font-size='18' fill='%234b5563'%3E%F0%9F%93%B7 X-Ray Image Placeholder%3C/text%3E%3Ctext x='200' y='160' text-anchor='middle' font-family='Arial' font-size='12' fill='%236b7280'%3EReplace img field in script.js with your URL%3C/text%3E%3C/svg%3E"
        }
    ],
    "RDG 401": [
        { q: "The standard contrast medium for a barium meal is:", o: ["Iodine solution", "Barium sulphate suspension", "Air", "Saline"], a: 1, why: "Barium sulphate is inert, insoluble, and coats mucosa." },
        { q: "Barium studies are contraindicated when:", o: ["The patient is fasting", "Bowel perforation is suspected", "The patient is over 50", "The patient has diabetes"], a: 1, why: "Barium leaking into peritoneum causes peritonitis." },
        { q: "In an IVU, contrast is administered:", o: ["Orally", "Rectally", "Intravenously", "Intramuscularly"], a: 2, why: "IVU requires intravenous contrast." },
        { q: "HSG primarily evaluates the:", o: ["Uterus and fallopian tubes", "Bladder", "Kidneys", "Liver"], a: 0, why: "HSG visualises the uterine cavity and tubal patency." },
        { q: "Which contrast agent is used when performing a barium enema?", o: ["Barium sulphate", "Gadolinium", "CO₂", "Normal saline"], a: 0, why: "Barium sulphate is used rectally for double-contrast studies." },
        { q: "Before IV contrast administration, a key check is:", o: ["Blood group", "Renal function and allergy history", "Visual acuity", "Hair colour"], a: 1, why: "Renal impairment and prior reactions increase risk." }
    ],
    "RDG 403": [
        { q: "Hounsfield units (HU) for water are:", o: ["-1000", "0", "+1000", "+3000"], a: 1, why: "Water is the reference point of the HU scale." },
        { q: "Quantum mottle on a CT image is most associated with:", o: ["Low mAs", "High kVp", "High mAs", "Short exposure time only"], a: 0, why: "Insufficient photons produce noisy images." },
        { q: "Which of these is a CT artifact from patient motion?", o: ["Streak artifact", "Motion blur", "Partial volume", "Ring artifact"], a: 1, why: "Movement blurs the reconstructed image." },
        { q: "Helical CT differs from conventional CT by:", o: ["Continuous table movement", "Slower acquisition", "No X-rays used", "Different contrast"], a: 0, why: "Helical CT scans continuously while the table moves." },
        { q: "The HU of dense cortical bone is approximately:", o: ["0", "+100", "+1000 or higher", "-1000"], a: 2, why: "Cortical bone measures around +1000 HU." }
    ],
    "RDG 405": [
        { q: "The piezoelectric effect in ultrasound refers to:", o: ["Conversion of electrical to mechanical energy", "Absorption of sound", "Reflection at boundaries", "Beam focusing"], a: 0, why: "Piezoelectric crystals convert electrical pulses to sound." },
        { q: "The Doppler effect in ultrasound measures:", o: ["Tissue density", "Frequency shift from moving reflectors", "Beam width", "Attenuation"], a: 1, why: "Blood flow causes a frequency shift." },
        { q: "Higher frequency transducers provide:", o: ["Better resolution but less penetration", "Better penetration but less resolution", "No change", "More heat"], a: 0, why: "Higher frequency = better detail, shallower depth." },
        { q: "A first-trimester obstetric scan typically uses a:", o: ["Linear probe", "Curvilinear or transvaginal probe", "Phased array", "Continuous wave probe"], a: 1, why: "Curvilinear/transvaginal provides optimal field of view." }
    ],
    "RDG 407": [
        { q: "The Larmor frequency depends on:", o: ["Patient weight", "Field strength and gyromagnetic ratio", "Coil type", "Room temperature"], a: 1, why: "Larmor frequency = γ × B0." },
        { q: "On a T1-weighted image, fat appears:", o: ["Dark", "Bright", "Grey", "Invisible"], a: 1, why: "Fat has a short T1 relaxation time." },
        { q: "On a T2-weighted image, fluid appears:", o: ["Dark", "Bright", "Grey", "Invisible"], a: 1, why: "Fluid has a long T2 relaxation time." },
        { q: "The main safety concern of the MRI scanner is:", o: ["Radiation dose", "Ferromagnetic projectiles and implants", "Noise only", "Heat only"], a: 1, why: "The strong magnetic field attracts ferromagnetic objects." },
        { q: "Gadolinium contrast is used in MRI to:", o: ["Shorten T1 relaxation", "Lengthen T2 relaxation", "Enhance X-ray contrast", "Reduce noise"], a: 0, why: "Gadolinium shortens T1 relaxation time." }
    ],
    "RDG 501": [
        { q: "Radiotherapy primarily kills tumour cells by:", o: ["Direct DNA damage and indirect free-radical damage", "Reducing blood flow", "Mechanical disruption", "Lowering temperature"], a: 0, why: "Ionizing radiation damages DNA directly and via free radicals." },
        { q: "The therapeutic ratio is the balance between:", o: ["Dose and cost", "Tumour control and normal tissue damage", "Beam energy and depth", "Time and distance"], a: 1, why: "Higher therapeutic ratio = better." },
        { q: "A common side effect of pelvic radiotherapy is:", o: ["Hair loss only", "Radiation cystitis or proctitis", "Blindness", "Hearing loss"], a: 1, why: "Pelvic irradiation can inflame bladder and rectum." }
    ],
    "RDG 505": [
        { q: "A radiograph shows poor contrast and high density. Most likely cause?", o: ["Under-exposure", "Over-exposure", "Excessive collimation", "Low kVp"], a: 1, why: "Over-exposure produces high density and reduces contrast." },
        { q: "Which artifact is caused by patient motion?", o: ["Grid cut-off", "Blur / unsharpness", "Backscatter fog", "Chemical fog"], a: 1, why: "Movement during exposure produces motion blur." },
        { q: "A Mach band is an example of:", o: ["Grid error", "Physiological/optical edge enhancement", "Processing fault", "Detector fault"], a: 1, why: "Mach bands are optical edge effects." },
        { q: "Grid cut-off is typically caused by:", o: ["Wrong SID or angulation", "Patient movement", "Film fog", "Low mAs"], a: 0, why: "Grids must be used within their focal range at the correct SID." },
        { q: "A repeat radiograph because of rotation is best prevented by:", o: ["Increasing kVp", "Checking patient positioning before exposure", "Using smaller film", "Reducing SID"], a: 1, why: "Pre-exposure positioning checks prevent rotational repeats." }
    ]
};

// ==========================================
// AUTH
// ==========================================
function toggleAuthMode(e) {
    if (e) e.preventDefault();
    authMode = authMode === 'login' ? 'signup' : 'login';
    const isSignup = authMode === 'signup';
    $('auth-subtitle').textContent = isSignup ? 'Create Your Student Account' : 'Student Portal Login';
    $('auth-university').classList.toggle('hidden-view', !isSignup);
    $('login-btn').textContent = isSignup ? 'Sign Up' : 'Login';
    $('auth-toggle-msg').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
    $('auth-toggle-btn').textContent = isSignup ? 'Login' : 'Sign Up';
}

function handleLogin() {
    const username = ($('auth-username').value || '').trim();
    const password = ($('auth-password').value || '').trim();
    const university = $('auth-university').value;
    if (!username) return alert('Please enter a username.');
    if (password.length < 4) return alert('Password must be at least 4 characters.');
    if (authMode === 'signup' && !university) return alert('Please select your university.');

    const key = 'radprep_user_' + username.toLowerCase();
    if (authMode === 'signup') {
        if (store.get(key)) return alert('That username is already taken.');
        store.set(key, { username, password, university });
    } else {
        const saved = store.get(key);
        if (saved && saved.password !== password) return alert('Incorrect password.');
    }
    const record = store.get(key) || { username, university: university || 'Other' };
    enterApp(record.username, record.university);
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = store.get('radprep_last_login', null);
    let streak = store.get('radprep_streak', 0);
    if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        streak = (lastLogin === yesterday.toDateString()) ? streak + 1 : 1;
        store.set('radprep_streak', streak);
        store.set('radprep_last_login', today);
    }
    return streak;
}

function enterApp(username, university) {
    currentUser = { username, university };
    store.set('radprep_session', currentUser);
    updateStreak();
    $('auth-container').classList.add('hidden-view');
    $('app-container').classList.remove('hidden-view');
    $('user-display-name').textContent = username;
    $('leaderboard-username-display').textContent = username;
    $('leaderboard-uni-display').textContent = 'University: ' + university;
    const savedAvatar = store.get('radprep_avatar_' + username.toLowerCase(), null);
    if (savedAvatar) $('user-avatar-preview').src = savedAvatar;
    renderCurriculum(activeLevel);
    renderFlashcard();
    renderNotesList();
    renderHistory();
    renderLibrary();
    renderScholarships();
    renderLeaderboard();
    renderReviewCount();
    updateHelperModeLabel();
    showSection('curriculum-section');
}

function handleLogout() {
    store.del('radprep_session');
    currentUser = null;
    $('app-container').classList.add('hidden-view');
    $('auth-container').classList.remove('hidden-view');
    $('auth-username').value = '';
    $('auth-password').value = '';
}

// ==========================================
// NAVIGATION
// ==========================================
const SECTION_TITLES = {
    'curriculum-section': 'Academic Curriculum',
    'course-detail-section': 'Course',
    'flashcards-section': 'Flashcards',
    'quiz-section': 'Question Bank',
    'review-section': 'Review Deck',
    'notes-section': 'Study Notes',
    'history-section': 'History of Radiography',
    'library-section': 'Reference Library',
    'scholarship-section': 'Scholarships & Grants',
    'helper-section': 'Study Helper',
    'leaderboard-section': 'Leaderboard'
};

function showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(s => {
        s.classList.remove('active-section');
        s.classList.add('hidden-section');
    });
    const target = $(sectionId);
    if (target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.target === sectionId);
    });
    $('section-title').textContent = SECTION_TITLES[sectionId] || 'RadPrep';
    $('sidebar').classList.remove('open');
    $('sidebar-overlay').classList.remove('active');
    if (sectionId === 'review-section') renderReviewSection();
}

function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    $('theme-btn').textContent = dark ? '☀️' : '🌙';
    store.set('radprep_dark', dark);
}

// ==========================================
// PROGRESS
// ==========================================
function saveProgress(code, score, total) {
    const progress = store.get('radprep_progress', {});
    if (!progress[code]) progress[code] = { attempts: 0, totalCorrect: 0, totalPossible: 0, best: 0, bestTotal: 0, lastDate: null };
    const p = progress[code];
    p.attempts++;
    p.totalCorrect += score;
    p.totalPossible += total;
    if (score > p.best || (score === p.best && total > p.bestTotal)) { p.best = score; p.bestTotal = total; }
    p.lastDate = new Date().toISOString();
    store.set('radprep_progress', progress);
}

function getCourseProgress(code) {
    const progress = store.get('radprep_progress', {});
    return progress[code] || null;
}

function getOverallStats() {
    const progress = store.get('radprep_progress', {});
    let quizzes = 0, correct = 0, possible = 0;
    Object.values(progress).forEach(p => { quizzes += p.attempts; correct += p.totalCorrect; possible += p.totalPossible; });
    return { quizzes, accuracy: possible > 0 ? Math.round((correct / possible) * 100) : 0, courses: Object.keys(progress).length };
}

function renderOverallStats() {
    const el = $('overall-stats');
    if (!el) return;
    const stats = getOverallStats();
    if (stats.quizzes === 0) { el.classList.add('hidden-view'); return; }
    el.classList.remove('hidden-view');
    el.innerHTML = `
        <span>📊 <strong>${stats.quizzes}</strong> quiz${stats.quizzes !== 1 ? 'zes' : ''} taken</span>
        <span>🎯 <strong>${stats.accuracy}%</strong> average accuracy</span>
        <span>📚 <strong>${stats.courses}</strong> course${stats.courses !== 1 ? 's' : ''} attempted</span>
    `;
}

// ==========================================
// REVIEW DECK
// ==========================================
function getReviewDeck() { return store.get('radprep_review', []); }

function addToReview(code, idx) {
    const deck = getReviewDeck();
    const exists = deck.some(item => item.code === code && item.idx === idx);
    if (!exists) {
        deck.push({ code, idx, addedAt: new Date().toISOString() });
        store.set('radprep_review', deck);
        renderReviewCount();
    }
}

function removeFromReview(code, idx) {
    const deck = getReviewDeck().filter(item => !(item.code === code && item.idx === idx));
    store.set('radprep_review', deck);
    renderReviewCount();
}

function clearReviewDeck() {
    if (!confirm('Clear all questions from your review deck?')) return;
    store.set('radprep_review', []);
    renderReviewCount();
    renderReviewSection();
}

function renderReviewCount() {
    const badge = $('review-count');
    if (!badge) return;
    const count = getReviewDeck().length;
    if (count > 0) { badge.textContent = count; badge.classList.remove('hidden-view'); }
    else badge.classList.add('hidden-view');
}

function renderReviewSection() {
    const deck = getReviewDeck();
    const summary = $('review-summary');
    const actions = $('review-actions');
    if (!summary || !actions) return;

    if (!deck.length) {
        summary.innerHTML = `
            <h3>🎉 Your review deck is empty!</h3>
            <p>Questions you answer wrong in any quiz will appear here automatically.</p>
        `;
        actions.innerHTML = '';
        return;
    }

    const grouped = {};
    deck.forEach(item => { grouped[item.code] = (grouped[item.code] || 0) + 1; });
    const breakdown = Object.entries(grouped)
        .map(([code, count]) => `<strong>${code}</strong>: ${count}`)
        .join(' · ');

    summary.innerHTML = `
        <h3>📚 ${deck.length} question${deck.length > 1 ? 's' : ''} to review</h3>
        <p>${breakdown}</p>
    `;

    actions.innerHTML = `
        <button class="purple-btn" onclick="startReviewQuiz()">🎯 Start Review Session (${deck.length})</button>
        <button class="grey-btn" onclick="clearReviewDeck()">🗑️ Clear All</button>
    `;
}

function startReviewQuiz() {
    const deck = getReviewDeck();
    if (!deck.length) { alert('Your review deck is empty!'); return; }
    const questions = [], sources = [];
    deck.forEach(item => {
        const bank = quizBank[item.code];
        if (bank && bank[item.idx]) {
            questions.push(bank[item.idx]);
            sources.push({ code: item.code, idx: item.idx });
        }
    });
    if (!questions.length) {
        alert('No valid questions found. Clearing...');
        clearReviewDeck();
        return;
    }
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
        [sources[i], sources[j]] = [sources[j], sources[i]];
    }
    quizState = {
        code: 'Review', questions, sources, index: 0, score: 0,
        answered: false, answers: [], isReview: true
    };
    showSection('quiz-section');
    $('quiz-setup').classList.add('hidden-view');
    $('quiz-results').classList.add('hidden-view');
    $('quiz-active').classList.remove('hidden-view');
    $('quiz-course-title').textContent = '🔁 Review Session';
    renderQuizQuestion();
}

// ==========================================
// CURRICULUM RENDER
// ==========================================
function renderCurriculum(level) {
    const container = $('course-grid');
    if (!container) return;
    activeLevel = level;
    const courses = curriculumData[level] || [];
    container.innerHTML = '';
    renderOverallStats();
    if (!courses.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">No courses for this level yet.</p>';
        return;
    }
    courses.forEach(course => {
        const hasQuiz = !!quizBank[course.code];
        const prog = getCourseProgress(course.code);
        let progressBadge = '';
        if (prog) {
            const pct = prog.bestTotal > 0 ? Math.round((prog.best / prog.bestTotal) * 100) : 0;
            progressBadge = `<div class="course-progress-badge">📊 Best: ${prog.best}/${prog.bestTotal} (${pct}%) · ${prog.attempts} attempt${prog.attempts > 1 ? 's' : ''}</div>`;
        }
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header">
                <span class="course-code">${course.code}</span>
                <span class="course-units">${course.units} Units</span>
            </div>
            <h4 class="course-title">${course.title}</h4>
            <p class="course-desc">${course.desc}</p>
            ${progressBadge}
            <div class="course-actions">
                <button class="primary-btn open-course-btn" data-code="${course.code}">View Course</button>
                ${hasQuiz ? `<button class="purple-btn" data-quiz="${course.code}">Take Quiz</button>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
    document.querySelectorAll('.open-course-btn').forEach(btn => btn.addEventListener('click', () => openCourseDetail(btn.dataset.code)));
    document.querySelectorAll('[data-quiz]').forEach(btn => btn.addEventListener('click', () => startQuiz(btn.dataset.quiz)));
}

function findCourse(code) {
    for (const level in curriculumData) {
        const found = curriculumData[level].find(c => c.code === code);
        if (found) return found;
    }
    return null;
}

function openCourseDetail(code) {
    const course = findCourse(code);
    if (!course) return;
    activeCourseCode = code;
    const hasQuiz = !!quizBank[code];
    const prog = getCourseProgress(code);
    let progressLine = '';
    if (prog) {
        const pct = prog.bestTotal > 0 ? Math.round((prog.best / prog.bestTotal) * 100) : 0;
        progressLine = `<p style="font-size:13px;color:#059669;font-weight:700;margin-top:10px;">📊 Best score: ${prog.best}/${prog.bestTotal} (${pct}%) across ${prog.attempts} attempt${prog.attempts > 1 ? 's' : ''}</p>`;
    }
    $('course-detail-content').innerHTML = `
        <div class="detail-hero">
            <span class="course-code">${course.code}</span>
            <h2>${course.title}</h2>
            <p>${course.desc}</p>
            <p style="font-size:13px;color:var(--text-dim);margin:0;"><strong>${course.units} Units</strong></p>
            ${progressLine}
        </div>
        <div class="detail-topics">
            <h3>What you'll learn</h3>
            <ul>${course.topics.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="detail-actions">
            ${hasQuiz ? `<button class="purple-btn" onclick="startQuiz('${course.code}')">📝 Take Quiz (${quizBank[code].length} questions)</button>` : '<button class="grey-btn" disabled>Quiz coming soon</button>'}
            <button class="primary-btn" onclick="showSection('notes-section')">📖 Study Notes</button>
        </div>
    `;
    showSection('course-detail-section');
    $('section-title').textContent = course.code + ' · ' + course.title;
}

// ==========================================
// FLASHCARDS
// ==========================================
const DEFAULT_CARDS = [
    { topic: 'Physics', q: 'What is the SI unit of absorbed radiation dose?', a: 'The Gray (Gy). 1 Gy = 1 J/kg of tissue.' },
    { topic: 'Physics', q: 'State the ALARA principle.', a: 'As Low As Reasonably Achievable — exposures kept to minimum practical level.' },
    { topic: 'Protection', q: 'Name three radiation protection principles.', a: 'Time, distance, and shielding.' },
    { topic: 'Physics', q: 'What does kVp control?', a: 'Beam quality (penetrability) — higher kVp = harder beam.' },
    { topic: 'Physics', q: 'What does mAs control?', a: 'Beam quantity — the number of photons; main driver of image density.' },
    { topic: 'Procedures', q: 'Contrast used for a barium meal?', a: 'Barium sulphate suspension — inert, insoluble, coats mucosa.' },
    { topic: 'Anatomy', q: 'Which vertebral level corresponds to the xiphoid process?', a: 'Approximately T9–T10.' },
    { topic: 'Ultrasound', q: 'What does Doppler ultrasound measure?', a: 'Frequency shift from moving reflectors — blood flow velocity.' },
    { topic: 'Physics', q: 'State the inverse square law.', a: 'Intensity is proportional to 1/d².' },
    { topic: 'Protection', q: 'What is the annual public dose limit?', a: '1 mSv/year (ICRP).' }
];

let flashcardDeck = [];
let flashcardIndex = 0;

function loadFlashcards() {
    flashcardDeck = store.get('radprep_cards', null) || DEFAULT_CARDS.slice();
    if (!store.get('radprep_cards')) store.set('radprep_cards', flashcardDeck);
}

function filteredDeck() {
    const filter = $('topic-filter').value;
    return filter === 'All' ? flashcardDeck : flashcardDeck.filter(c => c.topic === filter);
}

function renderFlashcard() {
    const deck = filteredDeck();
    const card = $('flashcard');
    card.classList.remove('is-flipped');
    if (!deck.length) {
        $('card-question').textContent = 'No cards in this topic yet.';
        $('card-answer').textContent = 'Add one below!';
        $('front-topic').textContent = 'Empty';
        $('card-counter').textContent = 'Card 0 of 0';
        $('progress-bar').style.width = '0%';
        return;
    }
    if (flashcardIndex >= deck.length) flashcardIndex = 0;
    if (flashcardIndex < 0) flashcardIndex = deck.length - 1;
    const current = deck[flashcardIndex];
    $('card-question').textContent = current.q;
    $('card-answer').textContent = current.a;
    $('front-topic').textContent = current.topic;
    $('card-counter').textContent = `Card ${flashcardIndex + 1} of ${deck.length}`;
    $('progress-bar').style.width = `${((flashcardIndex + 1) / deck.length) * 100}%`;
}

// ==========================================
// QUIZ
// ==========================================
let quizState = { code: '', questions: [], sources: null, index: 0, score: 0, answered: false, answers: [], isReview: false };

function startQuiz(code) {
    const questions = quizBank[code];
    if (!questions || !questions.length) { alert(`No questions available for ${code} yet.`); return; }
    quizState = { code, questions, sources: null, index: 0, score: 0, answered: false, answers: [], isReview: false };
    showSection('quiz-section');
    $('quiz-setup').classList.add('hidden-view');
    $('quiz-results').classList.add('hidden-view');
    $('quiz-active').classList.remove('hidden-view');
    $('quiz-course-title').textContent = `${code} Quiz`;
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const { questions, index } = quizState;
    const q = questions[index];
    quizState.answered = false;
    $('quiz-progress').textContent = `Q ${index + 1} / ${questions.length}`;
    $('quiz-question-text').textContent = q.q;
    $('quiz-explanation').classList.add('hidden-view');
    $('quiz-next-btn').classList.add('hidden-view');

    const imgContainer = $('quiz-image-container');
    if (q.img) {
        imgContainer.innerHTML = `<img src="${q.img}" alt="Question image" onerror="this.style.display='none'">`;
        imgContainer.classList.remove('hidden-view');
    } else {
        imgContainer.innerHTML = '';
        imgContainer.classList.add('hidden-view');
    }

    const box = $('quiz-options');
    box.innerHTML = '';
    q.o.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = `${String.fromCharCode(65 + i)}. ${option}`;
        btn.addEventListener('click', () => answerQuiz(i, btn));
        box.appendChild(btn);
    });
}

function answerQuiz(selected, btn) {
    if (quizState.answered) return;
    quizState.answered = true;
    const q = quizState.questions[quizState.index];
    const buttons = $('quiz-options').querySelectorAll('.quiz-option-btn');
    buttons.forEach(b => b.disabled = true);

    const correct = selected === q.a;
    if (correct) { btn.classList.add('correct'); quizState.score++; }
    else { btn.classList.add('wrong'); buttons[q.a].classList.add('correct'); }

    quizState.answers.push({ idx: quizState.index, correct });

    if (q.why) {
        const exp = $('quiz-explanation');
        exp.innerHTML = `<strong>Explanation:</strong> ${q.why}`;
        exp.classList.remove('hidden-view');
    }
    $('quiz-next-btn').classList.remove('hidden-view');
}

function advanceQuiz() {
    quizState.index++;
    if (quizState.index < quizState.questions.length) renderQuizQuestion();
    else finishQuiz();
}

function finishQuiz() {
    const { score, questions, answers, isReview } = quizState;
    $('quiz-active').classList.add('hidden-view');
    $('quiz-results').classList.remove('hidden-view');
    $('quiz-score-display').textContent = `You scored ${score} out of ${questions.length} on ${isReview ? 'Review' : quizState.code}.`;

    // Update review deck
    answers.forEach(ans => {
        const src = isReview ? quizState.sources[ans.idx] : { code: quizState.code, idx: ans.idx };
        if (ans.correct) removeFromReview(src.code, src.idx);
        else addToReview(src.code, src.idx);
    });

    // Leaderboard + progress only for non-review quizzes
    if (currentUser && !isReview) {
        const total = store.get('radprep_score', 0) + (score * 10);
        store.set('radprep_score', total);
        const streak = store.get('radprep_streak', 1);
        saveProgress(quizState.code, score, questions.length);
        submitScoreToSupabase(currentUser.username, currentUser.university, total, streak);
        renderLeaderboard();
    }
}

// ==========================================
// SUPABASE
// ==========================================
async function submitScoreToSupabase(username, university, score, streak) {
    if (!supabaseClient) return false;
    try {
        const { error } = await supabaseClient.from('leaderboard').upsert(
            { username, university, score, streak, updated_at: new Date().toISOString() },
            { onConflict: 'username' }
        );
        if (error) throw error;
        console.log('✅ Score synced to Supabase');
        return true;
    } catch (err) { console.warn('⚠️ Supabase submit failed:', err); return false; }
}

async function fetchLeaderboardFromSupabase(limit = 20) {
    if (!supabaseClient) return null;
    try {
        const { data, error } = await supabaseClient.from('leaderboard').select('username, university, score, streak').order('score', { ascending: false }).limit(limit);
        if (error) throw error;
        return data;
    } catch (err) { console.warn('⚠️ Supabase fetch failed:', err); return null; }
}

async function renderLeaderboard() {
    const tbody = $('leaderboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:24px;">Loading…</td></tr>';
    let rows = await fetchLeaderboardFromSupabase(20);
    if (!rows) {
        rows = [];
        if (currentUser) rows.push({ username: currentUser.username, university: currentUser.university, streak: store.get('radprep_streak', 0), score: store.get('radprep_score', 0) });
    }
    tbody.innerHTML = '';
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:24px;">No scores yet — take a quiz!</td></tr>';
        $('user-streak-count').textContent = '0';
        return;
    }
    rows.sort((a, b) => b.score - a.score);
    rows.forEach((row, i) => {
        const isMe = currentUser && row.username === currentUser.username;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="rank-cell">${i + 1}</td>
            <td>${row.username}${isMe ? ' <em>(you)</em>' : ''}</td>
            <td>${row.university || '—'}</td>
            <td>🔥 ${row.streak || 0}</td>
            <td>${row.score || 0}</td>
        `;
        if (isMe) tr.style.background = 'rgba(37, 99, 235, 0.08)';
        tbody.appendChild(tr);
    });
    $('user-streak-count').textContent = store.get('radprep_streak', 0);
}

// ==========================================
// NOTES
// ==========================================
const notesData = [
    { title: 'Radiation Protection & ALARA', html: `<h3>Core Principles</h3><p>Justification, optimisation, and dose limitation.</p><h3>Time, Distance, Shielding</h3><p>Minimise exposure time, maximise distance (inverse square law), and use appropriate shielding.</p><div class="note-callout">💡 Doubling your distance reduces dose to a quarter.</div><h3>ICRP Dose Limits</h3><p>Occupational: 20 mSv/year averaged over 5 years. Public: 1 mSv/year.</p>` },
    { title: 'X-Ray Production', html: `<h3>Bremsstrahlung</h3><p>Electrons decelerating in the nuclear field produce a continuous spectrum.</p><h3>Characteristic Radiation</h3><p>Shell transitions emit photons of fixed energy.</p><div class="note-callout">💡 mA controls quantity; kVp controls quality; filtration hardens the beam.</div>` },
    { title: 'Image Quality Metrics', html: `<h3>Four Pillars</h3><p>Density, contrast, sharpness, and distortion.</p><h3>Unsharpness</h3><p>Increases with larger focal spot, larger object–detector distance, or shorter SID.</p><div class="note-callout">💡 Use the small focal spot whenever exposure time allows.</div>` },
    { title: 'Contrast Media', html: `<h3>Positive vs Negative</h3><p><strong>Positive</strong> (barium, iodine) attenuate more than tissue. <strong>Negative</strong> (air, CO₂) attenuate less.</p><h3>Barium Sulphate</h3><p>Inert and insoluble. Contraindicated in suspected perforation.</p><h3>Iodinated Contrast</h3><p>Used for IVU, CT, and angiography. Risks: anaphylactoid reaction, contrast-induced nephropathy.</p>` },
    { title: 'CT Physics Essentials', html: `<h3>Hounsfield Scale</h3><p>Water = 0 HU, air = −1000 HU, dense bone ≈ +1000 HU.</p><h3>Acquisition</h3><p>Helical CT uses continuous table motion for fast volumetric acquisition.</p><div class="note-callout">💡 Low mAs → quantum mottle. High mAs → smoother image but higher dose.</div>` },
    { title: 'MRI Fundamentals', html: `<h3>Larmor Frequency</h3><p>ω = γ·B₀.</p><h3>T1 vs T2</h3><p>On T1, fat is bright. On T2, fluid is bright.</p><h3>Safety</h3><p>Ferromagnetic objects and implants are absolute hazards.</p>` },
    { title: 'Ultrasound Basics', html: `<h3>Piezoelectric Effect</h3><p>Crystals convert electrical pulses to sound and back.</p><h3>Frequency Trade-off</h3><p>Higher frequency → better resolution, less penetration. Lower frequency → deeper penetration, less detail.</p><div class="note-callout">💡 Doppler measures frequency shift from moving blood.</div>` }
];

function renderNotesList() {
    const list = $('notes-list');
    if (!list) return;
    list.innerHTML = '';
    notesData.forEach((note, i) => {
        const btn = document.createElement('button');
        btn.className = 'note-item-btn';
        btn.textContent = note.title;
        btn.addEventListener('click', () => openNote(i, btn));
        list.appendChild(btn);
    });
}

function openNote(i, btn) {
    document.querySelectorAll('.note-item-btn').forEach(b => b.classList.remove('active-note'));
    if (btn) btn.classList.add('active-note');
    $('note-title').textContent = notesData[i].title;
    $('note-content').innerHTML = notesData[i].html;
}

// ==========================================
// HISTORY
// ==========================================
const historyData = [
    { date: 'Nov 8, 1895', title: 'Discovery of X-Rays (Global)', body: 'Wilhelm Conrad Röntgen discovers X-rays at Würzburg University.' },
    { date: '1896', title: 'First Clinical X-Ray in Nigeria', body: 'Early diagnostic X-ray work begins after Röntgen\'s discovery.' },
    { date: '1913', title: 'First X-Ray Unit in Nigeria', body: 'A permanent X-ray machine is installed at Massey Street Hospital, Lagos.' },
    { date: '1920s', title: 'Formal Radiography Training Begins', body: 'Structured training pathways emerge in West Africa.' },
    { date: '1950s', title: 'School of Radiography Established', body: 'Organised radiography education takes root in Nigeria.' },
    { date: '1987', title: 'RRBN Established', body: 'The Radiographers Registration Board of Nigeria is created under Decree No. 42 of 1987.' },
    { date: '2000s', title: 'Digital Radiography Adoption', body: 'Nigerian hospitals transition from film to digital radiography.' },
    { date: '2010s+', title: 'Advanced Modalities', body: 'CT, MRI, and ultrasound services expand across teaching hospitals.' }
];

function renderHistory() {
    const c = $('history-timeline');
    if (!c) return;
    c.innerHTML = '';
    historyData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `<div class="timeline-date">${item.date}</div><h4>${item.title}</h4><p>${item.body}</p>`;
        c.appendChild(div);
    });
}

// ==========================================
// LIBRARY
// ==========================================
const libraryData = [
    { title: "Radiopaedia", desc: "Free radiology reference — cases, articles, and anatomy.", url: "https://radiopaedia.org/" },
    { title: "IAEA Human Health Publications", desc: "Free IAEA publications on diagnostic imaging and safety.", url: "https://www.iaea.org/publications" },
    { title: "WHO Radiation Safety", desc: "WHO resources on radiation and health.", url: "https://www.who.int/health-topics/radiation" },
    { title: "ICRP Publications", desc: "International Commission on Radiological Protection.", url: "https://www.icrp.org/" },
    { title: "MIT OpenCourseWare — Medical Imaging", desc: "Free lectures on medical imaging physics.", url: "https://ocw.mit.edu/search/?q=medical+imaging" },
    { title: "OpenStax Anatomy & Physiology", desc: "Free, peer-reviewed human anatomy textbook.", url: "https://openstax.org/details/books/anatomy-and-physiology-2e" }
];

function renderLibrary() {
    const c = $('library-grid');
    if (!c) return;
    c.innerHTML = '';
    libraryData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'library-card';
        card.innerHTML = `<h4>${item.title}</h4><p>${item.desc}</p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Open Resource ↗</a>`;
        c.appendChild(card);
    });
}

// ==========================================
// SCHOLARSHIPS
// ==========================================
const scholarshipData = [
    { title: "NNPC / Chevron JV National Undergraduate Scholarship", status: "Open", eligibility: "200L students in Nigerian federal/state universities, incl. Radiography.", value: "₦150,000 / year", url: "https://www.chevron.com/worldwide/nigeria", note: "Verify dates on the official portal." },
    { title: "Federal Government Scholarship (BEA)", status: "Pending", eligibility: "Undergraduate students in Nigerian tertiary institutions.", value: "Varies", url: "https://education.gov.ng/", note: "Applications typically open annually." }
];

function renderScholarships() {
    const c = $('scholarship-list');
    if (!c) return;
    $('scholarship-checked').textContent = new Date().toLocaleDateString();
    c.innerHTML = '';
    scholarshipData.forEach(item => {
        const badgeClass = item.status === 'Open' ? 'active-badge' : 'pending-badge';
        const card = document.createElement('div');
        card.className = 'scholarship-card';
        card.innerHTML = `
            <div class="scholarship-header"><h4>${item.title}</h4><span class="status-badge ${badgeClass}">${item.status}</span></div>
            <p><strong>Eligibility:</strong> ${item.eligibility}</p>
            <p><strong>Value:</strong> ${item.value}</p>
            <p style="font-size:12px;color:var(--text-dim);">${item.note}</p>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer">Visit Official Portal ↗</a>
        `;
        c.appendChild(card);
    });
}

// ==========================================
// STUDY HELPER (Gemini or local)
// ==========================================
function updateHelperModeLabel() {
    const el = $('helper-mode');
    if (!el) return;
    el.innerHTML = GEMINI_API_KEY
        ? 'Mode: <strong>Gemini AI</strong> — real AI responses enabled.'
        : 'Mode: <strong>Local keyword matcher</strong> — configure Gemini in script.js for real AI.';
}

async function askGemini(text) {
    if (!GEMINI_API_KEY) return null;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a concise radiography tutor for Nigerian university students. Answer in 2-4 sentences, plain language, no markdown. If asked about something outside radiography, politely decline. Question: ${text}`
                    }]
                }]
            })
        });
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (err) {
        console.warn('Gemini call failed:', err);
        return null;
    }
}

function localHelperReply(text) {
    const t = text.toLowerCase();
    if (t.includes('alara')) return 'ALARA = As Low As Reasonably Achievable. Apply time, distance, and shielding to keep dose minimal.';
    if (t.includes('kvp') || t.includes('kilovolt')) return 'kVp controls beam quality (penetrability). Higher kVp = harder beam = more penetrating photons.';
    if (t.includes('mas') || t.includes('milliamp')) return 'mAs controls beam quantity — the number of photons produced. Main driver of image density.';
    if (t.includes('hounsfield') || t.includes('hu')) return 'Hounsfield scale: water = 0, air = −1000, dense bone ≈ +1000.';
    if (t.includes('mri')) return 'MRI uses strong magnetic fields. T1: fat bright. T2: fluid bright. Safety = no ferromagnetic objects or implants.';
    if (t.includes('ultrasound') || t.includes('doppler')) return 'Doppler measures frequency shift from moving blood. Higher frequency = better resolution, less penetration.';
    if (t.includes('inverse')) return 'Inverse square law: Intensity ∝ 1/d². Double distance → quarter dose.';
    if (t.includes('photoelectric')) return 'Photoelectric effect dominates in bone (high Z, low kVp). Compton dominates in soft tissue at diagnostic energies.';
    if (t.includes('compton')) return 'Compton scattering dominates in soft tissue between 30–150 keV, causing scatter and reduced contrast.';
    if (t.includes('tungsten')) return 'Tungsten is the standard anode material — high atomic number (74) and high melting point (3422°C).';
    return 'Local mode can answer: ALARA, kVp, mAs, Hounsfield, MRI, ultrasound, Doppler, inverse square, photoelectric, Compton, tungsten. For anything else, configure Gemini in script.js.';
}

async function helperReply(text) {
    const geminiAnswer = await askGemini(text);
    if (geminiAnswer) return geminiAnswer;
    return localHelperReply(text);
}

function pushChat(text, isUser) {
    const box = $('ai-chat-history');
    const div = document.createElement('div');
    div.className = 'chat-message ' + (isUser ? 'user-msg' : 'ai-msg');
    div.innerHTML = `<strong>${isUser ? 'You' : 'Helper'}:</strong> ${text}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadFlashcards();
    applyTheme(store.get('radprep_dark', false));

    if (!store.get('radprep_disclaimer_seen', false)) $('disclaimer-modal').classList.remove('hidden-view');
    $('disclaimer-accept').addEventListener('click', () => {
        store.set('radprep_disclaimer_seen', true);
        $('disclaimer-modal').classList.add('hidden-view');
    });

    $('login-btn').addEventListener('click', handleLogin);
    $('auth-toggle-btn').addEventListener('click', toggleAuthMode);
    $('auth-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    $('logout-btn').addEventListener('click', handleLogout);

    $('menu-toggle').addEventListener('click', () => {
        $('sidebar').classList.toggle('open');
        $('sidebar-overlay').classList.toggle('active');
    });
    $('sidebar-overlay').addEventListener('click', () => {
        $('sidebar').classList.remove('open');
        $('sidebar-overlay').classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.target)));
    document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.back)));
    $('theme-btn').addEventListener('click', () => applyTheme(!document.body.classList.contains('dark-mode')));

    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active-level'));
            btn.classList.add('active-level');
            renderCurriculum(btn.dataset.level);
        });
    });

    $('flashcard').addEventListener('click', () => $('flashcard').classList.toggle('is-flipped'));
    $('flip-btn').addEventListener('click', () => $('flashcard').classList.toggle('is-flipped'));
    $('prev-btn').addEventListener('click', () => { flashcardIndex--; renderFlashcard(); });
    $('next-btn').addEventListener('click', () => { flashcardIndex++; renderFlashcard(); });
    $('shuffle-btn').addEventListener('click', () => {
        flashcardDeck.sort(() => Math.random() - 0.5);
        store.set('radprep_cards', flashcardDeck);
        flashcardIndex = 0;
        renderFlashcard();
    });
    $('topic-filter').addEventListener('change', () => { flashcardIndex = 0; renderFlashcard(); });
    $('add-btn').addEventListener('click', () => {
        const q = $('new-question').value.trim();
        const a = $('new-answer').value.trim();
        const topic = $('new-topic').value;
        if (!q || !a) return alert('Please fill in both question and answer.');
        flashcardDeck.push({ topic, q, a });
        store.set('radprep_cards', flashcardDeck);
        $('new-question').value = '';
        $('new-answer').value = '';
        flashcardIndex = flashcardDeck.length - 1;
        renderFlashcard();
    });

    $('exit-quiz-btn').addEventListener('click', () => {
        $('quiz-active').classList.add('hidden-view');
        $('quiz-setup').classList.remove('hidden-view');
        showSection('curriculum-section');
    });
    $('quiz-next-btn').addEventListener('click', advanceQuiz);
    $('retry-quiz-btn').addEventListener('click', () => {
        if (quizState.isReview) startReviewQuiz();
        else startQuiz(quizState.code);
    });
    $('return-curriculum-btn').addEventListener('click', () => {
        $('quiz-results').classList.add('hidden-view');
        $('quiz-setup').classList.remove('hidden-view');
        if (quizState.isReview) showSection('review-section');
        else if (activeCourseCode) openCourseDetail(activeCourseCode);
        else showSection('curriculum-section');
    });

    $('avatar-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            $('user-avatar-preview').src = ev.target.result;
            store.set('radprep_avatar_' + currentUser.username.toLowerCase(), ev.target.result);
        };
        reader.readAsDataURL(file);
    });

    async function sendHelper() {
        const input = $('ai-chat-input');
        const text = input.value.trim();
        if (!text) return;
        pushChat(text, true);
        input.value = '';

        const thinking = document.createElement('div');
        thinking.className = 'chat-message ai-msg';
        thinking.id = 'helper-thinking';
        thinking.innerHTML = '<strong>Helper:</strong> <em>Thinking…</em>';
        $('ai-chat-history').appendChild(thinking);
        $('ai-chat-history').scrollTop = $('ai-chat-history').scrollHeight;

        const reply = await helperReply(text);
        document.getElementById('helper-thinking')?.remove();
        pushChat(reply, false);
    }
    $('ai-send-btn').addEventListener('click', sendHelper);
    $('ai-chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendHelper(); });

    renderReviewCount();
    updateHelperModeLabel();

    const session = store.get('radprep_session', null);
    if (session) enterApp(session.username, session.university);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => console.log('✅ SW registered')).catch(err => console.warn('SW failed:', err));
    }
});