#!/bin/bash
# Đảm bảo tab đang active của Chrome là tab làm bài thi (không phải tab khác như ChatGPT).
osascript -e 'tell application "Google Chrome"
    set tabList to tabs of front window
    repeat with i from 1 to count of tabList
        if URL of item i of tabList contains "hoclaixethaiviet" then
            set active tab index of front window to i
        end if
    end repeat
end tell'
