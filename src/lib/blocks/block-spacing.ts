/**
 * Block Spacing Standards
 * 
 * Standard padding values to prevent text clipping by rounded corners.
 * 
 * For rounded-xl (12px radius), minimum inner padding should be 16px (p-4)
 * For rounded-2xl (16px radius), minimum inner padding should be 20px (p-5)  
 * For rounded-3xl (24px radius), minimum inner padding should be 24px (p-6)
 * 
 * Rule: inner padding >= border-radius to prevent visual clipping
 */

/**
 * Standard block container classes with proper padding for rounded corners
 * Use these instead of manually defining padding on block containers
 */
export const BLOCK_CONTAINER_CLASSES = {
  /** rounded-xl + p-4 - Standard card blocks */
  card: 'rounded-xl p-4',
  /** rounded-xl + p-4 sm:p-5 - Responsive card blocks */
  cardResponsive: 'rounded-xl p-4 sm:p-5',
  /** rounded-2xl + p-5 - Medium emphasis blocks */
  medium: 'rounded-2xl p-5',
  /** rounded-2xl + p-5 sm:p-6 - Responsive medium blocks */
  mediumResponsive: 'rounded-2xl p-5 sm:p-6',
  /** rounded-3xl + p-6 - Large/hero blocks */
  large: 'rounded-3xl p-6',
  /** rounded-3xl + p-6 sm:p-8 - Responsive large blocks */
  largeResponsive: 'rounded-3xl p-6 sm:p-8',
} as const;

/**
 * Inner content padding for nested rounded elements
 * When you have rounded parent with rounded children
 */
export const BLOCK_INNER_CLASSES = {
  /** For items inside rounded-xl container */
  item: 'rounded-lg p-3',
  /** For items inside rounded-xl container - responsive */
  itemResponsive: 'rounded-lg p-3 sm:p-4',
} as const;

/**
 * Get minimum padding class based on border-radius class
 * @param radiusClass - Tailwind border-radius class (e.g., 'rounded-xl')
 * @returns Minimum padding class to prevent clipping
 */
export function getMinPaddingForRadius(radiusClass: string): string {
  switch (radiusClass) {
    case 'rounded-3xl':
      return 'p-6';
    case 'rounded-2xl':
      return 'p-5';
    case 'rounded-xl':
      return 'p-4';
    case 'rounded-lg':
      return 'p-3';
    case 'rounded-md':
    case 'rounded':
      return 'p-2';
    default:
      return 'p-4';
  }
}
