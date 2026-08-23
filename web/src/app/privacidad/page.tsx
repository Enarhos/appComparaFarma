import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Política de privacidad de PreciosFarma.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">PreciosFarma</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">Política de privacidad</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: 22 de agosto de 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink/85">
        <section>
          <p>
            PreciosFarma es una aplicación móvil y sitio web que consulta en tiempo real los precios publicados por
            Cruz Verde, Salcobrand, Farmacias Ahumada, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop y
            EasyFarma, permitiendo al usuario comparar precios sin necesidad de visitar cada sitio por separado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Datos que recopilamos</h2>
          <p className="mt-3">
            Puedes usar la búsqueda y comparación de precios de PreciosFarma sin crear una cuenta. En ese caso, no se
            solicita nombre, correo electrónico, número de teléfono ni ningún otro dato que permita identificarte
            directamente.
          </p>
          <p className="mt-3">
            Si decides crear una cuenta —por ejemplo, para guardar alertas de precio o gestionar una suscripción—
            PreciosFarma recopila y almacena tu correo electrónico y tu contraseña. La contraseña se guarda de forma
            cifrada a través de nuestro proveedor de autenticación (Supabase) y PreciosFarma nunca accede a ella en
            texto plano. Si registras una alerta de precio o nos escribes a través del formulario de contacto, tu
            correo electrónico queda asociado a esa solicitud. Si contratas una suscripción paga, se almacenan los
            datos necesarios para administrarla, como su estado y los eventos asociados a su procesamiento de pago.
          </p>
          <p className="mt-3">
            Para mejorar la estabilidad del servicio y comprender el uso de la aplicación, se recopilan además datos
            técnicos y de uso anónimos mediante Sentry y PostHog, tal como se describe en la sección "Servicios de
            terceros".
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Cómo funciona la app</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Las búsquedas que realizas se envían al servidor de PreciosFarma, alojado en Vercel, que consulta en
              paralelo las APIs y sitios de cada farmacia y devuelve los resultados. Tu dispositivo no establece
              conexión directa con los sitios de las farmacias.
            </li>
            <li>
              Los resultados se guardan temporalmente en la memoria local de tu teléfono, con caché de 30 minutos, para
              evitar consultas repetidas. Este caché se elimina automáticamente y nunca sale de tu dispositivo.
            </li>
            <li>
              El historial de búsquedas recientes se guarda localmente en tu dispositivo. Puedes eliminarlo en cualquier
              momento desde la pantalla de inicio.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Servicios de terceros</h2>
          <p className="mt-3">
            PreciosFarma utiliza <strong>Sentry</strong> para el monitoreo de errores técnicos. Sentry puede registrar
            información técnica anónima, como tipo de error, versión de la app y modelo del dispositivo, únicamente
            cuando ocurre un fallo. En caso de error durante una búsqueda, el término buscado puede quedar incluido en
            los registros de error como parte del contexto técnico.
          </p>
          <p className="mt-3">
            Más información sobre Sentry:{" "}
            <a className="break-words font-medium text-accent-ink underline underline-offset-2" href="https://sentry.io/privacy/">
              sentry.io/privacy
            </a>
            .
          </p>
          <p className="mt-3">
            PreciosFarma utiliza <strong>PostHog</strong> para el análisis anónimo de uso. PostHog registra eventos de
            uso, como búsquedas realizadas, término buscado, cantidad de resultados, precio más bajo encontrado y
            farmacias disponibles, y les asigna un identificador aleatorio por instalación que no está vinculado a tu
            identidad real.
          </p>
          <p className="mt-3">
            Más información sobre PostHog:{" "}
            <a className="break-words font-medium text-accent-ink underline underline-offset-2" href="https://posthog.com/privacy">
              posthog.com/privacy
            </a>
            .
          </p>
          <p className="mt-3">
            La aplicación muestra precios y enlaces hacia sitios de terceros, como las farmacias consultadas. Al abrir
            un enlace externo, se aplican las políticas de privacidad propias de ese sitio.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Eliminación de tu cuenta</h2>
          <p className="mt-3">
            Si tienes una cuenta, puedes solicitar su eliminación en cualquier momento desde la propia aplicación (en
            la Web, desde Cuenta → Eliminar cuenta; en la app móvil, desde la pantalla de cuenta → Eliminar cuenta),
            luego de confirmar tu identidad.
          </p>
          <p className="mt-3">
            La eliminación de tu cuenta es permanente y no puede deshacerse. Al eliminarla se eliminan tu perfil, tu
            suscripción y los registros asociados a su procesamiento de pago, tus alertas de precio registradas por
            correo y los mensajes de contacto asociados a tu correo electrónico. Este proceso elimina esos datos de
            forma definitiva; no se trata de una anonimización.
          </p>
          <p className="mt-3">
            Si tienes una suscripción paga activa, debes cancelarla antes de poder eliminar tu cuenta.
          </p>
          <p className="mt-3">
            La información de precios de medicamentos y farmacias que utiliza PreciosFarma (por ejemplo, el historial
            de precios de un medicamento) no es un dato personal ni está asociada a tu cuenta, por lo que no se
            elimina cuando eliminas tu cuenta.
          </p>
          <p className="mt-3">
            Esto se enmarca en los derechos que la normativa chilena de protección de datos personales (Ley N.º
            21.719) reconoce a las personas sobre sus propios datos. Este texto es información general sobre el
            funcionamiento de PreciosFarma y no constituye asesoría legal.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Permisos de la aplicación</h2>
          <p className="mt-3">
            PreciosFarma únicamente requiere acceso a Internet para consultar los precios de las farmacias. No accede a
            la cámara, micrófono, ubicación, contactos ni ningún otro recurso del dispositivo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Menores de edad</h2>
          <p className="mt-3">
            PreciosFarma no está dirigida a menores de 13 años y no recopila conscientemente información de menores.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Cambios en esta política</h2>
          <p className="mt-3">
            Esta política puede actualizarse para reflejar cambios técnicos o regulatorios. Cualquier cambio relevante
            se publicará en esta misma página.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Contacto</h2>
          <p className="mt-3">
            Para consultas sobre privacidad puedes escribir a{" "}
            <a className="break-words font-medium text-accent-ink underline underline-offset-2" href="mailto:mario.lillo.alfaro@gmail.com">
              mario.lillo.alfaro@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <footer className="mt-10 border-t border-line pt-6 text-xs text-muted">
        PreciosFarma © 2026 ·{" "}
        <a className="break-words font-medium text-accent-ink underline underline-offset-2" href="https://github.com/Enarhos/appComparaFarma">
          GitHub
        </a>
      </footer>
    </main>
  );
}
