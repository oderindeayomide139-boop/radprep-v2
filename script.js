// ==========================================
// RadPrep v4 — Supabase Auth + persistent data
// ==========================================
console.log("🔥 RadPrep v4 loaded");

const SUPABASE_URL = 'https://puqxlbtdkajzlxgbtsnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wibge1aU64UKmHdchdkywA_jmZ2SNMp';

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
let progressCache = {};
let reviewCache = [];

// ==========================================
// CURRICULUM
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
        { q: "For an AP mobile chest radiograph, the cassette is placed:", o: ["Behind the patient", "In front of the patient", "At the side", "Under the stretcher"], a: 0, why: "AP projection places the detector behind the patient." }
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
};// ==========================================
// AUTH
// ==========================================
function showAuthError(msg) {
    const el = $('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden-view');
}

function clearAuthError() {
    $('auth-error').classList.add('hidden-view');
}

function setAuthButtonLoading(loading) {
    const btn = $('login-btn');
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…' : (authMode === 'signup' ? 'Create Account' : 'Sign In');
}

function toggleAuthMode(e) {
    if (e) e.preventDefault();
    authMode = authMode === 'login' ? 'signup' : 'login';
    const isSignup = authMode === 'signup';
    clearAuthError();
    $('auth-subtitle').textContent = isSignup ? 'Create your student account' : 'Sign in to your account';
    $('auth-username').classList.toggle('hidden-view', !isSignup);
    $('auth-university').classList.toggle('hidden-view', !isSignup);
    $('login-btn').textContent = isSignup ? 'Create Account' : 'Sign In';
    $('auth-toggle-msg').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
    $('auth-toggle-btn').textContent = isSignup ? 'Sign In' : 'Sign Up';
}

async function handleAuthSubmit() {
    if (!supabaseClient) return showAuthError('Server not reachable. Please check your internet connection and refresh.');
    clearAuthError();
    const email = ($('auth-email').value || '').trim();
    const password = ($('auth-password').value || '').trim();

    if (!email || !email.includes('@')) return showAuthError('Please enter a valid email address.');
    if (password.length < 6) return showAuthError('Password must be at least 6 characters.');

    if (authMode === 'signup') {
        const username = ($('auth-username').value || '').trim();
        const university = $('auth-university').value;
        if (!username) return showAuthError('Please enter a username.');
        if (username.length < 3) return showAuthError('Username must be at least 3 characters.');
        if (!university) return showAuthError('Please select your university.');

        setAuthButtonLoading(true);
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { username, university } }
            });
            if (error) throw error;
            if (!data.session) {
                // Email confirmation is ON — show message
                $('auth-form').innerHTML = `<p class="auth-success">✅ Account created!<br><br>Check your email (<strong>${email}</strong>) and click the confirmation link, then come back and sign in.</p>`;
                return;
            }
            // Email confirmation is OFF — user is already signed in
            // onAuthStateChange will fire and handle the rest
        } catch (err) {
            setAuthButtonLoading(false);
            if (err.message.includes('already registered')) showAuthError('This email is already registered. Try signing in instead.');
            else showAuthError(err.message || 'Signup failed. Please try again.');
        }
    } else {
        setAuthButtonLoading(true);
        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // onAuthStateChange will fire and handle the rest
        } catch (err) {
            setAuthButtonLoading(false);
            if (err.message.includes('Invalid login')) showAuthError('Invalid email or password. Please try again.');
            else if (err.message.includes('Email not confirmed')) showAuthError('Please confirm your email first — check your inbox for the link.');
            else showAuthError(err.message || 'Login failed. Please try again.');
        }
    }
}

async function ensureProfile(user) {
    try {
        const { data } = await supabaseClient.from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!data) {
            await supabaseClient.from('profiles').insert({
                id: user.id,
                username: user.user_metadata?.username || user.email.split('@')[0],
                university: user.user_metadata?.university || 'Other'
            });
        }
    } catch (err) { console.warn('Profile ensure failed:', err); }
}

