# Authentication and authorization

Authentication answers “who is this person?”; authorization answers “what may
this person access?”. Fragments performs authentication with a local email and
password, then authorizes every fragment query with the authenticated user ID.

The important invariant is that ownership is enforced in the repository query,
not only in the UI or route parameters. A valid session for one user must never
make another user’s fragment visible.
