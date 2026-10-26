const formulario = document.getElementById("registerForm");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("btnRegistrar");

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const Name = document.getElementById("Name").value.trim();
    const Phone = document.getElementById("Phone").value.trim();
    const Email = document.getElementById("Email").value.trim();
    const Password = document.getElementById("Password").value;
    const ConfirmPassword = document.getElementById("ConfirmPassword").value;

    mensaje.textContent = "";
    mensaje.className = "";

    if (Password !== ConfirmPassword) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        mensaje.className = "error";
        return;
    }

    boton.disabled = true;
    boton.textContent = "Registrando...";

    try {
        const respuesta = await fetch(
        "http://localhost:3000/api/v1/users/register",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Name,
                Phone,
                Email,
                Password
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || "No se pudo registrar el usuario."
            );
        }

        mensaje.textContent = datos.mensaje;
        mensaje.className = "exito";
        formulario.reset();

    } catch (error) {
        mensaje.textContent = error instanceof Error ? error.message : "Error de conexión con la API.";
        mensaje.className = "error";

    } finally {
        boton.disabled = false;
        boton.textContent = "Registrarse";
    }
});