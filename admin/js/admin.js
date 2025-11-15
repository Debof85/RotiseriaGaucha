import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, addDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

console.log("admin.js cargado");

// =========================
// Config Firebase
// =========================
const firebaseConfig = {
    apiKey: "AIzaSyCuZnIyvTIvoNknjQVzHyyYWojZe3wl1F8",
    authDomain: "gaucha-6c9c3.firebaseapp.com",
    projectId: "gaucha-6c9c3",
    storageBucket: "gaucha-6c9c3.appspot.com",
    messagingSenderId: "952823415131",
    appId: "1:952823415131:web:6f470306953596af285a7e",
    measurementId: "G-JQW163LB7S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// =========================
// Roles
// =========================
const SUPERADMIN_UID = "cv6BfI1wkBPOtdcWLwPSgALhbJw2";
const GERENTE_UID     = "Z9IE0NnL7bfoOFgmMThpGWv0PJ02";
const VENTAS_UID      = "iC27sWjiBjOcWmCdQtWuO4ax8ky1";

// =========================
// DOM helpers
// =========================
const logoutBtn = document.getElementById("logoutBtn");
const menuItems = Array.from(document.querySelectorAll(".menu-item"));
const sections  = Array.from(document.querySelectorAll(".section"));

function showOnlySections(sectionIds) {
    sections.forEach(sec => {
        if(sectionIds.includes(sec.id)) {
            sec.classList.add("active");
            sec.style.display = "";
        } else {
            sec.classList.remove("active");
            sec.style.display = "none";
        }
    });
    menuItems.forEach(mi => {
        if(sectionIds.includes(mi.dataset.section)) mi.classList.add("active");
        else mi.classList.remove("active");
    });
}

function setMenuVisibility(allowed) {
    menuItems.forEach(item => {
        item.style.display = allowed.includes(item.dataset.section) ? "" : "none";
    });
}

// =========================
// Click en menú
// =========================
menuItems.forEach(item => {
    item.addEventListener("click", () => {
        if(getComputedStyle(item).display === "none") return;
        showOnlySections([item.dataset.section]);
        if(item.dataset.section === "pedidos") cargarPedidos();
        if(item.dataset.section === "ventas") cargarVentas();
        if(item.dataset.section === "productos") cargarProductos();
        if(item.dataset.section === "beneficios") cargarBeneficios();
    });
});

// =========================
// Logout
// =========================
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "loginadmin.html";
});

// =========================
// Autenticación y roles
// =========================
onAuthStateChanged(auth, user => {
    if(!user) return window.location.href = "loginadmin.html";

    console.log("Usuario logueado UID:", user.uid);

    let allowed = [];
    if(user.uid === SUPERADMIN_UID) allowed = ["pedidos","ventas","productos","beneficios"];
    else if(user.uid === GERENTE_UID) allowed = ["pedidos","ventas","productos"];
    else if(user.uid === VENTAS_UID) allowed = ["pedidos","ventas"];
    else allowed = ["pedidos"];

    setMenuVisibility(allowed);
    showOnlySections(allowed);

    if(allowed.includes("pedidos")) cargarPedidos();
    if(allowed.includes("ventas")) cargarVentas();
    if(allowed.includes("productos")) cargarProductos();
    if(allowed.includes("beneficios")) cargarBeneficios();
});

