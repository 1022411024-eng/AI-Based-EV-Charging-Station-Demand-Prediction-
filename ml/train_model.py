import os
import sys
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


def train():
    # Resolve path to dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, '..', 'data', 'urban_ev.csv'),
        os.path.join(base_dir, 'data', 'urban_ev.csv'),
        'data/urban_ev.csv',
        os.path.abspath('data/urban_ev.csv'),
    ]

    data_path = None
    for cand in candidates:
        if os.path.exists(cand):
            data_path = cand
            break

    if not data_path:
        print("Error: Dataset not found in data/urban_ev.csv", file=sys.stderr)
        sys.exit(1)

    print(f"Loading EV charging dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df):,} records with columns: {list(df.columns)}")

    target_col = 'occupancy_rate'
    if target_col not in df.columns:
        print(f"Error: Target column '{target_col}' not found in dataset.", file=sys.stderr)
        sys.exit(1)

    # Derive hour / day_of_week from timestamp if missing
    if 'hour' not in df.columns and 'timestamp' in df.columns:
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    if 'day_of_week' not in df.columns and 'timestamp' in df.columns:
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.day_name()

    # Clean data types
    df['station_id'] = df['station_id'].astype(str)
    df['day_of_week'] = df['day_of_week'].astype(str)
    df['power_kw'] = pd.to_numeric(df['power_kw'], errors='coerce').fillna(100.0)
    df['temperature'] = pd.to_numeric(df['temperature'], errors='coerce').fillna(20.0)
    df['is_raining'] = pd.to_numeric(df['is_raining'], errors='coerce').fillna(0).astype(int)
    df['hour'] = pd.to_numeric(df['hour'], errors='coerce').fillna(12).astype(int)
    y = pd.to_numeric(df[target_col], errors='coerce').fillna(50.0)

    categorical_features = ['station_id', 'day_of_week']
    numeric_features = ['power_kw', 'temperature', 'is_raining', 'hour']
    feature_cols = categorical_features + numeric_features

    X = df[feature_cols]

    # 80/20 Train-Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    print(f"Training set: {len(X_train):,} samples | Test set: {len(X_test):,} samples (20%)")

    # OneHotEncoding for station_id and day_of_week, passthrough for numeric features
    try:
        cat_encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    except TypeError:
        cat_encoder = OneHotEncoder(handle_unknown='ignore', sparse=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', cat_encoder, categorical_features),
            ('num', 'passthrough', numeric_features),
        ]
    )

    # Random Forest Regressor
    rf_regressor = RandomForestRegressor(
        n_estimators=100,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    model_pipeline = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('regressor', rf_regressor),
        ]
    )

    print("Fitting RandomForestRegressor model...")
    model_pipeline.fit(X_train, y_train)

    # Evaluate on 20% test split
    y_pred = model_pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print("\n" + "=" * 55)
    print("EV CHARGING DEMAND MODEL - TEST SPLIT EVALUATION (20%)")
    print("=" * 55)
    print(f"MAE: {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R²: {r2:.4f}")
    print(f"R2: {r2:.4f}")
    print(f"Mean Absolute Error (MAE):       {mae:.2f}%")
    print(f"Root Mean Squared Error (RMSE):   {rmse:.2f}%")
    print(f"R² Score (Variance Explained):   {r2:.4f}")
    print("=" * 55)

    # Feature Importances
    fitted_rf = model_pipeline.named_steps['regressor']
    cat_trans = model_pipeline.named_steps['preprocessor'].named_transformers_['cat']
    onehot_feature_names = list(cat_trans.get_feature_names_out(categorical_features))
    all_feature_names = onehot_feature_names + numeric_features
    importances = fitted_rf.feature_importances_

    feature_importance_df = pd.DataFrame(
        {
            'Feature': all_feature_names,
            'Importance': importances,
        }
    ).sort_values(by='Importance', ascending=False)

    print("\nFEATURE IMPORTANCES:")
    print("-" * 55)
    print(f"{'Feature Name':<35} {'Importance':>15}")
    print("-" * 55)
    for _, row in feature_importance_df.iterrows():
        pct_bar = "█" * int(row['Importance'] * 30)
        print(f"{row['Feature']:<35} {row['Importance'] * 100:>7.2f}%  {pct_bar}")
    print("-" * 55)

    # Save trained model to ml/model.pkl
    output_model_path = os.path.join(base_dir, 'model.pkl')
    with open(output_model_path, 'wb') as f:
        pickle.dump(model_pipeline, f)

    print(f"\nModel successfully serialized and saved to: {output_model_path}\n")


if __name__ == '__main__':
    train()
