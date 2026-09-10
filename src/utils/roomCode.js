import { CODE_ALPHABET, CODE_LENGTH } from './constants.js'

/**
 * Generates a random room code from the unambiguous alphabet.
 * Example output: "HK4M7R"
 */
export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}
