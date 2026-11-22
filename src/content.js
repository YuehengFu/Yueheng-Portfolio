// Facts come from two places only:
// - the old portfolio (YuehengFu/Yueheng-Portfolio, src/components/*.jsx at
//   HEAD): YH Models, Markham Teen Arts Council, DECA, the projects, the
//   numbers and the toolkit;
// - the owner's current resume, approved for this site: Magic Hour AI and
//   Silver Owl Robotics.
// The wording is shorter and lowercase; the facts are not changed. Still
// waiting on the owner: the MTAC title change and the YH grant source, so
// those stay exactly as the old portfolio has them.
// Hyphenated words never break across lines: see components/Text.jsx.

export const EMAIL = 'yueheng.fu@uwaterloo.ca'
export const GITHUB = 'https://github.com/YuehengFu'

// Newest first. The three older entries have no dates in the source, so they
// keep the old portfolio's order after the dated ones.
export const experience = [
  {
    org: 'Magic Hour AI (YC W24)',
    role: 'applied machine learning intern',
    figure: 'oct 2026 – now',
    note: 'built an image outpainting tool that won 80% of head-to-head comparisons against the production expander.',
  },
  {
    org: 'Silver Owl Robotics',
    role: 'software engineer',
    figure: 'may 2024 – may 2025',
    note: 'optimised a C++ PID movement control system, raising autonomous speeds up to 15%.',
  },
  {
    org: 'YH Models',
    role: 'founder & product designer',
    figure: '$3,000 grant from the city',
    note: 'original 3D-printed low-poly figurines, designed and sold online.',
  },
  {
    org: 'Markham Teen Arts Council',
    role: 'co-chair',
    figure: '$8,000+ revenue across two years',
    note: 'youth division of the Markham Arts Council. organized fundraisers and events across York Region.',
  },
  {
    org: 'DECA PETHS Chapter',
    role: 'co-president',
    figure: '134 regional and 106 provincial awards',
    note: "led one of Ontario's largest DECA chapters, with 200+ members.",
  },
]

export const projects = [
  {
    title: 'Impulse',
    tags: 'java · greenfoot',
    note: 'a java space shooter built from scratch with the Greenfoot library. artwork handmade in Piskel.',
    href: 'https://github.com/YuehengFu/Impulse',
  },
  {
    title: 'Ancient Greece Battleground Simulation',
    tags: 'java · greenfoot',
    note: 'includes special events with Poseidon, Hades, Zeus & more.',
    href: 'https://github.com/YuehengFu/YuehengFuVehicleSimulator',
  },
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
