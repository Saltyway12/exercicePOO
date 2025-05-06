/**
 * Classe Paint - Application de dessin
 * Cette classe encapsule toutes les fonctionnalités d'une application de dessin simple
 * permettant de dessiner avec un stylo, des carrés et des cercles
 */
export class Paint {
	/**
	 * Constructeur de l'application Paint
	 * @param {Object} options - Options de configuration
	 * @param {HTMLElement} options.container - Élément HTML qui contiendra l'application
	 */
	constructor(options) {
		// Récupération du conteneur
		this.container = options.container;
		if (!this.container) {
			console.error("Conteneur non spécifié pour l'application Paint");
			return;
		}

		// États et paramètres
		this.painting = false; // Indique si on est en train de dessiner
		this.tool = "pen"; // Outil sélectionné (pen, square, circle)
		this.color = "black"; // Couleur sélectionnée
		this.size = 10; // Taille du trait
		this.undoList = []; // Liste des actions pour annuler
		this.lastAction = []; // Dernière action en cours
		this.redoList = []; // Liste des actions pour rétablir
		this.originalShapePos = {}; // Position originale pour les formes
		this.snapshot = null; // Capture d'écran temporaire
		this.minSize = 1; // Taille minimale du trait
		this.maxSize = 100; // Taille maximale du trait
		this.toolList = ["pen", "square", "circle"]; // Liste des outils disponibles

		// Éléments DOM
		this.canvas = null; // Élément canvas
		this.ctx = null; // Contexte 2D du canvas
		this.inputColor = null; // Sélecteur de couleur
		this.inputSize = null; // Sélecteur de taille
		this.btnUndo = null; // Bouton annuler
		this.btnRedo = null; // Bouton rétablir
		this.btnSave = null; // Bouton sauvegarder
		this.btnLoad = null; // Bouton charger
		this.btnsTool = null; // Boutons d'outils
	}

	/**
	 * Initialise l'application Paint
	 */
	init() {
		// Création des éléments DOM
		this.initDOM();
		// Injection des styles CSS
		this.injectCSS();
		// Binding des méthodes pour maintenir le contexte 'this'
		this.bindMethods();

		// Initialisation des valeurs par défaut
		this.inputColor.value = this.color;
		this.inputSize.value = this.size;

		// Redimensionnement initial du canvas
		this.resize();

		// Ajout des écouteurs d'événements
		this.initEventListeners();
	}

	/**
	 * Lie les méthodes au contexte de l'objet
	 */
	bindMethods() {
		this.resize = this.resize.bind(this);
		this.startPosition = this.startPosition.bind(this);
		this.finishedPosition = this.finishedPosition.bind(this);
		this.draw = this.draw.bind(this);
		this.keyboard = this.keyboard.bind(this);
		this.chooseColor = this.chooseColor.bind(this);
		this.setSize = this.setSize.bind(this);
		this.undo = this.undo.bind(this);
		this.redo = this.redo.bind(this);
		this.save = this.save.bind(this);
		this.load = this.load.bind(this);
		this.changeTool = this.changeTool.bind(this);
	}

