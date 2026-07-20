import React from 'react';
import type { Asset } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

export interface ItemDraft {
  asset: string;
  quantity: number;
}

export interface InventoryState {
  items: ItemDraft[];
  shipping: number;
  discount: number; // percentage
}

export interface InventoryPayload {
  items: { asset: string; quantity: number; amount: number }[];
  taxRate: number; // NOTE: backend field name — actually a computed tax AMOUNT, not a %
  shipping: number;
  discount: number;
  subtotal: number;
  total: number;
}

function findAsset(assets: Asset[], id: string): Asset | undefined {
  return assets.find(a => a._id === id);
}

function itemAmount(assets: Asset[], item: ItemDraft): number {
  const asset = findAsset(assets, item.asset);
  return asset ? Number(asset.price) * item.quantity : 0;
}

function itemTax(assets: Asset[], item: ItemDraft): number {
  const asset = findAsset(assets, item.asset);
  return asset ? (Number(asset.price) * item.quantity * Number(asset.taxRate)) / 100 : 0;
}

export function computeInventoryPayload(state: InventoryState, assets: Asset[]): InventoryPayload {
  const items = state.items
    .filter(i => i.asset)
    .map(i => ({ asset: i.asset, quantity: i.quantity, amount: itemAmount(assets, i) }));
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxRate = state.items.reduce((s, i) => s + itemTax(assets, i), 0);
  const discountValue = state.discount ? (state.discount / 100) * subtotal : 0;
  const total = subtotal + taxRate + (state.shipping || 0) - discountValue;
  return { items, taxRate, shipping: state.shipping || 0, discount: state.discount || 0, subtotal, total };
}

interface Props {
  assets: Asset[];
  state: InventoryState;
  onChange: (state: InventoryState) => void;
}

export function InventoryEditor({ assets, state, onChange }: Props) {
  const assetOptions = [
    { value: '', label: '— Select item —' },
    ...assets.map(a => ({ value: a._id, label: `${a.name} (${a.price})` })),
  ];

  const updateItem = (i: number, patch: Partial<ItemDraft>) => {
    const items = state.items.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    onChange({ ...state, items });
  };
  const addItem = () => onChange({ ...state, items: [...state.items, { asset: '', quantity: 1 }] });
  const removeItem = (i: number) => onChange({ ...state, items: state.items.filter((_, idx) => idx !== i) });

  const { taxRate, subtotal, total } = computeInventoryPayload(state, assets);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
        <span className="col-span-6">Item</span>
        <span className="col-span-2">Qty</span>
        <span className="col-span-3">Amount</span>
      </div>
      {state.items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-6">
            <Select
              options={assetOptions}
              value={item.asset}
              onChange={e => updateItem(i, { asset: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={e => updateItem(i, { quantity: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-3 pt-2 text-sm font-medium">
            {itemAmount(assets, item).toLocaleString()}
          </div>
          <div className="col-span-1 pt-1.5">
            <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addItem}>+ Add Item</Button>

      <div className="border-t pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Shipping"
            type="number"
            step="0.01"
            min="0"
            value={state.shipping}
            onChange={e => onChange({ ...state, shipping: Number(e.target.value) })}
          />
          <Input
            label="Discount (%)"
            type="number"
            step="0.01"
            min="0"
            value={state.discount}
            onChange={e => onChange({ ...state, discount: Number(e.target.value) })}
          />
        </div>
        <div className="text-right text-sm text-gray-600 space-y-1 pr-1">
          <p>Subtotal: {subtotal.toLocaleString()}</p>
          <p>Tax: {taxRate.toLocaleString()}</p>
          <p className="font-semibold text-gray-900">Total: {total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
