// services/editorService.ts
import { debounce } from 'lodash-es';

// Mock data for autocomplete suggestions
const MOCK_SUGGESTIONS = [
    'authentication', 'refactor', 'database', 'migration', 'deployment',
    'bugfix', 'critical', 'performance', 'optimization', 'frontend',
    'backend', 'user-interface', 'UX/UI', 'sprint-planning'
];

/**
 * Simulates fetching autocomplete suggestions from a backend service.
 * @param query The 3+ character query to search for.
 * @returns A promise that resolves to an array of matching suggestion strings.
 */
export const getAutocompleteSuggestions = debounce(async (query: string): Promise<string[]> => {
    console.log(`Fetching suggestions for "${query}"...`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network latency
    if (query.length < 3) {
        return [];
    }
    const lowerCaseQuery = query.toLowerCase();
    const results = MOCK_SUGGESTIONS.filter(term => term.toLowerCase().startsWith(lowerCaseQuery));
    return results.slice(0, 4); // Return max 4 suggestions
}, 150);
