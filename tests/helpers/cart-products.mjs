// Consistent catalog snapshots at the external product HTTP port.
export function productResponse(items) {
  const optionGroups = {};
  for (const item of items) {
    const group = optionGroups[item.styleId] ??= [];
    let product = group.find(product => product.productId === item.productId);
    if (!product) group.push(product = { productId: item.productId, styleId: item.styleId, color: { id: item.productId, label: item.color, hex: '#888888' }, variants: [] });
    product.variants.push({ id: item.variantId, size: item.size, stock: item.stock, priceOffset: item.priceOffset });
  }
  return { cartItems: items, optionGroups };
}
