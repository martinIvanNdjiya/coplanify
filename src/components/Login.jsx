
const Login = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center bg-gray-100">
      {/* Section gauche avec la vidéo ou l'image */}
      <div className="lg:w-1/2 w-full h-64 lg:h-screen relative overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src="./login.mp4" // Remplace par ton chemin vidéo
          autoPlay
          loop
          muted
          playsInline
        ></video>
        <div className="absolute inset-0 bg-blue-500 bg-opacity-40 flex items-center justify-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg">
            Coplanify
          </h1>
        </div>
      </div>

      {/* Section droite avec le formulaire */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-6">
            Bienvenue sur Coplanify
          </h2>
          <p className="text-lg text-gray-600 text-center mb-8">
            Connectez-vous pour planifier vos voyages en groupe.
          </p>
          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre e-mail"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-600 transition duration-300"
            >
              Se connecter
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Vous n&apos;avez pas encore de compte ?{" "}
              <a
                href="#"
                className="text-blue-500 font-semibold hover:underline"
              >
                Inscrivez-vous
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
