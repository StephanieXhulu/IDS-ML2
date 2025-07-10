import pandas as pd

# Load the original data
input_path = 'dataset/Test_data.csv'
df = pd.read_csv(input_path)

# Add a Label column: 'Malicious' if src_bytes > 1000, else 'Benign'
df['Label'] = df['src_bytes'].apply(lambda x: 'Malicious' if x > 1000 else 'Benign')

# Save to a new file
output_path = 'dataset/Test_data_labeled.csv'
df.to_csv(output_path, index=False)

print(f"Labeled data saved to {output_path}. Label distribution:")
print(df['Label'].value_counts()) 