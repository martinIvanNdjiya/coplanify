import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div>
      {/* Navbar */}
      <nav className="bg-white shadow-md mb-6">
  <div className="container mx-auto px-4 py-6 flex items-center justify-between">
    <h1 className="text-3xl font-bold text-gray-800">Coplanify</h1>
    <div className="flex items-center space-x-8">
      <ul className="flex space-x-6">
        <li>
          <Link to="/" className="text-lg text-gray-700 hover:text-gray-900">
            Accueil
          </Link>
        </li>
        <li>
          <Link to="/voyages" className="text-lg text-gray-700 hover:text-gray-900">
            Voyages
          </Link>
        </li>
        <li>
          <Link to="/sondages" className="text-lg text-gray-700 hover:text-gray-900">
            Sondages
          </Link>
        </li>
        <li>
          <Link to="/chat" className="text-lg text-gray-700 hover:text-gray-900">
            Chat
          </Link>
        </li>
      </ul>
      <button className="bg-blue-500 text-white px-6 py-3 text-lg font-semibold rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105">
             Se connecter
       </button>
        </div>
    </div>
    </nav>

      {/* Section principale avec image */}
      <header className="relative h-screen overflow-hidden">
        {/* Vidéo en arrière-plan */}
        <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src="./videoPrincipal.mp4" // Remplace par le chemin de ta vidéo
            autoPlay
            loop
            muted
            playsInline
        ></video>

        {/* Contenu superposé */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full bg-black bg-opacity-50">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Planifiez votre voyage facilement
            </h1>
            <p className="text-xl text-gray-300">
            Une planification de voyages en groupe simplifiée à portée de main
            </p>
        </div>
        </header>

      {/* Section explicative */}
      <section className="container mx-auto px-6 py-16">
  <div className="flex flex-col md:flex-row items-center gap-12">
    {/* Texte */}
    <div className="md:w-1/2">
      <h2 className="text-4xl font-extrabold text-gray-800 leading-tight mb-6">
        La planification de groupe sans effort vous attend
      </h2>
      <p className="text-lg text-gray-700 leading-relaxed text-justify mb-6">
        Coplanify redéfinit la manière dont vous planifiez et gérez vos voyages en groupe. 
        Grâce à nos outils innovants et intuitifs, vous pouvez collaborer avec vos amis, 
        choisir des destinations et créer des souvenirs inoubliables, le tout en quelques clics. 
        Laissez-nous vous simplifier la vie en gérant les détails, pendant que vous vous concentrez 
        sur ce qui compte vraiment : profiter de l&apos;aventure.
      </p>
      <button className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-600 transition duration-300 ease-in-out">
        En savoir plus
      </button>
    </div>

    {/* Image */}
    <div className="md:w-1/2">
      <img
        src="./aPropos.jpg"
        alt="Planification de voyage"
        className="rounded-lg shadow-xl"
      />
    </div>
  </div>
</section>


      {/* Section fonctionnalités */}
      <section className="bg-gray-100 py-24">
        <div className="container mx-auto px-8">
            {/* Titre principal */}
            <h2 className="text-6xl font-extrabold text-center text-gray-800 mb-20">
            Vos voyages en groupe parfaits commencent ici !
            </h2>

            {/* Grid des fonctionnalités */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Fonctionnalité 1 */}
            <div className="flex flex-col items-center text-center">
                <div className="w-64 h-64 relative mb-8">
                <img
                    src="./planification.png"
                    alt="Planification de voyage"
                    className="w-full h-full rounded-full object-cover shadow-lg"
                />
                </div>
                <h3 className="text-4xl font-bold text-gray-800 mb-6">
                Planification de voyage
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed max-w-md">
                Planifiez vos voyages facilement avec notre application intuitive et
                profitez d&apos;une organisation sans stress.
                </p>
            </div>

            {/* Fonctionnalité 2 */}
            <div className="flex flex-col items-center text-center">
                <div className="w-64 h-64 relative mb-8">
                <img
                    src="./chat.png"
                    alt="Chat collaboratif"
                    className="w-full h-full rounded-full object-cover shadow-lg"
                />
                </div>
                <h3 className="text-4xl font-bold text-gray-800 mb-6">
                Chat collaboratif
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed max-w-md">
                Communiquez efficacement avec vos amis pour organiser et partager vos
                idées en temps réel.
                </p>
            </div>

            {/* Fonctionnalité 3 */}
            <div className="flex flex-col items-center text-center">
                <div className="w-64 h-64 relative mb-8">
                <img
                    src="./sondage.png"
                    alt="Sondages en temps réel"
                    className="w-full h-full rounded-full object-cover shadow-lg"
                />
                </div>
                <h3 className="text-4xl font-bold text-gray-800 mb-6">
                Sondages en temps réel
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed max-w-md">
                Prenez des décisions rapides et collectives grâce à nos sondages
                dynamiques.
                </p>
            </div>
            </div>
        </div>
        </section>


    </div>
  );
};

export default LandingPage;
