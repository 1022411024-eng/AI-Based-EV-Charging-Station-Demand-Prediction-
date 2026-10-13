import sys
import os
import json
import pickle
import pandas as pd


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, 'model.pkl'),
        'ml/model.pkl',
        os.path.abspath('ml/model.pkl'),
    ]

    model_path = None
    for cand in candidates:
        if os.path.exists(cand):
            model_path = cand
            break

    if not model_path:
        err = {"error": f"Model file not found. Please run ml/train_model.py first."}
        print(json.dumps(err), file=sys.stderr)
        sys.exit(1)

    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    # Read from stdin
    try:
        input_raw = sys.stdin.read().strip()
        if not input_raw:
            print(json.dumps({"error": "No JSON payload received on stdin"}), file=sys.stderr)
            sys.exit(1)
        data = json.loads(input_raw)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON on stdin: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    is_single_dict = False
    requested_json_output = False

    if isinstance(data, dict):
        if "records" in data and isinstance(data["records"], list):
            records = data["records"]
        else:
            records = [data]
            is_single_dict = True
            if data.get("format") == "json" or data.get("output_format") == "json":
                requested_json_output = True
    elif isinstance(data, list):
        records = data
    else:
        print(json.dumps({"error": "Expected JSON object or list on stdin"}), file=sys.stderr)
        sys.exit(1)

    if not records:
        if is_single_dict:
            print("0.00%")
        else:
            print(json.dumps([]))
        return

    # Normalize records into DataFrame
    feature_cols = ['station_id', 'power_kw', 'temperature', 'is_raining', 'day_of_week', 'hour']
    normalized = []
    for r in records:
        hour = r.get('hour')
        day_of_week = r.get('day_of_week')

        # Derive hour and day_of_week from timestamp if available and not explicitly provided
        if 'timestamp' in r and (hour is None or day_of_week is None):
            try:
                dt = pd.to_datetime(r['timestamp'])
                if hour is None:
                    hour = dt.hour
                if day_of_week is None:
                    day_of_week = dt.day_name()
            except Exception:
                pass

        if hour is None:
            hour = 12
        if day_of_week is None:
            day_of_week = 'Monday'

        entry = {
            'station_id': str(r.get('station_id', 'stn_001')),
            'power_kw': float(r.get('power_kw', 100.0)),
            'temperature': float(r.get('temperature', 20.0)),
            'is_raining': int(bool(r.get('is_raining', 0))),
            'day_of_week': str(day_of_week),
            'hour': int(hour),
        }
        normalized.append(entry)

    df = pd.DataFrame(normalized)[feature_cols]

    # Predict occupancy rates
    try:
        preds = model.predict(df)
    except Exception as e:
        print(json.dumps({"error": f"Model inference failed: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    results = []
    for i, pred in enumerate(preds):
        clamped = max(5.0, min(100.0, float(pred)))
        res_item = {
            "predicted_occupancy_rate": round(clamped, 2),
            "occupancy_rate": round(clamped, 2),
            "hour": normalized[i]["hour"],
            "station_id": normalized[i]["station_id"],
        }
        results.append(res_item)

    if is_single_dict and not requested_json_output:
        # Print predicted occupancy percentage to stdout
        pred_pct = results[0]["predicted_occupancy_rate"]
        print(f"{pred_pct:.2f}%")
    else:
        print(json.dumps(results if not (is_single_dict and requested_json_output) else results[0]))


if __name__ == '__main__':
    main()
