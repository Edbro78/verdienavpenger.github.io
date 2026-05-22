// --- Supabase ---
const SUPABASE_URL = 'https://qlowvgthfootuvwxbysx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eHFZ_3e5VETF0fKS6yUgYw_F92QXpX7';

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (err) {
    console.warn('Supabase-klient kunne ikke opprettes:', err);
}

// KPI data for historical calculations
const kpiData = {
    2010: 2.4,
    2011: 1.3,
    2012: 0.8,
    2013: 2.1,
    2014: 2.1,
    2015: 2.2,
    2016: 3.6,
    2017: 1.8,
    2018: 2.7,
    2019: 2.2,
    2020: 1.3,
    2021: 3.5,
    2022: 5.8,
    2023: 5.5,
    2024: 3.1
};

// Global variables
let currentAmount = 1000000;
let selectedHistoricalYear = 2025;
let selectedFutureYear = 2025;
let selectedKPI = 3;

// DOM elements
const amountSlider = document.getElementById('amount-slider');
const amountDisplay = document.getElementById('amount-display');
const presentAmount = document.getElementById('present-amount');

const historicalYearSlider = document.getElementById('historical-year-slider');
const historicalYearDisplay = document.getElementById('historical-year-display');
const historicalAmount = document.getElementById('historical-amount');

const futureYearSlider = document.getElementById('future-year-slider');
const futureYearDisplay = document.getElementById('future-year-display');
const futureAmount = document.getElementById('future-amount');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeSliders();
    initializeKPIButtons();
    initializeHistoricalKPIModal();
    initializeDisclaimerModal();
    updateAllCalculations();
});

// Initialize theme toggle
function initializeTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        html.classList.add('dark');
    }
    
    // Theme toggle handler
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            html.classList.toggle('dark');
            
            // Save preference
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}

// Update slider progress fill
function updateSliderProgress(slider, min, max) {
    const value = parseInt(slider.value);
    const percentage = ((value - min) / (max - min)) * 100;
    // Use CSS custom properties - browsers will handle OKLCH conversion
    const root = getComputedStyle(document.documentElement);
    const primaryColor = root.getPropertyValue('--primary').trim();
    const borderColor = root.getPropertyValue('--border').trim();
    slider.style.background = `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${percentage}%, ${borderColor} ${percentage}%, ${borderColor} 100%)`;
}

// Initialize sliders
function initializeSliders() {
    if (amountSlider) {
        const min = parseInt(amountSlider.min);
        const max = parseInt(amountSlider.max);
        updateSliderProgress(amountSlider, min, max);
        
        amountSlider.addEventListener('input', function() {
            currentAmount = parseInt(this.value);
            updateAmountDisplay();
            updateAllCalculations();
            updateSliderProgress(this, min, max);
        });
    }

    if (historicalYearSlider) {
        const min = parseInt(historicalYearSlider.min);
        const max = parseInt(historicalYearSlider.max);
        updateSliderProgress(historicalYearSlider, min, max);
        
        historicalYearSlider.addEventListener('input', function() {
            selectedHistoricalYear = parseInt(this.value);
            updateHistoricalYearDisplay();
            updateAllCalculations();
            updateSliderProgress(this, min, max);
        });
    }

    if (futureYearSlider) {
        const min = parseInt(futureYearSlider.min);
        const max = parseInt(futureYearSlider.max);
        updateSliderProgress(futureYearSlider, min, max);
        
        futureYearSlider.addEventListener('input', function() {
            selectedFutureYear = parseInt(this.value);
            updateFutureYearDisplay();
            updateAllCalculations();
            updateSliderProgress(this, min, max);
        });
    }
}

// Initialize KPI buttons
function initializeKPIButtons() {
    const kpiButtons = document.querySelectorAll('.kpi-btn');
    
    kpiButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            kpiButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update selected KPI
            selectedKPI = parseFloat(this.dataset.kpi);
            
            // Update calculations
            updateAllCalculations();
        });
    });

    // Set default active button (3%)
    const defaultButton = document.querySelector('[data-kpi="3"]');
    if (defaultButton) {
        defaultButton.classList.add('active');
    }
}

