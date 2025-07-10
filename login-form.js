// Abre tu archivo login-form.js


        document.addEventListener('DOMContentLoaded', () => {
            const loginForm = document.getElementById('login-form');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginMessageDiv = document.getElementById('login-message');
            const pageTitle = document.querySelector('h1');

            // Obtener el tipo de login que se intentó desde index.html
            const pendingLoginType = sessionStorage.getItem('pendingLoginType');
            let endpoint = '';

            if (pendingLoginType === 'admin') {
                endpoint = 'http://localhost:8080/usuario/list'; // Asume este endpoint para admins
                pageTitle.textContent = 'Iniciar Sesión Admin';
            } else if (pendingLoginType === 'user') {
                endpoint = 'http://localhost:8080/usuario/list'; // Tu endpoint para usuarios
                pageTitle.textContent = 'Iniciar Sesión Usuario';
            } else {
                loginMessageDiv.textContent = 'Error: No se especificó el tipo de login.';
                loginMessageDiv.classList.add('error');
                loginMessageDiv.style.display = 'block';
                return; // Detiene la ejecución si no hay tipo de login
            }

            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const username = usernameInput.value;
                const password = passwordInput.value; // La usaremos para una simulación más completa

                loginMessageDiv.style.display = 'none';
                loginMessageDiv.classList.remove('success', 'error');

                try {
                    const response = await fetch(endpoint);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const users = await response.json();

                    // Buscar el usuario por el campo "usuario" y verificar la "clave" (simulado)
                    const userFound = users.find(u => u.usuario === username && u.clave === password); // <--- CAMBIO CLAVE AQUÍ

                    if (userFound) {
                        sessionStorage.setItem('loggedInUserType', pendingLoginType);
                        sessionStorage.setItem('loggedInUser', username);
                        sessionStorage.removeItem('pendingLoginType');

                        loginMessageDiv.textContent = `¡Bienvenido, ${username}! Redirigiendo...`;
                        loginMessageDiv.classList.add('success');
                        loginMessageDiv.style.display = 'block';

                        // Redirigir a index.html con un indicador de éxito
                        window.location.href = `index.html?loginSuccess=true&loggedInUserType=${pendingLoginType}&username=${username}`;
                    } else {
                        loginMessageDiv.textContent = 'Usuario o contraseña incorrectos.';
                        loginMessageDiv.classList.add('error');
                        loginMessageDiv.style.display = 'block';
                    }

                } catch (error) {
                    console.error('Error durante el login:', error);
                    loginMessageDiv.textContent = 'Error al intentar iniciar sesión. Por favor, intenta de nuevo más tarde.';
                    loginMessageDiv.classList.add('error');
                    loginMessageDiv.style.display = 'block';
                }
            });
        });
    