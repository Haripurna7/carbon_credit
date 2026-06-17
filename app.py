from flask import Flask, request, jsonify, render_template
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load model and encoders
model_path = r"C:\hari\py_jupyter\carbon_model.joblib"
if not os.path.exists(model_path):
    model_path = "carbon_model.joblib"

print(f"Loading model from {model_path}...")
model_data = joblib.load(model_path)
model = model_data["model"]
encoders = model_data["encoders"]
feature_names = model_data["feature_names"]
print("Model loaded successfully.")

RECYCLING_ORDER = ['Paper', 'Plastic', 'Glass', 'Metal']
COOKING_ORDER = ['Stove', 'Oven', 'Microwave', 'Grill', 'Airfryer']

def format_recycling(items):
    if not items or len(items) == 0:
        return '[]'
    sorted_items = [x for x in RECYCLING_ORDER if x in items]
    return str(sorted_items)

def format_cooking_with(items):
    if not items or len(items) == 0:
        return '[]'
    sorted_items = [x for x in COOKING_ORDER if x in items]
    return str(sorted_items)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        # Parse inputs
        inputs = {}
        inputs['Monthly Grocery Bill'] = float(data.get('Monthly Grocery Bill', 120))
        inputs['Vehicle Monthly Distance Km'] = float(data.get('Vehicle Monthly Distance Km', 0))
        inputs['Waste Bag Weekly Count'] = float(data.get('Waste Bag Weekly Count', 2))
        inputs['How Long TV PC Daily Hour'] = float(data.get('How Long TV PC Daily Hour', 3))
        inputs['How Many New Clothes Monthly'] = float(data.get('How Many New Clothes Monthly', 2))
        inputs['How Long Internet Daily Hour'] = float(data.get('How Long Internet Daily Hour', 4))
        
        inputs['Body Type'] = data.get('Body Type', 'normal')
        inputs['Sex'] = data.get('Sex', 'female')
        inputs['Diet'] = data.get('Diet', 'omnivore')
        inputs['How Often Shower'] = data.get('How Often Shower', 'daily')
        inputs['Heating Energy Source'] = data.get('Heating Energy Source', 'natural gas')
        inputs['Transport'] = data.get('Transport', 'public')
        
        if inputs['Transport'] == 'private':
            inputs['Vehicle Type'] = data.get('Vehicle Type', 'petrol')
        else:
            inputs['Vehicle Type'] = 'none'
            inputs['Vehicle Monthly Distance Km'] = 0.0
            
        inputs['Social Activity'] = data.get('Social Activity', 'sometimes')
        inputs['Frequency of Traveling by Air'] = data.get('Frequency of Traveling by Air', 'rarely')
        inputs['Waste Bag Size'] = data.get('Waste Bag Size', 'medium')
        inputs['Energy efficiency'] = data.get('Energy efficiency', 'Yes')
        
        recycling_items = data.get('Recycling', [])
        inputs['Recycling'] = format_recycling(recycling_items)
        
        cooking_items = data.get('Cooking_With', [])
        inputs['Cooking_With'] = format_cooking_with(cooking_items)

        # Prepare encoded data for prediction
        encoded_inputs = inputs.copy()
        for col, le in encoders.items():
            val = encoded_inputs[col]
            if val not in le.classes_:
                if 'none' in le.classes_:
                    val = 'none'
                elif '[]' in le.classes_:
                    val = '[]'
                else:
                    val = le.classes_[0]
            encoded_inputs[col] = le.transform([val])[0]

        input_df = pd.DataFrame([encoded_inputs])[feature_names]
        predicted_emission = float(model.predict(input_df)[0])
        
        # --- Scope 1, 2, 3 Proportional Calculations ---
        s1_raw = 0.0
        # Direct Heating (Scope 1)
        if inputs['Heating Energy Source'] == 'coal':
            s1_raw += 400.0
        elif inputs['Heating Energy Source'] == 'natural gas':
            s1_raw += 200.0
        elif inputs['Heating Energy Source'] == 'wood':
            s1_raw += 150.0
        # Direct Transport fuel (Scope 1)
        if inputs['Transport'] == 'private' and inputs['Vehicle Type'] != 'electric':
            fuel_factors = {'petrol': 0.18, 'diesel': 0.20, 'lpg': 0.16, 'hybrid': 0.10}
            factor = fuel_factors.get(inputs['Vehicle Type'], 0.18)
            s1_raw += inputs['Vehicle Monthly Distance Km'] * 12.0 * factor

        s2_raw = 0.0
        # Purchased Energy (Scope 2)
        if inputs['Heating Energy Source'] == 'electricity':
            s2_raw += 300.0
        s2_raw += inputs['How Long TV PC Daily Hour'] * 365.0 * 0.12
        s2_raw += inputs['How Long Internet Daily Hour'] * 365.0 * 0.08
        
        cooking_weights = {'Stove': 100.0, 'Oven': 250.0, 'Microwave': 80.0, 'Grill': 120.0, 'Airfryer': 110.0}
        for item in cooking_items:
            s2_raw += cooking_weights.get(item, 50.0)
            
        # EV Charging (Scope 2)
        if inputs['Transport'] == 'private' and inputs['Vehicle Type'] == 'electric':
            s2_raw += inputs['Vehicle Monthly Distance Km'] * 12.0 * 0.05

        s3_raw = 0.0
        # Supply Chain & Lifestyle (Scope 3)
        diet_weights = {'vegan': 500.0, 'vegetarian': 800.0, 'pescatarian': 1100.0, 'omnivore': 2000.0}
        s3_raw += diet_weights.get(inputs['Diet'], 1500.0)
        
        flight_weights = {'never': 0.0, 'rarely': 600.0, 'frequently': 2500.0, 'very frequently': 6500.0}
        s3_raw += flight_weights.get(inputs['Frequency of Traveling by Air'], 1000.0)
        
        s3_raw += inputs['How Many New Clothes Monthly'] * 12.0 * 15.0
        s3_raw += inputs['Monthly Grocery Bill'] * 12.0 * 0.8
        
        size_multipliers = {'small': 2.0, 'medium': 5.0, 'large': 8.0, 'extra large': 12.0}
        waste_mult = size_multipliers.get(inputs['Waste Bag Size'], 5.0)
        s3_raw += inputs['Waste Bag Weekly Count'] * 52.0 * waste_mult
        
        # Recycling discount
        s3_raw -= len(recycling_items) * 120.0
        if s3_raw < 100.0:
            s3_raw = 100.0

        # Normalization
        total_raw = s1_raw + s2_raw + s3_raw
        if total_raw <= 0:
            total_raw = 1.0

        scope1_val = predicted_emission * (s1_raw / total_raw)
        scope2_val = predicted_emission * (s2_raw / total_raw)
        scope3_val = predicted_emission * (s3_raw / total_raw)

        # Classification
        if predicted_emission < 1200:
            level = "Low (Eco-Friendly)"
            level_color = "emerald"
            level_desc = "Your carbon footprint is remarkably low! You are living a highly sustainable lifestyle."
        elif predicted_emission < 2200:
            level = "Moderate"
            level_color = "amber"
            level_desc = "Your carbon footprint is about average. There are several areas where you can reduce your impact."
        else:
            level = "High"
            level_color = "rose"
            level_desc = "Your carbon footprint is higher than average. Implementing sustainable changes is highly recommended."

        # Compile recommendations
        recommendations = []
        if inputs['Diet'] == 'omnivore':
            recommendations.append({
                "category": "Diet (Scope 3)",
                "text": "Shift towards a pescatarian, vegetarian, or vegan diet, or reduce red meat consumption. Livestock farming represents a major greenhouse gas source.",
                "icon": "utensils"
            })
        if inputs['Transport'] == 'private' and inputs['Vehicle Type'] in ['petrol', 'diesel', 'lpg']:
            recommendations.append({
                "category": "Transportation (Scope 1)",
                "text": f"Your vehicle runs on {inputs['Vehicle Type']}. Shifting to hybrid/electric vehicles, or carpooling/biking, will substantially reduce carbon output.",
                "icon": "car"
            })
        if inputs['Vehicle Monthly Distance Km'] > 1200:
            recommendations.append({
                "category": "Transportation (Scope 1)",
                "text": f"Driving {int(inputs['Vehicle Monthly Distance Km'])} km monthly generates significant emissions. Plan fewer, consolidated trips or consider remote communication.",
                "icon": "route"
            })
        if inputs['Frequency of Traveling by Air'] in ['frequently', 'very frequently']:
            recommendations.append({
                "category": "Air Travel (Scope 3)",
                "text": "Frequent air travel has a high emissions density per passenger mile. Consider taking fewer flights or looking into high-speed rail options.",
                "icon": "plane"
            })
        if inputs['Heating Energy Source'] in ['coal', 'wood']:
            recommendations.append({
                "category": "Home Energy (Scope 1)",
                "text": f"Using {inputs['Heating Energy Source']} heating is highly emissions-heavy. Transition to natural gas, heat pumps, or renewable electrical sources.",
                "icon": "fire"
            })
        if inputs['How Many New Clothes Monthly'] > 4:
            recommendations.append({
                "category": "Consumption (Scope 3)",
                "text": f"Purchasing {int(inputs['How Many New Clothes Monthly'])} new clothes monthly contributes to fashion waste. Try purchasing second-hand or buying durable clothing.",
                "icon": "tshirt"
            })
        if len(recycling_items) == 0:
            recommendations.append({
                "category": "Waste Management (Scope 3)",
                "text": "Start sorting and recycling household waste (Plastic, Glass, Paper, Metal) to minimize landfill emissions.",
                "icon": "recycle"
            })
            
        if not recommendations:
            recommendations.append({
                "category": "Sustainability",
                "text": "Excellent job! You are already practicing outstanding carbon-reduction habits. Keep it up!",
                "icon": "leaf"
            })

        return jsonify({
            "predicted_emission": round(predicted_emission, 2),
            "level": level,
            "level_color": level_color,
            "level_desc": level_desc,
            "recommendations": recommendations,
            "inputs": inputs,
            "scopes": {
                "scope1": {
                    "value": round(scope1_val, 2),
                    "percentage": round((scope1_val / predicted_emission) * 100, 1) if predicted_emission > 0 else 0
                },
                "scope2": {
                    "value": round(scope2_val, 2),
                    "percentage": round((scope2_val / predicted_emission) * 100, 1) if predicted_emission > 0 else 0
                },
                "scope3": {
                    "value": round(scope3_val, 2),
                    "percentage": round((scope3_val / predicted_emission) * 100, 1) if predicted_emission > 0 else 0
                }
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
