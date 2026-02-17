import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-schoolGreen text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* School Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Green Park School</h3>
            <p className="text-sm text-gray-100">
              Providing quality education since many years with a commitment to excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-100 hover:text-schoolYellow">Home</a></li>
              <li><a href="#" className="text-gray-100 hover:text-schoolYellow">About Us</a></li>
              <li><a href="#" className="text-gray-100 hover:text-schoolYellow">Academics</a></li>
              <li><a href="#" className="text-gray-100 hover:text-schoolYellow">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>No: 9, Sai Ram Nagar, Siruvachur, Perambalur – 621113</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+91 95975 88889</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>greenparkmhssiruvachur@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-opacity-20 border-white mt-8 pt-8 text-center text-sm text-gray-100">
          <p>&copy; 2024 Green Park Matric. Hr. Sec. School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
