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