// =========================
// Función Pedidos
// =========================
async function cargarPedidos() {
    const lista = document.getElementById("listaPedidos");
    lista.innerHTML = "";

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>WhatsApp</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    lista.appendChild(table);
    const tbody = table.querySelector("tbody");

    const snapshot = await getDocs(query(collection(db,"pedidos"),orderBy("fecha","desc")));
    snapshot.forEach(docSnap => {
        const pedido = docSnap.data();
        if(pedido.estado === "entregado" || pedido.estado === "en reparto") return;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${pedido.nombre}</td>
            <td>${pedido.telefono}</td>
            <td>${pedido.direccion}</td>
            <td>${pedido.carrito.map(p=>`${p.nombre} ($${p.precio})`).join(", ")}</td>
            <td></td>
            <td></td>
        `;

        // Select estado
        const select = document.createElement("select");
        ["pendiente","en preparación","en camino","entregado","en reparto"].forEach(e=>{
            const option = document.createElement("option");
            option.value = e;
            option.textContent = e;
            if(pedido.estado===e) option.selected = true;
            select.appendChild(option);
        });
        select.addEventListener("change", async () => {
            await updateDoc(doc(db,"pedidos",docSnap.id),{estado:select.value});
            if(select.value==="entregado"||select.value==="en reparto") tr.remove();
            const mensaje = `Hola ${pedido.nombre}, tu pedido ahora está *${select.value}*`;
            window.open(`https://wa.me/${pedido.telefono}?text=${encodeURIComponent(mensaje)}`,"_blank");
        });

        const btnWhats = document.createElement("button");
        btnWhats.textContent = "📲 WhatsApp";
        btnWhats.addEventListener("click", ()=>{
            const mensaje = `Hola ${pedido.nombre}, tu pedido está actualmente *${select.value}*`;
            window.open(`https://wa.me/${pedido.telefono}?text=${encodeURIComponent(mensaje)}`,"_blank");
        });

        tr.children[4].appendChild(select);
        tr.children[5].appendChild(btnWhats);

        tbody.appendChild(tr);
    });
}

