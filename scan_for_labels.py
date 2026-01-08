import os
import pandas as pd

LABEL_NAMES = ['label', 'attack', 'class']
DATASET_DIR = '../dataset'

for root, dirs, files in os.walk(DATASET_DIR):
    for file in files:
        if file.endswith('.csv'):
            path = os.path.join(root, file)
            try:
                df = pd.read_csv(path, nrows=5)
                print(f'\nFile: {path}')
                print('Columns:', list(df.columns))
                if any(col.lower() in LABEL_NAMES for col in df.columns):
                    print('*** Found label column! ***')
                print(df.head())
            except Exception as e:
                print(f'Error reading {path}:', e) 