import { supabase } from '../supamanager/supabase.js';

export async function fetchProductBySlug(slug) {
  const { data: produto, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !produto) throw new Error('Produto não encontrado');
  return produto;
}
