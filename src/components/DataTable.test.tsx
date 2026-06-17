import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable';

interface TestItem {
  id: number;
  name: string;
  value: number;
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value' },
];

const data: TestItem[] = [
  { id: 1, name: 'Alpha', value: 10 },
  { id: 2, name: 'Beta', value: 20 },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Value')).toBeDefined();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
  });

  it('renders empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No items" />);
    expect(screen.getByText('No items')).toBeDefined();
  });

  it('renders default empty message', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No data found')).toBeDefined();
  });

  it('shows edit button and triggers onEdit', () => {
    const onEdit = vi.fn();
    render(<DataTable columns={columns} data={data} onEdit={onEdit} />);
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBe(2);
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(data[0]);
  });

  it('shows delete button and triggers onDelete', () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={data} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBe(2);
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(data[0]);
  });

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('applies rowClass function', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowClass={() => 'custom-row'}
      />
    );
    const rows = document.querySelectorAll('tbody tr');
    expect(rows[0].className).toContain('custom-row');
  });

  it('renders custom cell content via render function', () => {
    const customColumns = [
      { key: 'name', label: 'Name', render: (item: TestItem) => `Mr. ${item.name}` },
    ];
    render(<DataTable columns={customColumns} data={data} />);
    expect(screen.getByText('Mr. Alpha')).toBeDefined();
  });

  it('respects pageSize limit', () => {
    const manyItems = Array.from({ length: 15 }, (_, i) => ({ id: i, name: `Item ${i}`, value: i }));
    render(<DataTable columns={columns} data={manyItems} pageSize={5} />);
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });
});
