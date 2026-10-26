import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './pages';

describe('landing page', () => {
  it('introduces the fictional investigation and provides a create action', () => {
    render(<MemoryRouter><App/></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /every clue has a story/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create a mystery/i })).toHaveAttribute('href', '/cases/new');
    expect(screen.getByText(/fictional stories/i)).toBeInTheDocument();
  });
});
