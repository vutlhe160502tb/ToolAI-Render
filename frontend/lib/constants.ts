/**
 * Shared constants for styling and configuration
 */

export const COLORS = {
  primary: '#D344FF',
  primaryHover: '#B836E6',
  background: {
    main: '#1A1A1A',
    card: '#252525',
    preview: '#2a2a2a',
    results: '#131313',
    button: '#101010',
  },
  border: {
    gray: 'border-gray-400/30',
    light: 'border-gray-400/20',
  },
} as const;

export const BORDER_RADIUS = {
  sm: 'rounded-[10px]',
  md: 'rounded-[20px]',
  lg: 'rounded-[25px]',
  full: 'rounded-full',
} as const;

export const SPACING = {
  container: 'px-4 sm:px-6',
  section: 'mb-4 sm:mb-6',
  padding: 'p-4 sm:p-6',
} as const;

export const FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
} as const;

export const FILE_SIZES = {
  image: 50 * 1024 * 1024, // 50MB
  video: 200 * 1024 * 1024, // 200MB
  audio: 50 * 1024 * 1024, // 50MB
} as const;

