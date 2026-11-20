import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '../src/app/state';
import { Txt } from '../src/ui/Txt';

// Regression test: the pinyin function must not be handed to React as a state
// updater (it was, and every call received null/undefined).
describe('pinyin', () => {
  it('renders pinyin above Chinese characters', async () => {
    const errors: unknown[] = [];
    const orig = console.error;
    console.error = (...a: unknown[]) => { errors.push(a); };
    try {
      render(<AppProvider><p data-testid="t"><Txt pinyin>你好，AI 老师</Txt></p></AppProvider>);
      await waitFor(() => expect(screen.getByTestId('t').querySelectorAll('ruby')).toHaveLength(4));
      const rts = [...screen.getByTestId('t').querySelectorAll('rt')].map((r) => r.textContent);
      expect(rts).toEqual(['nǐ', 'hǎo', 'lǎo', 'shī']);
      expect(screen.getByTestId('t').textContent).toContain('AI');
      expect(errors.filter((e) => String(e).includes('pinyin'))).toEqual([]);
    } finally {
      console.error = orig;
    }
  });
});
