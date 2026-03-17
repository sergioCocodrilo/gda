import pandas as pd
import os

def prepare_data():
    """
    Reads all .xlsx files from the 'data/data' directory, extracts specified columns,
    and saves the data as JSON files in 'vite-dashboard/public/data'.
    """
    input_dir = "data/caltraf"
    output_dir = "vite-dashboard/public/data"
    os.makedirs(output_dir, exist_ok=True)

    columns_to_keep = [
        'CENTRO DE MANTENIMIENTO', 'CLLI_REAL', 'EDIFICIO', 'A.- Cob', 'B.- NC', 
        'C.- OC', 'D.- INC', 'E.- TNP', 'F.- Intentos', 'Paso', 'Bloi', 'Bloe', 
        'FTS', 'FTE', 'OPR', 'Vacantes', 'Falla Tecnica', 'TIPO', 'TECNOLOGIA', 
        'NOMBRE', 'year', 'month'
    ]

    for filename in os.listdir(input_dir):
        if filename.endswith(".xlsx") and "_Q" in filename:
            file_path = os.path.join(input_dir, filename)
            
            # Extract year and month from filename
            date_part = filename.split('_Q')[-1].split('.')[0]
            year = "20" + date_part[:2]
            month = date_part[2:]
            
            # Read excel file
            df = pd.read_excel(file_path, sheet_name="Datos")
            
            # Add year and month columns
            df['year'] = year
            df['month'] = month

            # Add missing columns with default values if they don't exist
            for col in columns_to_keep:
                if col not in df.columns:
                    df[col] = None
            
            # Filter to keep only specified columns
            df_filtered = df[columns_to_keep]

            # Generate output filename
            json_filename = f"Q{date_part}.json"
            output_path = os.path.join(output_dir, json_filename)
            
            # Save to JSON
            df_filtered.to_json(output_path, orient="records", indent=4)
            print(f"Successfully converted {filename} to {json_filename}")

if __name__ == "__main__":
    prepare_data()