	/**
	 * Crée et initialise les éléments DOM de l'application
	 */
	initDOM() {
		// Création de la structure HTML
		this.container.innerHTML = `
            <div class="paint-app-container">
                <div class="interface">
                    <div class="interface-container interface-left">
                        <input type="color" name="color-select" id="color-select" class="btn btn-color" title="Couleur: 'shift'+'c'">
                        <input type="number" name="size-select" id="size-select" min="1" max="100" class="btn btn-size" title="Taille: raccourci: 'shift'+'+' | 'shift'+'-'">
                        <button class="btn btn-tool btn-pen" data-tool="pen"><img src="./icons/pen.svg" alt="Bouton Stylo"></button>
                        <button class="btn btn-tool btn-square" data-tool="square"><img src="./icons/square.svg" alt="Bouton Carré"></button>
                        <button class="btn btn-tool btn-circle" data-tool="circle"><img src="./icons/circle.svg" alt="Bouton Cercle"></button>
                    </div>
                    <div class="interface-container interface-right">
                        <button class="btn btn-undo" disabled="true"><img src="./icons/undo.svg" alt="Bouton Annuler" title="Annuler: 'shift'+'z'"></button>
                        <button class="btn btn-redo" disabled="true"><img src="./icons/redo.svg" alt="Bouton Rétablir" title="Rétablir: 'shift'+'y'"></button>
                        <button class="btn btn-save" title="Sauvegarder: 'shift'+'s'"><img src="./icons/save.svg" alt="Bouton Sauvegarder"></button>
                        <button class="btn btn-load" title="Charger: 'shift'+'l'"><img src="./icons/load.svg" alt="Bouton Charger"></button>
                    </div>
                </div>
                <div class="canvas-container">
                    <canvas class="paint-app"></canvas>
                </div>
            </div>
        `;

		// Récupération des éléments DOM
		this.canvas = this.container.querySelector("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.inputColor = this.container.querySelector(".btn-color");
		this.inputSize = this.container.querySelector(".btn-size");
		this.btnUndo = this.container.querySelector(".btn-undo");
		this.btnRedo = this.container.querySelector(".btn-redo");
		this.btnSave = this.container.querySelector(".btn-save");
		this.btnLoad = this.container.querySelector(".btn-load");
		this.btnsTool = this.container.querySelectorAll(".btn-tool");
	}
	injectCSS() {
		if (document.getElementById("paint-styles")) return;

		const styleElement = document.createElement("style");
		styleElement.id = "paint-styles";

		styleElement.textContent = `
        .paint-app-container {
            overflow: hidden;
            display: grid;
            height: 100%;
            width: 100%;
            grid-template-rows: auto 1fr;
        }

        .paint-app-container .interface {
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
            border-bottom: 2px solid black;
        }

        .paint-app-container .interface .interface-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .paint-app-container .interface .interface-container .btn {
            display: inline-block;
            width: 50px;
            height: 50px;
        }

        .paint-app-container .interface .interface-container .btn:has(img) {
            padding: 10px;
        }

        .paint-app-container .canvas-container {
            position: relative;
            width: 75dvw;
            height: 75dvh;
            border : 2px solid black;
        }

        .paint-app-container .paint-app[data-tool="square"],
        .paint-app-container .paint-app[data-tool="circle"] {
            cursor: crosshair;
        }

        .paint-app-container .paint-app[data-tool="pen"] {
            cursor: pointer;
        }
`;

		document.head.appendChild(styleElement);
	}
	/**
	 * Initialise les écouteurs d'événements
	 */
	initEventListeners() {
		// Événements de fenêtre et canvas
		window.addEventListener("resize", this.resize);
		this.canvas.addEventListener("mousedown", this.startPosition);
		window.addEventListener("mouseup", this.finishedPosition);
		this.canvas.addEventListener("mousemove", this.draw);
		document.addEventListener("keypress", this.keyboard);

		// Événements d'interface
		this.inputColor.addEventListener("change", this.chooseColor);
		this.inputSize.addEventListener("change", this.setSize);
		this.btnUndo.addEventListener("click", this.undo);
		this.btnRedo.addEventListener("click", this.redo);
		this.btnSave.addEventListener("click", this.save);
		this.btnLoad.addEventListener("click", this.load);

		// Événements des boutons d'outils
		this.btnsTool.forEach((btn) => {
			btn.addEventListener("click", this.changeTool);
		});
	}

	/**
	 * Supprime les écouteurs d'événements pour éviter les fuites de mémoire
	 */
	destroy() {
		// Suppression des écouteurs globaux
		window.removeEventListener("resize", this.resize);
		window.removeEventListener("mouseup", this.finishedPosition);
		document.removeEventListener("keypress", this.keyboard);

		// Suppression des écouteurs du canvas
		if (this.canvas) {
			this.canvas.removeEventListener("mousedown", this.startPosition);
			this.canvas.removeEventListener("mousemove", this.draw);
		}

		// Suppression des écouteurs d'interface
		if (this.inputColor)
			this.inputColor.removeEventListener("change", this.chooseColor);
		if (this.inputSize)
			this.inputSize.removeEventListener("change", this.setSize);
		if (this.btnUndo) this.btnUndo.removeEventListener("click", this.undo);
		if (this.btnRedo) this.btnRedo.removeEventListener("click", this.redo);
		if (this.btnSave) this.btnSave.removeEventListener("click", this.save);
		if (this.btnLoad) this.btnLoad.removeEventListener("click", this.load);

		// Suppression des écouteurs des boutons d'outils
		if (this.btnsTool) {
			this.btnsTool.forEach((btn) => {
				btn.removeEventListener("click", this.changeTool);
			});
		}

		// Nettoyage du conteneur
		this.container.innerHTML = "";
	}

	/**
	 * Redimensionne le canvas en fonction de la taille du conteneur
	 */
	resize() {
		// Sauvegarde du contenu actuel
		if (this.canvas.width > 0 && this.canvas.height > 0) {
			let snapshot = this.ctx.getImageData(
				0,
				0,
				this.canvas.width,
				this.canvas.height
			);

			// Nouveau dimensionnement
			const paintContainer = this.container.querySelector(
				".paint-app-container"
			);
			const interfaceHeight =
				this.container.querySelector(".interface").offsetHeight;
			this.canvas.width = paintContainer.clientWidth;
			this.canvas.height = paintContainer.clientHeight - interfaceHeight;

			// Restauration du contenu
			this.ctx.putImageData(snapshot, 0, 0);
		} else {
			// Premier dimensionnement
			const paintContainer = this.container.querySelector(
				".paint-app-container"
			);
			const interfaceHeight =
				this.container.querySelector(".interface").offsetHeight;
			this.canvas.width = paintContainer.clientWidth;
			this.canvas.height = paintContainer.clientHeight - interfaceHeight;
		}

		// Configuration du contexte
		this.setContext();
	}

	/**
	 * Configure les propriétés du contexte de dessin
	 */
	setContext() {
		this.ctx.lineWidth = this.size;
		this.ctx.strokeStyle = this.color;
	}

	/**
	 * Change l'outil de dessin sélectionné
	 * @param {Event} e - Événement du clic
	 */
	changeTool(e) {
		const selectedTool = e.currentTarget.dataset.tool;
		if (!this.toolList.includes(selectedTool)) return;
		this.tool = selectedTool;
		this.canvas.dataset.tool = selectedTool;
	}

	/**
	 * Débute le dessin
	 * @param {MouseEvent} e - Événement de souris
	 */
	startPosition(e) {
		this.painting = true;
		switch (this.tool) {
			case "pen":
				// Pour créer un point au clic
				this.draw(e);
				break;
			case "circle":
			case "square":
				this.drawWithShape(e, "start");
				break;
		}
	}

	/**
	 * Termine le dessin
	 * @param {MouseEvent} e - Événement de souris
	 */
	finishedPosition(e) {
		switch (this.tool) {
			case "pen":
				this.painting = false;
				this.draw(e);
				break;
			case "circle":
			case "square":
				this.drawWithShape(e, "end");
				this.painting = false;
				break;
		}

		this.ctx.beginPath();

		// Si aucune action n'a été effectuée, on sort
		if (!this.lastAction.length) return;

		// Sauvegarde de l'action pour pouvoir l'annuler
		const undoAction = {
			usedTool: this.tool,
			actions: this.lastAction,
			color: this.color,
			size: this.size,
		};
		this.undoList.push(undoAction);
		this.lastAction = [];

		// Mise à jour des boutons
		this.checkDisabled();
	}

	/**
	 * Dessine en fonction de l'outil sélectionné
	 * @param {MouseEvent} e - Événement de souris
	 */
	draw(e) {
		// Si on n'est pas en train de dessiner, on arrête la fonction
		if (!this.painting) return;

		switch (this.tool) {
			case "pen":
				this.drawWithPen(e);
				break;
			case "circle":
			case "square":
				this.drawWithShape(e, "selection");
				break;
		}
	}

	/**
	 * Dessine avec l'outil stylo
	 * @param {MouseEvent} e - Événement de souris
	 */
	drawWithPen(e) {
		this.ctx.lineCap = "round";
		let mouse = this.getMousePos(e);

		// On dessine là où se trouve la souris
		this.ctx.lineTo(mouse.x, mouse.y);
		this.ctx.stroke();

		// On améliore la fluidité
		this.ctx.beginPath();
		this.ctx.moveTo(mouse.x, mouse.y);

		// Sauvegarde de la position pour l'historique
		this.lastAction.push({
			x: mouse.x,
			y: mouse.y,
		});
	}

	/**
	 * Dessine avec les outils de forme (carré ou cercle)
	 * @param {MouseEvent} e - Événement de souris
	 * @param {string} state - État du dessin ("start", "selection" ou "end")
	 */
	drawWithShape(e, state) {
		if (!this.painting) return;
		const lastPos = this.getMousePos(e);

		// Au début du dessin, on sauvegarde la position initiale et l'état du canvas
		if (state === "start") {
			this.originalShapePos = lastPos;
			this.snapshot = this.ctx.getImageData(
				0,
				0,
				this.canvas.width,
				this.canvas.height
			);
			return;
		}

		// Calcul des dimensions de la forme
		const shape = this.getShapeRect(this.originalShapePos, lastPos);

		// Restauration de l'état initial pour effacer les formes temporaires
		this.ctx.putImageData(this.snapshot, 0, 0);

		// Dessin de la forme
		this.drawShape(shape);

		// Si on termine le dessin, on sauvegarde la forme dans l'historique
		if (state === "end") {
			this.lastAction.push(shape);
		}
	}

	/**
	 * Dessine une forme selon l'outil sélectionné
	 * @param {Object} shape - Dimensions et position de la forme
	 */
	drawShape(shape) {
		switch (this.tool) {
			case "square":
				this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
				break;
			case "circle":
				this.ctx.beginPath();
				this.ctx.ellipse(
					shape.x + shape.width / 2, // Centre X
					shape.y + shape.height / 2, // Centre Y
					shape.width / 2, // Rayon X
					shape.height / 2, // Rayon Y
					0,
					0,
					Math.PI * 2 // 0 rotation, angle de début/fin pour un cercle complet
				);
				this.ctx.stroke();
				break;
		}
	}

	/**
	 * Calcule les dimensions et la position d'une forme
	 * @param {{x:number, y:number}} originalPos - Position initiale
	 * @param {{x:number, y:number}} lastPos - Position finale
	 * @returns {{x:number, y:number, width:number, height:number}} - Dimensions de la forme
	 */
	getShapeRect(originalPos, lastPos) {
		const shape = {};

		// Calcul de la position X et de la largeur
		if (originalPos.x < lastPos.x) {
			shape.x = originalPos.x;
			shape.width = lastPos.x - originalPos.x;
		} else {
			shape.x = lastPos.x;
			shape.width = originalPos.x - lastPos.x;
		}

		// Calcul de la position Y et de la hauteur
		if (originalPos.y < lastPos.y) {
			shape.y = originalPos.y;
			shape.height = lastPos.y - originalPos.y;
		} else {
			shape.y = lastPos.y;
			shape.height = originalPos.y - lastPos.y;
		}

		return shape;
	}

	/**
	 * Retourne la position de la souris relative au canvas
	 * @param {MouseEvent} evt - Événement de souris
	 * @returns {{x:number, y:number}} - Coordonnées dans le canvas
	 */
	getMousePos(evt) {
		const rect = this.canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top,
		};
	}

