import type { Asset } from '@officing/api-client';
import { Btn } from '../../components/ui/Btn';
import { Field } from '../../components/ui/Field';
import { Plus, Xmark } from '@gravity-ui/icons';

export interface ItemDraft { asset: string; quantity: number; }
export interface InventoryState { items: ItemDraft[]; shipping: number; discount: number; }
export interface InventoryPayload {
  items: { asset: string; quantity: number; amount: number }[];
  taxRate: number;
  shipping: number;
  discount: number;
  subtotal: number;
  total: number;
}

function findAsset(assets: Asset[], id: string) { 
  const safeAssets = Array.isArray(assets) ? assets : [];
  return safeAssets.find(a => a._id === id); 
}

function itemAmount(assets: Asset[], item: ItemDraft) {
  const a = findAsset(assets, item.asset);
  return a ? Number(a.price) * item.quantity : 0;
}

function itemTax(assets: Asset[], item: ItemDraft) {
  const a = findAsset(assets, item.asset);
  return a ? (Number(a.price) * item.quantity * Number(a.taxRate)) / 100 : 0;
}

export function computeInventoryPayload(state: InventoryState, assets: Asset[]): InventoryPayload {
  const items    = state.items.filter(i => i.asset).map(i => ({ asset: i.asset, quantity: i.quantity, amount: itemAmount(assets, i) }));
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxRate  = state.items.reduce((s, i) => s + itemTax(assets, i), 0);
  const discountValue = state.discount ? (state.discount / 100) * subtotal : 0;
  const total    = subtotal + taxRate + (state.shipping || 0) - discountValue;
  return { items, taxRate, shipping: state.shipping || 0, discount: state.discount || 0, subtotal, total };
}

interface Props { assets: Asset[]; state: InventoryState; onChange: (s: InventoryState) => void; }

export function InventoryEditor({ assets, state, onChange }: Props) {
  // Defensive check: Ensure assets is definitely an array
  const safeAssets = Array.isArray(assets) ? assets : [];

  const assetOptions = [
    { value: '', label: '— Select item —' },
    ...safeAssets.map(a => ({ value: a._id, label: `${a.name} · ${Number(a.price).toLocaleString()}` })),
  ];

  const updateItem = (i: number, patch: Partial<ItemDraft>) => {
    onChange({ ...state, items: state.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  };
  const addItem    = () => onChange({ ...state, items: [...state.items, { asset: '', quantity: 1 }] });
  const removeItem = (i: number) => onChange({ ...state, items: state.items.filter((_, idx) => idx !== i) });

  const { taxRate, subtotal, total } = computeInventoryPayload(state, safeAssets);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div
        className="grid grid-cols-12 gap-2 px-1 pb-1"
        style={{ borderBottom: '1px solid var(--separator)' }}
      >
        {['Item', 'Qty', 'Amount', ''].map((h, i) => (
          <span key={i} className={`text-[11px] font-bold uppercase tracking-wide ${i === 0 ? 'col-span-6' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3' : 'col-span-1'}`} style={{ color: 'var(--muted)' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Line items */}
      {state.items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-6">
            <Field.Select options={assetOptions} value={item.asset} onChange={e => updateItem(i, { asset: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Field type="number" min="1" value={item.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} />
          </div>
          <div className="col-span-3 pt-2.5 text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {itemAmount(safeAssets, item).toLocaleString()}
          </div>
          <div className="col-span-1 pt-2">
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="rounded-lg p-1 transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label="Remove line"
            >
              <Xmark width={15} height={15} />
            </button>
          </div>
        </div>
      ))}

      <Btn type="button" variant="ghost" size="sm" onClick={addItem}>
        <Plus width={14} height={14} /> Add line item
      </Btn>

      {/* Totals */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: 'var(--surface-secondary)', borderTop: '1px solid var(--separator)' }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Shipping" type="number" step="0.01" min="0" value={state.shipping}
            onChange={e => onChange({ ...state, shipping: Number(e.target.value) })}
          />
          <Field label="Discount (%)" type="number" step="0.01" min="0" max="100" value={state.discount}
            onChange={e => onChange({ ...state, discount: Number(e.target.value) })}
          />
        </div>
        <div className="text-right space-y-1 pr-1 text-sm" style={{ color: 'var(--muted)' }}>
          <p>Subtotal: <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{subtotal.toLocaleString()}</span></p>
          <p>Tax: <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{taxRate.toLocaleString()}</span></p>
          <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
            Total: {total.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}