// =========================
// Función Ventas realizadas
// =========================
async function cargarVentas() {
    const lista = document.getElementById("listaVentas");
    lista.innerHTML = "";

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Productos</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    lista.appendChild(table);
    const tbody = table.querySelector("tbody");

    let sumaDiaria = 0;
    let sumaMensual = 0;
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();

    const snapshot = await getDocs(query(collection(db,"pedidos"),orderBy("fecha","desc")));
    snapshot.forEach(docSnap => {
        const pedido = docSnap.data();
        if(pedido.estado !== "entregado" && pedido.estado !== "en reparto") return;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${pedido.nombre}</td>
            <td>${pedido.telefono}</td>
            <td>${pedido.direccion}</td>
            <td>${pedido.carrito.map(p=>`${p.nombre} ($${p.precio})`).join(", ")}</td>
            <td>${pedido.totalFinal}</td>
        `;
        tbody.appendChild(tr);

        const fechaPedido = pedido.fecha.toDate();
        if(fechaPedido.getDate()===diaActual && fechaPedido.getMonth()===mesActual) sumaDiaria += pedido.totalFinal;
        sumaMensual += pedido.totalFinal;
    });

    // Fila sumatoria
    const trSum = document.createElement("tr");
    trSum.innerHTML = `<td colspan="4"><strong>Total diario: $${sumaDiaria} | Total mensual: $${sumaMensual}</strong></td><td></td>`;
    tbody.appendChild(trSum);
}

// =========================
// Variables globales para productos
// =========================
let productoActualId = null;
let urlImagenNueva = null;
let productos = []; // Array global para productos

const modalProducto = document.getElementById("modalProducto");
const editNombre = document.getElementById("editNombre");
const editDescripcion = document.getElementById("editDescripcion");
const editPrecio = document.getElementById("editPrecio");
const editCategoria = document.getElementById("editCategoria");
const editImagen = document.getElementById("editImagen");
const btnGuardarProducto = document.getElementById("btnGuardarProducto");
const btnCancelarProducto = document.getElementById("btnCancelarProducto");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");
const listaProductos = document.getElementById("listaProductos");

// =========================
// Cargar productos desde Firestore
// =========================
async function cargarProductos() {
    listaProductos.innerHTML = "";

    // Crear tabla
    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Imagen</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    listaProductos.appendChild(table);
    const tbody = table.querySelector("tbody");

    // Traer productos de Firestore
    productos = [];
    const snapshot = await getDocs(collection(db, "productos"));
    snapshot.forEach(docSnap => {
        const p = docSnap.data();
        p.id = docSnap.id;
        productos.push(p);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.descripcion}</td>
            <td>${p.precio}</td>
            <td>${p.categoria}</td>
            <td>${p.imagen ? `<img src="${p.imagen}" width="50">` : "-"}</td>
            <td><button class="editar">Editar</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Delegación de eventos para botones Editar
    tbody.addEventListener("click", (e) => {
        if (!e.target.classList.contains("editar")) return;

        const tr = e.target.closest("tr");
        const index = Array.from(tbody.children).indexOf(tr);
        const p = productos[index];

        productoActualId = p.id;

        editNombre.value = p.nombre;
        editDescripcion.value = p.descripcion;
        editPrecio.value = p.precio;
        editCategoria.value = p.categoria;
        editImagen.value = null;
        urlImagenNueva = null;

        modalProducto.style.display = "flex";
    });

    // Botón crear nuevo producto dentro de la sección
    if (!document.getElementById("btnCrearNuevoProducto")) {
        const btnNuevo = document.createElement("button");
        btnNuevo.id = "btnCrearNuevoProducto";
        btnNuevo.textContent = "➕ Nuevo Producto";
        btnNuevo.addEventListener("click", abrirModalNuevoProducto);
        listaProductos.appendChild(btnNuevo);
    }
}

// =========================
// Abrir modal para nuevo producto
// =========================
function abrirModalNuevoProducto() {
    productoActualId = null;
    editNombre.value = "";
    editDescripcion.value = "";
    editPrecio.value = "";
    editCategoria.value = "";
    editImagen.value = null;
    urlImagenNueva = null;

    modalProducto.style.display = "flex";
}

// =========================
// Botón Nuevo Producto fijo (HTML)
// =========================
btnNuevoProducto.addEventListener("click", abrirModalNuevoProducto);

// =========================
// Subir imagen nueva
// =========================
editImagen.addEventListener("change", async () => {
    const file = editImagen.files[0];
    if (!file) return;

    const nombreUnico = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `productos/${nombreUnico}`);
    await uploadBytes(storageRef, file);
    urlImagenNueva = await getDownloadURL(storageRef);
});

// =========================
// Guardar producto (nuevo o editar)
// =========================
btnGuardarProducto.addEventListener("click", async () => {
    if (!editNombre.value || !editDescripcion.value || !editPrecio.value || !editCategoria.value) {
        alert("Completa todos los campos");
        return;
    }

    const datos = {
        nombre: editNombre.value,
        descripcion: editDescripcion.value,
        precio: parseFloat(editPrecio.value),
        categoria: editCategoria.value
    };
    if (urlImagenNueva) datos.imagen = urlImagenNueva;

    try {
        if (productoActualId) {
            await updateDoc(doc(db, "productos", productoActualId), datos);
        } else {
            await addDoc(collection(db, "productos"), datos);
        }

        modalProducto.style.display = "none";
        productoActualId = null;
        urlImagenNueva = null;
        editImagen.value = null;

        cargarProductos();
    } catch (error) {
        console.error("Error guardando producto:", error);
        alert("Hubo un error al guardar el producto.");
    }
});

// =========================
// Cancelar modal
// =========================
btnCancelarProducto.addEventListener("click", () => {
    modalProducto.style.display = "none";
    productoActualId = null;
    urlImagenNueva = null;
    editImagen.value = null;
});

// =========================
// Inicializar tabla al cargar página
// =========================
document.addEventListener("DOMContentLoaded", cargarProductos);




// =========================
// Función Beneficios
// =========================
async function cargarBeneficios() {
    const lista = document.getElementById("listaBeneficios");
    lista.innerHTML = "";

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    lista.appendChild(table);
    const tbody = table.querySelector("tbody");

    const snapshot = await getDocs(collection(db,"beneficios"));
    snapshot.forEach(docSnap => {
        const b = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.nombre}</td>
            <td>${b.descripcion}</td>
            <td><button class="editar">Editar</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Botón crear nuevo beneficio
    const btnNuevo = document.createElement("button");
    btnNuevo.textContent = "➕ Nuevo Beneficio";
    btnNuevo.addEventListener("click", ()=>{ /* abrir modal para crear beneficio */ });
    lista.appendChild(btnNuevo);
}
