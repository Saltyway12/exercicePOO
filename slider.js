/**
 * Classe Slider - Application de diaporama d'images améliorée
 * Cette classe encapsule toutes les fonctionnalités d'un slider d'images
 * avec des options avancées, différents modes de transition et une meilleure interface utilisateur
 */
export class Slider {
	/**
	 * Constructeur de l'application Slider
	 * @param {Object} options - Options de configuration
	 * @param {HTMLElement} options.container - Élément HTML qui contiendra l'application
	 * @param {Array<String>} [options.images] - Tableau optionnel des URLs d'images
	 * @param {string} [options.theme="light"] - Thème de l'application (light, dark, colorful)
	 * @param {string} [options.transition="fade"] - Type de transition (fade, slide, zoom)
	 * @param {number} [options.interval=5000] - Intervalle entre les transitions en mode automatique (ms)
	 */
	constructor(options) {
		// Récupération du conteneur
		this.container = options.container;
		if (!this.container) {
			console.error("Conteneur non spécifié pour l'application Slider");
			return;
		}

		// Images par défaut si aucune n'est fournie
		this.images = options.images || [
			"https://picsum.photos/id/10/800/450",
			"https://picsum.photos/id/11/800/450",
			"https://picsum.photos/id/12/800/450",
			"https://picsum.photos/id/13/800/450",
			"https://picsum.photos/id/14/800/450",
		];

		// Options et état
		this.theme = options.theme || this.loadSavedTheme() || "light";
		this.transition =
			options.transition || this.loadSavedTransition() || "fade";
		this.interval = options.interval || 5000;
		this.autoplay = false;
		this.fullscreen = false;
		this.index = 0;
		this.timerInterval = null;
		this.initialized = false;

		// Éléments DOM
		this.btns = [];
		this.dots = [];
		this.items = [];
		this.sliderElement = null;
		this.themeSelector = null;
		this.transitionSelector = null;
		this.intervalInput = null;
		this.autoplayBtn = null;
		this.fullscreenBtn = null;
		this.caption = null;
		this.touchStartX = null;
		this.touchEndX = null;

		// Historique et statistiques
		this.viewCount = 0;
		this.totalViewTime = 0;
		this.viewStartTime = null;
		this.viewHistory = this.loadViewHistory() || [];
	}

	/**
	 * Initialise l'application Slider
	 */
	init() {
		// Création de la structure du slider
		this.createSlider();

		// Injection des styles CSS
		this.injectCSS();

		// Application du thème
		this.applyTheme();

		// Mise à jour de l'interface pour les options
		this.updateOptions();

		// Affichage de la première image et ajout des écouteurs d'événements
		this.showItems(0);
		this.addEventListeners();

		// Démarrer le suivi du temps de visionnage
		this.startViewTracking();

		// Marquer comme initialisé
		this.initialized = true;

		console.log("Application Slider initialisée avec succès");

		// Afficher un toast de bienvenue
		this.showToast("Diaporama prêt !");
	}

