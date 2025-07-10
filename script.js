// script.js - Versión Final Corregida para Redirección Post-Login

document.addEventListener('DOMContentLoaded', () => {
    // --- Variables Globales y Referencias al DOM ---
    const productosListaDiv = document.getElementById('productos-lista');
    const errorMessageDiv = document.getElementById('error-message');
    const loginAdminBtn = document.getElementById('login-admin-btn');
    const loginUserBtn = document.getElementById('login-user-btn');
    const addBtnContainer = document.getElementById('add-btn-container');
    const toggleCartBtn = document.getElementById('toggle-cart-btn');
    const shoppingCartSidebar = document.getElementById('shopping-cart-sidebar');
    //aquii
    // --- NUEVA LÓGICA: Establecer el texto inicial del botón al cargar ---
        if (shoppingCartSidebar.classList.contains('hidden')) {
            toggleCartBtn.textContent = 'Mostrar Carrito';
        } else {
            toggleCartBtn.textContent = 'Ocultar Carrito';
        }
// --- FIN DE NUEVA LÓGICA ---

    const cartItemsDiv = document.getElementById('cart-items');
    // const cartItemCountSpan = document.getElementById('cart-item-count'); // Removido si no se usa directamente
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const finalizePurchaseBtn = document.getElementById('finalize-purchase-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    // --- Endpoints del Backend ---
    const endpointList = 'http://localhost:8080/producto/list';
    const endpointDelete = 'http://localhost:8080/producto/delete/';
    const endpointBatchPedido = 'http://localhost:8080/pedido/batchPedidos';
    // const endpointUsuariosList = 'http://localhost:8080/usuarios/list'; // No se usa directamente aquí

    // --- Variables del Carrito de Compras ---
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    let nroPedidoGlobal = null;

    // --- Variables de Sesión y Autenticación ---
    let loggedInUserType = null; // 'admin', 'user', o null
    let loggedInUsername = null; // Para guardar el nombre de usuario

    // --- Funciones de Utilidad ---
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(price);
    };

    const getCurrentDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    // --- Lógica de Sesión y Actualización de Interfaz de Usuario ---

    /**
     * Verifica el estado de inicio de sesión y actualiza la UI de los botones de login.
     * Lee directamente de sessionStorage.
     */
    const checkLoginStatus = () => {
        loggedInUserType = sessionStorage.getItem('loggedInUserType');
        loggedInUsername = sessionStorage.getItem('loggedInUser');

        if (loggedInUserType === 'admin') {
            loginAdminBtn.textContent = 'ADMIN Close';
            loginAdminBtn.classList.remove('btn-primary');
            loginAdminBtn.classList.add('btn-secondary');
            loginUserBtn.style.display = 'none';
        } else if (loggedInUserType === 'user') {
            loginUserBtn.textContent = 'USER Close';
            loginUserBtn.classList.remove('btn-primary');
            loginUserBtn.classList.add('btn-secondary');
            loginAdminBtn.style.display = 'none';
        } else {
            // No logueado
            loginAdminBtn.textContent = 'LOGIN ADMIN';
            loginAdminBtn.classList.remove('btn-secondary');
            loginAdminBtn.classList.add('btn-primary');
            loginAdminBtn.style.display = 'inline-block';

            loginUserBtn.textContent = 'LOGIN USUARIO';
            loginUserBtn.classList.remove('btn-secondary');
            loginUserBtn.classList.add('btn-primary');
            loginUserBtn.style.display = 'inline-block';
        }
    };

    /**
     * Cierra la sesión del usuario.
     */
    const logout = () => {
        const userLoggedOut = loggedInUserType;
        sessionStorage.removeItem('loggedInUserType');
        sessionStorage.removeItem('loggedInUser');
        loggedInUserType = null;
        loggedInUsername = null;
        alert(`Has cerrado sesión como ${userLoggedOut}.`);
        window.location.href = 'index.html'; // Redirige para refrescar toda la UI
    };

    // Event Listeners para los botones de login/logout
    if (loginAdminBtn) { // Asegura que el botón existe antes de añadir el listener
        loginAdminBtn.addEventListener('click', () => {
            if (loggedInUserType === 'admin') {
                logout();
            } else {
                sessionStorage.setItem('pendingLoginType', 'admin');
                window.location.href = 'login-form.html';
            }
        });
    }

    if (loginUserBtn) { // Asegura que el botón existe antes de añadir el listener
        loginUserBtn.addEventListener('click', () => {
            if (loggedInUserType === 'user') {
                logout();
            } else {
                sessionStorage.setItem('pendingLoginType', 'user');
                window.location.href = 'login-form.html';
            }
        });
    }

    /**
     * Actualiza la visibilidad de los elementos de la interfaz de usuario
     * basándose en el tipo de usuario logueado (admin o user).
     * Esta función debe llamarse *después* de que los productos se hayan renderizado.
     */
    const updateProductCardButtonsVisibility = () => {
        if (addBtnContainer) {
            addBtnContainer.style.display = (loggedInUserType === 'admin') ? 'block' : 'none';
        }

        document.querySelectorAll('.producto-card').forEach(card => {
            const actionsContainer = card.querySelector('.actions');
            const buyControlsContainer = card.querySelector('.buy-controls');

            if (actionsContainer) {
                if (loggedInUserType === 'admin') {
                    actionsContainer.classList.add('visible');
                } else {
                    actionsContainer.classList.remove('visible');
                }
            }

            if (buyControlsContainer) {
                if (loggedInUserType === 'user') {
                    buyControlsContainer.classList.add('visible');
                } else {
                    buyControlsContainer.classList.remove('visible');
                }
            }
        });

        if (finalizePurchaseBtn && clearCartBtn) {
            if (loggedInUserType === 'user' && cart.length > 0) {
                finalizePurchaseBtn.style.display = 'block';
                clearCartBtn.style.display = 'block';
            } else {
                finalizePurchaseBtn.style.display = 'none';
                clearCartBtn.style.display = 'none';
            }
        }
    };

    // --- Lógica del Carrito de Compras ---
    const generateNroPedido = () => {
        if (!nroPedidoGlobal) {
            nroPedidoGlobal = Date.now() + Math.floor(Math.random() * 1000);
            console.log("Generado nuevo NroPedido:", nroPedidoGlobal);
        }
        return nroPedidoGlobal;
    };

    const renderCart = () => {
        cartItemsDiv.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>El carrito está vacío.</p>';
        } else {
            cart.forEach((item, index) => {
                const itemTotal = item.precio * item.cantidad;
                total += itemTotal;

                const cartItemCard = document.createElement('div');
                cartItemCard.classList.add('cart-item-card');
                cartItemCard.innerHTML = `
                    <div class="cart-item-info">
                        <p><strong>${item.nombreProducto}</strong></p>
                        <p>Cant: ${item.cantidad} x ${formatPrice(item.precio)} = ${formatPrice(itemTotal)}</p>
                    </div>
                    <button class="cart-item-remove btn-danger" data-index="${index}">X</button>
                `;
                cartItemsDiv.appendChild(cartItemCard);
            });
        }

        // cartItemCountSpan.textContent = cart.length; // Si no tienes este span, puedes comentarlo
        if (cartTotalPriceSpan) { // Asegura que el elemento existe
            cartTotalPriceSpan.textContent = formatPrice(total);
        }

        // Asegúrate de que la visibilidad de los botones del carrito se actualice aquí también
        updateProductCardButtonsVisibility();

        localStorage.setItem('shoppingCart', JSON.stringify(cart));

        document.querySelectorAll('.cart-item-remove').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToRemove = parseInt(event.target.dataset.index);
                removeItemFromCart(indexToRemove);
            });
        });
    };

    const addItemToCart = (product) => {
        if (loggedInUserType !== 'user') {
            alert('Debes iniciar sesión como usuario para agregar productos al carrito.');
            return;
        }

        const quantityInput = document.getElementById(`quantity-${product.id}`);
        if (!quantityInput) {
            console.error(`Input de cantidad para producto ${product.id} no encontrado.`);
            alert('Error: No se pudo obtener la cantidad del producto.');
            return;
        }
        const quantity = parseInt(quantityInput.value);

        if (isNaN(quantity) || quantity <= 0) {
            alert('Por favor, ingresa una cantidad válida y mayor a 0.');
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].cantidad += quantity;
            alert(`Cantidad de "${product.nombre}" actualizada en el carrito.`);
        } else {
            cart.push({
                id: product.id,
                nombreProducto: product.nombre,
                precio: product.precio,
                cantidad: quantity
            });
            alert(`"${product.nombre}" añadido al carrito.`);
        }

        renderCart();
    };

    const removeItemFromCart = (index) => {
        if (loggedInUserType !== 'user') {
            alert('Acceso denegado. Solo usuarios pueden modificar el carrito.');
            return;
        }
        cart.splice(index, 1);
        renderCart();
        alert('Producto eliminado del carrito.');
    };

    const clearCart = () => {
        if (loggedInUserType !== 'user') {
            alert('Acceso denegado. Solo usuarios pueden vaciar el carrito.');
            return;
        }
        cart = [];
        nroPedidoGlobal = null;
        renderCart();
        alert('Carrito vaciado.');
    };

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    if (finalizePurchaseBtn) {
        finalizePurchaseBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('El carrito está vacío. Agrega productos antes de finalizar la compra.');
                return;
            }
            if (loggedInUserType !== 'user') {
                alert('Debes iniciar sesión como usuario para finalizar la compra.');
                sessionStorage.setItem('pendingLoginType', 'user');
                window.location.href = 'login-form.html';
                return;
            }

            const pedidoItems = cart.map(item => ({
                fecha: getCurrentDate(),
                cliente: loggedInUsername || 'usuario_anonimo',
                producto: item.id,
                precio: item.precio,
                cantidad: item.cantidad,
                nropedido: generateNroPedido(),
                nombreCliente: loggedInUsername || 'usuario_anonimo'
            }));

            sendPurchaseOrder(pedidoItems);
        });
    }

    const sendPurchaseOrder = (orderItems) => {
        const csrfToken = getCookie('XSRF-TOKEN');

        fetch(endpointBatchPedido, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken
            },
            body: JSON.stringify(orderItems)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().catch(() => ({ message: 'Error desconocido al procesar la compra.' }))
                                     .then(err => { throw new Error(err.message || 'Error en la respuesta del servidor.'); });
            }
            return response.json();
        })
        .then(data => {
            alert('¡Compra finalizada con éxito!');
            console.log('Respuesta del pedido:', data);
            clearCart();
        })
        .catch(error => {
            console.error('Error al finalizar la compra:', error);
            alert(`No se pudo finalizar la compra: ${error.message}`);
        });
    };

    // --- Funciones de Carga y Eliminación de Productos ---
    const fetchProducts = () => {
        productosListaDiv.innerHTML = '<p>Cargando productos...</p>';
        errorMessageDiv.style.display = 'none';

        fetch(endpointList)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(productos => {
                productosListaDiv.innerHTML = '';

                if (productos.length === 0) {
                    productosListaDiv.innerHTML = '<p>No hay productos disponibles en este momento.</p>';
                    // updateProductCardButtonsVisibility() se llamará al final de DOMContentLoaded
                    return;
                }

                productos.forEach(producto => {
                    const productoCard = document.createElement('div');
                    productoCard.classList.add('producto-card');

                    productoCard.innerHTML = `
                        <h2>${producto.nombre}</h2>
                        <p><strong>ID:</strong> ${producto.id}</p>
                        <p><strong>Descripción:</strong> ${producto.descripcion}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria}</p>
                        <p><strong>Stock:</strong> ${producto.stock}</p>
                        <p class="precio"><strong>Precio:</strong> ${formatPrice(producto.precio)}</p>
                        ${producto.url_imagen ? `<img src="${producto.url_imagen}" alt="${producto.nombre}" style="max-width: 100%; height: auto; border-radius: 4px; margin-top: 10px;">` : ''}

                        <div class="buy-controls">
                            <input type="number" id="quantity-${producto.id}" value="1" min="1" max="${producto.stock}" title="Cantidad">
                            <button class="btn-primary add-to-cart-btn" data-product-id="${producto.id}"
                                data-product-name="${producto.nombre}"
                                data-product-price="${producto.precio}">
                                Comprar
                            </button>
                        </div>

                        <div class="actions">
                            <a href="product-form.html?id=${producto.id}" class="btn-secondary">Modificar</a>
                            <button class="btn-danger delete-btn" data-id="${producto.id}">Eliminar</button>
                        </div>
                    `;
                    productosListaDiv.appendChild(productoCard);
                });

                // Añadir event listeners para los botones de las tarjetas después de que se han creado
                document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const productId = parseInt(event.target.dataset.productId);
                        const productName = event.target.dataset.productName;
                        const productPrice = parseFloat(event.target.dataset.productPrice);

                        addItemToCart({
                            id: productId,
                            nombre: productName,
                            precio: productPrice
                        });
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        if (loggedInUserType !== 'admin') {
                            alert('Acceso denegado. Solo administradores pueden eliminar productos.');
                            return;
                        }
                        const productId = event.target.dataset.id;
                        if (confirm(`¿Estás seguro de que quieres eliminar el producto con ID: ${productId}?`)) {
                            deleteProduct(productId);
                        }
                    });
                });

                document.querySelectorAll('.actions .btn-secondary').forEach(link => {
                    link.addEventListener('click', (event) => {
                        if (loggedInUserType !== 'admin') {
                            alert('Acceso denegado. Solo administradores pueden modificar productos.');
                            event.preventDefault(); // Previene la navegación
                        }
                    });
                });

                // UNA VEZ QUE LOS PRODUCTOS Y SUS BOTONES ESTÁN EN EL DOM, ACTUALIZA SU VISIBILIDAD
                updateProductCardButtonsVisibility();
            })
            .catch(error => {
                console.error('Error al cargar los productos:', error);
                productosListaDiv.innerHTML = '<p class="error-message">Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
                errorMessageDiv.style.display = 'block';
            });
    };

    const deleteProduct = (id) => {
        if (loggedInUserType !== 'admin') {
            alert('Acceso denegado. Solo administradores pueden eliminar productos.');
            return;
        }

        const csrfToken = getCookie('XSRF-TOKEN');

        fetch(endpointDelete + id, {
            method: 'DELETE',
            headers: {
                'X-XSRF-TOKEN': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                // Intenta parsear el error del servidor
                return response.json().catch(() => ({ message: 'Error desconocido al eliminar el producto.' }))
                                     .then(err => { throw new Error(err.message || 'Error en la respuesta del servidor.'); });
            }
            console.log(`Producto con ID ${id} eliminado correctamente.`);
            fetchProducts(); // Recargar productos después de la eliminación
        })
        .catch(error => {
            console.error('Error al eliminar el producto:', error);
            alert(`No se pudo eliminar el producto: ${error.message}`);
        });
    };

    // --- Event Listener para el botón del Carrito (mostrar/ocultar) ---
    if (toggleCartBtn && shoppingCartSidebar) {
        toggleCartBtn.addEventListener('click', () => {
    shoppingCartSidebar.classList.toggle('hidden'); // Alterna la clase 'hidden'

    // Actualiza el texto del botón basado en si el carrito está oculto o no
    if (shoppingCartSidebar.classList.contains('hidden')) {
        toggleCartBtn.textContent = 'Mostrar Carrito';
    } else {
        toggleCartBtn.textContent = 'Ocultar Carrito';
    }
});
    }

    // --- Lógica para el Login Exitoso desde login-form.html ---
    // Esta sección se ejecuta al cargar index.html y detecta si viene de un login exitoso.
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('loginSuccess');
    const loggedInTypeFromForm = urlParams.get('loggedInUserType');
    const usernameFromForm = urlParams.get('username');

    if (loginSuccess === 'true' && loggedInTypeFromForm && usernameFromForm) {
        // Almacena los datos en sessionStorage
        sessionStorage.setItem('loggedInUserType', loggedInTypeFromForm);
        sessionStorage.setItem('loggedInUser', usernameFromForm);
        // Limpia los parámetros de la URL para que no queden visibles
        window.history.replaceState(null, '', window.location.pathname);
    }

    // --- Inicialización de la Aplicación ---
    // 1. Verifica y actualiza el estado de los botones de login (esto depende de sessionStorage)
    checkLoginStatus();

    // 2. Carga los productos y luego actualiza la visibilidad de los botones de las tarjetas
    //    Es crucial que updateProductCardButtonsVisibility() se llame DESPUÉS de que
    //    fetchProducts() haya agregado las tarjetas al DOM.
    fetchProducts();

    // 3. Renderiza el carrito de compras (su visibilidad se ajusta con updateProductCardButtonsVisibility)
    renderCart();
});