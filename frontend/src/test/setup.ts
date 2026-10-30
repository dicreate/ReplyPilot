import '@testing-library/jest-dom/vitest'

import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw-server'

// MSW для перехвата сетевых запросов во всех тестах
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