	/**
	 * Crée les éléments du slider avec une interface améliorée
	 */
	createSlider() {
		// Création du conteneur principal
		this.container.innerHTML = `
      <div class="slider-app-container ${this.theme}">
        <div class="slider-header">
          <h3>Galerie d'images</h3>
          <div class="slider-options">
            <div class="form-group">
              <label for="theme-select">Thème:</label>
              <select id="theme-select" class="form-select form-select-sm">
                <option value="light" ${
									this.theme === "light" ? "selected" : ""
								}>Clair</option>
                <option value="dark" ${
									this.theme === "dark" ? "selected" : ""
								}>Sombre</option>
                <option value="colorful" ${
									this.theme === "colorful" ? "selected" : ""
								}>Coloré</option>
              </select>
            </div>
            <div class="form-group">
              <label for="transition-select">Transition:</label>
              <select id="transition-select" class="form-select form-select-sm">
                <option value="fade" ${
									this.transition === "fade" ? "selected" : ""
								}>Fondu</option>
                <option value="slide" ${
									this.transition === "slide" ? "selected" : ""
								}>Glissement</option>
                <option value="zoom" ${
									this.transition === "zoom" ? "selected" : ""
								}>Zoom</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="slider-container">
          <div class="slider-content">
            ${this.images
							.map(
								(img, i) => `
              <div class="slider-item ${this.transition}">
                <img src="${img}" alt="Image ${i + 1}" loading="lazy">
                <div class="slider-caption">Image ${i + 1}</div>
              </div>
            `
							)
							.join("")}
          </div>
          
          <div class="slider-controls">
            <div class="slider-dots">
              ${this.images
								.map(
									(_, i) => `
                <span class="slider-dot" data-id="${i}"></span>
              `
								)
								.join("")}
            </div>
            
            <a class="slider-nav slider-prev">&lsaquo;</a>
            <a class="slider-nav slider-next">&rsaquo;</a>
            
            <div class="slider-toolbar">
              <button class="slider-btn" id="autoplay-btn" title="Lecture automatique">
                <i class="fas fa-play"></i>
              </button>
              <button class="slider-btn" id="fullscreen-btn" title="Plein écran">
                <i class="fas fa-expand"></i>
              </button>
              <div class="slider-interval">
                <label for="interval-input">Intervalle:</label>
                <input type="range" id="interval-input" min="1000" max="10000" step="1000" value="${
									this.interval
								}">
                <span id="interval-value">${this.interval / 1000}s</span>
              </div>
            </div>
          </div>
          
          <div class="slider-info">
            <div class="slider-counter">
              <span id="current-slide">1</span>/<span id="total-slides">${
								this.images.length
							}</span>
            </div>
          </div>
        </div>
        
        <div class="slider-stats">
          <div class="slider-stat-item">
            Images visionnées: <span id="view-count">0</span>
          </div>
          <div class="slider-stat-item">
            Temps total: <span id="view-time">00:00</span>
          </div>
        </div>
      </div>
    `;

		// Récupération des éléments DOM
		this.sliderElement = this.container.querySelector(".slider-container");
		this.items = this.container.querySelectorAll(".slider-item");
		this.dots = this.container.querySelectorAll(".slider-dot");
		this.btns = [
			this.container.querySelector(".slider-next"),
			this.container.querySelector(".slider-prev"),
		];
		this.themeSelector = this.container.querySelector("#theme-select");
		this.transitionSelector =
			this.container.querySelector("#transition-select");
		this.intervalInput = this.container.querySelector("#interval-input");
		this.intervalValue = this.container.querySelector("#interval-value");
		this.autoplayBtn = this.container.querySelector("#autoplay-btn");
		this.fullscreenBtn = this.container.querySelector("#fullscreen-btn");
		this.currentSlide = this.container.querySelector("#current-slide");
		this.totalSlides = this.container.querySelector("#total-slides");
		this.viewCountDisplay = this.container.querySelector("#view-count");
		this.viewTimeDisplay = this.container.querySelector("#view-time");
	}

	/**
	 * Met à jour les options d'interface en fonction des paramètres actuels
	 */
	updateOptions() {
		// Mettre à jour les sélecteurs
		if (this.themeSelector) this.themeSelector.value = this.theme;
		if (this.transitionSelector)
			this.transitionSelector.value = this.transition;
		if (this.intervalInput) {
			this.intervalInput.value = this.interval;
			this.intervalValue.textContent = `${this.interval / 1000}s`;
		}

		// Mettre à jour l'état du bouton de lecture automatique
		if (this.autoplayBtn) {
			if (this.autoplay) {
				this.autoplayBtn.innerHTML = '<i class="fas fa-pause"></i>';
				this.autoplayBtn.classList.add("active");
				this.autoplayBtn.title = "Pause";
			} else {
				this.autoplayBtn.innerHTML = '<i class="fas fa-play"></i>';
				this.autoplayBtn.classList.remove("active");
				this.autoplayBtn.title = "Lecture automatique";
			}
		}

		// Appliquer la classe de transition à tous les éléments
		this.items.forEach((item) => {
			item.classList.remove("fade", "slide", "zoom");
			item.classList.add(this.transition);
		});
	}

