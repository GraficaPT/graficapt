import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
export const SUPABASE_URL = 'https://nbcmqkcztuogflejswau.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL';
export const STORAGE_PUBLIC = 'https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function uploadImageToSupabase(file, slug) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
  const filePath = `${slug}/${fileName}`;
  const { error } = await supabase.storage.from('products').upload(filePath, file, { upsert: false });
  if (error) throw error;
  return filePath;
}