async function loadUserData(user) {
    // Progress
    try {
        const { data, error } = await supabaseClient.from('user_progress').select('*').eq('user_id', user.id);
        if (error) throw error;
        progressCache = {};
        (data || []).forEach(row => {
            progressCache[row.course_code] = {
                attempts: row.attempts,
                totalCorrect: row.total_correct,
                totalPossible: row.total_possible,
                best: row.best_score,
                bestTotal: row.best_total,
                lastDate: row.last_date
            };
        });
    } catch (err) { console.warn('Progress load failed:', err); progressCache = {}; }

    // Review deck
    try {
        const { data, error } = await supabaseClient.from('review_deck').select('*').eq('user_id', user.id);
        if (error) throw error;
        reviewCache = (data || []).map(row => ({ code: row.course_code, idx: row.question_index }));
    } catch (err) { console.warn('Deck load failed:', err); reviewCache = []; }
}

async function handleSignedIn(user) {
    const username = user.user_metadata?.username || user.email.split('@')[0];
    const university = user.user_metadata?.university || 'Other';
    currentUser = { id: user.id, username, university, email: user.email };

    await ensureProfile(user);
    await loadUserData(user);
    enterApp();
}

function enterApp() {
    $('auth-container').classList.add('hidden-view');
    $('app-container').classList.remove('hidden-view');
    $('user-display-name').textContent = currentUser.username;
    $('leaderboard-username-display').textContent = currentUser.username;
    $('leaderboard-uni-display').textContent = 'University: ' + currentUser.university;
    setAuthButtonLoading(false);

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

async function handleLogout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    currentUser = null;
    progressCache = {};
    reviewCache = [];
    $('app-container').classList.add('hidden-view');
    $('auth-container').classList.remove('hidden-view');
    $('auth-password').value = '';
    $('auth-error').classList.add('hidden-view');
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
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.target === sectionId));
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
function getCourseProgress(code) { return progressCache[code] || null; }

function getOverallStats() {
    let quizzes = 0, correct = 0, possible = 0;
    Object.values(progressCache).forEach(p => { quizzes += p.attempts; correct += p.totalCorrect; possible += p.totalPossible; });
    return { quizzes, accuracy: possible > 0 ? Math.round((correct / possible) * 100) : 0, courses: Object.keys(progressCache).length };
}

