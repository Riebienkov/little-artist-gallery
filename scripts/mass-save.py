import subprocess
import time

script_step = """
tell application "System Events" to tell process "Preview"
    set targetWins to (every window whose name starts with "Без названия" and not (name ends with ".jpeg" or name ends with ".jpg"))
    if (count of targetWins) is 0 then
        return "DONE"
    end if
    
    -- Check if any window already has a sheet
    repeat with w in targetWins
        set sList to sheets of w
        if (count of sList) > 0 then
            set sh to item 1 of sList
            set elem to entire contents of sh
            repeat with el in elem
                try
                    if class of el is button and (title of el is "Сохранить" or name of el is "Сохранить") then
                        click el
                        return "SAVED: " & (name of w)
                    end if
                end try
            end repeat
        end if
    end repeat
    
    -- If no sheet was open, trigger close on the first target window
    set w to item 1 of targetWins
    tell w
        click (first button whose subrole is "AXCloseButton")
    end tell
    return "TRIGGERED_CLOSE: " & (name of w)
end tell
"""

print("[Mass Save] Starting automatic save and close of all scanned drawings in Preview...")

count = 0
max_iterations = 200

while count < max_iterations:
    res = subprocess.run(["osascript", "-e", script_step], capture_output=True, text=True)
    out = res.stdout.strip()
    if not out:
        time.sleep(0.2)
        continue
    
    if out == "DONE":
        print("[Mass Save] All scanned drawings have been saved and closed successfully! 🎉")
        break
    
    if "SAVED:" in out or "TRIGGERED_CLOSE:" in out:
        print(f"[{count+1}] {out}")
    
    count += 1
    time.sleep(0.25)
