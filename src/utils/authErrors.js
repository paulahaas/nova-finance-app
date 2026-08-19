const MESSAGES = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em instantes.',
  'demo/account-not-found': 'Nenhuma conta encontrada com esse e-mail. Crie uma conta ou experimente o modo demonstração.',
};

export function friendlyAuthError(err) {
  return MESSAGES[err?.code] ?? err?.message ?? 'Não foi possível concluir a ação. Tente novamente.';
}
