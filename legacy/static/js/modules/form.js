/**
 * Form Handling & Clinical Input Validation Module
 * Handles BMI calculations, eGFR updates, form submission, and prefill sample data.
 */

export function calculateBMI(heightCm, weightKg) {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
}

export function setupBMICalculation() {
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const bmiInput = document.getElementById('bmi');
    const bmiCategoryEl = document.getElementById('bmi-category');

    function update() {
        const h = parseFloat(heightInput ? heightInput.value : 0);
        const w = parseFloat(weightInput ? weightInput.value : 0);
        const bmi = calculateBMI(h, w);
        if (bmi !== null && bmiInput) {
            bmiInput.value = bmi;
            if (bmiCategoryEl) {
                let cat = "Normal";
                if (bmi < 18.5) cat = "Underweight";
                else if (bmi >= 25 && bmi < 30) cat = "Overweight";
                else if (bmi >= 30) cat = "Obese";
                bmiCategoryEl.textContent = `(${cat})`;
            }
        }
    }

    if (heightInput) heightInput.addEventListener('input', update);
    if (weightInput) weightInput.addEventListener('input', update);
}

export function extractFormData(formElement) {
    if (!formElement) return {};
    const formData = new FormData(formElement);
    const payload = {};

    for (const [key, value] of formData.entries()) {
        const numVal = parseFloat(value);
        if (!isNaN(numVal) && !['medication_name', 'sex', 'ethnicity', 'cyp2c9', 'cyp2d6', 'cyp3a4', 'slco1b1_genotype', 'abcb1_genotype', 'abcg2_genotype', 'indication'].includes(key)) {
            payload[key] = numVal;
        } else {
            payload[key] = value;
        }
    }
    return payload;
}

export async function loadSampleData(sampleType = "high_risk") {
    try {
        const response = await fetch(`/sample_data/${sampleType}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        for (const [key, val] of Object.entries(data)) {
            const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = Boolean(val);
                } else {
                    el.value = val;
                }
                el.dispatchEvent(new Event('change'));
            }
        }
        setupBMICalculation();
        return data;
    } catch (err) {
        console.error("Failed to load sample clinical data:", err);
        return null;
    }
}
