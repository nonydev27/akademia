# components/

Shared, reusable UI pieces. Suggested first components to build (per PRD
section 9's "Clear status" and "Error guidance" principles):

- `StatusBadge.jsx` — colored pill for Active / Due / Paid / Withheld /
  Published / Expired / Locked.
- `DataTable.jsx` — reusable paginated/sortable table for students, payments,
  attendance sheets, etc.
- `FormField.jsx` — labeled input with inline validation error display.
- `ConfirmDialog.jsx` — used before destructive/irreversible actions (e.g.
  publishing results, overriding a fee lock — pair with a reason textbox for
  the audit log).
- `SubscriptionBanner.jsx` — persistent warning banner shown to School Admins
  during the grace period.
- `EmptyState.jsx` — friendly "nothing here yet" placeholder for lists.

Keep these dumb/presentational — no direct API calls inside; pass data and
callbacks in as props.
