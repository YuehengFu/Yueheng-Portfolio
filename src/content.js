// Facts come from two places only:
// - the old portfolio (YuehengFu/Yueheng-Portfolio, src/components/*.jsx at
//   HEAD): YH Models, Markham Teen Arts Council, DECA, the numbers and the
//   toolkit;
// - the owner's current resume, approved for this site: Magic Hour AI and
//   Silver Owl Robotics, and the dates on every experience row.
// The wording is shorter and lowercase; the facts are not changed. The owner
// chose to keep the site's own titles and grant wording.
// Hyphenated words never break across lines: see components/Keep.jsx.

import catPrint from './assets/media/cat-print.webp'
import yhBird from './assets/media/yh-bird.webp'
import decaStage from './assets/media/deca-stage.webp'
import decaGroup from './assets/media/deca-group.webp'
import mtacSax from './assets/media/mtac-sax.webp'
import mtacDrive from './assets/media/mtac-drive.webp'
import mtacSolstice from './assets/media/mtac-solstice.webp'

export const EMAIL = 'yueheng.fu@uwaterloo.ca'
export const GITHUB = 'https://github.com/YuehengFu'
export const TIKTOK = 'https://www.tiktok.com/@yh.models'

// Photos, with their intrinsic sizes so nothing shifts while they load.
export const photos = {
  catPrint: { src: catPrint, w: 560, h: 746, alt: 'the printed cat: a white low-poly figurine on a shelf beside a plant' },
  yhBird: { src: yhBird, w: 640, h: 854, alt: 'a blue 3D-printed low-poly bird figurine standing among leaves' },
  decaStage: { src: decaStage, w: 720, h: 388, alt: 'five DECA members in suits on stage, wearing medals' },
  decaGroup: { src: decaGroup, w: 720, h: 540, alt: 'a large group photo of the DECA chapter in a conference hall' },
  mtacSax: { src: mtacSax, w: 720, h: 480, alt: 'a saxophonist, guitarist and singer performing at a Markham Teen Arts Council event' },
  mtacDrive: { src: mtacDrive, w: 720, h: 480, alt: 'donated food, pasta and canned goods piled on a table' },
  mtacSolstice: { src: mtacSolstice, w: 720, h: 406, alt: 'a poster for Solstice 2025 over a photo of the event' },
}

// Work, newest first by end date. `tint` colours the org's chip; `peek`
// lists the photos that float by the pointer on hover.
export const experience = [
  {
    org: 'David R. Cheriton School of Computer Science',
    tint: 'mint',
    role: 'undergraduate research assistant',
    dates: 'nov 2026 – now',
    note: 'researching LLM alignment and safety at the University of Waterloo: how language models can be influenced, and how to keep them reliable.',
  },
  {
    org: 'Magic Hour AI (YC W24)',
    tint: 'violet',
    role: 'applied machine learning intern',
    dates: 'oct 2026 – now',
    note: 'built an image outpainting tool that won 80% of head-to-head comparisons against the production expander.',
  },
  {
    org: 'YH Models',
    tint: 'amber',
    role: 'founder & product designer',
    dates: 'jun 2024 – feb 2026',
    note: 'original 3D-printed low-poly figurines, designed and sold online, with a $3,000 grant from the city.',
    peek: ['catPrint', 'yhBird'],
  },
]

// Volunteering, newest first by end date (ties: the later start first).
export const volunteering = [
  {
    org: 'DECA PETHS Chapter',
    tint: 'sky',
    role: 'co-president',
    dates: 'may 2025 – jun 2026',
    note: "led one of Ontario's largest DECA chapters, with 200+ members: 134 regional and 106 provincial awards.",
    peek: ['decaStage', 'decaGroup'],
  },
  {
    org: 'Markham Teen Arts Council',
    tint: 'rose',
    role: 'co-chair',
    dates: 'sep 2024 – jun 2026',
    note: 'youth division of the Markham Arts Council. organized fundraisers and events across York Region: $8,000+ revenue across two years.',
    peek: ['mtacSax', 'mtacDrive', 'mtacSolstice'],
  },
]

// The scrapbook: prints scattered on a board. x, y are the print's centre as
// a share of the board, w its width as a share, r its tilt in degrees.
export const prints = [
  { photo: 'yhBird', caption: 'yh models', x: 0.16, y: 0.25, w: 0.27, r: -6 },
  { photo: 'mtacSax', caption: 'mtac', x: 0.51, y: 0.17, w: 0.4, r: 4 },
  { photo: 'catPrint', caption: 'the cat, printed', x: 0.86, y: 0.27, w: 0.23, r: 7 },
  { photo: 'decaGroup', caption: 'deca', x: 0.2, y: 0.68, w: 0.38, r: 3 },
  { photo: 'mtacSolstice', caption: 'solstice 2025', x: 0.55, y: 0.5, w: 0.4, r: -3 },
  { photo: 'mtacDrive', caption: 'mtac', x: 0.52, y: 0.84, w: 0.34, r: 2 },
  { photo: 'decaStage', caption: 'deca', x: 0.83, y: 0.72, w: 0.36, r: -5 },
]

// The old "player stats" section, figure first.
export const numbers = [
  { figure: '1560', text: 'on the SAT, 99th percentile: 800 math, 760 reading & writing.' },
  { figure: '99th', text: 'percentile on the Fermat Math Contest, among 19,000 international competitors.' },
  {
    figure: '1 of 70',
    text: 'high school students selected nationwide by the University of Waterloo for the Lloyd Auckland Math Camp, by invitation for top contest performers.',
  },
  { figure: '5 / 5', text: 'on AP Calculus BC, Macroeconomics and Microeconomics, each self-studied.' },
]

export const toolkit = [
  ['languages', 'C/C++, Java, Python, JavaScript, HTML/CSS, Lua, SQL'],
  ['frameworks', 'React, Node.js'],
  ['libraries', 'NumPy, OpenCV, Pandas'],
  ['tools', 'Blender, SolidWorks'],
]
