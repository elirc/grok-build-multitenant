import { render, screen } from '@testing-library/react';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage';

test('renders tenant context message', () => {
  render(<ProjectsPage />);
  expect(screen.getByText(/strictly isolated/i)).toBeInTheDocument();
});
