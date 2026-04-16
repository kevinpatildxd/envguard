/**
 * Static bundle-size reference for the top-30 heavy npm packages.
 * Sizes are minified+gzipped (kB) from Bundlephobia as of 2025-Q1.
 * Keep this list sorted alphabetically.
 */

export interface BundleEntry {
  /** minified + gzipped size in kB */
  gzip: number;
  /** lighter alternative to suggest */
  alternative?: string;
}

export const BUNDLE_DATA: Record<string, BundleEntry> = {
  '@mui/material':     { gzip: 93,  alternative: 'shadcn/ui (zero-runtime)' },
  'antd':              { gzip: 189, alternative: 'radix-ui + tailwind' },
  'axios':             { gzip: 13,  alternative: 'ky or native fetch' },
  'chart.js':          { gzip: 63,  alternative: 'recharts or visx' },
  'core-js':           { gzip: 74 },
  'd3':                { gzip: 82,  alternative: 'import only the d3-* sub-packages you need' },
  'date-fns':          { gzip: 15,  alternative: 'temporal-polyfill or Intl.DateTimeFormat' },
  'draft-js':          { gzip: 145, alternative: 'tiptap or lexical' },
  'framer-motion':     { gzip: 57,  alternative: 'motion/react (Motion One) or CSS animations' },
  'fullcalendar':      { gzip: 168, alternative: 'react-big-calendar' },
  'highlight.js':      { gzip: 98,  alternative: 'shiki or prism-react-renderer' },
  'i18next':           { gzip: 34,  alternative: 'react-intl or @formatjs/intl' },
  'immutable':         { gzip: 17,  alternative: 'native Map/Set or immer' },
  'jquery':            { gzip: 30,  alternative: 'native DOM APIs' },
  'lodash':            { gzip: 71,  alternative: 'radash or native Array/Object methods' },
  'lodash-es':         { gzip: 71,  alternative: 'radash or native Array/Object methods' },
  'luxon':             { gzip: 23,  alternative: 'date-fns or Intl.DateTimeFormat' },
  'material-ui':       { gzip: 93,  alternative: 'shadcn/ui (zero-runtime)' },
  'moment':            { gzip: 72,  alternative: 'date-fns or dayjs (2 kB)' },
  'moment-timezone':   { gzip: 35,  alternative: 'date-fns-tz or Intl.DateTimeFormat' },
  'plotly.js':         { gzip: 436, alternative: 'recharts or visx' },
  'quill':             { gzip: 58,  alternative: 'tiptap or lexical' },
  'ramda':             { gzip: 45,  alternative: 'native Array/Object methods or remeda' },
  'react-bootstrap':   { gzip: 39,  alternative: 'shadcn/ui or headlessui' },
  'react-icons':       { gzip: 1,   alternative: 'import individual icons (already tree-shakeable)' },
  'rxjs':              { gzip: 50,  alternative: 'native Promises + zustand or jotai for state' },
  'styled-components': { gzip: 34,  alternative: 'CSS modules or tailwind' },
  'three':             { gzip: 165, alternative: 'import specific three/* sub-paths' },
  'underscore':        { gzip: 20,  alternative: 'native Array/Object methods or radash' },
  'xlsx':              { gzip: 240, alternative: 'csv-parse for CSV-only or exceljs' },
};

/** Threshold in kB (gzipped) above which we warn. */
export const BUNDLE_THRESHOLD_KB = 50;
