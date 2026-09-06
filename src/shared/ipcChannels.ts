/**
 * Central registry of IPC channel names. Importing from here instead of
 * hand-typing strings on both ends of the bridge is what stops a typo from
 * turning into a silent, hard-to-debug dead channel.
 */
export const IPC = {
  pets: {
    list: "pets:list",
    create: "pets:create",
    remove: "pets:remove",
    poke: "pets:poke",
  },
  settings: {
    get: "settings:get",
    set: "settings:set",
    /** main -> every open pet window, broadcast after a settings change that doesn't require recreating the window */
    changed: "settings:changed",
  },
  windows: {
    openOnboarding: "windows:openOnboarding",
    openSettings: "windows:openSettings",
    closeCurrent: "windows:closeCurrent",
  },
  pet: {
    /** main -> pet window, broadcasts the current coarse activity */
    activity: "pet:activity",
    /** pet window -> main, this window's id, sent once on mount */
    ready: "pet:ready",
  },
} as const;
