// One table for the quantity rules both carts follow: apply_cart_operation (member, SQL) and
// applyGuestChange (guest, TypeScript). Both test files run every case, so changing one side alone fails a test.
// "line" is the cart line's quantity before the action (0: not in the cart yet); stocks are the variant's.

export const adjustCases = [
  { name: 'a decrease from above stock lands on stock at once', line: 5, delta: -1, stock: 3, expected: 3 },
  { name: 'a decrease never goes below 1', line: 1, delta: -1, stock: 3, expected: 1 },
  { name: 'an increase stops at stock', line: 3, delta: 1, stock: 3, expected: 3 },
  { name: 'an increase below stock adds one', line: 2, delta: 1, stock: 3, expected: 3 },
  { name: 'an increase never lowers a line above stock', line: 5, delta: 1, stock: 3, expected: 5 },
  { name: 'a sold-out line is not changed', line: 4, delta: -1, stock: 0, expected: 4 },
];

export const addCases = [
  { name: 'an add stops at stock', line: 1, added: 5, stock: 3, expected: 3 },
  { name: 'an add to a full line keeps it at stock', line: 3, added: 3, stock: 3, expected: 3 },
  { name: 'an add never lowers a line above stock', line: 5, added: 1, stock: 3, expected: 5 },
  { name: 'a new line stops at stock', line: 0, added: 7, stock: 3, expected: 3 },
];

// The line moves to another option of the same style; "target" is that option's existing line (0: none).
export const optionCases = [
  { name: 'a moved quantity stops at the new option stock', line: 5, target: 0, stock: 2, expected: 2 },
  { name: 'a move into a target above stock keeps the target', line: 2, target: 4, stock: 2, expected: 4 },
  { name: 'a move into a target below stock stops at stock', line: 2, target: 9, stock: 10, expected: 10 },
];
