// pedidos.js

document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a los elementos del DOM
    const pedidosTableBody = document.querySelector('#pedidos-table tbody');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const noOrdersMessage = document.getElementById('no-orders-message');

    // Referencias a los elementos del total
    const grandTotalElement = document.getElementById('grand-total');
    const tableFooter = document.getElementById('table-footer'); // Referencia al tfoot

    // Referencias a los elementos del filtro
    const filterNroPedidoInput = document.getElementById('filterNroPedido');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');

    // Variable para almacenar todos los registros obtenidos del backend
    // Esto nos permite filtrar sin hacer una nueva petición cada vez
    let allRegistros = []; 

    // URL del endpoint de tu API para listar los registros de venta
    const API_URL_REGISTROS_VENTA = 'http://localhost:8080/pedido/listar'; 

    /**
     * Función para renderizar la tabla con un array dado de registros.
     * Calcula y muestra el total de los subtotales para los registros que se renderizan.
     * @param {Array} registrosToRender - Array de objetos de registro/item de venta a mostrar.
     */
    function renderTable(registrosToRender) {
        pedidosTableBody.innerHTML = ''; // Limpia el contenido actual de la tabla
        let currentGrandTotal = 0;       // Inicializa el total para esta renderización

        // Si no hay registros para mostrar
        if (registrosToRender.length === 0) {
            noOrdersMessage.style.display = 'block';         // Muestra el mensaje de "No hay registros"
            tableFooter.style.display = 'none';              // Oculta el pie de tabla
            grandTotalElement.textContent = '$0.00';         // Resetea el total a cero
            return; // Sale de la función si no hay nada que renderizar
        }

        // Si hay registros, asegura que los mensajes estén ocultos y el pie de tabla visible
        noOrdersMessage.style.display = 'none'; 
        tableFooter.style.display = 'table-footer-group'; // 'table-footer-group' es el valor por defecto para un <tfoot>

        // Itera sobre cada registro y lo añade a la tabla
        registrosToRender.forEach(registro => {
            const row = pedidosTableBody.insertRow(); // Crea una nueva fila en el cuerpo de la tabla
            
            // Formatea la fecha para una visualización amigable
            // Asume que registro.fecha es una cadena de fecha válida (ej. "06/07/2025")
            const fecha = new Date(registro.fecha).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            // Calcula el subtotal para este item de venta
            const subtotal = registro.precio * registro.cantidad; 
            currentGrandTotal += subtotal; // Suma el subtotal al total general acumulado

            // Rellena las celdas de la fila con los datos del registro
            row.insertCell().textContent = registro.id;          // ID de este registro/item
            row.insertCell().textContent = registro.nropedido;   // Número de Pedido
            row.insertCell().textContent = fecha;                // Fecha formateada
            row.insertCell().textContent = registro.nombreCliente || registro.cliente; // Nombre del Cliente (usa nombreCliente, si no existe, usa cliente)
            row.insertCell().textContent = registro.producto;    // ID del Producto
            row.insertCell().textContent = registro.cantidad;    // Cantidad
            row.insertCell().textContent = `$${registro.precio.toFixed(2)}`; // Precio Unitario (formato moneda con 2 decimales)
            row.insertCell().textContent = `$${subtotal.toFixed(2)}`; // Subtotal (calculado y formato moneda)

            const actionsCell = row.insertCell(); // Celda para los botones de acción (actualmente vacía)

            // --- SECCIÓN DE BOTONES DE ACCIÓN (COMENTADA) ---
            // Si en el futuro quieres añadir botones como "Ver detalle", "Editar" o "Eliminar",
            // puedes descomentar y adaptar este código.
            // Para el botón "Ver", que se pidió eliminar:
            /*
            const detailButton = document.createElement('a');
            detailButton.href = `detalle-venta.html?idRegistro=${registro.id}&nroPedido=${registro.nropedido}`; 
            detailButton.textContent = 'Ver';
            detailButton.classList.add('btn-detail');
            actionsCell.appendChild(detailButton);
            */

            // Para los botones "Editar" y "Eliminar":
            /*
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.classList.add('btn-edit');
            editButton.addEventListener('click', () => {
                alert(`Editar registro ${registro.id}`);
                // Aquí iría la lógica para redirigir a un formulario de edición o abrir un modal
            });
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('btn-delete');
            deleteButton.addEventListener('click', async () => {
                if (confirm(`¿Estás seguro de que quieres eliminar el registro ${registro.id} (del pedido ${registro.nropedido})?`)) {
                    try {
                        // Este es un ejemplo de endpoint de eliminación. Asegúrate de que tu backend tenga uno similar.
                        const deleteResponse = await fetch(`http://localhost:8080/registro/delete/${registro.id}`, { 
                            method: 'DELETE'
                        });
                        if (deleteResponse.ok) {
                            alert(`Registro ${registro.id} eliminado con éxito.`);
                            fetchRegistrosVenta(); // Vuelve a cargar la tabla para reflejar el cambio
                        } else {
                            throw new Error(`Error al eliminar: ${deleteResponse.statusText}`);
                        }
                    } catch (deleteError) {
                        console.error('Error al eliminar el registro:', deleteError);
                        alert('No se pudo eliminar el registro. Intenta de nuevo.');
                    }
                }
            });
            actionsCell.appendChild(deleteButton);
            */
            // --- FIN SECCIÓN DE BOTONES DE ACCIÓN ---
        });

        // Actualiza el elemento del total con la suma calculada después de renderizar todas las filas
        grandTotalElement.textContent = `$${currentGrandTotal.toFixed(2)}`;
    }

    /**
     * Función principal para obtener los registros del backend y cargarlos inicialmente.
     */
    async function fetchRegistrosVenta() {
        loadingMessage.style.display = 'block'; // Muestra el mensaje de carga
        errorMessage.style.display = 'none';    // Oculta mensajes de error previos
        noOrdersMessage.style.display = 'none'; // Oculta el mensaje de no hay datos
        pedidosTableBody.innerHTML = '';        // Limpia la tabla
        grandTotalElement.textContent = '$0.00'; // Resetea el total a cero antes de cargar nuevos datos

        try {
            const response = await fetch(API_URL_REGISTROS_VENTA);
            if (!response.ok) {
                // Si la respuesta no es exitosa (ej. 404, 500), lanza un error
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allRegistros = await response.json(); // Almacena TODOS los registros recibidos del backend
            loadingMessage.style.display = 'none'; // Oculta el mensaje de carga
            renderTable(allRegistros); // Renderiza la tabla con todos los registros inicialmente

        } catch (error) {
            console.error('Error al obtener los registros de venta:', error);
            loadingMessage.style.display = 'none'; // Oculta el mensaje de carga en caso de error
            errorMessage.textContent = 'No se pudieron cargar los registros. Por favor, inténtalo de nuevo más tarde.';
            errorMessage.style.display = 'block'; // Muestra el mensaje de error
            allRegistros = []; // Asegura que la lista de registros esté vacía en caso de error
            tableFooter.style.display = 'none'; // Oculta el pie de tabla si hay un error de carga
        }
    }

    /**
     * Función para aplicar el filtro basado en el número de pedido ingresado por el usuario.
     */
    function applyFilter() {
        // Obtiene el valor del input de filtro y lo convierte a número entero.
        const filterValue = parseInt(filterNroPedidoInput.value); 

        // Si el valor del filtro no es un número válido (ej. el campo está vacío o contiene texto)
        if (isNaN(filterValue)) {
            renderTable(allRegistros); // Muestra todos los registros originales
            return; // Sale de la función
        }

        // Filtra la lista completa de registros.
        // Solo incluye los registros cuyo 'nropedido' coincide con el valor del filtro.
        const filteredRegistros = allRegistros.filter(registro => {
            return registro.nropedido === filterValue;
        });

        renderTable(filteredRegistros); // Renderiza la tabla con los registros filtrados
    }

    // --- Configuración de Event Listeners para los botones de filtro ---
    // Listener para el botón "Aplicar Filtro"
    if (applyFilterBtn) { // Verifica que el botón exista en el DOM
        applyFilterBtn.addEventListener('click', applyFilter);
    }

    // Listener para el botón "Limpiar Filtro"
    if (clearFilterBtn) { // Verifica que el botón exista en el DOM
        clearFilterBtn.addEventListener('click', () => {
            filterNroPedidoInput.value = ''; // Borra el contenido del input de filtro
            renderTable(allRegistros); // Vuelve a mostrar todos los registros originales
        });
    }

    // --- Opción: Filtrar mientras se escribe (descomentar si se prefiere este comportamiento) ---
    // Si quieres que la tabla se filtre automáticamente cada vez que el usuario escribe en el input,
    // puedes descomentar las siguientes líneas. Si lo dejas comentado, el filtro
    // se aplicará solo al hacer clic en el botón "Aplicar Filtro".
    /*
    if (filterNroPedidoInput) {
        filterNroPedidoInput.addEventListener('input', applyFilter);
    }
    */

    // --- Llamada inicial ---
    // Carga los registros del backend cuando el DOM esté completamente cargado y listo.
    fetchRegistrosVenta();
});