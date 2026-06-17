# 🌱 EcoFootprint Pro — AI-Powered Carbon Footprint Calculator

> **Green Internship Project** | GHG Protocol ESG Certified | HistGradientBoosting ML Model (97.6% R²)

An end-to-end data science and web application project that **predicts, analyzes, and simulates** an individual's annual carbon footprint using machine learning and an interactive Flask dashboard.

---

## 📁 Project Structure

```
C:\hari\py_jupyter\
│
├── Carbon Emission.csv           # Source dataset (10,000 individual records, 20 features)
│
├── carbon_emission.ipynb         # Jupyter Notebook — EDA, ML modeling, feature analysis
│
├── train_and_save_model.py       # Script to train & serialize the ML model
├── carbon_model.joblib           # Pre-trained model + LabelEncoders (auto-generated)
│
├── app.py                        # Flask backend — REST API + page routing
│
├── templates/
│   └── index.html                # Main HTML — stepper form + results dashboard
│
└── static/
    ├── style.css                 # Premium dark glassmorphic styling + print media CSS
    └── app.js                    # Frontend logic — stepper, API calls, simulator, exports
```

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Data & ML** | Python 3, Pandas, NumPy | Data loading, cleaning, transformation |
| **Machine Learning** | scikit-learn | `HistGradientBoostingRegressor`, `LabelEncoder`, `train_test_split` |
| **Model Persistence** | joblib | Serialize & load trained model + encoders |
| **Backend** | Flask | REST API server + HTML template rendering |
| **Frontend** | HTML5, Vanilla CSS, Vanilla JS | Multi-step form, dashboard, simulator |
| **Icons** | Font Awesome 6 | UI icons throughout the dashboard |
| **Fonts** | Google Fonts (Inter, Outfit) | Premium modern typography |
| **Notebook** | Jupyter / nbformat, nbconvert | EDA, visualizations, model experiments |

---

## 📊 Dataset

**File:** `Carbon Emission.csv`  
**Rows:** 10,000 individuals  
**Target Column:** `CarbonEmission` (kg CO2e per year)

### Input Features (19 columns)

| Category | Features |
|---|---|
| Personal | Sex, Body Type, Diet, How Often Shower, Social Activity |
| Home Energy | Heating Energy Source, Energy Efficiency, TV/PC Hours, Internet Hours, Cooking_With |
| Transportation | Transport Mode, Vehicle Type, Vehicle Monthly Distance Km |
| Consumption | Monthly Grocery Bill, How Many New Clothes Monthly, Frequency of Traveling by Air |
| Waste | Waste Bag Size, Waste Bag Weekly Count, Recycling |

> **Note:** `Vehicle Type` is `NaN` for ~67% of the dataset — logically filled with `'none'` for users who travel by public transport or walk/cycle.

---

## 🤖 Machine Learning Pipeline

### Models Evaluated

| Model | MAE (kg/yr) | RMSE (kg/yr) | R² Score |
|---|---|---|---|
| Linear Regression | 524.1 | 651.7 | 0.5915 |
| Random Forest | 231.6 | 309.8 | 0.9077 |
| **HistGradientBoosting** | **117.5** | **159.0** | **0.9757** ✅ |

### Top Feature Importances (Random Forest)

| Feature | Importance |
|---|---|
| Vehicle Monthly Distance Km | 38.1% |
| Frequency of Traveling by Air | 23.3% |
| Vehicle Type | 16.4% |
| How Many New Clothes Monthly | 4.9% |
| Waste Bag Weekly Count | 2.7% |

---

## 🏭 Industrial Scope Breakdown (GHG Protocol)

The app classifies predicted emissions into internationally recognized ESG scopes:

| Scope | Type | Examples |
|---|---|---|
| **Scope 1** 🔴 | Direct Emissions | Private vehicle fuel burning, home coal/wood/gas heating |
| **Scope 2** 🔵 | Purchased Electricity | Appliances, electric heating, EV charging, computing |
| **Scope 3** 🟢 | Indirect Value Chain | Food diet, aviation, clothing manufacturing, groceries, landfill |

The dashboard displays a **live stacked progress bar** showing each scope's % share of total footprint.

---

## ✨ Premium Features

### 🎯 AI Prediction Engine
- Powered by a pre-trained `HistGradientBoostingRegressor` (R² = 97.57%).
- Instant prediction via a REST API endpoint (`POST /api/predict`).
- Classifies footprint as **Low / Moderate / High** with color-coded badges.
- Animated semicircle gauge meter comparing user to the 2,000 kg average.

### 📋 4-Step Multi-Wizard Form
- Organized into Personal, Energy, Travel, and Waste categories.
- **Dynamic field toggling** — Vehicle Type/Distance fields only appear when "Private Vehicle" is selected.
- Progress bar and stepper indicators guide the user through each section.
- Custom glassmorphic checkboxes for cooking appliances and recycling types.

### 🌿 Interactive Carbon Offsetting Simulator
Test real-time mitigation strategies with live sliders and toggles:

