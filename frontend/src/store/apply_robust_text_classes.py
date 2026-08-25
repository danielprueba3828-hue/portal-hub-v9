import os

files_to_fix = [
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BodegaForm.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BitacoraAdmin.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BitacoraNueva.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BodegaAdmin.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\CargaExcel.jsx"
]

def apply_robust_text(file_path):
    print(f"Applying robust text classes to: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. H1 Page Titles
    content = content.replace(
        'className="text-3xl font-title font-black text-slate-900 dark:text-white flex items-center gap-3"',
        'className={`text-3xl font-title font-black flex items-center gap-3 ${tc.textPrimary}`}'
    )
    content = content.replace(
        'className="text-3xl md:text-4xl font-title font-black tracking-tight dark:text-white flex items-center justify-center md:justify-start gap-3"',
        'className={`text-3xl md:text-4xl font-title font-black tracking-tight flex items-center justify-center md:justify-start gap-3 ${tc.textPrimary}`}'
    )

    # 2. H2 Success Screen Titles
    content = content.replace(
        'className="text-3xl font-title font-black mb-4 text-slate-900 dark:text-white"',
        'className={`text-3xl font-title font-black mb-4 ${tc.textPrimary}`}'
    )

    # 3. H3 Card Section Titles
    content = content.replace(
        'className="text-xl font-title font-black text-slate-900 dark:text-white border-b pb-4 border-slate-150 dark:border-slate-800"',
        'className={`text-xl font-title font-black border-b pb-4 border-slate-150 dark:border-slate-800 ${tc.textPrimary}`}'
    )
    content = content.replace(
        'className="text-xl font-title font-black text-slate-900 dark:text-white border-b pb-2 border-slate-150 dark:border-slate-800"',
        'className={`text-xl font-title font-black border-b pb-2 border-slate-150 dark:border-slate-800 ${tc.textPrimary}`}'
    )
    content = content.replace(
        'className="text-lg font-title font-black text-slate-900 dark:text-white truncate"',
        'className={`text-lg font-title font-black truncate ${tc.textPrimary}`}'
    )
    content = content.replace(
        'className="text-2xl font-title font-black text-slate-900 dark:text-white"',
        'className={`text-2xl font-title font-black ${tc.textPrimary}`}'
    )

    # 4. Page descriptions and subtitles (textMuted)
    content = content.replace(
        'className="text-slate-500 dark:text-slate-400 mt-1"',
        'className={`mt-1 ${tc.textMuted}`}'
    )
    content = content.replace(
        'className="text-slate-500 dark:text-slate-400 mt-2"',
        'className={`mt-2 ${tc.textMuted}`}'
    )

    # 5. KPI card values
    content = content.replace(
        'className="text-2xl md:text-3xl font-title font-black mt-2 dark:text-white"',
        'className={`text-2xl md:text-3xl font-title font-black mt-2 ${tc.textPrimary}`}'
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Robust text classes injected successfully!")

for path in files_to_fix:
    apply_robust_text(path)

print("=== Text Class Upgrades Completed! ===")
