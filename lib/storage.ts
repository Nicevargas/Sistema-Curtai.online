import { supabase } from './supabase';

/**
 * Faz o upload de uma imagem para o bucket do Supabase Storage
 * @param file O arquivo a ser enviado
 * @param bucket O nome do bucket (ex: 'capa')
 * @param folder Opcional: subpasta dentro do bucket
 * @returns A URL pública da imagem ou erro
 */
export async function uploadImage(file: File, bucket: string = 'capa', folder: string = ''): Promise<{ url: string | null, error: any }> {
  try {
    // Gera um nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Faz o upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Erro no upload:', error);
    return { url: null, error };
  }
}

/**
 * Exclui uma imagem do Supabase Storage a partir da sua URL
 * @param url A URL completa da imagem
 * @param bucket O nome do bucket
 */
export async function deleteImageByUrl(url: string, bucket: string = 'capa'): Promise<{ error: any }> {
  try {
    if (!url.includes(bucket)) return { error: 'URL não pertence ao bucket' };

    // Extrai o caminho do arquivo da URL
    // Exemplo: https://xxx.supabase.co/storage/v1/object/public/capa/arquivo.jpg
    const urlParts = url.split(`${bucket}/`);
    if (urlParts.length < 2) return { error: 'Caminho do arquivo não encontrado na URL' };
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    return { error };
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    return { error };
  }
}
