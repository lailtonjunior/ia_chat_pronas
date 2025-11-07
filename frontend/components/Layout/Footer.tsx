'use client'

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Sistema PRONAS/PCD. Todos os direitos reservados.</p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-blue-600">Ajuda</a>
            <a href="#" className="hover:text-blue-600">Privacidade</a>
            <a href="#" className="hover:text-blue-600">Termos</a>
            <span className="text-xs text-gray-500">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
