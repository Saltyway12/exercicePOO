// Importation de nos différentes applications
import { JustePrix } from "./justePrix.js";
import { Paint } from "./paint.js";
import { Slider } from "./slider.js";

// Gestionnaire principal qui chargera les applications
class AppManager {
	constructor() {
		this.currentApp = null;
		this.appContainer = document.querySelector(".appli");
		this.selector = document.getElementById("appli");

		// Initialisation des écouteurs d'événements
		this.initEventListeners();
	}

	// Initialise les écouteurs d'événements
	initEventListeners() {
		this.selector.addEventListener("change", (e) => {
			this.loadApp(e.target.value);
		});
	}

	// Charge l'application sélectionnée
	loadApp(appName) {
		// Vider le conteneur
		this.appContainer.innerHTML = "";

		// Détruire l'application précédente si nécessaire
		if (this.currentApp && typeof this.currentApp.destroy === "function") {
			this.currentApp.destroy();
		}

		// Charger la nouvelle application
		switch (appName) {
			case "justePrix":
				this.currentApp = new JustePrix({
					container: this.appContainer,
					maxNumber: 100,
				});
				this.currentApp.init();
				break;

			case "paint":
				this.currentApp = new Paint({ container: this.appContainer });
				this.currentApp.init();
				break;

			case "slider":
				this.currentApp = new Slider({ container: this.appContainer });
				this.currentApp.init();
				break;

			default:
				this.appContainer.innerHTML =
					"<p>Veuillez sélectionner une application</p>";
		}
	}
}

// Initialisation du gestionnaire d'applications quand le DOM est chargé
document.addEventListener("DOMContentLoaded", () => {
	const appManager = new AppManager();
});