	/**
	 * Redessine une séquence d'actions
	 * @param {Array} tab - Liste d'actions à redessiner
	 */
	redraw(tab) {
		tab.forEach((action) => {
			// Configuration du contexte pour cette action
			this.ctx.strokeStyle = action.color;
			this.ctx.lineWidth = action.size;

			switch (action.usedTool) {
				case "pen":
					this.ctx.beginPath();
					action.actions.forEach((move) => {
						this.ctx.lineTo(move.x, move.y);
						this.ctx.stroke();
						this.ctx.beginPath();
						this.ctx.moveTo(move.x, move.y);
					});
					break;

				case "square":
					const squareMove = action.actions[0];
					this.ctx.strokeRect(
						squareMove.x,
						squareMove.y,
						squareMove.width,
						squareMove.height
					);
					break;

				case "circle":
					const circleMove = action.actions[0];
					this.ctx.beginPath();
					this.ctx.ellipse(
						circleMove.x + circleMove.width / 2,
						circleMove.y + circleMove.height / 2,
						circleMove.width / 2,
						circleMove.height / 2,
						0,
						0,
						Math.PI * 2
					);
					this.ctx.stroke();
					break;
			}
		});

		// Réinitialisation du chemin
		this.ctx.beginPath();

		// Restauration du contexte actuel
		this.setContext();
	}

