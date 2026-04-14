export default function EmailSentPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">

            <h1 className="text-2xl font-bold mb-4">
                📨 Email envoyé !
            </h1>

            <p className="text-gray-600 mb-6">
                Un email de vérification vous a été envoyé.<br />
                Vérifiez votre boîte mail pour continuer.
            </p>

            <a
                href="/"
                className="px-4 py-2 bg-black text-white rounded-lg"
            >
                Retour à l’accueil
            </a>

            <p className="text-sm text-gray-400 mt-4">
                Vous n’avez pas reçu l’email ? Vérifiez vos spams.
            </p>

            <button className="mt-4 underline text-sm">
                Renvoyer l’email
            </button>

        </div>
    );
}