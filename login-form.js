document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    // IDs que ahora SÍ COINCIDEN con tu HTML proporcionado
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('clave'); // ¡CORREGIDO: ahora busca 'clave'!
    const loginMessageDiv = document.getElementById('login-message');
    const pageTitle = document.querySelector('h1');

    // --- Lógica para el ojo de contraseña ---
    const togglePassword = document.getElementById('togglePassword');
    // Asegurarse de que el input de contraseña exista antes de intentar adjuntar el evento
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Cambiar el tipo del input entre 'password' y 'text'
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Cambiar el icono visualmente (👁️ ojo abierto, 🔒 candado/ojo cerrado)
            this.textContent = (type === 'password') ? '👁️' : '🔒';
        });
    }
    // ------------------------------------------

    const pendingLoginType = sessionStorage.getItem('pendingLoginType');
    let endpoint = '';

    if (pendingLoginType === 'admin') {
        endpoint = 'http://localhost:8080/usuario/list'; 
        pageTitle.textContent = 'Iniciar Sesión Admin';
    } else if (pendingLoginType === 'user') {
        endpoint = 'http://localhost:8080/usuario/list'; 
        pageTitle.textContent = 'Iniciar Sesión Usuario';
    } else {
        loginMessageDiv.textContent = 'Error: No se especificó el tipo de login.';
        loginMessageDiv.classList.add('error');
        loginMessageDiv.style.display = 'block';
        return;
    }

    // Asegurarse de que el formulario y sus inputs existan antes de añadir el evento
    // Esta comprobación es más robusta en caso de errores de carga del HTML
    if (loginForm && usernameInput && passwordInput && loginMessageDiv) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evita el envío por defecto del formulario

            // Limpiar mensajes anteriores
            loginMessageDiv.style.display = 'none';
            loginMessageDiv.classList.remove('success', 'error');

            const username = usernameInput.value;
            const password = passwordInput.value; // El valor de 'clave'

            if (!username || !password) {
                showMessage('Por favor, ingresa tu usuario y contraseña.', 'error');
                return;
            }

            try {
                // Realizar la solicitud GET para obtener la lista de usuarios (solo para pruebas)
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const users = await response.json();

                // Buscar el usuario en la lista (validación simulada en frontend)
                const userFound = users.find(u => u.usuario === username && u.clave === password);

                if (userFound) {
                    // Almacenar el objeto completo del usuario en localStorage para index.html
                    localStorage.setItem('loggedInUser', JSON.stringify(userFound));
                    
                    sessionStorage.setItem('loggedInUserType', pendingLoginType);
                    sessionStorage.removeItem('pendingLoginType');

                    // Mostrar mensaje de bienvenida usando el nombre (si existe) o el usuario
                    showMessage(`¡Bienvenido, ${userFound.nombre || userFound.usuario}! Redirigiendo...`, 'success');

                    setTimeout(() => {
                        window.location.href = `index.html`; // Redirige a index.html
                    }, 1500);
                } else {
                    showMessage('Usuario o contraseña incorrectos.', 'error');
                }

            } catch (error) {
                console.error('Error durante el login:', error);
                showMessage('Error al intentar iniciar sesión. Por favor, intenta de nuevo más tarde.', 'error');
            }
        });
    } else {
        // Mensaje de error si algún elemento crucial no se encuentra al inicio
        console.error("Error: Uno o más elementos del formulario de login no fueron encontrados. Verifica los IDs en tu HTML.");
        // Opcional: mostrar un mensaje visible al usuario si el formulario no funciona
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Error grave: El formulario de login no pudo ser inicializado correctamente. Contacta al soporte.</p>';
        }
    }

    // Función auxiliar para mostrar mensajes
    function showMessage(msg, type) {
        loginMessageDiv.textContent = msg;
        loginMessageDiv.classList.add(type);
        loginMessageDiv.style.display = 'block';
    }
});