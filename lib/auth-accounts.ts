export function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Member";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\d+$/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Member";
}
