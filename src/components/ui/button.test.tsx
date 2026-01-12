import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with default variant and size', () => {
      renderWithProviders(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-slot', 'button');
    });

    it('should render with custom variant', () => {
      renderWithProviders(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button', { name: /delete/i });
      
      expect(button).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      renderWithProviders(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button', { name: /large button/i });
      
      expect(button).toBeInTheDocument();
    });

    it('should render as child when asChild is true', () => {
      renderWithProviders(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Interaction', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick} disabled>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      renderWithProviders(<Button>Accessible Button</Button>);
      const button = screen.getByRole('button', { name: /accessible button/i });
      
      expect(button).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      renderWithProviders(<Button aria-label="Custom Label">Icon</Button>);
      const button = screen.getByLabelText(/custom label/i);
      
      expect(button).toBeInTheDocument();
    });

    it('should indicate disabled state to screen readers', () => {
      renderWithProviders(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: /disabled button/i });
      
      expect(button).toBeDisabled();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      renderWithProviders(<Button className="custom-class">Styled Button</Button>);
      const button = screen.getByRole('button', { name: /styled button/i });
      
      expect(button).toHaveClass('custom-class');
    });

    it('should combine variant, size and className', () => {
      renderWithProviders(
        <Button variant="outline" size="sm" className="extra-class">
          Combined
        </Button>
      );
      const button = screen.getByRole('button', { name: /combined/i });
      
      expect(button).toHaveClass('extra-class');
      expect(button).toBeInTheDocument();
    });
  });
});
