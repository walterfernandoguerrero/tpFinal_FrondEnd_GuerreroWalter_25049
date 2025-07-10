document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        // Limpiar mensajes anteriores y sus estilos
        messageDiv.style.display = 'none';
        messageDiv.classList.remove('success', 'error');

        // Obtener los valores de los campos del formulario
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const dni = document.getElementById('dni').value;
        const usuario = document.getElementById('usuario').value;
        const clave = document.getElementById('clave').value;
        const confirmClave = document.getElementById('confirmClave').value;

        // --- Validación del lado del cliente ---
        if (clave !== confirmClave) {
            showMessage('Las contraseñas no coinciden.', 'error');
            return;
        }

        // Validación de DNI: 7 u 8 dígitos numéricos
        if (dni.length < 7 || dni.length > 8 || !/^[0-9]+$/.test(dni)) {
            showMessage('El DNI debe contener 7 u 8 dígitos numéricos.', 'error');
            return;
        }

        // Validación de longitud mínima para usuario
        if (usuario.length < 4) {
            showMessage('El usuario debe tener al menos 4 caracteres.', 'error');
            return;
        }

        // Validación de longitud mínima para contraseña
        if (clave.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        // --- Fin de Validación del lado del cliente ---

        // Preparar los datos para enviar al backend
        const userData = {
            nombre: nombre,
            apellido: apellido,
            dni: dni,
            usuario: usuario,
            clave: clave,
            rol: 2 // <-- ¡El rol se establece siempre en 2 para los usuarios registrados!
        };

        try {
            // Realizar la petición POST al endpoint de registro
            const response = await fetch('http://localhost:8080/usuario/nuevoUS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Indicar que enviamos un JSON
                },
                body: JSON.stringify(userData) // Convertir el objeto JavaScript a cadena JSON
            });

            if (response.ok) {
                // Si la respuesta es exitosa (código 2xx)
                showMessage('¡Usuario registrado con éxito! Redirigiendo a la página de inicio de sesión...', 'success');
                registerForm.reset(); // Limpiar el formulario
                setTimeout(() => {
                    window.location.href = 'login-form.html'; // Redirigir al login después de 2 segundos
                }, 2000);
            } else {
                // Si hubo un error en el servidor (ej. 400, 500)
                let errorMessage = 'Error al registrar usuario.';
                try {
                    const errorData = await response.json(); // Intentar leer el mensaje de error del backend
                    errorMessage = errorData.message || response.statusText;
                } catch (jsonError) {
                    errorMessage = response.statusText; // Si no es JSON, usar el estado del texto
                }
                showMessage(`Error al registrar usuario: ${errorMessage}`, 'error');
            }
        } catch (error) {
            // Capturar errores de red (servidor no disponible, etc.)
            console.error('Error de red o al enviar los datos:', error);
            showMessage('Error de conexión. Inténtalo de nuevo más tarde.', 'error');
        }
    });

    // Función auxiliar para mostrar mensajes al usuario
    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.classList.add(type); // Añade 'success' o 'error' para el estilo
        messageDiv.style.display = 'block'; // Muestra el div del mensaje
    }
});