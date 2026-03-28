import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
