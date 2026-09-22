# App shell rules

- **One control height, app-wide.** Every toolbar control is `h-9`. State it explicitly on each control even though it is the stock default — the failure mode is silent: one control two pixels off its neighbours.
- **One filled button per screen, and it is the commit.** Everything else is outline or ghost.
- **The content top bar holds the breadcrumb and app-wide actions only.** Page titles live in the page header, not the chrome. Do not render the same name in both.
- **Editor surfaces get their own toolbar** instead of the page header: back link, separator, inline title on the left; icon-only utilities and the commit on the right.
- **A collapsed sidebar must still show its own toggle.** `SidebarRail` is a 16px transparent strip nobody finds — hiding the `SidebarTrigger` in icon mode makes the collapse a one-way door. Hide the wordmark instead and centre the button.
- **Sentence case everywhere**, including the small print.
- **A tag is a label and must not borrow a button's silhouette.** If it is not pressable it must not look pressable.
- **Actions in the last table column**, as a menu when there are several.
- **`components/ui/*` stays unmodified** — put compositions outside that directory.
- **Two patched registry files:** `components/ui/sidebar.tsx` (TooltipProvider wrapper) and `hooks/use-mobile.ts` (state initializer). Both marked `NOT stock`.
