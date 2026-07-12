import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import HistGradientBoostingRegressor
import joblib
import os

print("Starting model training script...")

# 1. Load data
data_path = "Carbon Emission.csv"
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

df = pd.read_csv(data_path)
print(f"Data loaded successfully. Shape: {df.shape}")

# 2. Clean logical missing values
df['Vehicle Type'] = df['Vehicle Type'].fillna('none')

# 3. Categorical Encodings
cat_cols = df.select_dtypes(include=['object']).columns
le_dict = {}
df_encoded = df.copy()

for col in cat_cols:
    le = LabelEncoder()
    df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
    le_dict[col] = le

print("Categorical variables encoded.")

# 4. Features & Target
X = df_encoded.drop('CarbonEmission', axis=1)
y = df_encoded['CarbonEmission']

# 5. Model Training
print("Training HistGradientBoostingRegressor...")
model = HistGradientBoostingRegressor(random_state=42)
model.fit(X, y)
print("Model trained successfully.")


save_path = os.path.join(BASE_DIR, "carbon_model.joblib")
payload = {
    "model": model,
    "encoders": le_dict,
    "feature_names": list(X.columns),
    "categorical_columns": list(cat_cols)
}

joblib.dump(payload, save_path)
print(f"Model and encoders successfully saved to: {save_path}")
