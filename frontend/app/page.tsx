import Link from 'next/link'
import { FaGift, FaHeart, FaShare } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaGift className="text-3xl text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-800">Wishlist</h1>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Создавайте и делитесь
            <br />
            <span className="text-primary-600">списками желаний</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Соберите все свои желания в одном месте и поделитесь ими с друзьями и близкими.
            Пусть подарки будут именно тем, что вы хотели!
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-primary-600 text-white text-lg rounded-lg hover:bg-primary-700 font-medium shadow-lg"
          >
            Начать бесплатно
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <FaGift className="text-3xl text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Создавайте списки
            </h3>
            <p className="text-gray-600">
              Добавляйте желаемые подарки с описанием, ссылками и фотографиями
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <FaShare className="text-3xl text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Делитесь легко
            </h3>
            <p className="text-gray-600">
              Получите публичную ссылку и отправьте её друзьям и родным
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
              <FaHeart className="text-3xl text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Получайте желаемое
            </h3>
            <p className="text-gray-600">
              Друзья увидят что вам нужно и смогут отметить купленное
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">
            Готовы начать?
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            Создайте свой первый вишлист прямо сейчас — это бесплатно!
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-primary-600 text-white text-lg rounded-lg hover:bg-primary-700 font-medium"
          >
            Создать вишлист
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Wishlist App. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}
