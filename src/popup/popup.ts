import { TermConfig } from '../shared/types.js';
import { loadTerms, saveTerms } from '../shared/storage.js';
import { LOG_PREFIX } from '../shared/constants.js';

/**
 * Initialize popup when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

/**
 * Initialize the popup UI
 */
async function initializePopup(): Promise<void> {
  console.log(`${LOG_PREFIX} Popup initialized`);

  const terms = await loadTerms();
  renderTermsList(terms);
  setupEventListeners();
  setupTermListDelegation();
}

/**
 * Set up event listeners for the form
 */
function setupEventListeners(): void {
  const form = document.getElementById('add-term-form');
  if (form) {
    form.addEventListener('submit', handleAddTerm);
  }
}

/**
 * Set up event delegation for term list controls
 * Called once on init - handles all dynamically rendered term items
 */
function setupTermListDelegation(): void {
  const listContainer = document.getElementById('terms-list');
  if (!listContainer) return;

  // Single listener for all color changes
  listContainer.addEventListener('change', async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('term-color-picker')) {
      await handleColorChange(event);
    }
  });

  // Single listener for all remove clicks
  listContainer.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('remove-button')) {
      await handleRemoveTerm(event);
    }
  });
}

/**
 * Handle color change for a term
 */
async function handleColorChange(event: Event): Promise<void> {
  const picker = event.target as HTMLInputElement;
  const index = parseInt(picker.dataset.termIndex || '-1', 10);

  if (index < 0) return;

  const terms = await loadTerms();
  if (index >= terms.length) return;

  const newColor = picker.value;
  const termName = terms[index].term;

  terms[index].color = newColor;

  const success = await saveTerms(terms);

  if (success) {
    console.log(`${LOG_PREFIX} Color updated for "${termName}" to ${newColor}`);
    showFeedback('Color updated', 'success');
    // No need to re-render - color picker already shows new value
  } else {
    showFeedback('Failed to update color', 'error');
    // Revert picker to old value by re-loading
    const reloadedTerms = await loadTerms();
    if (index < reloadedTerms.length) {
      picker.value = reloadedTerms[index].color;
    }
  }
}

/**
 * Handle removing a term
 */
async function handleRemoveTerm(event: Event): Promise<void> {
  const button = event.target as HTMLButtonElement;
  const index = parseInt(button.dataset.termIndex || '-1', 10);

  if (index < 0) return;

  const terms = await loadTerms();
  if (index >= terms.length) return;

  const removedTerm = terms[index].term;

  // Remove term at index
  const updatedTerms = terms.filter((_, i) => i !== index);

  const success = await saveTerms(updatedTerms);

  if (success) {
    console.log(`${LOG_PREFIX} Term removed: "${removedTerm}"`);
    showFeedback('Term removed', 'success');
    renderTermsList(updatedTerms);
  } else {
    showFeedback('Failed to remove term', 'error');
  }
}

/**
 * Handle adding a new term
 */
async function handleAddTerm(event: Event): Promise<void> {
  event.preventDefault();

  const termInput = document.getElementById('term-input') as HTMLInputElement;
  const colorPicker = document.getElementById('color-picker') as HTMLInputElement;

  if (!termInput || !colorPicker) {
    console.error(`${LOG_PREFIX} Form elements not found`);
    return;
  }

  const term = termInput.value.trim();
  const color = colorPicker.value;

  // Validate empty term
  if (!term) {
    showFeedback('Please enter a term', 'error');
    return;
  }

  const currentTerms = await loadTerms();

  // Check for duplicates (case-insensitive)
  if (currentTerms.some(t => t.term.toLowerCase() === term.toLowerCase())) {
    showFeedback('Term already exists', 'error');
    return;
  }

  const newTerm: TermConfig = { term, color };
  const updatedTerms = [...currentTerms, newTerm];

  const success = await saveTerms(updatedTerms);

  if (success) {
    showFeedback('Term added successfully', 'success');
    termInput.value = '';
    renderTermsList(updatedTerms);
  } else {
    showFeedback('Failed to save term', 'error');
  }
}

/**
 * Render the list of terms with edit/remove controls
 */
function renderTermsList(terms: TermConfig[]): void {
  const listContainer = document.getElementById('terms-list');
  if (!listContainer) return;

  if (terms.length === 0) {
    listContainer.innerHTML = '<p class="empty-message">No terms configured yet</p>';
    return;
  }

  listContainer.innerHTML = terms.map((term, index) => `
    <div class="term-item" data-term-index="${index}">
      <input
        type="color"
        class="term-color-picker"
        value="${term.color}"
        data-term-index="${index}"
        title="Change color"
        aria-label="Change color for ${term.term}"
      >
      <span class="term-text">${escapeHtml(term.term)}</span>
      <button
        type="button"
        class="remove-button"
        data-term-index="${index}"
        title="Remove term"
        aria-label="Remove ${term.term}"
      ><span aria-hidden="true">×</span></button>
    </div>
  `).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show feedback message to user
 */
function showFeedback(message: string, type: 'success' | 'error'): void {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  feedback.textContent = message;
  feedback.className = `feedback ${type}`;

  // Clear any existing timeout
  const existingTimeout = feedback.dataset.timeoutId;
  if (existingTimeout) {
    clearTimeout(parseInt(existingTimeout, 10));
  }

  // Auto-hide after 3 seconds
  const timeoutId = setTimeout(() => {
    feedback.classList.add('hidden');
  }, 3000);

  feedback.dataset.timeoutId = timeoutId.toString();
}
