// Event sources do not all describe their response charset reliably. Keep
// their known encodings explicit so Danish characters are decoded before any
// crawler extracts title, description, place or address fields.
export const UTF8_RESPONSE_ENCODING = "utf-8";
export const KULTUNAUT_DETAIL_RESPONSE_ENCODING = "windows-1252";
