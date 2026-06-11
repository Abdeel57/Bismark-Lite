import { LegalLayout, LegalSection } from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Aviso de Privacidad" updated="Junio 2026">
      <p className="text-sm text-muted-foreground">
        En cumplimiento de la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares
        (LFPDPPP)</strong>, te informamos cómo tratamos tus datos personales en <strong>Bismark</strong>.
      </p>

      <LegalSection n={1} title="Responsable">
        <p>
          Bismark (la “Plataforma”) es responsable del tratamiento de los datos que se recaban a través del sitio.
          Contacto para temas de privacidad: <strong>privacidad@bismark.com</strong>.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Datos que recabamos">
        <p>
          <strong>De los Riferos (usuarios registrados):</strong> nombre, correo electrónico, teléfono/WhatsApp,
          contraseña (cifrada) y los datos de su página y de pago que decidan publicar.
        </p>
        <p>
          <strong>De los compradores:</strong> nombre, teléfono, WhatsApp y estado, proporcionados al apartar boletos.
          Estos datos los captura el comprador en la página del Rifero y se usan para gestionar su orden.
        </p>
        <p>No recabamos datos sensibles ni información de tarjetas de crédito en la Plataforma.</p>
      </LegalSection>

      <LegalSection n={3} title="Finalidades">
        <p>
          <strong>Primarias (necesarias):</strong> crear y administrar tu cuenta, operar las páginas de rifas, generar
          órdenes y boletos digitales, enviar avisos del servicio (p. ej. recuperación de contraseña, aviso de órdenes
          nuevas) y dar soporte.
        </p>
        <p>
          <strong>Secundarias (opcionales):</strong> mejoras del producto y comunicación de novedades. Puedes oponerte
          a éstas escribiéndonos, sin afectar el servicio.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Transferencias y encargados">
        <p>
          Los datos de los compradores se ponen a disposición del <strong>Rifero correspondiente</strong> para que
          administre su rifa. Usamos proveedores que actúan como encargados: alojamiento e infraestructura (p. ej.
          Railway), envío de correos (p. ej. Resend) y, en su caso, almacenamiento de archivos. No vendemos tus datos.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Derechos ARCO y revocación">
        <p>
          Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento de tus datos, así
          como a revocar tu consentimiento. Para ejercerlos, escribe a <strong>privacidad@bismark.com</strong>{' '}
          indicando tu nombre, la cuenta asociada y tu solicitud. Responderemos en los plazos que marca la ley.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Cookies y tecnologías">
        <p>
          Usamos cookies estrictamente necesarias para la sesión (mantenerte con sesión iniciada) y, de forma opcional,
          herramientas de analítica para entender el uso del sitio. La PWA no almacena en caché información privada de la
          API.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Seguridad y conservación">
        <p>
          Aplicamos medidas razonables (contraseñas cifradas, control de acceso por rol, conexión segura). Conservamos
          los datos mientras mantengas tu cuenta o sea necesario para las finalidades descritas.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cambios al aviso">
        <p>
          Podemos actualizar este Aviso; publicaremos los cambios en esta página con su fecha de actualización.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
