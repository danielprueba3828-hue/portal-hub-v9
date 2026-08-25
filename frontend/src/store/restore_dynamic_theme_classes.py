import os

files_to_fix = [
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BodegaForm.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BitacoraAdmin.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BitacoraNueva.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\BodegaAdmin.jsx",
    r"C:\Users\User\Desktop\horario\marathon-horarios\frontend\src\pages\CargaExcel.jsx"
]

def restore_dynamic_styles(file_path):
    print(f"Restoring dynamic style classes in: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Define all replacements
    replacements = [
        (
            'className="p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] space-y-6 animate-fade-in-up" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] space-y-8 animate-fade-in-up" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-8 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-8 md:p-12 rounded-3xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] text-center animate-fade-in-up" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-8 md:p-12 border shadow-sm text-center animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)]" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-5 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] grid grid-cols-1 md:grid-cols-3 gap-4" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-8 rounded-3xl border shadow-sm text-center border-red-500/20 max-w-md mx-auto ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="py-16 px-4 rounded-3xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md text-center" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`py-16 px-4 rounded-3xl border shadow-sm text-center ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-6 rounded-3xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] premium-shadow-hover relative flex flex-col justify-between h-[230px]" style={{ borderLeft: \'4px solid \' + myTheme.primary }}',
            'className={`p-6 rounded-3xl border shadow-sm premium-shadow-hover relative flex flex-col justify-between h-[230px] ${tc.cardBg}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-5 rounded-3xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] space-y-4 relative overflow-hidden" style={{ borderLeft: \'4px solid \' + (myTheme.primary || \'#2563EB\') }}',
            'className={`p-5 rounded-3xl border shadow-sm space-y-4 relative overflow-hidden ${tc.cardBg || \'bg-white border-marathon-light\'}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] space-y-4" style={{ borderLeft: \'4px solid \' + (myTheme.primary || \'#2563EB\') }}',
            'className={`p-5 rounded-2xl border shadow-sm space-y-4 ${tc.cardBg || \'bg-white border-marathon-light\'}`} style={tc.cardBgStyle}'
        ),
        (
            'className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/8 bg-white/85 dark:bg-[#131C33]/60 backdrop-blur-xl shadow-md dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] space-y-4" style={{ borderLeft: \'4px solid \' + (myTheme.primary || \'#2563EB\') }}',
            'className={`p-6 rounded-2xl border shadow-sm space-y-4 ${tc.cardBg || \'bg-white border-marathon-light\'}`} style={tc.cardBgStyle}'
        )
    ]

    replaced_count = 0
    for target, replacement in replacements:
        if target in content:
            content = content.replace(target, replacement)
            replaced_count += 1

    if replaced_count > 0:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  Successfully restored {replaced_count} card styles!")
    else:
        print("  No hardcoded card styles found to restore.")

for path in files_to_fix:
    restore_dynamic_styles(path)

print("=== Style Restorations Completed! ===")
