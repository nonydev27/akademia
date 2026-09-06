# hooks/

Custom hooks to add as modules are built, e.g.:

- `useStudents.js` — fetch/search/paginate students for the current tenant.
- `useFeeBalance.js` — fetch a student's computed fee balance.
- `useSubscriptionStatus.js` — poll/fetch the tenant's subscription state for
  the SubscriptionBanner component.

Each hook should wrap `api/axiosClient.js` calls and expose
`{ data, isLoading, error, refetch }`-style state.