async function saveProgress(code, score, total) {
    if (!currentUser || !supabaseClient) return;
    const existing = progressCache[code] || { attempts: 0, totalCorrect: 0, totalPossible: 0, best: 0, bestTotal: 0 };
    existing.attempts++;
    existing.totalCorrect += score;
    existing.totalPossible += total;
    if (score > existing.best || (score === existing.best && total > existing.bestTotal)) {
        existing.best = score;
        existing.bestTotal = total;
    }
    existing.lastDate = new Date().toISOString();
    progressCache[code] = existing;

    try {
        await supabaseClient.from('user_progress').upsert({
            user_id: currentUser.id,
            course_code: code,
            attempts: existing.attempts,
            total_correct: existing.totalCorrect,
            total_possible: existing.totalPossible,
            best_score: existing.best,
            best_total: existing.bestTotal,
            last_date: existing.lastDate
        }, { onConflict: 'user_id,course_code' });
    } catch (err) { console.warn('Progress save failed:', err); }
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
async function addToReview(code, idx) {
    if (!currentUser || !supabaseClient) return;
    const exists = reviewCache.some(item => item.code === code && item.idx === idx);
    if (exists) return;
    reviewCache.push({ code, idx });
    renderReviewCount();
    try {
        await supabaseClient.from('review_deck').insert({ user_id: currentUser.id, course_code: code, question_index: idx });
    } catch (err) { console.warn('Deck add failed:', err); }
}

async function removeFromReview(code, idx) {
    if (!currentUser || !supabaseClient) return;
    reviewCache = reviewCache.filter(item => !(item.code === code && item.idx === idx));
    renderReviewCount();
    try {
        await supabaseClient.from('review_deck').delete().eq('user_id', currentUser.id).eq('course_code', code).eq('question_index', idx);
    } catch (err) { console.warn('Deck remove failed:', err); }
}

async function clearReviewDeck() {
    if (!confirm('Clear all questions from your review deck?')) return;
    reviewCache = [];
    renderReviewCount();
    renderReviewSection();
    try {
        await supabaseClient.from('review_deck').delete().eq('user_id', currentUser.id);
    } catch (err) { console.warn('Deck clear failed:', err); }
}

function renderReviewCount() {
    const badge = $('review-count');
    if (!badge) return;
    const count = reviewCache.length;
    if (count > 0) { badge.textContent = count; badge.classList.remove('hidden-view'); }
    else badge.classList.add('hidden-view');
}

function renderReviewSection() {
    const summary = $('review-summary');
    const actions = $('review-actions');
    if (!summary || !actions) return;

    if (!reviewCache.length) {
        summary.innerHTML = `<h3>🎉 Your review deck is empty!</h3><p>Questions you answer wrong in any quiz will appear here automatically.</p>`;
        actions.innerHTML = '';
        return;
    }
    const grouped = {};
    reviewCache.forEach(item => { grouped[item.code] = (grouped[item.code] || 0) + 1; });
    const breakdown = Object.entries(grouped).map(([code, count]) => `<strong>${code}</strong>: ${count}`).join(' · ');
    summary.innerHTML = `<h3>📚 ${reviewCache.length} question${reviewCache.length > 1 ? 's' : ''} to review</h3><p>${breakdown}</p>`;
    actions.innerHTML = `
        <button class="purple-btn" onclick="startReviewQuiz()">🎯 Start Review Session (${reviewCache.length})</button>
        <button class="grey-btn" onclick="clearReviewDeck()">🗑️ Clear All</button>
    `;
}

function startReviewQuiz() {
    if (!reviewCache.length) { alert('Your review deck is empty!'); return; }
    const questions = [], sources = [];
    reviewCache.forEach(item => {
        const bank = quizBank[item.code];
        if (bank && bank[item.idx]) {
            questions.push(bank[item.idx]);
            sources.push({ code: item.code, idx: item.idx });
        }
    });
    if (!questions.length) { alert('No valid questions found.'); return; }
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
        [sources[i], sources[j]] = [sources[j], sources[i]];
    }
    quizState = { code: 'Review', questions, sources, index: 0, score: 0, answered: false, answers: [], isReview: true };
    showSection('quiz-section');
    $('quiz-setup').classList.add('hidden-view');
    $('quiz-results').classList.add('hidden-view');
    $('quiz-active').classList.remove('hidden-view');
    $('quiz-course-title').textContent = '🔁 Review Session';
    renderQuizQuestion();
}

// ==========================================
// CURRICULUM
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
        let badge = '';
        if (prog) {
            const pct = prog.bestTotal > 0 ? Math.round((prog.best / prog.bestTotal) * 100) : 0;
            badge = `<div class="course-progress-badge">📊 Best: ${prog.best}/${prog.bestTotal} (${pct}%) · ${prog.attempts} attempt${prog.attempts > 1 ? 's' : ''}</div>`;
        }
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header"><span class="course-code">${course.code}</span><span class="course-units">${course.units} Units</span></div>
            <h4 class="course-title">${course.title}</h4>
            <p class="course-desc">${course.desc}</p>
            ${badge}
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
    let progLine = '';
    if (prog) {
        const pct = prog.bestTotal > 0 ? Math.round((prog.best / prog.bestTotal) * 100) : 0;
        progLine = `<p style="font-size:13px;color:#059669;font-weight:700;margin-top:10px;">📊 Best: ${prog.best}/${prog.bestTotal} (${pct}%) across ${prog.attempts} attempt${prog.attempts > 1 ? 's' : ''}</p>`;
    }
    $('course-detail-content').innerHTML = `
        <div class="detail-hero">
            <span class="course-code">${course.code}</span>
            <h2>${course.title}</h2>
            <p>${course.desc}</p>
            <p style="font-size:13px;color:var(--text-dim);margin:0;"><strong>${course.units} Units</strong></p>
            ${progLine}
        </div>
        <div class="detail-topics"><h3>What you'll learn</h3><ul>${course.topics.map(t => `<li>${t}</li>`).join('')}</ul></div>
        <div class="detail-actions">
            ${hasQuiz ? `<button class="purple-btn" onclick="startQuiz('${course.code}')">📝 Take Quiz (${quizBank[code].length} questions)</button>` : '<button class="grey-btn" disabled>Quiz coming soon</button>'}
            <button class="primary-btn" onclick="showSection('notes-section')">📖 Study Notes</button>
        </div>
    `;
    showSection('course-detail-section');
    $('section-title').textContent = course.code + ' · ' + course.title;
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