	/**
	 * Injecte le CSS nécessaire pour le slider avec les différents thèmes et transitions
	 */
	injectCSS() {
		if (document.getElementById("slider-styles")) return;

		const style = document.createElement("style");
		style.id = "slider-styles";
		style.textContent = `
      /* Structure principale */
      .slider-app-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      
      .slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .slider-header h3 {
        margin: 0;
        font-weight: 600;
      }
      
      .slider-options {
        display: flex;
        gap: 15px;
      }
      
      .form-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      /* Conteneur du slider */
      .slider-container {
        position: relative;
        width: 100%;
        height: 450px;
        margin: 0 auto;
        overflow: hidden;
        background-color: #f5f5f5;
      }
      
      /* Zone de contenu */
      .slider-content {
        width: 100%;
        height: 100%;
        position: relative;
      }
      
      /* Éléments du slider */
      .slider-item {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
      }
      
      .slider-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .slider-caption {
        position: absolute;
        bottom: 50px;
        left: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px;
        text-align: center;
        transform: translateY(100%);
        opacity: 0;
        transition: all 0.5s ease;
      }
      
      .slider-item.active .slider-caption {
        transform: translateY(0);
        opacity: 1;
      }
      
      /* Transitions */
      .slider-item.fade {
        opacity: 0;
        transition: opacity 1s ease;
      }
      
      .slider-item.fade.active {
        opacity: 1;
        display: block;
      }
      
      .slider-item.slide {
        transform: translateX(100%);
        transition: transform 0.8s ease;
        display: block;
        opacity: 0;
      }
      
      .slider-item.slide.active {
        transform: translateX(0);
        opacity: 1;
      }
      
      .slider-item.slide.prev {
        transform: translateX(-100%);
        display: block;
        opacity: 0;
      }
      
      .slider-item.zoom {
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.8s ease;
        display: block;
      }
      
      .slider-item.zoom.active {
        transform: scale(1);
        opacity: 1;
      }
      
      /* Contrôles */
      .slider-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .slider-dots {
        display: flex;
        justify-content: center;
        margin: 10px 0;
      }
      
      .slider-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        margin: 0 5px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .slider-dot:hover {
        background-color: rgba(255, 255, 255, 0.8);
      }
      
      .slider-dot.active {
        background-color: white;
        transform: scale(1.2);
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }
      
      .slider-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background-color: rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 24px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 50%;
        z-index: 10;
        transition: all 0.3s ease;
      }
      
      .slider-nav:hover {
        background-color: rgba(0, 0, 0, 0.6);
      }
      
      .slider-prev {
        left: 15px;
      }
      
      .slider-next {
        right: 15px;
      }
      
      /* Barre d'outils */
      .slider-toolbar {
        display: flex;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 8px 15px;
        border-radius: 20px;
        margin-bottom: 10px;
      }
      
      .slider-btn {
        background-color: transparent;
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        cursor: pointer;
        margin: 0 5px;
        transition: all 0.3s ease;
      }
      
      .slider-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .slider-btn.active {
        background-color: rgba(255, 255, 255, 0.3);
      }
      
      .slider-interval {
        display: flex;
        align-items: center;
        color: white;
        margin-left: 10px;
        font-size: 0.85rem;
      }
      
      .slider-interval input {
        width: 100px;
        margin: 0 8px;
      }
      
      /* Compteur */
      .slider-info {
        position: absolute;
        top: 15px;
        right: 15px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.85rem;
      }
      
      /* Statistiques */
      .slider-stats {
        display: flex;
        justify-content: space-around;
        padding: 10px;
        background-color: #f8f9fa;
        border-top: 1px solid #e9ecef;
        margin-top: auto;
      }
      
      .slider-stat-item {
        font-size: 0.85rem;
        color: #6c757d;
      }
      
      /* Mode plein écran */
      .slider-app-container.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        background-color: black;
      }
      
      .slider-app-container.fullscreen .slider-container {
        height: 100%;
      }
      
      /* Toast */
      .slider-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: fadeInOut 2.5s ease forwards;
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        10% { opacity: 1; transform: translate(-50%, 0); }
        90% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
      }
      
      /* Thème clair (par défaut) */
      .slider-app-container.light {
        background-color: white;
        color: #333;
      }
      
      .slider-app-container.light .slider-header {
        background-color: white;
        border-bottom: 1px solid #eee;
      }
      
      .slider-app-container.light .slider-stats {
        background-color: #f8f9fa;
        color: #6c757d;
      }
      
      /* Thème sombre */
      .slider-app-container.dark {
        background-color: #212529;
        color: #f8f9fa;
      }
      
      .slider-app-container.dark .slider-header {
        background-color: #343a40;
        border-bottom: 1px solid #495057;
      }
      
      .slider-app-container.dark .slider-container {
        background-color: #000;
      }
      
      .slider-app-container.dark .slider-stats {
        background-color: #343a40;
        border-top: 1px solid #495057;
      }
      
      .slider-app-container.dark .slider-stat-item {
        color: #adb5bd;
      }
      
      .slider-app-container.dark select,
      .slider-app-container.dark input {
        background-color: #495057;
        color: #f8f9fa;
        border-color: #6c757d;
      }
      
      /* Thème coloré */
      .slider-app-container.colorful {
        background-color: #f8f0fc;
        color: #862e9c;
      }
      
      .slider-app-container.colorful .slider-header {
        background: linear-gradient(135deg, #748ffc, #f783ac);
        color: white;
      }
      
      .slider-app-container.colorful .slider-container {
        background-color: #f3d9fa;
      }
      
      .slider-app-container.colorful .slider-nav {
        background-color: rgba(134, 46, 156, 0.6);
      }
      
      .slider-app-container.colorful .slider-nav:hover {
        background-color: rgba(134, 46, 156, 0.9);
      }
      
      .slider-app-container.colorful .slider-dot {
        background-color: rgba(134, 46, 156, 0.3);
      }
      
      .slider-app-container.colorful .slider-dot.active {
        background-color: #862e9c;
      }
      
      .slider-app-container.colorful .slider-toolbar {
        background: linear-gradient(90deg, #748ffc, #f783ac);
      }
      
      .slider-app-container.colorful .slider-stats {
        background: linear-gradient(90deg, #e9ecef, #f8f0fc);
      }
      
      .slider-app-container.colorful .slider-stat-item {
        color: #862e9c;
      }
    `;

		document.head.appendChild(style);
	}

