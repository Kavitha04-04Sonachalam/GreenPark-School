import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Youtube, Link as LinkIcon } from 'lucide-react'

export default function TopContactBar() {
  return (
    <div className="bg-contactGreen text-white py-2 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile View: Icons Only (📧 📞 📍 🔗) */}
        <div className="flex md:hidden justify-between items-center py-1 max-w-[280px] mx-auto">
          <a href="mailto:greenparkmhssiruvachur@gmail.com" className="p-3 hover:bg-white/10 rounded-full transition" title="Email">
            <Mail size={22} />
          </a>
          <a href="tel:+919597588889" className="p-3 hover:bg-white/10 rounded-full transition" title="Call">
            <Phone size={22} />
          </a>
          <a 
            href="https://www.google.com/maps/search/?api=1&query=Green+Park+School+Siruvachur+Perambalur" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-3 hover:bg-white/10 rounded-full transition" 
            title="Location"
          >
            <MapPin size={22} />
          </a>
          <a 
            href="https://www.instagram.com/greenpark_siruvachur/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-3 hover:bg-white/10 rounded-full transition" 
            title="Social Links"
          >
            <LinkIcon size={22} />
          </a>
        </div>

        {/* Desktop View: Full Content */}
        <div className="hidden md:flex flex-row justify-between items-center text-sm">
          {/* Left side - Contact info */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Mail size={16} />
              <a href="mailto:greenparkmhssiruvachur@gmail.com" className="hover:underline">
                greenparkmhssiruvachur@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>+91 95975 88889 / 96293 2223 / 8500959963</span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <MapPin size={16} />
              <span>No: 9, Sai Ram Nagar, Siruvachur, Perambalur – 621113</span>
            </div>
          </div>

          {/* Right side - Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/greenpark_siruvachur/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
              title="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://www.facebook.com/gpmhss/?locale=da_DK&_rdr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
              title="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://www.youtube.com/@greenparkschoolsiruvachurp4612"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
              title="YouTube"
            >
              <Youtube size={18} />
            </a>
            <a
              href="https://www.linkedin.com/in/swathika-muthaya-a32b46337/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
              title="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
