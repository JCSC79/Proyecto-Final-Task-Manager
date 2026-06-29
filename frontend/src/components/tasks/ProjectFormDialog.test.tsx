import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectFormDialog } from './ProjectFormDialog';

// Global mocks

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Helpers

interface RenderOptions {
  mode?: 'create' | 'rename';
  isOpen?: boolean;
  currentName?: string;
  isLoading?: boolean;
}

function renderDialog(options: RenderOptions = {}) {
  const onConfirm = vi.fn();
  const onClose   = vi.fn();
  render(
    <ProjectFormDialog
      mode={options.mode ?? 'create'}
      isOpen={options.isOpen ?? true}
      currentName={options.currentName}
      isLoading={options.isLoading ?? false}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  return { onConfirm, onClose };
}

// Tests

describe('ProjectFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Visibility 

  it('does not render when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Create mode 

  it('shows the "create" action button in create mode', () => {
    renderDialog({ mode: 'create' });
    expect(screen.getByText('create')).toBeInTheDocument();
  });

  it('shows the 5 colour swatches in create mode', () => {
    renderDialog({ mode: 'create' });
    // Each swatch has an aria-label equal to its hex colour
    expect(screen.getByLabelText('#4C90F0')).toBeInTheDocument();
    expect(screen.getByLabelText('#29A634')).toBeInTheDocument();
    expect(screen.getByLabelText('#C9372C')).toBeInTheDocument();
    expect(screen.getByLabelText('#BF7326')).toBeInTheDocument();
    expect(screen.getByLabelText('#7157D9')).toBeInTheDocument();
  });

  it('Save button is disabled when input is empty', () => {
    renderDialog({ mode: 'create' });
    expect(screen.getByText('create').closest('button')).toBeDisabled();
  });

  it('Save button is disabled when input has fewer than 2 characters', () => {
    renderDialog({ mode: 'create' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } });
    expect(screen.getByText('create').closest('button')).toBeDisabled();
  });

  it('Save button becomes enabled when input has 2+ characters', () => {
    renderDialog({ mode: 'create' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My Project' } });
    expect(screen.getByText('create').closest('button')).not.toBeDisabled();
  });

  it('calls onConfirm with trimmed name and default colour when submitted', () => {
    const { onConfirm } = renderDialog({ mode: 'create' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  New Project  ' } });
    fireEvent.click(screen.getByText('create'));
    expect(onConfirm).toHaveBeenCalledWith('New Project', '#4C90F0');
  });

  it('calls onConfirm with selected colour when a swatch is clicked before submit', () => {
    const { onConfirm } = renderDialog({ mode: 'create' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alpha' } });
    fireEvent.click(screen.getByLabelText('#29A634'));
    fireEvent.click(screen.getByText('create'));
    expect(onConfirm).toHaveBeenCalledWith('Alpha', '#29A634');
  });

  // Rename mode 

  it('shows the "save" action button in rename mode', () => {
    renderDialog({ mode: 'rename', currentName: 'Old Name' });
    expect(screen.getByText('save')).toBeInTheDocument();
  });

  it('does NOT show colour swatches in rename mode', () => {
    renderDialog({ mode: 'rename', currentName: 'Old Name' });
    expect(screen.queryByLabelText('#4C90F0')).not.toBeInTheDocument();
  });

  it('pre-fills input with currentName when dialog opens in rename mode', () => {
    const onConfirm = vi.fn();
    const onClose   = vi.fn();
    // Start closed so the open transition fires the sync
    const { rerender } = render(
      <ProjectFormDialog
        mode="rename"
        isOpen={false}
        currentName="Old Name"
        isLoading={false}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
    rerender(
      <ProjectFormDialog
        mode="rename"
        isOpen={true}
        currentName="Old Name"
        isLoading={false}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
    expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument();
  });

  it('Save is disabled when name has not changed in rename mode', () => {
    renderDialog({ mode: 'rename', currentName: 'Old Name' });
    // Input is pre-filled with the current name — no changes made
    expect(screen.getByText('save').closest('button')).toBeDisabled();
  });

  it('Save is enabled when name changes in rename mode', () => {
    renderDialog({ mode: 'rename', currentName: 'Old Name' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New Name' } });
    expect(screen.getByText('save').closest('button')).not.toBeDisabled();
  });

  // Cancel 

  it('calls onClose when Cancel is clicked', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByText('cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
