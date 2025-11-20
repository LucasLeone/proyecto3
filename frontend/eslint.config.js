import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ===================================
      // MÉTRICA 1: Adherencia a Buenas Prácticas y "Code Smells"
      // ===================================
      
      // React Hooks - Garantiza la correcta utilización de Hooks
      'react-hooks/rules-of-hooks': 'error', // Los Hooks deben llamarse en el nivel superior
      'react-hooks/exhaustive-deps': 'warn', // Verifica las dependencias de useEffect
      
      // React - Buenas prácticas de componentes
      'react/jsx-key': ['error', { 
        checkFragmentShorthand: true,
        checkKeyMustBeforeSpread: true,
        warnOnDuplicates: true 
      }], // Key única en elementos de listas
      'react/jsx-no-duplicate-props': 'error', // Previene props duplicadas
      'react/jsx-no-undef': 'error', // Previene uso de componentes no definidos
      'react/jsx-uses-react': 'off', // No necesario en React 17+
      'react/jsx-uses-vars': 'error', // Marca componentes importados como usados
      'react/no-direct-mutation-state': 'error', // Previene mutación directa del estado
      'react/no-unescaped-entities': 'warn', // Advierte sobre entidades HTML no escapadas
      'react/prop-types': 'off', // Desactivado (podría activarse si usas PropTypes)
      'react/react-in-jsx-scope': 'off', // No necesario en React 17+
      
      // Accesibilidad (a11y) - Buenas prácticas de accesibilidad
      'jsx-a11y/alt-text': ['error', {
        elements: ['img', 'object', 'area', 'input[type="image"]'],
        img: ['Image'],
      }], // Texto alternativo en imágenes
      'jsx-a11y/anchor-is-valid': 'warn', // Links válidos
      'jsx-a11y/aria-props': 'error', // Props ARIA válidas
      'jsx-a11y/aria-proptypes': 'error', // Tipos de props ARIA válidos
      'jsx-a11y/aria-unsupported-elements': 'error', // Elementos que no soportan ARIA
      'jsx-a11y/click-events-have-key-events': 'warn', // Eventos de teclado junto a onClick
      'jsx-a11y/heading-has-content': 'warn', // Headings deben tener contenido
      'jsx-a11y/img-redundant-alt': 'warn', // Evita "image" o "photo" en alt text
      'jsx-a11y/no-access-key': 'warn', // Evita accessKey (problemas de a11y)
      
      // Console - Diferente severidad según entorno
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      
      // ===================================
      // MÉTRICA 2: Complejidad del Código
      // ===================================
      
      // Complejidad Ciclomática - Mantiene funciones simples
      'complexity': ['error', { max: 10 }], // Máximo 10 caminos por función
      
      // Límite de líneas por función - Fomenta componentes pequeños
      'max-lines-per-function': ['warn', {
        max: 150,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true
      }],
      
      // Límites adicionales de complejidad
      'max-depth': ['warn', 4], // Máximo 4 niveles de anidación
      'max-nested-callbacks': ['warn', 3], // Máximo 3 callbacks anidados
      'max-params': ['warn', 5], // Máximo 5 parámetros por función
      
      // ===================================
      // MÉTRICA 3: Errores Potenciales y Riesgos de Mantenimiento
      // ===================================
      
      // Variables no usadas - Código muerto
      'no-unused-vars': ['error', { 
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_|^React$'
      }],
      
      // Variables no definidas - Previene ReferenceError
      'no-undef': 'error',
      
      // Errores potenciales adicionales
      'no-unreachable': 'error', // Código inalcanzable después de return, throw, etc.
      'no-constant-condition': 'error', // Condiciones constantes en if/while
      'no-dupe-args': 'error', // Argumentos duplicados en funciones
      'no-dupe-keys': 'error', // Claves duplicadas en objetos
      'no-duplicate-case': 'error', // Cases duplicados en switch
      'no-empty': 'warn', // Bloques vacíos
      'no-func-assign': 'error', // Reasignación de funciones
      'no-sparse-arrays': 'error', // Arrays con elementos vacíos
      'use-isnan': 'error', // Uso correcto de isNaN
      'valid-typeof': 'error', // Comparaciones typeof válidas
      
      // Mejores prácticas adicionales
      'eqeqeq': ['error', 'always'], // Uso de === en lugar de ==
      'no-eval': 'error', // Prohibir eval()
      'no-implied-eval': 'error', // Prohibir eval() implícito
      'no-var': 'error', // Usar let/const en lugar de var
      'prefer-const': 'warn', // Preferir const cuando no se reasigna
      'no-shadow': 'warn', // Evitar variables que ocultan otras
    },
  },
])