	/**
	 * Ajoute les écouteurs d'événements sur les points et boutons
	 */
	addEventListeners() {
		// Écouteurs pour les points de navigation
		this.dots.forEach((dot) => {
			dot.addEventListener("click", this.currentItem.bind(this));
		});

		// Écouteurs pour les boutons précédent/suivant
		this.btns.forEach((btn) => {
			btn.addEventListener("click", this.changeItem.bind(this));
		});

		// Écouteurs pour les options
		this.themeSelector.addEventListener("change", this.changeTheme.bind(this));
		this.transitionSelector.addEventListener(
			"change",
			this.changeTransition.bind(this)
		);
		this.intervalInput.addEventListener(
			"input",
			this.changeInterval.bind(this)
		);

		// Écouteurs pour les boutons de contrôle
		this.autoplayBtn.addEventListener("click", this.toggleAutoplay.bind(this));
		this.fullscreenBtn.addEventListener(
			"click",
			this.toggleFullscreen.bind(this)
		);

		// Écouteurs pour les événements tactiles
		this.sliderElement.addEventListener(
			"touchstart",
			this.handleTouchStart.bind(this),
			false
		);
		this.sliderElement.addEventListener(
			"touchend",
			this.handleTouchEnd.bind(this),
			false
		);

		// Écouteur pour les touches du clavier
		document.addEventListener("keydown", this.handleKeyDown.bind(this));
	}

