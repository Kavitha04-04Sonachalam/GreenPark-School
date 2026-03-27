import React from 'react';

const FloatingWhatsApp = () => {
  const phoneNumber = '919597588889';
  const message = 'Hi I am a parent. I need help regarding the school portal';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-[100] group"
      aria-label="Chat with us on WhatsApp"
      id="whatsapp-support-button"
    >
      <div className="relative flex items-center justify-center">
        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-[13px] font-medium py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-2xl border border-white/10 backdrop-blur-sm -translate-x-2 group-hover:translate-x-0">
          Chat with us on WhatsApp
          {/* Tooltip spike */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1 border-[6px] border-transparent border-l-gray-900/90"></div>
        </div>

        {/* Floating Button */}
        <div className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 md:p-4 rounded-full shadow-lg hover:shadow-[0_20px_50px_rgba(37,211,102,0.3)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20">
          <svg
            className="w-6 h-6 md:w-7 md:h-7 drop-shadow-sm"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
