#!/usr/bin/env bash
# Runtime check of Home's date refresh (src/hooks/useToday.ts) on an Android emulator:
# the midnight timer and the foreground (AppState) refresh, without restarting the app.
#
# Needs: a rootable emulator (google_apis image) as the only adb device, Expo Go installed,
# and `npx expo start` running. Changes the emulator clock and restores automatic time at the end.
# Usage: scripts/android-week-rollover.sh [exp://<host>:8081]
set -euo pipefail

URL=${1:-exp://10.0.2.2:8081}
PKG=host.exp.exponent
DINNER=RolloverCheck

fail() { echo "FAIL: $*" >&2; exit 1; }
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null && adb exec-out cat /sdcard/ui.xml; }
has() { ui | grep -q -- "$1"; }
expect() { has "$1" || fail "expected '$1' on screen"; echo "ok: $1"; }
wait_for() { for _ in $(seq "${2:-30}"); do has "$1" && return; sleep 1; done; fail "timed out waiting for '$1'"; }
# Taps the centre of the first node whose content-desc starts with $1.
tap() {
  local b
  b=$(ui | grep -o "content-desc=\"$1[^\"]*\"[^>]*bounds=\"[^\"]*\"" | head -1 | grep -o '\[[0-9,]*\]\[[0-9,]*\]') || fail "no node '$1'"
  read -r x1 y1 x2 y2 <<<"$(tr '[],' '   ' <<<"$b")"
  adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
}
set_clock() { adb shell date "$1" >/dev/null; } # MMDDhhmmYYYY.ss, device local time
js_starts() { adb logcat -d -s ReactNativeJS:I | grep -c 'Running "main"' || true; }
# Backgrounds the app, changes the clock, and brings the same task back from Recents.
resume() {
  adb shell input keyevent KEYCODE_HOME; sleep 1
  set_clock "$1"; sleep 1
  adb shell input keyevent KEYCODE_APP_SWITCH; sleep 2
  tap 'Expo Go'; sleep 3
}
launch() {
  adb shell am force-stop "$PKG"
  # Expo Go's update cache rejects a launch after the clock moved backwards (UNIQUE constraint on
  # updates.commit_time). It is only a cache; matloop's AsyncStorage lives in a separate database.
  adb shell "rm -f /data/data/$PKG/databases/updates.db*"
  for _ in 1 2 3; do
    adb shell am start -a android.intent.action.VIEW -d "$URL" >/dev/null
    for _ in $(seq 15); do has 'Week ' && return; sleep 1; done
  done
  fail "app did not open $URL"
}

adb root >/dev/null; adb wait-for-device
adb shell settings put global auto_time 0
trap 'adb shell settings put global auto_time 1' EXIT

echo "== Sunday 11 Oct 2026 (ISO week 41): plan a dinner"
set_clock 101112002026.00
launch
expect 'Week 41, 2026'
has 'Clear dinner on Sunday 11 Oct' && tap 'Clear dinner on Sunday 11 Oct' && sleep 1
tap 'Dinner on Sunday 11 Oct'; sleep 1
adb shell input text "$DINNER"; sleep 1
adb shell input keyevent KEYCODE_ESCAPE; sleep 1
expect "text=\"$DINNER\""

echo "== Midnight timer: mounted Home crosses Sunday -> Monday"
set_clock 101123582026.00 # launching can take up to a minute; leave room before midnight
launch                     # schedule the timer against the new clock
expect 'Week 41, 2026'
pid=$(adb shell pidof "$PKG")
starts=$(js_starts)
wait_for 'Week 42, 2026' 180; echo "ok: Week 42, 2026"
expect '12 Oct – 18 Oct'
[ "$(adb shell pidof "$PKG")" = "$pid" ] || fail "app process restarted"
[ "$(js_starts)" = "$starts" ] || fail "JS bundle restarted"
echo "ok: same process and JS instance"

echo "== Resume: backgrounded on Monday 12 Oct, foregrounded on Monday 19 Oct (week 43)"
resume 101910002026.00
expect 'Week 43, 2026'
expect '19 Oct – 25 Oct'
[ "$(adb shell pidof "$PKG")" = "$pid" ] || fail "app process restarted"
[ "$(js_starts)" = "$starts" ] || fail "JS bundle restarted"
echo "ok: same process and JS instance"

echo "== Resume back in week 41: the earlier week's dinner is retained"
resume 101118002026.00
expect 'Week 41, 2026'
expect "text=\"$DINNER\""

echo "PASS"
