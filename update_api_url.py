import os
import glob

def fix_api_url():
    base_dir = r"C:\Users\piyus\Downloads\Food_Application\apps"
    count = 0
    
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.expo' in dirs:
            dirs.remove('.expo')
            
        is_vite = 'admin-web' in root
            
        env_str = "const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';\n" if is_vite else "const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';\n"
        
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Find where const API_URL = ... is defined and replace it completely
                lines = content.split('\n')
                new_lines = []
                changed = False
                
                for line in lines:
                    if line.startswith('const API_URL = ') or line.startswith('// @ts-ignore'):
                        # Skip old definitions and ts-ignores to replace them
                        if line.startswith('const API_URL = '):
                            if is_vite:
                                new_lines.append('// @ts-ignore')
                            new_lines.append(env_str.strip())
                            changed = True
                    else:
                        new_lines.append(line)
                        
                if changed:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(new_lines))
                    count += 1
                    print(f"Updated {path}")
                    
    print(f"Finished updating {count} files.")

if __name__ == "__main__":
    fix_api_url()
