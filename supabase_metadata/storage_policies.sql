-- Políticas de Segurança para o Bucket "capa"

-- 1. Permitir que qualquer pessoa visualize as imagens (Leitura Pública)
CREATE POLICY "Permitir leitura pública de capas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'capa' );

-- 2. Permitir que usuários autenticados façam upload de imagens
CREATE POLICY "Permitir upload para usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'capa' 
  AND auth.role() = 'authenticated'
);

-- 3. Permitir que usuários autenticados atualizem suas próprias imagens
CREATE POLICY "Permitir atualização para usuários autenticados"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'capa'
  AND auth.role() = 'authenticated'
);

-- 4. Permitir que usuários autenticados excluam imagens
CREATE POLICY "Permitir exclusão para usuários autenticados"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'capa'
  AND auth.role() = 'authenticated'
);