	/**
	 * Gère les raccourcis clavier
	 * @param {KeyboardEvent} e - Événement clavier
	 */
	keyboard(e) {
		// Les raccourcis fonctionnent uniquement avec la touche Shift
		if (!e.shiftKey) return;
		e.preventDefault();

		// Actions selon la touche pressée
		switch (e.key.toLowerCase()) {
			case "s":
				this.save();
				break;
			case "l":
				this.load();
				break;
			case "c":
				this.inputColor.click();
				break;
			case "z":
				this.undo();
				break;
			case "y":
				this.redo();
				break;
			case "+":
				this.inputSize.value++;
				this.setSize();
				break;
			case "-":
				this.inputSize.value--;
				this.setSize();
				break;
			case "1":
			case "2":
			case "3":
				const index = parseInt(e.key) - 1;
				if (this.btnsTool[index]) {
					this.btnsTool[index].click();
				}
				break;
		}
	}

	/**
	 * Change la taille du trait
	 */
	setSize() {
		this.size = parseInt(this.inputSize.value);

		// Vérification des limites
		if (this.size < this.minSize) this.size = this.minSize;
		else if (this.size > this.maxSize) this.size = this.maxSize;

		// Mise à jour de l'interface
		this.inputSize.value = this.size;

		// Application de la nouvelle taille
		this.setContext();
	}

