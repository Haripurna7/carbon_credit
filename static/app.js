document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentStep = 1;
    const totalSteps = 4;
    
    // Result State for Simulator
    let predictedEmission = 0.0;
    let scope1Emission = 0.0;
    let scope2Emission = 0.0;
    let scope3Emission = 0.0;
    
    // Input parameters cached for Simulator
    let vehicleType = 'none';
    let vehicleDistance = 0.0;
    let dietType = 'omnivore';
    let transportMode = 'public';

    // All form data backup
    let lastCalculationData = null;

    // --- DOM Elements ---
    const form = document.getElementById('calculator-form');
    const formCard = document.getElementById('form-card');
    const loaderCard = document.getElementById('loader-card');
    const resultsCard = document.getElementById('results-card');
    
    // Navigation Buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const recalcBtn = document.getElementById('recalc-btn');

    // Action Buttons
    const pdfBtn = document.getElementById('pdf-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Steps & Progress
    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const progressFill = document.getElementById('progress-fill');

    // Conditional Fields
    const transportSelect = document.getElementById('Transport');
    const vehicleTypeGroup = document.getElementById('vehicle-type-group');
    const vehicleDistanceGroup = document.getElementById('vehicle-distance-group');

    // Result Nodes
    const resultEmission = document.getElementById('result-emission');
    const resultBadge = document.getElementById('result-badge');
    const resultDesc = document.getElementById('result-desc');
    const gaugeFill = document.getElementById('gauge-fill');
    const gaugePercent = document.getElementById('gauge-percent');
    const recommendationsContainer = document.getElementById('recommendations-container');

    // Scope Elements
    const scope1Bar = document.getElementById('scope1-bar');
    const scope2Bar = document.getElementById('scope2-bar');
    const scope3Bar = document.getElementById('scope3-bar');
    const scope1ValText = document.getElementById('scope1-val');
    const scope2ValText = document.getElementById('scope2-val');
    const scope3ValText = document.getElementById('scope3-val');

    // Simulator Elements
    const simTrees = document.getElementById('sim-trees');
    const simTreesVal = document.getElementById('sim-trees-val');
    const simTreesOffset = document.getElementById('sim-trees-offset');
    
    const simSolar = document.getElementById('sim-solar');
    const simSolarVal = document.getElementById('sim-solar-val');
    const simSolarOffset = document.getElementById('sim-solar-offset');
    
    const simEv = document.getElementById('sim-ev');
    const simEvEffect = document.getElementById('sim-ev-effect');
    
    const simDiet = document.getElementById('sim-diet');
    const simDietEffect = document.getElementById('sim-diet-effect');
    
    const simOrigVal = document.getElementById('sim-orig-val');
    const simMitigationVal = document.getElementById('sim-mitigation-val');
    const simFinalVal = document.getElementById('sim-final-val');
    const simProgressFill = document.getElementById('sim-progress-fill');
    const simComparisonText = document.getElementById('sim-comparison-text');

    // --- Transport Conditional Logic ---
    function toggleVehicleFields() {
        if (transportSelect.value === 'private') {
            vehicleTypeGroup.style.display = 'flex';
            vehicleDistanceGroup.style.display = 'flex';
            document.getElementById('Vehicle Type').setAttribute('required', 'true');
            document.getElementById('Vehicle Monthly Distance Km').setAttribute('required', 'true');
        } else {
            vehicleTypeGroup.style.display = 'none';
            vehicleDistanceGroup.style.display = 'none';
            document.getElementById('Vehicle Type').removeAttribute('required');
            document.getElementById('Vehicle Monthly Distance Km').removeAttribute('required');
        }
    }

    transportSelect.addEventListener('change', toggleVehicleFields);
    toggleVehicleFields();

    // --- Form Navigation Logic ---
    function updateStepperUI() {
        formSteps.forEach(step => {
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        stepIndicators.forEach(indicator => {
            const stepNum = parseInt(indicator.dataset.step);
            if (stepNum === currentStep) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else if (stepNum < currentStep) {
                indicator.classList.remove('active');
                indicator.classList.add('completed');
            } else {
                indicator.classList.remove('active');
                indicator.classList.remove('completed');
            }
        });

        const percentage = ((currentStep) / totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;

        if (currentStep === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        } else if (currentStep === totalSteps) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }
    }

    function validateCurrentStep() {
        const activeStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const inputs = activeStepEl.querySelectorAll('input[required], select[required]');
        
        let isValid = true;
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                input.reportValidity();
            }
        });
        return isValid;
    }

    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStepperUI();
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepperUI();
        }
    });

    // --- Form Submission / API Call ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateCurrentStep()) return;

        const formData = new FormData(form);
        const payload = {};

        formData.forEach((value, key) => {
            if (key === 'Cooking_With' || key === 'Recycling') return;
            
            if (['Monthly Grocery Bill', 'Vehicle Monthly Distance Km', 'Waste Bag Weekly Count', 
                 'How Long TV PC Daily Hour', 'How Many New Clothes Monthly', 'How Long Internet Daily Hour'].includes(key)) {
                payload[key] = parseFloat(value);
            } else {
                payload[key] = value;
            }
        });

        const cookingCheckboxes = document.querySelectorAll('input[name="Cooking_With"]:checked');
        payload['Cooking_With'] = Array.from(cookingCheckboxes).map(cb => cb.value);

        const recyclingCheckboxes = document.querySelectorAll('input[name="Recycling"]:checked');
        payload['Recycling'] = Array.from(recyclingCheckboxes).map(cb => cb.value);

        // Store configuration inputs locally for simulator
        transportMode = payload['Transport'];
        if (transportMode === 'private') {
            vehicleType = payload['Vehicle Type'];
            vehicleDistance = parseFloat(payload['Vehicle Monthly Distance Km'] || 0);
        } else {
            vehicleType = 'none';
            vehicleDistance = 0.0;
        }
        dietType = payload['Diet'];

        // Hide form and show loader
        formCard.style.display = 'none';
        loaderCard.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Server error');
            }

            const result = await response.json();
            
            // Cache results for exports/simulator
            predictedEmission = result.predicted_emission;
            scope1Emission = result.scopes.scope1.value;
            scope2Emission = result.scopes.scope2.value;
            scope3Emission = result.scopes.scope3.value;
            lastCalculationData = result;

            renderResults(result);
            resetSimulator();

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during calculation.');
            loaderCard.style.display = 'none';
            formCard.style.display = 'block';
        }
    });

    // --- Render Results ---
    function renderResults(data) {
        // Core Scores
        resultEmission.textContent = data.predicted_emission.toLocaleString();
        resultBadge.textContent = `${data.level} Impact`;
        resultDesc.textContent = data.level_desc;

        resultBadge.className = 'status-badge';
        resultBadge.classList.add(data.level_color);

        // Gauge Comparison
        const averageEmission = 2000;
        let percent = (data.predicted_emission / averageEmission) * 100;
        if (percent > 150) percent = 150;
        
        const rotation = (Math.min(percent, 100) / 100) * 180;
        gaugePercent.textContent = `${Math.round((data.predicted_emission / averageEmission) * 100)}%`;
        gaugeFill.style.transform = `rotate(${rotation}deg)`;

        // Scope progress bars widths
        scope1Bar.style.width = `${data.scopes.scope1.percentage}%`;
        scope2Bar.style.width = `${data.scopes.scope2.percentage}%`;
        scope3Bar.style.width = `${data.scopes.scope3.percentage}%`;

        // Scope texts
        scope1ValText.textContent = `${data.scopes.scope1.value.toLocaleString()} kg (${data.scopes.scope1.percentage}%)`;
        scope2ValText.textContent = `${data.scopes.scope2.value.toLocaleString()} kg (${data.scopes.scope2.percentage}%)`;
        scope3ValText.textContent = `${data.scopes.scope3.value.toLocaleString()} kg (${data.scopes.scope3.percentage}%)`;

        // Action Recommendations
        recommendationsContainer.innerHTML = '';
        data.recommendations.forEach(rec => {
            const recEl = document.createElement('div');
            recEl.className = 'rec-item';
            recEl.innerHTML = `
                <div class="rec-icon-box">
                    <i class="fa-solid fa-${rec.icon}"></i>
                </div>
                <div class="rec-content">
                    <span class="rec-category">${rec.category}</span>
                    <p class="rec-text">${rec.text}</p>
                </div>
            `;
            recommendationsContainer.appendChild(recEl);
        });

        // Toggle Views
        loaderCard.style.display = 'none';
        resultsCard.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Simulator Logic ---
    function resetSimulator() {
        simTrees.value = 0;
        simSolar.value = 0;
        simEv.checked = false;
        simDiet.checked = false;
        
        simTreesVal.textContent = "0 Trees";
        simTreesOffset.textContent = "0";
        simSolarVal.textContent = "0% Solar";
        simSolarOffset.textContent = "0";
        
        simEvEffect.style.display = 'none';
        simDietEffect.style.display = 'none';
        
        updateSimulation();
    }

    function updateSimulation() {
        const trees = parseInt(simTrees.value);
        const solar = parseInt(simSolar.value);
        
        // 1. Tree Mitigation (each tree offsets 22 kg CO2e / year)
        const treeOffset = trees * 22;
        simTreesVal.textContent = `${trees} Trees`;
        simTreesOffset.textContent = treeOffset.toLocaleString();

        // 2. Solar Clean Energy (offsets up to 80% of Scope 2 domestic energy)
        const solarOffset = scope2Emission * (solar / 100) * 0.80;
        simSolarVal.textContent = `${solar}% Solar`;
        simSolarOffset.textContent = Math.round(solarOffset).toLocaleString();

        // 3. EV Switch (reduces 75% of private transport Scope 1 fuel emissions)
        let evOffset = 0.0;
        if (simEv.checked && transportMode === 'private' && vehicleType !== 'electric') {
            const fuelFactors = {'petrol': 0.18, 'diesel': 0.20, 'lpg': 0.16, 'hybrid': 0.10};
            const factor = fuelFactors[vehicleType] || 0.18;
            const vehicleEmission = vehicleDistance * 12 * factor;
            evOffset = vehicleEmission * 0.75;
            simEvEffect.style.display = 'inline';
        } else {
            simEvEffect.style.display = 'none';
        }

        // 4. Plant-Based Diet (replaces diet and drops Scope 3 impact)
        let dietOffset = 0.0;
        if (simDiet.checked) {
            if (dietType === 'omnivore') dietOffset = 1500.0;
            else if (dietType === 'pescatarian') dietOffset = 600.0;
            else if (dietType === 'vegetarian') dietOffset = 300.0;
            simDietEffect.style.display = 'inline';
        } else {
            simDietEffect.style.display = 'none';
        }

        // Totals
        let totalMitigations = treeOffset + solarOffset + evOffset + dietOffset;
        
        // Limit footprint to positive baseline (minimum 50 kg/year)
        if (totalMitigations > predictedEmission - 50) {
            totalMitigations = predictedEmission - 50;
        }

        const simulatedFootprint = predictedEmission - totalMitigations;

        // Render Simulator panel
        simOrigVal.textContent = `${Math.round(predictedEmission).toLocaleString()} kg`;
        simMitigationVal.textContent = `${Math.round(totalMitigations).toLocaleString()}`;
        simFinalVal.textContent = `${Math.round(simulatedFootprint).toLocaleString()} kg`;
        
        const remainingPercentage = (simulatedFootprint / predictedEmission) * 100;
        simProgressFill.style.width = `${remainingPercentage}%`;

        // Update main score display dynamically
        resultEmission.textContent = Math.round(simulatedFootprint).toLocaleString();

        // Comparison text
        if (totalMitigations > 0) {
            const savedPercentage = ((totalMitigations / predictedEmission) * 100).toFixed(1);
            simComparisonText.textContent = `You have simulated a ${savedPercentage}% carbon reduction!`;
            simComparisonText.className = "sim-comparison-text text-emerald";
        } else {
            simComparisonText.textContent = "No active simulated mitigations.";
            simComparisonText.className = "sim-comparison-text";
        }
    }

    simTrees.addEventListener('input', updateSimulation);
    simSolar.addEventListener('input', updateSimulation);
    simEv.addEventListener('change', updateSimulation);
    simDiet.addEventListener('change', updateSimulation);

    // --- Recalculate Reset Logic ---
    recalcBtn.addEventListener('click', () => {
        currentStep = 1;
        form.reset();
        toggleVehicleFields();
        updateStepperUI();

        resultsCard.style.display = 'none';
        formCard.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Export Data ---
    exportJsonBtn.addEventListener('click', () => {
        if (!lastCalculationData) return;
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastCalculationData, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "carbon_footprint_data.json");
        dlAnchorElem.click();
    });

    exportCsvBtn.addEventListener('click', () => {
        if (!lastCalculationData) return;

        const inputs = lastCalculationData.inputs;
        const scopes = lastCalculationData.scopes;
        const total = lastCalculationData.predicted_emission;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Metric,Value\n";
        csvContent += `Predicted Total Emission (kg CO2e/year),${total}\n`;
        csvContent += `Scope 1 Direct Emission (kg CO2e/year),${scopes.scope1.value}\n`;
        csvContent += `Scope 2 Energy Emission (kg CO2e/year),${scopes.scope2.value}\n`;
        csvContent += `Scope 3 Value Chain Emission (kg CO2e/year),${scopes.scope3.value}\n`;
        
        csvContent += "\nInput parameter,User Value\n";
        for (const [key, val] of Object.entries(inputs)) {
            // Escape values containing commas
            const valEscaped = typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            csvContent += `${key},${valEscaped}\n`;
        }

        const encodedUri = encodeURI(csvContent);
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", encodedUri);
        dlAnchorElem.setAttribute("download", "carbon_footprint_data.csv");
        dlAnchorElem.click();
    });

    // --- PDF / Print Logic ---
    pdfBtn.addEventListener('click', () => {
        document.getElementById('print-date').textContent = new Date().toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        window.print();
    });
});