async function finishQuiz() {
    const { score, questions, answers, isReview } = quizState;
    $('quiz-active').classList.add('hidden-view');
    $('quiz-results').classList.remove('hidden-view');
    $('quiz-score-display').textContent = `You scored ${score} out of ${questions.length} on ${isReview ? 'Review' : quizState.code}.`;

    for (const ans of answers) {
        const src = isReview ? quizState.sources[ans.idx] : { code: quizState.code, idx: ans.idx };
        if (ans.correct) await removeFromReview(src.code, src.idx);
        else await addToReview(src.code, src.idx);
    }

    if (currentUser && !isReview) {
        await saveProgress(quizState.code, score, questions.length);
        const total = store.get('radprep_score', 0) + (score * 10);
        store.set('radprep_score', total);
        await submitScoreToSupabase(currentUser.username, currentUser.university, total, store.get('radprep_streak', 1));
        renderLeaderboard();
    }
}

// ==========================================
// LEADERBOARD
// ==========================================
async function submitScoreToSupabase(username, university, score, streak) {
    if (!supabaseClient) return false;
    try {
        const { error } = await supabaseClient.from('leaderboard').upsert(
            { username, university, score, streak, updated_at: new Date().toISOString() },
            { onConflict: 'username' }
        );
        if (error) throw error;
        return true;
    } catch (err) { console.warn('Leaderboard submit failed:', err); return false; }
}

