import React from 'react';
import { cn } from '../../utils/cn';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children, className, ...props
}) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full text-sm', className)} {...props}>{children}</table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children, className, ...props
}) => (
  <thead className={cn('bg-surface-raised border-b border-divider', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children, className, ...props
}) => (
  <tbody className={cn('divide-y divide-divider', className)} {...props}>{children}</tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children, className, ...props
}) => (
  <tr className={cn('hover:bg-brand-50 transition-colors duration-75', className)} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children, className, ...props
}) => (
  <th className={cn(
    'px-4 py-3 text-left text-xs font-bold text-ink-2 uppercase tracking-wider whitespace-nowrap',
    className
  )} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableDataCellElement>> = ({
  children, className, ...props
}) => (
  <td className={cn('px-4 py-3 text-ink whitespace-nowrap font-medium', className)} {...props}>
    {children}
  </td>
);
