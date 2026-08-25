import os

files = [
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BitacoraNueva.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BodegaForm.jsx"
]

def add_global_style_tag(file_path):
    print(f"Injecting global style tag in: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # The style tag to inject
    style_tag = """      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-ring-focus:focus { border-color: ${myTheme.primary} !important; box-shadow: 0 0 0 3px ${myTheme.primary}20 !important; }
        .theme-accent-hover:hover { background-color: ${myTheme.primary}dd !important; }
        .theme-accent-border-hover:hover { border-color: ${myTheme.primary} !important; }
        .theme-accent-bg-hover:hover { background-color: ${myTheme.primary}20 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
        .theme-tab-active { border-color: ${myTheme.primary}80 !important; background-color: ${myTheme.primary}15 !important; }
        .theme-gradient-bg { background: linear-gradient(135deg, ${myTheme.primary} 0%, ${myTheme.primary}dd 100%) !important; }
        .theme-accent-shadow { box-shadow: 0 4px 20px -2px ${myTheme.primary}30 !important; }
      ` }} />"""

    # We want to inject it right after the start of the main return block:
    # return (
    #   <div className="max-w-4xl mx-auto py-6 px-4">
    
    target_pattern = 'return (\n    <div className="max-w-4xl mx-auto py-6 px-4">'
    replacement = 'return (\n    <div className="max-w-4xl mx-auto py-6 px-4">\n' + style_tag

    if target_pattern in content:
        content = content.replace(target_pattern, replacement)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("  Successfully injected!")
    else:
        # Try without the space-y or slightly different pattern
        target_pattern2 = 'return (\n    <div className="max-w-3xl mx-auto py-10 px-4">'
        # Let's search and replace with regex or standard find
        print("  Target pattern not matched exactly. Let's do a robust find.")
        
        # Find where "return (\n    <div" is located in the file
        import re
        match = re.search(r'return\s*\(\s*<div\s+className="max-w-4xl\s+mx-auto[^"]*"[^>]*>', content)
        if match:
            span = match.span()
            matched_str = content[span[0]:span[1]]
            content = content[:span[1]] + "\n" + style_tag + content[span[1]:]
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print("  Successfully injected using regex!")
        else:
            print("  🚨 Match NOT found. Style tag could not be injected.")

for file in files:
    add_global_style_tag(file)

print("=== Style Tag Injections Finished! ===")