	/**
	 * Gère l'événement de début de toucher
	 * @param {TouchEvent} e - Événement de toucher
	 */
	handleTouchStart(e) {
		this.touchStartX = e.changedTouches[0].screenX;
	}

	/**
	 * Gère l'événement de fin de toucher
	 * @param {TouchEvent} e - Événement de toucher
	 */
	handleTouchEnd(e) {
		this.touchEndX = e.changedTouches[0].screenX;
		this.handleSwipe();
	}

	/**
	 * Gère le geste de balayage
	 */
	handleSwipe() {
		// Si le geste n'est pas assez long, on ignore
		if (Math.abs(this.touchEndX - this.touchStartX) < 50) return;

		if (this.touchEndX < this.touchStartX) {
			// Balayage vers la gauche -> image suivante
			this.showItems(this.index + 1);
		} else {
			// Balayage vers la droite -> image précédente
			this.showItems(this.index - 1);
		}
	}

	/**
	 * Gère les touches du clavier
	 * @param {KeyboardEvent} e - Événement clavier
	 */
	handleKeyDown(e) {
		// Vérifier si le focus est dans l'application slider
		if (
			!this.container.contains(document.activeElement) &&
			document.activeElement !== document.body
		) {
			return;
		}

		switch (e.key) {
			case "ArrowLeft":
				this.showItems(this.index - 1);
				break;
			case "ArrowRight":
				this.showItems(this.index + 1);
				break;
			case " ":
				// Barre d'espace pour mettre en pause/reprendre
				e.preventDefault();
				this.toggleAutoplay();
				break;
			case "f":
				// Touche F pour le plein écran
				this.toggleFullscreen();
				break;
			case "Escape":
				// Échap pour quitter le plein écran
				if (this.fullscreen) {
					this.toggleFullscreen();
				}
				break;
		}
	}

	/**
	 * Change le thème de l'application
	 */
	changeTheme() {
		this.theme = this.themeSelector.value;
		this.applyTheme();

		// Sauvegarder le thème dans le localStorage
		localStorage.setItem("slider_theme", this.theme);

		// Afficher un toast
		this.showToast(`Thème ${this.theme} appliqué`);
	}

	/**
	 * Applique le thème sélectionné
	 */
	applyTheme() {
		// Récupérer le conteneur principal
		const container = this.container.querySelector(".slider-app-container");

		// Supprimer les classes de thème existantes
		container.classList.remove("light", "dark", "colorful");

		// Ajouter la classe du thème sélectionné
		container.classList.add(this.theme);
	}

	/**
	 * Change le type de transition
	 */
	changeTransition() {
		this.transition = this.transitionSelector.value;

		// Mettre à jour les classes des éléments
		this.items.forEach((item) => {
			item.classList.remove("fade", "slide", "zoom");
			item.classList.add(this.transition);
		});

		// Sauvegarder la transition dans le localStorage
		localStorage.setItem("slider_transition", this.transition);

		// Afficher un toast
		this.showToast(`Transition ${this.transition} appliquée`);
	}

	/**
	 * Change l'intervalle entre les transitions en mode automatique
	 */
	changeInterval() {
		this.interval = parseInt(this.intervalInput.value);
		this.intervalValue.textContent = `${this.interval / 1000}s`;

		// Si le mode automatique est actif, redémarrer avec le nouvel intervalle
		if (this.autoplay) {
			this.stopAutoplay();
			this.startAutoplay();
		}

		// Sauvegarder l'intervalle dans le localStorage
		localStorage.setItem("slider_interval", this.interval);
	}

	/**
	 * Active/désactive le mode de lecture automatique
	 */
	toggleAutoplay() {
		this.autoplay = !this.autoplay;

		if (this.autoplay) {
			this.startAutoplay();
			this.autoplayBtn.innerHTML = '<i class="fas fa-pause"></i>';
			this.autoplayBtn.classList.add("active");
			this.autoplayBtn.title = "Pause";
			this.showToast("Lecture automatique activée");
		} else {
			this.stopAutoplay();
			this.autoplayBtn.innerHTML = '<i class="fas fa-play"></i>';
			this.autoplayBtn.classList.remove("active");
			this.autoplayBtn.title = "Lecture automatique";
			this.showToast("Lecture automatique désactivée");
		}
	}

