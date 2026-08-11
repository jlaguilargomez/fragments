# Resource ownership

Fragments now carries the authenticated user ID through the application layer
into every repository operation. Reads, updates and deletes use both the user ID
and fragment ID in their SQL `WHERE` clause.

This makes ownership a persistence invariant: changing a client request or
calling the API directly cannot bypass the boundary enforced by the database
adapter.
