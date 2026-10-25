const form = document.querySelector('#loginForm');
const message = document.querySelector('#loginMessage');
const button = document.querySelector('#loginButton');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || 'No pudimos iniciar sesión.');
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    const safeNext = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\')
      ? requestedNext
      : '/home';
    window.location.assign(safeNext);
  } catch (error) {
    message.textContent = error.message || 'No se pudo conectar con el servidor.';
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});

