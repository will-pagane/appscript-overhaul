import { TermConfig } from '../shared/types.js';
import { loadTerms, saveTerms } from '../shared/storage.js';
import { LOG_PREFIX, PREDEFINED_COLORS } from '../shared/constants.js';

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

  // Render color grid for add form
  const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
  const currentColor = colorPicker?.value || '#ff69b4';
  renderColorGrid('color-grid', currentColor);
  setupColorGridListeners('color-grid', 'color-picker', null);

  // Set up modal event listeners
  setupModalEventListeners();
}

/**
 * Global escape key handler (defined once, no memory leak)
 */
function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    const modal = document.getElementById('color-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeColorModal();
    }
  }
}

/**
 * Set up event listeners for color modal
 */
function setupModalEventListeners(): void {
  const modal = document.getElementById('color-modal');
  const closeButton = document.querySelector('.color-modal-close');
  const backdrop = document.querySelector('.color-modal-backdrop');

  if (!modal) return;

  // Close button
  closeButton?.addEventListener('click', closeColorModal);

  // Backdrop click to close
  backdrop?.addEventListener('click', closeColorModal);

  // Escape key to close (single global listener, no leak)
  document.removeEventListener('keydown', handleEscapeKey); // Remove if exists
  document.addEventListener('keydown', handleEscapeKey);

  // Set up color grid listeners for edit modal
  setupColorGridListeners('edit-color-grid', 'edit-color-picker', handleEditColorSelection);

  // Set up colorTarget radio button listeners for immediate save
  const colorTargetInputs = document.querySelectorAll('input[name="edit-color-target"]') as NodeListOf<HTMLInputElement>;
  colorTargetInputs.forEach(input => {
    input.addEventListener('change', async () => {
      try {
        const editColorPicker = document.getElementById('edit-color-picker') as HTMLInputElement;
        if (editColorPicker) {
          await handleEditColorSelection(editColorPicker.value);
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error handling colorTarget change:`, error);
        showFeedback('Failed to update color target', 'error');
      }
    });
  });
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

  // Single listener for color picker button clicks
  listContainer.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;

    // Handle color picker button clicks
    if (target.classList.contains('term-color-button')) {
      const index = parseInt(target.dataset.termIndex || '-1', 10);
      const currentColor = target.dataset.currentColor || '#ff69b4';
      const currentTarget = (target.dataset.currentTarget as 'font' | 'background') || 'background';
      if (index >= 0) {
        await openColorModal(index, currentColor, currentTarget);
      }
      return;
    }

    // Handle remove button clicks
    if (target.classList.contains('remove-button')) {
      await handleRemoveTerm(event);
    }
  });
}

/**
 * Open color modal for editing a term's color and color target
 */
async function openColorModal(termIndex: number, currentColor: string, currentTarget: 'font' | 'background'): Promise<void> {
  try {
    const modal = document.getElementById('color-modal');
    const editColorPicker = document.getElementById('edit-color-picker') as HTMLInputElement;
    const editColorTargetInputs = document.querySelectorAll('input[name="edit-color-target"]') as NodeListOf<HTMLInputElement>;

    if (!modal || !editColorPicker || editColorTargetInputs.length === 0) {
      console.error(`${LOG_PREFIX} Modal elements not found`);
      return;
    }

    // Set current color
    editColorPicker.value = currentColor;

    // Set current color target radio button
    editColorTargetInputs.forEach(input => {
      input.checked = input.value === currentTarget;
    });

    // Render color grid with current selection
    renderColorGrid('edit-color-grid', currentColor);

    // Store term index in modal dataset
    modal.dataset.termIndex = termIndex.toString();

    // Show modal
    modal.classList.remove('hidden');

    console.log(`${LOG_PREFIX} Color modal opened for term index ${termIndex} with target ${currentTarget}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error opening color modal:`, error);
    showFeedback('Failed to open color picker', 'error');
  }
}

/**
 * Close color modal
 */
function closeColorModal(): void {
  const modal = document.getElementById('color-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  delete modal.dataset.termIndex;

  console.log(`${LOG_PREFIX} Color modal closed`);
}

/**
 * Handle color selection in edit mode (immediate save)
 */
async function handleEditColorSelection(color: string): Promise<void> {
  try {
    const modal = document.getElementById('color-modal');
    if (!modal) {
      console.error(`${LOG_PREFIX} Modal not found in handleEditColorSelection`);
      return;
    }

    const termIndex = parseInt(modal.dataset.termIndex || '-1', 10);
    if (termIndex < 0) {
      console.error(`${LOG_PREFIX} Invalid term index in modal`);
      return;
    }

    const terms = await loadTerms();
    if (termIndex >= terms.length) {
      console.error(`${LOG_PREFIX} Term index out of bounds: ${termIndex}`);
      return;
    }

    const termName = terms[termIndex].term;

    // Get current colorTarget from radio buttons with runtime validation
    const colorTargetInput = document.querySelector('input[name="edit-color-target"]:checked') as HTMLInputElement;
    const rawColorTarget = colorTargetInput?.value;
    const colorTarget: 'font' | 'background' =
      (rawColorTarget === 'font' || rawColorTarget === 'background')
        ? rawColorTarget
        : (terms[termIndex].colorTarget ?? 'background');

    // Update color and ensure colorTarget is set
    terms[termIndex].color = color;
    terms[termIndex].colorTarget = colorTarget;

    const success = await saveTerms(terms);

    if (success) {
      console.log(`${LOG_PREFIX} Color updated for "${termName}" to ${color} (${colorTarget})`);
      showFeedback('Color updated', 'success');
      renderTermsList(terms);
      closeColorModal();
    } else {
      showFeedback('Failed to update color', 'error');
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error in handleEditColorSelection:`, error);
    showFeedback('Failed to update color', 'error');
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
  const colorTargetInput = document.querySelector('input[name="color-target"]:checked') as HTMLInputElement;

  if (!termInput || !colorPicker) {
    console.error(`${LOG_PREFIX} Form elements not found`);
    return;
  }

  const term = termInput.value.trim();
  const color = colorPicker.value;

  // Validate colorTarget at runtime (prevent DOM manipulation attacks)
  const rawColorTarget = colorTargetInput?.value;
  const colorTarget: 'font' | 'background' =
    (rawColorTarget === 'font' || rawColorTarget === 'background')
      ? rawColorTarget
      : 'background';

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

  const newTerm: TermConfig = { term, color, colorTarget };
  const updatedTerms = [...currentTerms, newTerm];

  const success = await saveTerms(updatedTerms);

  if (success) {
    showFeedback(`Term added with ${colorTarget} color`, 'success');
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

  // Normalize terms for backward compatibility (default to 'background' if missing)
  const normalizedTerms = terms.map(term => ({
    ...term,
    colorTarget: term.colorTarget ?? 'background'
  }));

  listContainer.innerHTML = normalizedTerms.map((term, index) => {
    const colorTargetLabel = term.colorTarget === 'font' ? 'Font' : 'Background';
    const colorTargetIcon = term.colorTarget === 'font' ? 'Aa' : '■';

    return `
    <div class="term-item" data-term-index="${index}">
      <button
        type="button"
        class="term-color-button"
        style="background-color: ${term.color}"
        data-term-index="${index}"
        data-current-color="${term.color}"
        data-current-target="${term.colorTarget}"
        title="Change color (${colorTargetLabel})"
        aria-label="Change color for ${escapeHtml(term.term)}"
      ></button>
      <span class="term-text">
        ${escapeHtml(term.term)}
        <span class="color-target-badge" title="${colorTargetLabel} color">${colorTargetIcon}</span>
      </span>
      <button
        type="button"
        class="remove-button"
        data-term-index="${index}"
        title="Remove term"
        aria-label="Remove ${escapeHtml(term.term)}"
      ><span aria-hidden="true">×</span></button>
    </div>
  `;
  }).join('');
}

/**
 * Render color grid in a container
 * @param containerId - ID of the container element
 * @param selectedColor - Currently selected color (hex string)
 */
function renderColorGrid(containerId: string, selectedColor: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`${LOG_PREFIX} Color grid container not found: ${containerId}`);
    return;
  }

  container.innerHTML = PREDEFINED_COLORS.map(color => `
    <div
      class="color-swatch ${color.toLowerCase() === selectedColor.toLowerCase() ? 'selected' : ''}"
      style="background-color: ${color}"
      data-color="${color}"
      title="${color}"
      role="button"
      tabindex="0"
      aria-label="Select color ${color}"
    ></div>
  `).join('');

  console.log(`${LOG_PREFIX} Color grid rendered with ${PREDEFINED_COLORS.length} colors`);
}

/**
 * Store references to event handlers to prevent duplicate listeners
 */
const gridClickHandlers = new Map<string, (event: Event) => void>();
const gridKeydownHandlers = new Map<string, (event: KeyboardEvent) => void>();
const pickerChangeHandlers = new Map<string, () => void>();

/**
 * Set up event listeners for color grid interactions
 * @param gridId - ID of the color grid container
 * @param pickerInputId - ID of the native color picker input
 * @param onColorSelect - Optional callback for immediate color selection (e.g., edit mode save)
 */
function setupColorGridListeners(
  gridId: string,
  pickerInputId: string,
  onColorSelect: ((color: string) => Promise<void>) | null
): void {
  const grid = document.getElementById(gridId);
  const pickerInput = document.getElementById(pickerInputId) as HTMLInputElement;

  if (!grid || !pickerInput) {
    console.error(`${LOG_PREFIX} Color grid or picker not found`);
    return;
  }

  // Remove existing listeners if present (prevent duplicates)
  const existingClickHandler = gridClickHandlers.get(gridId);
  if (existingClickHandler) {
    grid.removeEventListener('click', existingClickHandler);
  }

  const existingKeydownHandler = gridKeydownHandlers.get(gridId);
  if (existingKeydownHandler) {
    grid.removeEventListener('keydown', existingKeydownHandler);
  }

  const existingChangeHandler = pickerChangeHandlers.get(pickerInputId);
  if (existingChangeHandler) {
    pickerInput.removeEventListener('change', existingChangeHandler);
  }

  // Event delegation for color swatch clicks
  const clickHandler = async (event: Event) => {
    const target = event.target as HTMLElement;
    const swatch = target.closest('.color-swatch') as HTMLElement;
    if (!swatch) return;

    const color = swatch.getAttribute('data-color');
    if (!color) return;

    // Update hidden color picker value
    pickerInput.value = color;

    // Update visual selection in grid
    grid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');

    console.log(`${LOG_PREFIX} Color selected from grid: ${color}`);

    // Call optional callback (for edit mode immediate save)
    if (onColorSelect) {
      await onColorSelect(color);
    }
  };

  // Keyboard support for color swatches
  const keydownHandler = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target as HTMLElement;
    const swatch = target.closest('.color-swatch') as HTMLElement;
    if (!swatch) return;

    event.preventDefault();
    swatch.click(); // Trigger the click handler
  };

  // Update grid when custom picker changes
  const changeHandler = async () => {
    const customColor = pickerInput.value.toLowerCase();

    // Remove all selections (custom color might not be in grid)
    grid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));

    // If custom color matches a predefined color, highlight it (case-insensitive)
    const matchingSwatch = grid.querySelector(`[data-color="${customColor}"]`);
    if (matchingSwatch) {
      matchingSwatch.classList.add('selected');
    }

    console.log(`${LOG_PREFIX} Custom color selected: ${customColor}`);

    // Call optional callback (for edit mode immediate save)
    if (onColorSelect) {
      await onColorSelect(customColor);
    }
  };

  // Add listeners and store references
  grid.addEventListener('click', clickHandler);
  grid.addEventListener('keydown', keydownHandler);
  pickerInput.addEventListener('change', changeHandler);

  gridClickHandlers.set(gridId, clickHandler);
  gridKeydownHandlers.set(gridId, keydownHandler);
  pickerChangeHandlers.set(pickerInputId, changeHandler);
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
