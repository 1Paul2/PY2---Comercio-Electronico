import { createContext, useContext } from 'react'

/**
 * Contexto del tema. Vive en este archivo (y no en ThemeContext.jsx) para
 * que ThemeContext.jsx exporte solo componentes y el Fast Refresh de Vite
 * funcione al editarlo.
 */
export const ThemeContext = createContext(null)

/**
 * Nombre: useTheme
 * Descripción: Accede al contexto del tema activo para leerlo o cambiarlo.
 * Entradas: No recibe parámetros.
 * Salidas: Objeto con el tema actual y la función toggleTheme.
 * Excepciones: No hay.
 */
export function useTheme() {
  return useContext(ThemeContext)
}
