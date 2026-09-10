import { getDatabase } from 'firebase/database'
import { app } from './config.js'

export const db = getDatabase(app)
