import "./WhatsAppButton.css";

function WhatsAppButton({
  phoneNumber = "573044697238",
  message = "Hola, quisiera obtener más información.",
}) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      className="whatsapp-button"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="whatsapp-icon"
      >
        <path
          fill="currentColor"
          d="M19.11 17.39c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.15-1.34-.79-.7-1.33-1.56-1.49-1.82-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.98 2.63 1.11 2.81c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.59-.65 1.81-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z"
        />
        <path
          fill="currentColor"
          d="M16.01 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.39 1.63 6.24L3.2 28.8l6.75-1.61a12.75 12.75 0 0 0 6.06 1.53h.01c7.07 0 12.8-5.73 12.8-12.8S23.08 3.2 16.01 3.2Zm0 23.3h-.01a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.01.96.97-3.91-.25-.4a10.5 10.5 0 1 1 9.03 5.04Z"
        />
      </svg>
    </a>
  );
}

export default WhatsAppButton;