// Update amount display
function updateAmountDisplay() {
    const formattedAmount = formatNumber(currentAmount);
    // Show current year (2025) as reference
    amountDisplay.textContent = '2025';
    presentAmount.textContent = formattedAmount + ',-';
}

// Update historical year display
function updateHistoricalYearDisplay() {
    historicalYearDisplay.textContent = selectedHistoricalYear;
}

// Update future year display
function updateFutureYearDisplay() {
    futureYearDisplay.textContent = selectedFutureYear;
}

// Calculate historical value (inflation adjustment)
function calculateHistoricalValue() {
    // Use 2025 as the reference year
    const referenceYear = 2025;
    
    if (selectedHistoricalYear === referenceYear) {
        return currentAmount;
    }

    let cumulativeInflation = 1;
    
    // Calculate cumulative inflation from historical year to 2025
    for (let year = selectedHistoricalYear; year < referenceYear; year++) {
        if (kpiData[year]) {
            cumulativeInflation *= (1 + kpiData[year] / 100);
        }
    }
    
    // Adjust current amount back to historical year
    return Math.round(currentAmount / cumulativeInflation);
}

// Calculate future value (discounting)
function calculateFutureValue() {
    const referenceYear = 2025;
    
    if (selectedFutureYear === referenceYear) {
        return currentAmount;
    }

    const yearsDifference = selectedFutureYear - referenceYear;
    const discountFactor = Math.pow(1 + selectedKPI / 100, yearsDifference);
    
    return Math.round(currentAmount * discountFactor);
}

// Update all calculations
function updateAllCalculations() {
    // Update historical value
    const historicalValue = calculateHistoricalValue();
    historicalAmount.textContent = formatNumber(historicalValue) + ',-';
    
    // Update future value
    const futureValue = calculateFutureValue();
    futureAmount.textContent = formatNumber(futureValue) + ',-';
    
    // Update present amount
    updateAmountDisplay();
}

// Format number with spaces as thousand separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Add some visual feedback for interactions
function addVisualFeedback() {
    // Add hover effects to value boxes
    const valueBoxes = document.querySelectorAll('.value-box');
    
    valueBoxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        box.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Initialize visual feedback
document.addEventListener('DOMContentLoaded', function() {
    addVisualFeedback();
});

// Add keyboard shortcuts for better accessibility
document.addEventListener('keydown', function(e) {
    // Arrow keys for amount slider
        if (e.target === amountSlider) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const step = e.key === 'ArrowLeft' ? -100000 : 100000;
                const newValue = Math.max(100000, Math.min(5000000, currentAmount + step));
                amountSlider.value = newValue;
                currentAmount = newValue;
                updateAmountDisplay();
                updateAllCalculations();
            }
        }
});

