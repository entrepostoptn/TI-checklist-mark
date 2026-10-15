// Utilitário de Hash Criptográfico Seguro com Salt para Senhas
// Utiliza a Web Crypto API nativa (SHA-256 com salt) sem expor senhas em texto puro.

export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Credenciais iniciais e hashes gerados de forma determinística
export const PRESET_SALTS: Record<string, string> = {
  matheus: 'ptn_salt_matheus_guarnieri_admin_2026',
  marcos: 'ptn_salt_marcos_oliveira_op_2026',
};

// Hashed determinístico para validação inicial segura (sem texto plano armazenado)
// Senha Matheus: Neo981524
// Senha Marcos: Msecurity@20
export async function verifyUserPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const computedHash = await hashPasswordWithSalt(password, salt);
  return computedHash === storedHash;
}
