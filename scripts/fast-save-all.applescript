tell application "System Events"
    tell process "Preview"
        set frontmost to true
        repeat 100 times
            set targetWins to (every window whose name starts with "Без названия" and not (name ends with ".jpeg" or name ends with ".jpg"))
            if (count of targetWins) is 0 then exit repeat
            
            set fw to front window
            set fwName to name of fw
            
            if not (fwName starts with "Без названия" and not (fwName ends with ".jpeg" or fwName ends with ".jpg")) then
                tell item 1 of targetWins to perform action "AXRaise"
                delay 0.1
            end if
            
            if (count of sheets of front window) > 0 then
                keystroke return
            else
                keystroke "w" using command down
                delay 0.2
                keystroke return
            end if
            delay 0.2
        end repeat
    end tell
end tell
