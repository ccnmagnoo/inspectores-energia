/**
 * Paleta cálida y terrosa del juego.
 * Todos los colores están en formato hexadecimal numérico (0xRRGGBB).
 */
export const C = {
  // Bases
  cream: 0xf6e7d3,
  creamDark: 0xe9d6bd,
  sand: 0xe4c9a8,
  wood: 0xb4794a,
  woodDark: 0x8a5533,
  terracotta: 0xd2703f,

  // Naturaleza
  olive: 0x7c9c5a,
  forest: 0x3f6b4a,
  leaf: 0x6fa04f,

  // Acentos
  sun: 0xffc94d,
  coral: 0xef6a5b,
  sky: 0x7fb8d9,
  purple: 0x9b7fb5,

  // Estados
  waste: 0xff8a3d,
  save: 0x5fd3a3,

  // Neutros
  white: 0xfdfaf4,
  offwhite: 0xefe8dc,
  gray: 0x9aa0a6,
  grayDark: 0x6f757b,
  ink: 0x33352f,
  metal: 0xb9c0c7,
  metalDark: 0x7d858c,

  // Efectos
  glass: 0xbfd9e6,
  ice: 0xa8d8ea,
  fire: 0xff7a3d,
  neon: 0xff6f91,
} as const;

export const palette = C;
export type PaletteKey = keyof typeof C;
