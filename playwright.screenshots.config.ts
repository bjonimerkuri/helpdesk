import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({ ...base, grepInvert: undefined, grep: /@screenshots/ });