async function fetchLeaderboardFromSupabase(limit = 20) {
    if (!supabaseClient) return null;
    try {
        const { data, error } = await supabaseClient.from('leaderboard').select('username, university, score, streak').order('score', { ascending: false }).limit(limit);
        if (error) throw error;
        return data;
    } catch (err) { console.warn('Leaderboard fetch failed:', err); return null; }
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
// FLASHCARDS, NOTES, HISTORY, LIBRARY, SCHOLARSHIPS, HELPER
// (unchanged from v3 — kept local-storage only)
// ==========================================
const DEFAULT_CARDS = [
    { topic: 'Physics', q: 'What is the SI unit of absorbed radiation dose?', a: 'The Gray (Gy). 1 Gy = 1 J/kg of tissue.' },
    { topic: 'Physics', q: 'State the ALARA principle.', a: 'As Low As Reasonably Achievable — exposures kept to minimum practical level.' },
    { topic: 'Protection', q: 'Name three radiation protection principles.', a: 'Time, distance, and shielding.' },
    { topic: 'Physics', q: 'What does kVp control?', a: 'Beam quality (penetrability).' },
    { topic: 'Physics', q: 'What does mAs control?', a: 'Beam quantity — the number of photons produced.' },
    { topic: 'Procedures', q: 'Contrast used for a barium meal?', a: 'Barium sulphate suspension — inert, insoluble, coats mucosa.' },
    { topic: 'Anatomy', q: 'Which vertebral level corresponds to the xiphoid process?', a: 'Approximately T9–T10.' },
    { topic: 'Ultrasound', q: 'What does Doppler ultrasound measure?', a: 'Frequency shift from moving reflectors.' },
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
    const cur = deck[flashcardIndex];
    $('card-question').textContent = cur.q;
    $('card-answer').textContent = cur.a;
    $('front-topic').textContent = cur.topic;
    $('card-counter').textContent = `Card ${flashcardIndex + 1} of ${deck.length}`;
    $('progress-bar').style.width = `${((flashcardIndex + 1) / deck.length) * 100}%`;
}

const notesData = [
    { title: 'Radiation Protection & ALARA', html: `<h3>Core Principles</h3><p>Justification, optimisation, and dose limitation.</p><h3>Time, Distance, Shielding</h3><p>Minimise time, maximise distance, use shielding.</p><div class="note-callout">💡 Doubling distance reduces dose to a quarter.</div><h3>ICRP Dose Limits</h3><p>Occupational: 20 mSv/year (5-yr avg). Public: 1 mSv/year.</p>` },
    { title: 'X-Ray Production', html: `<h3>Bremsstrahlung</h3><p>Continuous spectrum from decelerating electrons.</p><h3>Characteristic</h3><p>Shell transitions emit fixed-energy photons.</p>` },
    { title: 'Image Quality', html: `<h3>Four Pillars</h3><p>Density, contrast, sharpness, distortion.</p>` },
    { title: 'Contrast Media', html: `<h3>Positive vs Negative</h3><p>Barium/iodine vs air/CO₂.</p><h3>Barium</h3><p>Contraindicated in suspected perforation.</p>` },
    { title: 'CT Basics', html: `<h3>Hounsfield</h3><p>Water=0, air=−1000, bone≈+1000.</p>` },
    { title: 'MRI Basics', html: `<h3>T1 vs T2</h3><p>T1: fat bright. T2: fluid bright.</p><h3>Safety</h3><p>Ferromagnetic = absolute hazard.</p>` },
    { title: 'Ultrasound', html: `<h3>Piezoelectric</h3><p>Crystals convert electricity ↔ sound.</p>` }
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

const historyData = [
    { date: 'Nov 8, 1895', title: 'Discovery of X-Rays', body: 'Wilhelm Röntgen at Würzburg University.' },
    { date: '1913', title: 'First X-Ray Unit in Nigeria', body: 'Massey Street Hospital, Lagos.' },
    { date: '1987', title: 'RRBN Established', body: 'Decree No. 42 of 1987.' },
    { date: '2000s+', title: 'Digital Transition', body: 'Nigerian hospitals move from film to digital.' }
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

const libraryData = [
    { title: "Radiopaedia", desc: "Free radiology reference.", url: "https://radiopaedia.org/" },
    { title: "IAEA Publications", desc: "Free IAEA diagnostic imaging resources.", url: "https://www.iaea.org/publications" },
    { title: "WHO Radiation", desc: "WHO radiation safety.", url: "https://www.who.int/health-topics/radiation" },
    { title: "ICRP", desc: "Radiological protection recommendations.", url: "https://www.icrp.org/" },
    { title: "MIT OpenCourseWare", desc: "Medical imaging lectures.", url: "https://ocw.mit.edu/search/?q=medical+imaging" },
    { title: "OpenStax Anatomy", desc: "Free peer-reviewed anatomy textbook.", url: "https://openstax.org/details/books/anatomy-and-physiology-2e" }
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

const scholarshipData = [
    { title: "NNPC / Chevron Scholarship", status: "Open", eligibility: "200L Nigerian university students.", value: "₦150,000/year", url: "https://www.chevron.com/worldwide/nigeria", note: "Verify on official portal." },
    { title: "Federal Government Scholarship (BEA)", status: "Pending", eligibility: "Undergraduates in Nigerian institutions.", value: "Varies", url: "https://education.gov.ng/", note: "Check annually." }
];
function renderScholarships() {
    const c = $('scholarship-list');
    if (!c) return;
    $('scholarship-checked').textContent = new Date().toLocaleDateString();
    c.innerHTML = '';
    scholarshipData.forEach(item => {
        const badge = item.status === 'Open' ? 'active-badge' : 'pending-badge';
        const card = document.createElement('div');
        card.className = 'scholarship-card';
        card.innerHTML = `
            <div class="scholarship-header"><h4>${item.title}</h4><span class="status-badge ${badge}">${item.status}</span></div>
            <p><strong>Eligibility:</strong> ${item.eligibility}</p>
            <p><strong>Value:</strong> ${item.value}</p>
            <p style="font-size:12px;color:var(--text-dim);">${item.note}</p>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer">Visit Portal ↗</a>
        `;
        c.appendChild(card);
    });
}

function updateHelperModeLabel() {
    const el = $('helper-mode');
    if (el) el.innerHTML = 'Mode: <strong>Local keyword matcher</strong>.';
}
function helperReply(text) {
    const t = text.toLowerCase();
    if (t.includes('alara')) return 'ALARA = As Low As Reasonably Achievable. Apply time, distance, and shielding.';
    if (t.includes('kvp')) return 'kVp controls beam quality (penetrability).';
    if (t.includes('mas')) return 'mAs controls beam quantity (number of photons).';
    if (t.includes('hounsfield') || t.includes('hu')) return 'Hounsfield: water=0, air=−1000, bone≈+1000.';
    if (t.includes('mri')) return 'MRI: T1 fat bright, T2 fluid bright. Safety = no ferromagnets.';
    if (t.includes('ultrasound')) return 'Doppler measures frequency shift from moving blood.';
    if (t.includes('inverse')) return 'Inverse square law: Intensity ∝ 1/d².';
    return 'Local mode answers: ALARA, kVp, mAs, Hounsfield, MRI, ultrasound, inverse square.';
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
document.addEventListener('DOMContentLoaded', async () => {
    loadFlashcards();
    applyTheme(store.get('radprep_dark', false));

    if (!store.get('radprep_disclaimer_seen', false)) $('disclaimer-modal').classList.remove('hidden-view');
    $('disclaimer-accept').addEventListener('click', () => {
        store.set('radprep_disclaimer_seen', true);
        $('disclaimer-modal').classList.add('hidden-view');
    });

    // Auth form
    $('login-btn').addEventListener('click', handleAuthSubmit);
    $('auth-toggle-btn').addEventListener('click', toggleAuthMode);
    $('auth-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthSubmit(); });
    $('logout-btn').addEventListener('click', handleLogout);

    // Sidebar
    $('menu-toggle').addEventListener('click', () => {
        $('sidebar').classList.toggle('open');
        $('sidebar-overlay').classList.toggle('active');
    });
    $('sidebar-overlay').addEventListener('click', () => {
        $('sidebar').classList.remove('open');
        $('sidebar-overlay').classList.remove('active');
    });

    // Nav
    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.target)));
    document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.back)));

    // Theme
    $('theme-btn').addEventListener('click', () => applyTheme(!document.body.classList.contains('dark-mode')));

    // Level tabs
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active-level'));
            btn.classList.add('active-level');
            renderCurriculum(btn.dataset.level);
        });
    });

    // Flashcards
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

    // Quiz
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

    // Avatar
    $('avatar-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { $('user-avatar-preview').src = ev.target.result; };
        reader.readAsDataURL(file);
    });

    // Helper chat
    function sendHelper() {
        const input = $('ai-chat-input');
        const text = input.value.trim();
        if (!text) return;
        pushChat(text, true);
        input.value = '';
        setTimeout(() => pushChat(helperReply(text), false), 300);
    }
    $('ai-send-btn').addEventListener('click', sendHelper);
    $('ai-chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendHelper(); });

    // ==========================================
    // BOOTSTRAP AUTH
    // ==========================================
    if (!supabaseClient) {
        showAuthError('Backend not reachable. Please refresh the page.');
        return;
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        if (event === 'SIGNED_IN' && session?.user) {
            await handleSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            if (currentUser) handleLogout();
        }
    });

    // Check existing session
    const { data } = await supabaseClient.auth.getSession();
    if (data.session?.user) {
        await handleSignedIn(data.session.user);
    }

    // Service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('✅ SW registered'))
            .catch(err => console.warn('SW failed:', err));
    }
});