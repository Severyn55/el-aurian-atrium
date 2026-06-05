/**
 * Safety / ToS Schutz-Funktionen
 *
 * Cooldown und Confirm — wichtig für GitHub ToS Compliance.
 */

import { COOLDOWN_MS } from './constants';

let lastCommitTime = 0;

export function checkCommitCooldown(actionName = 'Commit'): boolean {
  const now = Date.now();
  const elapsed = now - lastCommitTime;
  if (elapsed < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    alert(
      `⏳ Cooldown aktiv: Bitte noch ${waitSec} Sekunden warten vor der nächsten ${actionName}.\n\n` +
        'Das schützt vor zu schnellen GitHub API Calls (ToS / Abuse Detection).'
    );
    return false;
  }
  return true;
}

export function recordCommitAction(): void {
  lastCommitTime = Date.now();
}

export function confirmCommit(actionDescription: string): boolean {
  return window.confirm(
    `Wirklich ${actionDescription}?\n\n` +
      'Änderung wird per GitHub Commit ins Repo geschrieben und triggert (meist) einen Deploy.\n' +
      'Token & Repo müssen korrekt sein (neuer Account!).\n\n' +
      'Fortfahren?'
  );
}