	/**
	 * Démarre la lecture automatique
	 */
	startAutoplay() {
		this.timerInterval = setInterval(() => {
			this.showItems(this.index + 1);
		}, this.interval);
	}

	/**
	 * Arrête la lecture automatique
	 */
	stopAutoplay() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	/**
	 * Active/désactive le mode plein écran
	 */
	toggleFullscreen() {
		this.fullscreen = !this.fullscreen;
		const container = this.container.querySelector(".slider-app-container");

		if (this.fullscreen) {
			container.classList.add("fullscreen");
			this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
			this.fullscreenBtn.title = "Quitter le plein écran";
			this.showToast("Mode plein écran activé");

			// Demander le plein écran au navigateur si possible
			if (container.requestFullscreen) {
				container.requestFullscreen();
			} else if (container.mozRequestFullScreen) {
				container.mozRequestFullScreen();
			} else if (container.webkitRequestFullscreen) {
				container.webkitRequestFullscreen();
			} else if (container.msRequestFullscreen) {
				container.msRequestFullscreen();
			}
		} else {
			container.classList.remove("fullscreen");
			this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
			this.fullscreenBtn.title = "Plein écran";
			this.showToast("Mode plein écran désactivé");

			// Quitter le plein écran du navigateur si possible
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}
	}