	/**
	 * Charge une image dans le canvas
	 */
	load() {
		// Création d'un input de type file
		const input = document.createElement("input");
		input.setAttribute("type", "file");
		input.click();

		// Référence à l'objet actuel pour utilisation dans les callbacks
		const that = this;

		// Gestion de la sélection de fichier
		input.oninput = function (e) {
			// Création d'un lecteur de fichier
			const reader = new FileReader();

			// Chargement du fichier
			reader.onload = function (event) {
				// Création d'une nouvelle image
				const img = new Image();

				// Lorsque l'image est chargée
				img.onload = function () {
					// Effacement du canvas
					that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
					// Dessin de l'image
					that.ctx.drawImage(img, 0, 0);

					// Réinitialisation des historiques
					that.undoList = [];
					that.redoList = [];
					that.checkDisabled();
				};

				// Définition de la source de l'image
				img.src = event.target.result;
			};

			// Lecture du fichier
			reader.readAsDataURL(e.target.files[0]);
		};
	}

	/**
	 * Sauvegarde le dessin actuel en tant qu'image PNG
	 */
	save() {
		// Conversion du canvas en données PNG
		const png = this.canvas.toDataURL("image/png");

		// Changement du type MIME pour le téléchargement
		png.replace("image/png", "application/octet-stream");

		// Création d'un lien de téléchargement
		const link = document.createElement("a");
		link.setAttribute("download", "SauvegardeCanvas.png");
		link.setAttribute("href", png);

		// Simulation du clic pour déclencher le téléchargement
		link.click();
	}

	/**
	 * Modifie la couleur du trait
	 */
	chooseColor() {
		this.color = this.inputColor.value;
		this.setContext();
	}

	/**
	 * Annule la dernière action
	 */
	undo() {
		if (!this.undoList.length) return;

		// Récupération de la dernière action
		const redoAction = this.undoList.pop();

		// Ajout à l'historique des rétablissements
		this.redoList.push(redoAction);

		// Effacement du canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Redessin de toutes les actions restantes
		this.redraw(this.undoList);

		// Mise à jour des boutons
		this.checkDisabled();
	}

	/**
	 * Rétablit la dernière action annulée
	 */
	redo() {
		if (!this.redoList.length) return;

		// Récupération de la dernière action annulée
		const redoAction = this.redoList.pop();

		// Ajout à l'historique des annulations
		this.undoList.push(redoAction);

		// Dessin de l'action rétablie
		this.redraw([redoAction]);

		// Mise à jour des boutons
		this.checkDisabled();
	}

	/**
	 * Vérifie si les boutons d'annulation et de rétablissement doivent être désactivés
	 */
	checkDisabled() {
		this.btnUndo.disabled = !this.undoList.length;
		this.btnRedo.disabled = !this.redoList.length;
	}
}
