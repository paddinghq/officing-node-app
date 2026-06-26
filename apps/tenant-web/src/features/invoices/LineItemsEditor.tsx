import React from 'react';
import type { LineItem } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemsEditor({ items, onChange }: Props) {
  const update = (i: number, field: keyof LineItem, val: string | number) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: field === 'name' ? val : Number(val) } : item);
    onChange(next);
  };

  const add = () => onChange([...items, { name: '', quantity: 1, rate: 0 }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
        <span className="col-span-5">Description</span>
        <span className="col-span-2">Qty</span>
        <span className="col-span-3">Rate</span>
        <span className="col-span-2">Amount</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-5">
            <Input
              value={item.name}
              onChange={e => update(i, 'name', e.target.value)}
              placeholder="Description"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={e => update(i, 'quantity', e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={item.rate}
              onChange={e => update(i, 'rate', e.target.value)}
            />
          </div>
          <div className="col-span-1 pt-2 text-sm font-medium">
            {((item.quantity || 0) * (item.rate || 0)).toLocaleString()}
          </div>
          <div className="col-span-1 pt-1.5">
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add}>+ Add Line</Button>
      <div className="text-right text-sm font-semibold text-gray-800 pr-8">
        Total: {items.reduce((s, i) => s + (i.quantity || 0) * (i.rate || 0), 0).toLocaleString()}
      </div>
    </div>
  );
}
