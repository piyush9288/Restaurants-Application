import os
import glob

def fix_api_url():
    base_dir = r"C:\Users\piyus\Downloads\Food_Application\apps"
    count = 0
    
    # We will replace 'http://127.0.0.1:8000' with API_URL
    # We need to insert the definition of API_URL at the top of the file if not present.
    # But since Expo and Vite handle env differently, it's easier to just do:
    # const API_URL = import.meta.env?.VITE_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    env_str = "const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';\n"
    
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.expo' in dirs:
            dirs.remove('.expo')
            
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if 'http://127.0.0.1:8000' in content:
                    # Replace occurrences
                    new_content = content.replace("'http://127.0.0.1:8000", "API_URL + '")
                    new_content = new_content.replace('`http://127.0.0.1:8000', '`${API_URL}')
                    
                    if "const API_URL =" not in new_content:
                        # insert after imports
                        lines = new_content.split('\n')
                        insert_idx = 0
                        for i, line in enumerate(lines):
                            if line.startswith('import '):
                                insert_idx = i + 1
                        lines.insert(insert_idx, env_str)
                        new_content = '\n'.join(lines)
                        
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    count += 1
                    print(f"Updated {path}")
                    
    print(f"Finished updating {count} files.")

if __name__ == "__main__":
    fix_api_url()
