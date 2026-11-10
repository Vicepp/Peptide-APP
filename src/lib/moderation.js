/*
 * Community safety: members may not share links, phone numbers or emails.
 * Only the admin can. (The same rule is enforced in firestore.rules.)
 */
const LINK = /(https?:\/\/|www\.)\S+|\b(t\.me|wa\.me|bit\.ly|tinyurl\.com)\b|\b[a-z0-9-]+\s*(\.|\(dot\)|\[dot\]|\sdot\s)\s*(com|net|org|io|co|me|ly|gg|app|shop|store|xyz|info|biz|us|uk|ca|au|de|ng|link|site|online|to|tv|ru|cn)\b/i
const EMAIL = /[a-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[a-z0-9-]+\s*(\.|\(dot\)|\sdot\s)\s*[a-z]{2,}/i
const PHONE = /\+?\d[\d\s().\-/]{6,}\d/g

function hasPhone(text) {
  return (text.match(PHONE) || []).some((m) => m.replace(/\D/g, '').length >= 9)
}

/** Returns an error message if the text breaks the rules, otherwise ''. */
export function checkContent(text, isAdmin = false) {
  if (isAdmin) return ''
  if (LINK.test(text)) return 'Links aren’t allowed in the community. Only the admin can share links.'
  if (EMAIL.test(text)) return 'Email addresses aren’t allowed in the community, for everyone’s safety.'
  if (hasPhone(text)) return 'Phone numbers aren’t allowed in the community, for everyone’s safety.'
  return ''
}
