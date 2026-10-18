import json
import os
from typing import List, Dict, Any

DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "alumniMockData.js")

def load_alumni_database(custom_file_path: str = None) -> List[Dict[str, Any]]:
    """Loads alumni records from JSON database."""
    target_path = custom_file_path or DATA_FILE_PATH
    if os.path.exists(target_path):
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if "const alumniMockData =" in content:
                    content = content.split("const alumniMockData =", 1)[1]
                if "export default" in content:
                    content = content.split("export default", 1)[0]
                content = content.strip().rstrip(";")
                return json.loads(content)
        except Exception as e:
            print(f"[Python AI DB] Warning loading {target_path}: {e}")

    return []

def save_alumnus_record(alumnus_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Inserts a new alumnus record or updates an existing record by id or username.
    Persists changes to alumniMockData.js (JSON file).
    """
    records = load_alumni_database()
    
    existing_index = -1
    for idx, r in enumerate(records):
        if (alumnus_data.get("id") and r.get("id") == alumnus_data.get("id")) or \
           (alumnus_data.get("email") and r.get("email") == alumnus_data.get("email")):
            existing_index = idx
            break

    if existing_index >= 0:
        records[existing_index].update(alumnus_data)
        print(f"[Python AI DB] Updated existing alumnus profile: {alumnus_data['name']} ({alumnus_data['id']})")
    else:
        records.insert(0, alumnus_data)
        print(f"[Python AI DB] Ingested NEW alumnus profile: {alumnus_data['name']} ({alumnus_data['id']})")

    try:
        with open(DATA_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
    except Exception as e:
        print(f"[Python AI DB] Exception persisting database: {e}")

    return records
