import { LegalLayout, LegalSection } from './LegalLayout';

export default function Terms() {
  return (
    <LegalLayout title="Términos y Condiciones" updated="Junio 2026">
      <p className="text-sm text-muted-foreground">
        Estos Términos regulan el uso de <strong>Bismark</strong> (la “Plataforma”), un servicio que permite a
        organizadores de rifas (“Riferos”) crear su página, administrar boletos y recibir órdenes. Al registrarte o
        usar la Plataforma, aceptas estos Términos.
      </p>

      <LegalSection n={1} title="Qué es (y qué no es) Bismark">
        <p>
          Bismark es una <strong>herramienta tecnológica</strong> que facilita la organización y administración de
          rifas. Bismark <strong>no organiza rifas, no vende boletos, no custodia ni procesa dinero</strong> de los
          compradores: los pagos se realizan de forma directa entre el comprador y el Rifero, fuera de la Plataforma.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Cuenta del Rifero">
        <p>
          Eres responsable de la veracidad de tus datos, de mantener segura tu contraseña y de toda la actividad de tu
          cuenta. Debes ser mayor de edad y tener capacidad legal para celebrar contratos.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Sorteos, rifas y permisos (muy importante)">
        <p>
          En México, la celebración de rifas y sorteos está regulada por la <strong>Ley Federal de Juegos y Sorteos</strong> y su
          reglamento, y puede requerir <strong>permiso de la Secretaría de Gobernación (SEGOB)</strong>.
        </p>
        <p>
          El <strong>Rifero es el único responsable</strong> de obtener y mantener vigentes todos los permisos, licencias y
          autorizaciones aplicables, de cumplir con las bases que publique y de entregar los premios ofrecidos. Bismark
          es solo el medio tecnológico y <strong>no es responsable</strong> de la legalidad, ejecución o resultado de las rifas
          publicadas por los Riferos. El Rifero mantendrá en paz y a salvo a Bismark frente a cualquier reclamación
          derivada de sus rifas.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Pagos a Riferos y planes">
        <p>
          Los compradores pagan directamente al Rifero por los medios que éste configure (transferencia, depósito,
          etc.). Bismark no interviene en esos pagos ni garantiza su realización.
        </p>
        <p>
          El uso de ciertas funciones requiere un <strong>plan de suscripción</strong> mensual. Los precios y límites se muestran
          en la Plataforma y pueden actualizarse. La activación inicial puede realizarse de forma manual por el equipo
          de Bismark.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Datos de los compradores">
        <p>
          Como Rifero, tratarás datos personales de tus compradores. Te obligas a usarlos únicamente para administrar
          tus rifas, a protegerlos y a cumplir la legislación de privacidad aplicable. Consulta también nuestro{' '}
          <a href="/privacidad" className="font-medium text-brand hover:underline">Aviso de Privacidad</a>.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Conducta prohibida">
        <p>
          No puedes usar la Plataforma para actividades ilícitas, fraudulentas o engañosas, para vulnerar derechos de
          terceros, ni para publicar rifas sin los permisos correspondientes. Podemos suspender cuentas que incumplan
          estos Términos.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Disponibilidad y limitación de responsabilidad">
        <p>
          La Plataforma se ofrece “tal cual”. En la medida permitida por la ley, Bismark no será responsable por daños
          indirectos, pérdida de ganancias o datos, ni por disputas entre Riferos y compradores.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cambios, ley aplicable y contacto">
        <p>
          Podemos actualizar estos Términos; los cambios se publicarán en esta página. Estos Términos se rigen por las
          leyes de los Estados Unidos Mexicanos. Para cualquier asunto: <strong>soporte@bismark.com</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
