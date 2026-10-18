// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders the copyright text', () => {
    render(<Footer />);
    const text = screen.getByText('© 2026 CorraMEP. Todos os direitos reservados.');
    expect(text).toBeDefined();
  });

  it('renders a footer element with the correct class', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer!.classList.contains('footer')).toBe(true);
  });

  it('contains a paragraph with footer__text class', () => {
    const { container } = render(<Footer />);
    const paragraph = container.querySelector('.footer__text');
    expect(paragraph).not.toBeNull();
    expect(paragraph!.textContent).toBe('© 2026 CorraMEP. Todos os direitos reservados.');
  });
});