// Add touch support for mobile devices
function addTouchSupport() {
    const sliders = document.querySelectorAll('input[type="range"]');
    
    sliders.forEach(slider => {
        slider.addEventListener('touchstart', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        slider.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Initialize touch support
document.addEventListener('DOMContentLoaded', function() {
    addTouchSupport();
});

// Initialize Historical KPI Modal
function initializeHistoricalKPIModal() {
    const modal = document.getElementById('historical-kpi-modal');
    const openBtn = document.getElementById('historical-kpi-btn');
    const closeBtn = document.getElementById('close-modal');
    const tableBody = document.getElementById('kpi-table-body');

    // Populate the table with KPI data
    populateKPITable(tableBody);

    // Open modal
    openBtn.addEventListener('click', function() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

// Populate KPI table with data
function populateKPITable(tableBody) {
    // Sort KPI data by year
    const sortedKPIData = Object.entries(kpiData).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    sortedKPIData.forEach(([year, kpi]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year}</td>
            <td>${kpi}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize Disclaimer Modal
function initializeDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    const openBtn = document.getElementById('disclaimer-btn');
    const closeBtn = document.getElementById('close-disclaimer-modal');

    // Open modal
    openBtn.addEventListener('click', function() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

// --- Supabase: autentisering og modell-lagring (data inn/ut av input-felter) ---

function visDashboard() {
    const authOverlay = document.getElementById('auth-overlay');
    const appContent = document.getElementById('app-content');
    if (authOverlay) authOverlay.classList.add('hidden');
    if (appContent) appContent.classList.remove('app-hidden');
    document.body.classList.remove('auth-locked');
}

function skjulDashboard() {
    const authOverlay = document.getElementById('auth-overlay');
    const appContent = document.getElementById('app-content');
    if (authOverlay) authOverlay.classList.remove('hidden');
    if (appContent) appContent.classList.add('app-hidden');
    document.body.classList.add('auth-locked');
}

function visLoginFeil(melding) {
    const el = document.getElementById('login-error');
    if (!el) return;
    if (melding) {
        el.textContent = melding;
        el.hidden = false;
    } else {
        el.textContent = '';
        el.hidden = true;
    }
}

function fjernGammelLokalInnlogging() {
    try {
        sessionStorage.removeItem('verdien_av_penger_innlogget');
        localStorage.removeItem('verdien_av_penger_innlogget');
    } catch (_err) { /* ignore */ }
}

function oversettAuthFeil(message) {
    if (!message) return 'Innlogging feilet. Sjekk e-post og passord.';
    if (message.includes('Invalid login credentials')) {
        return 'Feil e-post eller passord.';
    }
    if (message.includes('Email not confirmed')) {
        return 'Bekreft e-posten din i Supabase, eller slå av «Confirm email» under Authentication.';
    }
    return message;
}

async function hentAktivBrukerId() {
    if (!supabaseClient) return null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user ? user.id : null;
}

async function loggInn(epost, passord) {
    if (!supabaseClient) {
        throw new Error('Supabase er ikke tilgjengelig. Last siden på nytt.');
    }
    fjernGammelLokalInnlogging();

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: epost.trim(),
        password: passord
    });
    if (error) throw new Error(oversettAuthFeil(error.message));
    visDashboard();
    return data;
}

async function loggUt() {
    fjernGammelLokalInnlogging();
    if (supabaseClient) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    }
    skjulDashboard();
    lukkModellListe();
}

async function sjekkBrukerStatus() {
    fjernGammelLokalInnlogging();

    if (!supabaseClient) {
        skjulDashboard();
        return null;
    }
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            visDashboard();
        } else {
            skjulDashboard();
        }
        return session;
    } catch (_err) {
        skjulDashboard();
        return null;
    }
}

function hentModellTilstand() {
    const aktivKpiKnapp = document.querySelector('.kpi-btn.active');
    return {
        currentAmount,
        selectedHistoricalYear,
        selectedFutureYear,
        selectedKPI,
        amountSlider: amountSlider ? parseInt(amountSlider.value, 10) : currentAmount,
        historicalYear: selectedHistoricalYear,
        futureYear: selectedFutureYear,
        kpi: selectedKPI,
        aktivKpi: aktivKpiKnapp ? aktivKpiKnapp.dataset.kpi : String(selectedKPI)
    };
}

function settModellTilstand(modellData) {
    const data = modellData.modell_data || modellData;

    currentAmount = data.currentAmount ?? data.amountSlider ?? currentAmount;
    selectedHistoricalYear = data.selectedHistoricalYear ?? data.historicalYear ?? selectedHistoricalYear;
    selectedFutureYear = data.selectedFutureYear ?? data.futureYear ?? selectedFutureYear;
    selectedKPI = data.selectedKPI ?? data.kpi ?? selectedKPI;

    if (amountSlider) {
        amountSlider.value = currentAmount;
        updateSliderProgress(amountSlider, parseInt(amountSlider.min, 10), parseInt(amountSlider.max, 10));
    }
    if (historicalYearSlider) {
        historicalYearSlider.value = selectedHistoricalYear;
        updateSliderProgress(historicalYearSlider, parseInt(historicalYearSlider.min, 10), parseInt(historicalYearSlider.max, 10));
    }
    if (futureYearSlider) {
        futureYearSlider.value = selectedFutureYear;
        updateSliderProgress(futureYearSlider, parseInt(futureYearSlider.min, 10), parseInt(futureYearSlider.max, 10));
    }

    const kpiVerdi = data.aktivKpi != null ? data.aktivKpi : String(selectedKPI);
    const kpiButtons = document.querySelectorAll('.kpi-btn');
    kpiButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.kpi === kpiVerdi);
    });
    selectedKPI = parseFloat(kpiVerdi);

    updateHistoricalYearDisplay();
    updateFutureYearDisplay();
    updateAllCalculations();
}

async function lagreModell(kundeNavn) {
    const trimmedNavn = (kundeNavn || '').trim();
    if (!trimmedNavn) {
        throw new Error('Kundenavn kan ikke være tomt.');
    }

    const userId = await hentAktivBrukerId();
    if (!userId) {
        throw new Error('Du må være innlogget for å lagre modeller.');
    }

    const modellData = hentModellTilstand();
    const rad = {
        user_id: userId,
        kunde_navn: trimmedNavn,
        modell_data: modellData,
        oppdatert: new Date().toISOString()
    };

    if (!supabaseClient) {
        throw new Error('Supabase er ikke konfigurert. Fyll inn SUPABASE_URL og SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabaseClient
        .from('finans_modeller')
        .upsert(rad, { onConflict: 'user_id,kunde_navn' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function lastInnModell(modellId) {
    if (!supabaseClient) {
        throw new Error('Supabase er ikke konfigurert. Fyll inn SUPABASE_URL og SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabaseClient
        .from('finans_modeller')
        .select('*')
        .eq('id', modellId)
        .single();

    if (error) throw error;
    settModellTilstand(data);
    return data;
}

async function hentLagredeModeller() {
    const userId = await hentAktivBrukerId();
    if (!userId) return [];

    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('finans_modeller')
        .select('id, kunde_navn, oppdatert')
        .eq('user_id', userId)
        .order('oppdatert', { ascending: false });

    if (error) throw error;
    return data || [];
}

function lukkModellListe() {
    const liste = document.getElementById('modell-liste');
    const btn = document.getElementById('last-inn-modell-btn');
    if (liste) liste.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
}

function visModellListe(modeller) {
    const liste = document.getElementById('modell-liste');
    const itemsEl = document.getElementById('modell-liste-items');
    const emptyEl = document.getElementById('modell-liste-empty');
    const btn = document.getElementById('last-inn-modell-btn');
    if (!liste || !itemsEl) return;

    itemsEl.innerHTML = '';

    if (!modeller.length) {
        if (emptyEl) emptyEl.hidden = false;
    } else {
        if (emptyEl) emptyEl.hidden = true;
        modeller.forEach(modell => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'modell-liste-item';
            button.setAttribute('role', 'menuitem');
            button.dataset.modellId = modell.id;
            const dato = modell.oppdatert ? new Date(modell.oppdatert).toLocaleDateString('nb-NO') : '';
            button.textContent = dato ? `${modell.kunde_navn} (${dato})` : modell.kunde_navn;
            button.addEventListener('click', async function() {
                try {
                    await lastInnModell(modell.id);
                    lukkModellListe();
                } catch (err) {
                    console.error('Kunne ikke laste modell:', err.message);
                    alert('Kunne ikke laste modellen. Prøv igjen.');
                }
            });
            li.appendChild(button);
            itemsEl.appendChild(li);
        });
    }

    liste.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
}

function visLagreModellStatus(melding, erFeil) {
    const el = document.getElementById('lagre-modell-status');
    if (!el) return;
    el.textContent = melding;
    el.hidden = !melding;
    el.classList.toggle('modell-status--error', !!erFeil);
    el.classList.toggle('modell-status--success', !!melding && !erFeil);
}

function initializeSupabaseAuth() {
    const loginForm = document.getElementById('login-form');
    const loggUtBtn = document.getElementById('logg-ut-btn');
    const lagreModellBtn = document.getElementById('lagre-modell-btn');
    const lastInnModellBtn = document.getElementById('last-inn-modell-btn');
    const lagreModellModal = document.getElementById('lagre-modell-modal');
    const lagreModellForm = document.getElementById('lagre-modell-form');
    const closeLagreModal = document.getElementById('close-lagre-modell-modal');
    const avbrytLagre = document.getElementById('avbryt-lagre-modell');
    const kundeNavnInput = document.getElementById('kunde-navn-input');

    sjekkBrukerStatus();

    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session) {
                visDashboard();
            } else {
                skjulDashboard();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            visLoginFeil('');
            const epostFelt = loginForm.querySelector('#login-epost')
                || loginForm.elements.epost;
            const passordFelt = loginForm.querySelector('#login-password')
                || loginForm.elements.password;
            const epost = epostFelt ? epostFelt.value : '';
            const passord = passordFelt ? passordFelt.value : '';
            const submitBtn = document.getElementById('login-submit-btn');
            if (submitBtn) submitBtn.disabled = true;

            try {
                await loggInn(epost, passord);
                visLoginFeil('');
                loginForm.reset();
            } catch (err) {
                visLoginFeil(err.message || 'Innlogging feilet. Sjekk e-post og passord.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    if (loggUtBtn) {
        loggUtBtn.addEventListener('click', async function() {
            try {
                await loggUt();
            } catch (err) {
                console.error('Utlogging feilet:', err.message);
            }
        });
    }

    if (lagreModellBtn && lagreModellModal) {
        lagreModellBtn.addEventListener('click', function() {
            visLagreModellStatus('');
            if (kundeNavnInput) kundeNavnInput.value = '';
            lagreModellModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (kundeNavnInput) kundeNavnInput.focus();
        });
    }

    function lukkLagreModal() {
        if (lagreModellModal) lagreModellModal.classList.remove('active');
        document.body.style.overflow = '';
        visLagreModellStatus('');
    }

    if (closeLagreModal) closeLagreModal.addEventListener('click', lukkLagreModal);
    if (avbrytLagre) avbrytLagre.addEventListener('click', lukkLagreModal);

    if (lagreModellModal) {
        lagreModellModal.addEventListener('click', function(e) {
            if (e.target === lagreModellModal) lukkLagreModal();
        });
    }

    if (lagreModellForm) {
        lagreModellForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const navn = kundeNavnInput ? kundeNavnInput.value : '';
            const bekreftBtn = document.getElementById('bekreft-lagre-modell');
            if (bekreftBtn) bekreftBtn.disabled = true;

            try {
                await lagreModell(navn);
                visLagreModellStatus('Modellen ble lagret.', false);
                setTimeout(lukkLagreModal, 1200);
            } catch (err) {
                visLagreModellStatus(err.message || 'Kunne ikke lagre modellen.', true);
            } finally {
                if (bekreftBtn) bekreftBtn.disabled = false;
            }
        });
    }

    if (lastInnModellBtn) {
        lastInnModellBtn.addEventListener('click', async function() {
            const liste = document.getElementById('modell-liste');
            if (liste && !liste.hidden) {
                lukkModellListe();
                return;
            }
            try {
                const modeller = await hentLagredeModeller();
                visModellListe(modeller);
            } catch (err) {
                console.error('Kunne ikke hente modeller:', err.message);
                alert('Kunne ikke hente lagrede modeller.');
            }
        });
    }

    document.addEventListener('click', function(e) {
        const wrapper = document.querySelector('.load-model-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            lukkModellListe();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSupabaseAuth();
});