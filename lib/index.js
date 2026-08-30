/**
 * dsh-copy-as-markdown — host half.
 *
 * This plugin is a browser-only surface: the row exists so the profile's
 * bundle composition mounts the package and the client module graph scans its
 * `dsh.client` declaration. There is deliberately no host-side behavior.
 */
export function apply() {
  // no host resources: everything lives in lib/client.js
}
