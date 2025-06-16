
export default function Error() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center overflow-hidden relative">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-rose-200 rounded-full opacity-50 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-32 left-20 w-12 h-12 bg-pink-300 rounded-full opacity-70 animate-bounce" style={{animationDelay: '2s', animationDuration: '3.5s'}}></div>
        <div className="absolute bottom-20 right-40 w-24 h-24 bg-rose-100 rounded-full opacity-40 animate-bounce" style={{animationDelay: '0.5s', animationDuration: '5s'}}></div>
        <div className="absolute top-60 left-1/3 w-8 h-8 bg-pink-400 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '2.5s'}}></div>
      </div>

      {/* Main Content */}
      <div className="text-center z-10 px-6 max-w-2xl mx-auto">
        {/* Animated 404 Text */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-500 to-pink-600 animate-pulse select-none">
            404
          </h1>
          <div className="absolute inset-0 text-9xl font-bold text-pink-200 opacity-50 transform translate-x-2 translate-y-2 -z-10">
            404
          </div>
        </div>

        {/* Animated Title */}
        <div className="mb-6 overflow-hidden">
          <h2 className="text-4xl font-semibold text-pink-800 mb-4 transform transition-all duration-700 hover:scale-105">
            Oops! Page Not Found
          </h2>
        </div>

        {/* Animated Description */}
        <div className="mb-8 overflow-hidden">
          <p className="text-lg text-pink-700 leading-relaxed transform transition-all duration-500 hover:text-pink-800">
            The page you're looking for seems to have wandered off into the digital wilderness. 
            Don't worry, even the best explorers sometimes take a wrong turn!
          </p>
        </div>

        {/* Animated Buttons */}
        <div className="flex flex-col sm:flex-row  justify-center items-center">
          <button className="group relative px-8 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-semibold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:from-pink-500 hover:to-rose-600 focus:outline-none focus:ring-4 focus:ring-pink-300">
            <span className="relative z-10">Go Home</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          {/* <button className="group px-8 py-3 border-2 border-pink-400 text-pink-600 font-semibold rounded-full transform transition-all duration-300 hover:scale-105 hover:bg-pink-400 hover:text-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-300">
            Contact Support
          </button> */}
        </div>

        {/* Animated Icon */}
        <div className="mt-12">
          <div className="inline-block transform transition-all duration-500 hover:scale-110 hover:rotate-12">
            <svg className="w-24 h-24 text-pink-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6-8a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        h1 {
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        
        /* Hover effects for floating elements */
        .absolute.rounded-full {
          transition: all 0.3s ease;
        }
        
        .absolute.rounded-full:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}



