/**
 * Storage key for chrome.storage.sync - NEVER hardcode this value elsewhere
 */
export const STORAGE_KEY = 'highlightTerms';

/**
 * Log prefix for all console statements
 */
export const LOG_PREFIX = '[Highlight Extension]';

/**
 * Debounce delay for editor content changes (ms)
 */
export const DEBOUNCE_MS = 150;

/**
 * Predefined color palette for term highlighting
 * Organized by color families for easy selection (80 colors total)
 * Similar to Google Sheets color picker layout
 */
export const PREDEFINED_COLORS = [
  // Reds (8 colors)
  '#ff0000', '#cc0000', '#990000', '#660000',
  '#ff3333', '#ff6666', '#ff9999', '#ffcccc',

  // Oranges (8 colors)
  '#ff6600', '#ff8800', '#ffaa00', '#ff7700',
  '#ff9933', '#ffaa66', '#ffcc99', '#ffddcc',

  // Yellows (8 colors)
  '#ffff00', '#ffee00', '#ffdd00', '#ffcc00',
  '#ffff66', '#ffff99', '#ffffcc', '#fffff0',

  // Greens (12 colors)
  '#00ff00', '#00cc00', '#009900', '#006600',
  '#33ff33', '#66ff66', '#99ff99', '#ccffcc',
  '#00ff99', '#00cc99', '#009999', '#006666',

  // Blues (12 colors)
  '#0000ff', '#0000cc', '#000099', '#000066',
  '#3333ff', '#6666ff', '#9999ff', '#ccccff',
  '#0099ff', '#00ccff', '#00ffff', '#99ffff',

  // Purples & Pinks (12 colors)
  '#9900ff', '#9933ff', '#9966ff', '#cc33ff',
  '#cc00ff', '#cc66ff', '#cc99ff', '#dd99ff',
  '#ff00ff', '#ff66ff', '#ff99ff', '#ffccff',

  // Grays (12 colors)
  '#000000', '#333333', '#666666', '#999999',
  '#cccccc', '#dddddd', '#eeeeee', '#f0f0f0',
  '#f5f5f5', '#fafafa', '#ffffff', '#aaaaaa',

  // Browns & Earth Tones (8 colors)
  '#993300', '#cc6600', '#ff9966', '#cc9933',
  '#996633', '#cc9966', '#aa6633', '#ffddcc'
] as const;
