/** Maximum unplayed videos a single user can have queued */
export const MAX_PENDING = 5

/** Maximum allowed video duration in seconds (20 minutes) */
export const MAX_DURATION_SEC = 1200

/** If a guest drifts more than this many seconds, seek to correct */
export const DRIFT_THRESHOLD_SEC = 2

/** How often (ms) guests check their own drift — runs locally, no network */
export const DRIFT_CHECK_MS = 3000

/** Characters used for room codes — no ambiguous chars (0/O, 1/I/L) */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Length of generated room codes */
export const CODE_LENGTH = 6

/** Maximum display name length */
export const MAX_NAME_LENGTH = 20

/** Secret admin password — typed in the name prompt */
export const ADMIN_SECRET = '14319729'

/** Display name shown when admin logs in */
export const ADMIN_DISPLAY_NAME = 'Mhacccc'