| Control | Offset Calculated |
|---|---|
| 🌲 Plant Trees (0–100) | 22 kg CO2e per tree per year |
| ☀️ Solar Energy (0–100%) | Reduces up to 80% of Scope 2 electricity emissions |
| ⚡ Switch to EV | Eliminates 75% of Scope 1 fuel emissions |
| 🥦 Go Plant-Based | Cuts Scope 3 diet emissions by up to 1,500 kg/year |

The simulation output panel updates the footprint score **in real time** without any additional API calls.

### 📄 Export & Report Features
| Button | Output |
|---|---|
| **Export JSON** | Downloads full prediction payload (emission, scopes, recommendations, inputs) |
| **Export CSV** | Downloads emission metrics + all input parameters in tabular format |
| **Download PDF Report** | Triggers browser print — generates a clean, styled PDF using CSS `@media print` |

### 🎯 Personalized Action Plan
After each prediction, the app generates **category-tagged recommendations** specific to the user's profile, e.g.:
- `Diet (Scope 3)` — Suggest vegetarian shift for omnivore users.
- `Transportation (Scope 1)` — Flag petrol/diesel vehicles and suggest EV.
- `Air Travel (Scope 3)` — Flag frequent flyers with rail alternatives.
- `Waste Management (Scope 3)` — Recommend recycling if not currently practiced.

---

## 🚀 How to Run

### Prerequisites
Make sure these Python packages are installed:
```bash
pip install flask scikit-learn pandas numpy joblib nbformat nbconvert
```

### Step 1 — Train & Save the Model
Only needs to be run once. It trains the model on the full dataset and saves it:
```bash
cd C:\hari\py_jupyter
python train_and_save_model.py
```
This generates `carbon_model.joblib` in the same directory.

### Step 2 — Start the Flask Server
```bash
python app.py
```
Expected output:
```
Loading model from C:\hari\py_jupyter\carbon_model.joblib...
Model loaded successfully.
 * Running on http://127.0.0.1:5000
```

### Step 3 — Open the App
Open your browser and visit:
```
http://127.0.0.1:5000
```

### Step 4 — (Optional) Explore the Jupyter Notebook
Open `carbon_emission.ipynb` in VS Code or Jupyter Lab to explore the complete data science pipeline, including EDA plots, model comparison table, and feature importance visualization.

---

## 🔌 API Reference

### `POST /api/predict`

Accepts a JSON body with all 19 lifestyle parameters and returns the carbon footprint prediction.

**Request Body (example):**
```json
{
  "Diet": "omnivore",
  "Transport": "private",
  "Vehicle Type": "petrol",
  "Vehicle Monthly Distance Km": 1000,
  "Heating Energy Source": "natural gas",
  "Frequency of Traveling by Air": "rarely",
  "Monthly Grocery Bill": 120,
  "How Many New Clothes Monthly": 2,
  "Recycling": ["Paper", "Plastic"],
  "Cooking_With": ["Stove", "Microwave"],
  "How Long TV PC Daily Hour": 3,
  "How Long Internet Daily Hour": 4,
  "Waste Bag Size": "medium",
  "Waste Bag Weekly Count": 2,
  "Energy efficiency": "Yes",
  "Sex": "female",
  "Body Type": "normal",
  "How Often Shower": "daily",
  "Social Activity": "sometimes"
}
```

**Response (example):**
```json
{
  "predicted_emission": 1015.95,
  "level": "Low (Eco-Friendly)",
  "level_color": "emerald",
  "level_desc": "Your carbon footprint is remarkably low!",
  "scopes": {
    "scope1": { "value": 333.93, "percentage": 32.9 },
    "scope2": { "value": 60.59,  "percentage": 6.0  },
    "scope3": { "value": 621.44, "percentage": 61.2 }
  },
  "recommendations": [
    {
      "category": "Diet (Scope 3)",
      "icon": "utensils",
      "text": "Shift towards a pescatarian, vegetarian, or vegan diet..."
    }
  ],
  "inputs": { ... }
}
```

---

## 📋 Files Reference

| File | Description |
|---|---|
| `Carbon Emission.csv` | Raw dataset — 10,000 rows, 20 columns |
| `carbon_emission.ipynb` | Jupyter notebook — full EDA and ML pipeline |
| `train_and_save_model.py` | Trains model on full dataset & saves to `carbon_model.joblib` |
| `carbon_model.joblib` | Serialized model payload (model + encoders + feature names) |
| `app.py` | Flask server — routes, prediction API, Scope calculation logic |
| `templates/index.html` | Full-page HTML with stepper form, ESG dashboard, simulator |
| `static/style.css` | Dark glassmorphic design + responsive grid + `@media print` |
| `static/app.js` | Multi-step navigation, API fetch, simulator math, export logic |

---

## 🌍 Emission Level Classification

| Level | Range | Badge Color |
|---|---|---|
| 🟢 Low (Eco-Friendly) | < 1,200 kg CO2e/yr | Emerald Green |
| 🟡 Moderate | 1,200 – 2,200 kg CO2e/yr | Amber Yellow |
| 🔴 High | > 2,200 kg CO2e/yr | Rose Red |

---

*Built as part of the Green Internship Project — Aligned with GHG Protocol Corporate Standard for Scope 1, 2, and 3 emissions categorization.*
