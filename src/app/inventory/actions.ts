import type { Dispatch, SetStateAction } from 'react';
import type { Product } from '@/lib/mock/inventory';
import { updateOps, applyBatchDelta, nextMovementId } from '@/lib/mock/inventory-ops';
import type { Movement, MoveType } from '@/lib/mock/inventory-ops';
import { CHANNEL_LABEL } from '@/lib/mock/inventory-utils';

export const CURRENT_USER = 'Ravi K.';

type SetInv = Dispatch<SetStateAction<Product[]>>;

export function logMovement(m: Omit<Movement, 'id' | 'ts'>) {
  updateOps((s) => ({
    movements: [{ ...m, id: nextMovementId(s.movements), ts: new Date().toISOString() }, ...s.movements],
  }));
}

function bump(setInventory: SetInv, productId: string, loc: string, delta: number) {
  setInventory((prev) =>
    prev.map((p) => (p.id === productId ? ({ ...p, [loc]: Math.max(0, (p as any)[loc] + delta) } as Product) : p))
  );
}

export function adjustStock(opts: {
  setInventory: SetInv;
  product: Product;
  loc: string;
  delta: number;
  reason: string;
  note?: string;
}) {
  const { setInventory, product, loc, delta, reason, note } = opts;
  bump(setInventory, product.id, loc, delta);
  if (loc === 'warehouse') updateOps((s) => ({ batches: applyBatchDelta(s.batches, product.id, delta) }));
  const type: MoveType = reason === 'Write-off (damaged / expired)' ? 'Write-off' : 'Adjustment';
  logMovement({
    type,
    productId: product.id,
    qty: Math.abs(delta),
    from: delta < 0 ? CHANNEL_LABEL[loc] : 'Adjustment',
    to: delta < 0 ? type : CHANNEL_LABEL[loc],
    ref: `ADJ-${Math.floor(100 + Math.random() * 900)}`,
    user: CURRENT_USER,
    note: note ? `${reason}. ${note}` : reason,
  });
}

export function transferStock(opts: { setInventory: SetInv; product: Product; from: string; to: string; qty: number; note?: string }) {
  const { setInventory, product, from, to, qty, note } = opts;
  bump(setInventory, product.id, from, -qty);
  bump(setInventory, product.id, to, qty);
  if (from === 'warehouse') updateOps((s) => ({ batches: applyBatchDelta(s.batches, product.id, -qty) }));
  if (to === 'warehouse') updateOps((s) => ({ batches: applyBatchDelta(s.batches, product.id, qty) }));
  logMovement({
    type: 'Transfer',
    productId: product.id,
    qty,
    from: CHANNEL_LABEL[from],
    to: CHANNEL_LABEL[to],
    ref: `TRF-${Math.floor(100 + Math.random() * 900)}`,
    user: CURRENT_USER,
    note,
  });
}