	/**
	 * Affiche un toast de notification
	 * @param {string} message - Message à afficher
	 */
	showToast(message) {
		const toast = document.createElement("div");
		toast.className = "slider-toast";
		toast.textContent = message;
		document.body.appendChild(toast);

		// Supprimer le toast après l'animation
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 3000);
	}

	/**
	 * Affiche un élément du slider correspondant à l'index donné et cache les autres
	 * @param {number} n - Index de l'image à afficher
	 */
	showItems(n) {
		// Gestion des limites d'index (boucle)
		this.index =
			n > this.items.length - 1 ? 0 : n < 0 ? this.items.length - 1 : n;

		// Désactiver les classes active de toutes les images et points
		this.items.forEach((item, i) => {
			if (item.classList.contains("active")) {
				// Si c'était l'élément actif précédent
				item.classList.remove("active");

				// Pour la transition slide, marquer comme "prev"
				if (this.transition === "slide") {
					item.classList.add("prev");
					// Nettoyer après la transition
					setTimeout(() => {
						item.classList.remove("prev");
					}, 800);
				} else {
					// Pour les autres transitions, cacher après la transition
					setTimeout(() => {
						if (!item.classList.contains("active")) {
							item.style.display = "none";
						}
					}, 1000);
				}
			}

			this.dots[i].classList.remove("active");
		});

		// Afficher l'image active et marquer le point correspondant
		this.items[this.index].style.display = "block";
		setTimeout(() => {
			this.items[this.index].classList.add("active");
		}, 10); // Petit délai pour permettre aux transitions de fonctionner

		this.dots[this.index].classList.add("active");

		// Mettre à jour l'affichage du compteur
		this.currentSlide.textContent = this.index + 1;

		// Incrémenter le nombre de vues
		this.viewCount++;
		this.viewCountDisplay.textContent = this.viewCount;

		// Sauvegarder l'image courante pour le rechargement
		localStorage.setItem("slider_lastIndex", this.index);
	}

	/**
	 * Affiche l'image correspondant au point cliqué
	 * @param {MouseEvent} e - Événement de clic
	 */
	currentItem(e) {
		const n = parseInt(e.target.dataset.id);
		this.showItems(n);
	}

	/**
	 * Change l'image en fonction du bouton cliqué (précédent/suivant)
	 * @param {MouseEvent} e - Événement de clic
	 */
	changeItem(e) {
		if (e.currentTarget.classList.contains("slider-next")) {
			this.showItems(++this.index);
		} else {
			this.showItems(--this.index);
		}
	}

	/**
	 * Charge un thème sauvegardé
	 * @returns {string|null} - Le thème sauvegardé ou null si aucun
	 */
	loadSavedTheme() {
		return localStorage.getItem("slider_theme");
	}

	/**
	 * Charge une transition sauvegardée
	 * @returns {string|null} - La transition sauvegardée ou null si aucune
	 */
	loadSavedTransition() {
		return localStorage.getItem("slider_transition");
	}

	/**
	 * Charge l'historique des visionnages
	 * @returns {Array} - Liste des sessions de visionnage
	 */
	loadViewHistory() {
		return JSON.parse(localStorage.getItem("slider_viewHistory")) || [];
	}

	/**
	 * Démarre le suivi du temps de visionnage
	 */
	startViewTracking() {
		this.viewStartTime = new Date();

		// Charger le dernier index affiché si disponible
		const lastIndex = localStorage.getItem("slider_lastIndex");
		if (lastIndex !== null) {
			this.showItems(parseInt(lastIndex));
		}

		// Mettre à jour le compteur de visionnages toutes les secondes
		setInterval(() => {
			if (this.viewStartTime) {
				const currentTime = new Date();
				const viewDuration = Math.floor(
					(currentTime - this.viewStartTime) / 1000
				); // en secondes
				this.totalViewTime = viewDuration;

				// Formater le temps
				const minutes = Math.floor(this.totalViewTime / 60);
				const seconds = this.totalViewTime % 60;
				const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
					.toString()
					.padStart(2, "0")}`;

				// Mettre à jour l'affichage
				this.viewTimeDisplay.textContent = formattedTime;
			}
		}, 1000);
	}

	/**
	 * Sauvegarde une session de visionnage dans l'historique
	 */
	saveViewSession() {
		if (!this.viewStartTime || this.viewCount === 0) return;

		const currentTime = new Date();
		const viewDuration = Math.floor((currentTime - this.viewStartTime) / 1000); // en secondes

		const session = {
			date: new Date().toLocaleDateString(),
			duration: viewDuration,
			viewCount: this.viewCount,
			theme: this.theme,
		};

		// Ajouter à l'historique
		this.viewHistory.unshift(session);

		// Limiter à 20 sessions
		if (this.viewHistory.length > 20) {
			this.viewHistory = this.viewHistory.slice(0, 20);
		}

		// Sauvegarder dans le localStorage
		localStorage.setItem(
			"slider_viewHistory",
			JSON.stringify(this.viewHistory)
		);
	}

	/**
	 * Détruit l'application Slider et nettoie les ressources
	 */
	destroy() {
		// Sauvegarder la session de visionnage
		this.saveViewSession();

		// Arrêter la lecture automatique
		this.stopAutoplay();

		// Supprimer les écouteurs d'événements
		this.dots.forEach((dot) => {
			dot.removeEventListener("click", this.currentItem.bind(this));
		});

		this.btns.forEach((btn) => {
			btn.removeEventListener("click", this.changeItem.bind(this));
		});

		this.themeSelector.removeEventListener(
			"change",
			this.changeTheme.bind(this)
		);
		this.transitionSelector.removeEventListener(
			"change",
			this.changeTransition.bind(this)
		);
		this.intervalInput.removeEventListener(
			"input",
			this.changeInterval.bind(this)
		);
		this.autoplayBtn.removeEventListener(
			"click",
			this.toggleAutoplay.bind(this)
		);
		this.fullscreenBtn.removeEventListener(
			"click",
			this.toggleFullscreen.bind(this)
		);

		this.sliderElement.removeEventListener(
			"touchstart",
			this.handleTouchStart.bind(this)
		);
		this.sliderElement.removeEventListener(
			"touchend",
			this.handleTouchEnd.bind(this)
		);

		document.removeEventListener("keydown", this.handleKeyDown.bind(this));

		// Quitter le mode plein écran si activé
		if (this.fullscreen) {
			this.toggleFullscreen();
		}

		// Vider le conteneur
		this.container.innerHTML = "";
	}
}
