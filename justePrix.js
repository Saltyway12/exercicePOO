"use strict";
export class JustePrix {
	constructor(options = {}) {
		// Options configurables
		this.container = options.container || document.body;
		this.maxNumber = options.maxNumber || 100;
		this.maxTrials = options.maxTrials || 7; // 0 = illimité
		this.difficulty = options.difficulty || "normal"; // "easy", "normal", "hard"
		this.theme = options.theme || "classic"; // "classic", "dark", "colorful"

		// État interne
		this.randomNumber = null;
		this.trials = 0;
		this.gameOver = false;
		this.initialized = false;
		this.startTime = null;
		this.endTime = null;
		this.hint = null;
		this.hintsAllowed = 1;
		this.hintsUsed = 0;
		this.bestScore = this.loadBestScore();
		this.gameHistory = this.loadGameHistory();

		// Éléments DOM (seront créés lors de l'initialisation)
		this.form = null;
		this.input = null;
		this.error = null;
		this.instructions = null;
		this.statsDisplay = null;
		this.difficultySelector = null;
		this.themeSelector = null;
		this.hintButton = null;
		this.timerDisplay = null;
		this.timerInterval = null;
	}

	// Génère le HTML du jeu avec les nouvelles fonctionnalités
	generateHTML() {
		// Création du jeu dans le conteneur
		this.container.innerHTML = `
      <div class="container juste-prix-container ${this.theme}">
        <!-- Header avec options -->
        <div class="row justify-content-center mt-4">
          <div class="col-lg-8">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <header class="juste-prix-header">Le Juste Prix</header>
              <div class="juste-prix-options">
                <div class="d-flex gap-2">
                  <select id="difficulty-select" class="form-select form-select-sm">
                    <option value="easy" ${
											this.difficulty === "easy" ? "selected" : ""
										}>Facile</option>
                    <option value="normal" ${
											this.difficulty === "normal" ? "selected" : ""
										}>Normal</option>
                    <option value="hard" ${
											this.difficulty === "hard" ? "selected" : ""
										}>Difficile</option>
                  </select>
                  <select id="theme-select" class="form-select form-select-sm">
                    <option value="classic" ${
											this.theme === "classic" ? "selected" : ""
										}>Classique</option>
                    <option value="dark" ${
											this.theme === "dark" ? "selected" : ""
										}>Sombre</option>
                    <option value="colorful" ${
											this.theme === "colorful" ? "selected" : ""
										}>Coloré</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timer et statistiques -->
        <div class="row justify-content-center mb-2">
          <div class="col-lg-8">
            <div class="d-flex justify-content-between">
              <div id="timer" class="badge bg-primary">00:00</div>
              <div id="stats" class="badge bg-info">Meilleur score: ${
								this.bestScore ? this.bestScore + " essais" : "Aucun"
							}</div>
            </div>
          </div>
        </div>

        <!-- Formulaire -->
        <div class="row justify-content-center mb-4">
          <div class="col-lg-8">
            <div class="bg-light p-4 shadow rounded">
              <form id="formulaire-juste-prix">
                <div class="row mb-3">
                  <div class="col-9">
                    <input
                      id="prix-juste-prix"
                      class="form-control"
                      placeholder="Devinez le prix ! (entre 0 et ${
												this.maxNumber
											})"
                      autocomplete="off" />
                  </div>
                  <div class="col-3">
                    <button type="submit" class="btn btn-primary w-100" id="button-deviner">
                      Deviner
                    </button>
                  </div>
                </div>
                <div class="text-danger error-juste-prix mb-3">Vous devez rentrer un nombre.</div>
                
                <div class="row gx-2">
                  <div class="col">
                    <button type="button" class="btn btn-secondary w-100" id="button-reset">
                      <i class="bi bi-arrow-repeat"></i> Nouvelle partie
                    </button>
                  </div>
                  <div class="col">
                    <button type="button" class="btn btn-warning w-100" id="button-hint">
                      <i class="bi bi-lightbulb"></i> Indice <span class="badge bg-light text-dark">${
												this.hintsAllowed
											}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="row justify-content-center mb-4">
          <div id="instructions-juste-prix" class="col-lg-8"></div>
        </div>

        <!-- Historique des parties -->
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="accordion" id="gameHistoryAccordion">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#gameHistory">
                    Historique des parties
                  </button>
                </h2>
                <div id="gameHistory" class="accordion-collapse collapse">
                  <div class="accordion-body p-0">
                    <table class="table table-striped table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Difficulté</th>
                          <th>Essais</th>
                          <th>Temps</th>
                          <th>Résultat</th>
                        </tr>
                      </thead>
                      <tbody id="history-table-body">
                        ${this.renderGameHistory()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

		// Stocker les références aux éléments DOM
		this.form = document.getElementById("formulaire-juste-prix");
		this.input = document.getElementById("prix-juste-prix");
		this.error = document.querySelector(".error-juste-prix");
		this.instructions = document.getElementById("instructions-juste-prix");
		this.resetButton = document.getElementById("button-reset");
		this.hintButton = document.getElementById("button-hint");
		this.timerDisplay = document.getElementById("timer");
		this.statsDisplay = document.getElementById("stats");
		this.difficultySelector = document.getElementById("difficulty-select");
		this.themeSelector = document.getElementById("theme-select");

		return true;
	}

	// Injecte le CSS nécessaire avec les nouveaux thèmes
	injectCSS() {
		if (document.getElementById("juste-prix-styles")) return;

		const styleElement = document.createElement("style");
		styleElement.id = "juste-prix-styles";

		styleElement.textContent = `
      /* Styles de base */
      .juste-prix-container {
        padding: 10px;
        border-radius: 10px;
        transition: all 0.3s ease;
      }
      
      .juste-prix-header {
        font-size: 2.5em;
        text-align: center;
        font-weight: bold;
        transition: color 0.3s ease;
      }
      
      #instructions-juste-prix {
        border-radius: 10px;
        overflow: hidden;
      }
      
      .instruction {
        padding: 15px;
        margin: 5px 0;
        border-radius: 5px;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      /* Animation pour les nouvelles instructions */
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .instruction {
        animation: slideIn 0.3s ease forwards;
      }
      
      /* Thème classique */
      .classic .juste-prix-header {
        color: #ff7315;
      }
      
      .classic .plus {
        background-color: #f67280;
      }
      
      .classic .moins {
        background-color: #ffa372;
      }
      
      .classic .fini {
        background-color: #0c9463;
        color: white;
      }
      
      .classic .perdu {
        background-color: #f67280;
        color: white;
      }
      
      /* Thème sombre */
      .dark {
        background-color: #2d3436;
        color: #dfe6e9;
      }
      
      .dark .juste-prix-header {
        color: #74b9ff;
      }
      
      .dark .bg-light {
        background-color: #3d4d5d !important;
        color: #dfe6e9;
      }
      
      .dark .form-control {
        background-color: #232b32;
        border-color: #4a6380;
        color: #dfe6e9;
      }
      
      .dark .form-control::placeholder {
        color: #b2bec3;
      }
      
      .dark .plus {
        background-color: #d63031;
        color: white;
      }
      
      .dark .moins {
        background-color: #0984e3;
        color: white;
      }
      
      .dark .fini {
        background-color: #00b894;
        color: white;
      }
      
      .dark .perdu {
        background-color: #d63031;
        color: white;
      }
      
      /* Thème coloré */
      .colorful {
        background-color: #fdcb6e;
      }
      
      .colorful .juste-prix-header {
        color: #6c5ce7;
        text-shadow: 2px 2px 0px #fd79a8;
      }
      
      .colorful .bg-light {
        background-color: #55efc4 !important;
      }
      
      .colorful .form-control {
        background-color: white;
        border: 2px solid #fd79a8;
      }
      
      .colorful .btn-primary {
        background-color: #6c5ce7;
        border-color: #6c5ce7;
      }
      
      .colorful .btn-secondary {
        background-color: #fd79a8;
        border-color: #fd79a8;
      }
      
      .colorful .plus {
        background-color: #e17055;
        color: white;
      }
      
      .colorful .moins {
        background-color: #0984e3;
        color: white;
      }
      
      .colorful .fini {
        background-color: #00b894;
        color: white;
      }
      
      .colorful .perdu {
        background-color: #d63031;
        color: white;
      }
      
      /* Animation confetti pour la victoire */
      @keyframes confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      
      .confetti {
        position: fixed;
        width: 10px;
        height: 10px;
        z-index: 1000;
        animation: confetti 3s ease-in-out forwards;
      }
    `;

		document.head.appendChild(styleElement);
	}

	// Génère un nombre aléatoire entre 0 et max en fonction de la difficulté
	getRandomInt(max) {
		switch (this.difficulty) {
			case "easy":
				// En mode facile, on génère des nombres "ronds" plus faciles à deviner
				return Math.floor(Math.random() * Math.floor(max / 10)) * 10;
			case "hard":
				// En mode difficile, on utilise tout l'intervalle avec des nombres décimaux
				return Math.floor(Math.random() * Math.floor(max * 10)) / 10;
			case "normal":
			default:
				// En mode normal, on utilise tout l'intervalle
				return Math.floor(Math.random() * Math.floor(max));
		}
	}

	// Vérification de la proposition avec l'ajout de la gestion du score
	check(number) {
		if (this.gameOver) return;

		let instruction = document.createElement("div");
		instruction.className = "instruction";

		// Calcul de l'écart relatif pour les indications
		const gap = Math.abs(number - this.randomNumber) / this.maxNumber;

		if (number < this.randomNumber) {
			instruction.classList.add("plus");

			let message = `#${this.trials} (${number}) C'est plus`;

			// Ajout d'indications sur la proximité
			if (gap < 0.05) {
				message += " - Vous y êtes presque !";
			} else if (gap < 0.2) {
				message += " - Pas très loin";
			}

			instruction.innerHTML = message;
		} else if (number > this.randomNumber) {
			instruction.classList.add("moins");

			let message = `#${this.trials} (${number}) C'est moins`;

			// Ajout d'indications sur la proximité
			if (gap < 0.05) {
				message += " - Vous y êtes presque !";
			} else if (gap < 0.2) {
				message += " - Pas très loin";
			}

			instruction.innerHTML = message;
		} else {
			// Arrêt du timer
			this.stopTimer();
			this.endTime = new Date();

			// Calcul du temps écoulé
			const timeElapsed = Math.floor((this.endTime - this.startTime) / 1000);
			const minutes = Math.floor(timeElapsed / 60);
			const seconds = timeElapsed % 60;
			const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds
				.toString()
				.padStart(2, "0")}`;

			instruction.classList.add("fini");
			instruction.innerHTML = `
        <div>
          <strong>#${this.trials} (${number}) Bravo, vous avez gagné !</strong>
          <p class="mb-0">En ${this.trials} essais et en ${timeFormatted}</p>
        </div>
        <div>
          <button class="btn btn-sm btn-light share-button">
            <i class="bi bi-share"></i> Partager
          </button>
        </div>
      `;

			// Lancer l'effet confetti
			this.createConfetti();

			// Mise à jour du meilleur score
			if (!this.bestScore || this.trials < this.bestScore) {
				this.bestScore = this.trials;
				localStorage.setItem("justePrix_bestScore", this.trials);
				this.statsDisplay.innerHTML = `Meilleur score: ${this.trials} essais`;

				// Notification pour le nouveau record
				this.showToast("🏆 Nouveau record !");
			}

			// Enregistrement de la partie dans l'historique
			this.saveGameToHistory({
				date: new Date().toLocaleDateString(),
				difficulty: this.difficulty,
				trials: this.trials,
				time: timeFormatted,
				result: "Victoire",
			});

			this.gameOver = true;
			this.input.disabled = true;
		}

		this.instructions.prepend(instruction);

		// Vérification du nombre maximum d'essais
		if (this.maxTrials > 0 && this.trials >= this.maxTrials && !this.gameOver) {
			// Arrêt du timer
			this.stopTimer();

			this.gameOver = true;
			let gameOverInstruction = document.createElement("div");
			gameOverInstruction.className = "instruction perdu";
			gameOverInstruction.innerHTML = `
        <div>
          <strong>Vous avez perdu !</strong>
          <p class="mb-0">Le nombre était ${this.randomNumber}</p>
        </div>
      `;
			this.instructions.prepend(gameOverInstruction);
			this.input.disabled = true;

			// Enregistrement de la partie dans l'historique
			this.saveGameToHistory({
				date: new Date().toLocaleDateString(),
				difficulty: this.difficulty,
				trials: this.trials,
				time: this.timerDisplay.textContent,
				result: "Défaite",
			});
		}

		// Ajouter un gestionnaire pour le bouton de partage
		const shareButton = instruction.querySelector(".share-button");
		if (shareButton) {
			shareButton.addEventListener("click", () => this.shareResult());
		}
	}

	// Création de l'effet confetti pour célébrer la victoire
	createConfetti() {
		const colors = ["#ff7315", "#0c9463", "#f67280", "#ffa372", "#74b9ff"];

		for (let i = 0; i < 100; i++) {
			const confetti = document.createElement("div");
			confetti.className = "confetti";
			confetti.style.backgroundColor =
				colors[Math.floor(Math.random() * colors.length)];
			confetti.style.left = `${Math.random() * 100}vw`;
			confetti.style.top = "-10px";
			confetti.style.transform = `scale(${Math.random() * 1.5})`;
			document.body.appendChild(confetti);

			// Nettoyage des confettis après l'animation
			setTimeout(() => {
				if (confetti.parentNode) {
					confetti.parentNode.removeChild(confetti);
				}
			}, 3000);
		}
	}

	// Partage du résultat
	shareResult() {
		const text = `🎮 J'ai trouvé le Juste Prix en ${this.trials} essais ! (Difficulté: ${this.difficulty}) Pouvez-vous faire mieux ?`;

		// Vérifier si l'API Web Share est disponible
		if (navigator.share) {
			navigator
				.share({
					title: "Juste Prix - Mon résultat",
					text: text,
				})
				.catch((err) => {
					console.error("Erreur lors du partage:", err);
					// Fallback - copier le texte dans le presse-papier
					this.copyToClipboard(text);
				});
		} else {
			// Fallback pour les navigateurs qui ne supportent pas l'API Web Share
			this.copyToClipboard(text);
		}
	}

	// Copie le texte dans le presse-papier
	copyToClipboard(text) {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();

		try {
			document.execCommand("copy");
			this.showToast("Résultat copié dans le presse-papier !");
		} catch (err) {
			console.error("Erreur lors de la copie:", err);
			this.showToast("Impossible de copier le résultat");
		}

		document.body.removeChild(textarea);
	}

	// Affiche un toast
	showToast(message) {
		const toast = document.createElement("div");
		toast.className = "juste-prix-toast";
		toast.textContent = message;
		document.body.appendChild(toast);

		// Ajouter le style du toast si nécessaire
		if (!document.getElementById("toast-style")) {
			const style = document.createElement("style");
			style.id = "toast-style";
			style.textContent = `
        .juste-prix-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
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
      `;
			document.head.appendChild(style);
		}

		// Supprimer le toast après l'animation
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 3000);
	}

	// Réinitialiser le jeu avec les nouvelles options
	resetGame() {
		// Réinitialiser les variables
		this.trials = 0;
		this.gameOver = false;
		this.hintsUsed = 0;

		// Définir la difficulté en fonction de la sélection
		if (this.difficultySelector) {
			this.difficulty = this.difficultySelector.value;
		}

		// Définir le thème en fonction de la sélection
		if (this.themeSelector) {
			this.theme = this.themeSelector.value;
			document.querySelector(
				".juste-prix-container"
			).className = `juste-prix-container ${this.theme}`;
		}

		// Paramètres spécifiques à la difficulté
		switch (this.difficulty) {
			case "easy":
				this.maxTrials = 10;
				this.hintsAllowed = 2;
				break;
			case "normal":
				this.maxTrials = 7;
				this.hintsAllowed = 1;
				break;
			case "hard":
				this.maxTrials = 5;
				this.hintsAllowed = 0;
				break;
		}

		// Générer le nouveau nombre aléatoire
		this.randomNumber = this.getRandomInt(this.maxNumber);

		// Réinitialiser l'interface
		this.input.value = "";
		this.input.disabled = false;
		this.instructions.innerHTML = "";
		this.error.style.display = "none";

		// Mettre à jour le bouton d'indice
		if (this.hintButton) {
			this.hintButton.querySelector(".badge").textContent = this.hintsAllowed;
			this.hintButton.disabled = this.hintsAllowed === 0;
		}

		// Démarrer le timer
		this.startTimer();

		console.log("Nouveau nombre à deviner:", this.randomNumber);
	}

	// Démarrer le timer
	startTimer() {
		// Réinitialiser le timer précédent si nécessaire
		this.stopTimer();

		this.startTime = new Date();
		this.timerDisplay.textContent = "00:00";

		this.timerInterval = setInterval(() => {
			const now = new Date();
			const timeElapsed = Math.floor((now - this.startTime) / 1000);
			const minutes = Math.floor(timeElapsed / 60);
			const seconds = timeElapsed % 60;
			this.timerDisplay.textContent = `${minutes
				.toString()
				.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
		}, 1000);
	}

	// Arrêter le timer
	stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	// Donner un indice
	giveHint() {
		if (this.hintsUsed >= this.hintsAllowed || this.gameOver) return;

		// Générer un indice en fonction de la difficulté
		let hintText = "";
		if (this.difficulty === "easy") {
			// En facile, donne une plage précise
			const lowerBound = Math.floor(this.randomNumber / 10) * 10;
			const upperBound = lowerBound + 10;
			hintText = `Le nombre est entre ${lowerBound} et ${upperBound}`;
		} else {
			// En normal, donne juste la parité
			hintText = `Le nombre est ${
				this.randomNumber % 2 === 0 ? "pair" : "impair"
			}`;
		}

		// Afficher l'indice
		let hintElement = document.createElement("div");
		hintElement.className = "instruction";
		hintElement.style.backgroundColor = "#74b9ff";
		hintElement.innerHTML = `
      <div>
        <strong>Indice ${this.hintsUsed + 1}/${this.hintsAllowed}:</strong>
        <p class="mb-0">${hintText}</p>
      </div>
    `;
		this.instructions.prepend(hintElement);

		// Mettre à jour le nombre d'indices
		this.hintsUsed++;
		this.hintButton.querySelector(".badge").textContent =
			this.hintsAllowed - this.hintsUsed;

		// Désactiver le bouton si tous les indices ont été utilisés
		if (this.hintsUsed >= this.hintsAllowed) {
			this.hintButton.disabled = true;
		}
	}

	// Charger le meilleur score depuis le localStorage
	loadBestScore() {
		return parseInt(localStorage.getItem("justePrix_bestScore")) || null;
	}

	// Charger l'historique des parties depuis le localStorage
	loadGameHistory() {
		return JSON.parse(localStorage.getItem("justePrix_gameHistory")) || [];
	}

	// Enregistrer une partie dans l'historique
	saveGameToHistory(game) {
		// Limiter l'historique à 10 parties
		this.gameHistory.unshift(game);
		if (this.gameHistory.length > 10) {
			this.gameHistory = this.gameHistory.slice(0, 10);
		}

		// Sauvegarder dans le localStorage
		localStorage.setItem(
			"justePrix_gameHistory",
			JSON.stringify(this.gameHistory)
		);

		// Mettre à jour l'affichage de l'historique
		const historyTableBody = document.getElementById("history-table-body");
		if (historyTableBody) {
			historyTableBody.innerHTML = this.renderGameHistory();
		}
	}

	// Générer le HTML pour l'historique des parties
	renderGameHistory() {
		if (!this.gameHistory || this.gameHistory.length === 0) {
			return '<tr><td colspan="5" class="text-center">Aucune partie enregistrée</td></tr>';
		}

		return this.gameHistory
			.map(
				(game) => `
      <tr>
        <td>${game.date}</td>
        <td><span class="badge ${this.getDifficultyBadgeColor(
					game.difficulty
				)}">${game.difficulty}</span></td>
        <td>${game.trials}</td>
        <td>${game.time}</td>
        <td><span class="badge ${
					game.result === "Victoire" ? "bg-success" : "bg-danger"
				}">${game.result}</span></td>
      </tr>
    `
			)
			.join("");
	}

	// Obtenir la couleur du badge en fonction de la difficulté
	getDifficultyBadgeColor(difficulty) {
		switch (difficulty) {
			case "easy":
				return "bg-success";
			case "normal":
				return "bg-primary";
			case "hard":
				return "bg-danger";
			default:
				return "bg-secondary";
		}
	}

	// Initialise les comportements JavaScript
	initializeScripts() {
		// Cacher l'erreur au départ
		this.error.style.display = "none";

		// Générer le nombre aléatoire initial
		this.randomNumber = this.getRandomInt(this.maxNumber);
		console.log("Nombre à deviner:", this.randomNumber);

		// Démarrer le timer
		this.startTimer();

		// Gestionnaire d'événement pour le formulaire
		this.form.addEventListener("submit", (e) => {
			e.preventDefault();

			if (this.gameOver) return;

			let choosedNumber = parseFloat(this.input.value);

			// Vérification spécifique pour le mode difficile (nombres décimaux)
			if (this.difficulty === "hard") {
				if (
					isNaN(choosedNumber) ||
					choosedNumber < 0 ||
					choosedNumber > this.maxNumber
				) {
					this.error.style.display = "block";
					return;
				}
			} else {
				// Mode facile et normal (nombres entiers)
				choosedNumber = parseInt(this.input.value);
				if (
					isNaN(choosedNumber) ||
					choosedNumber < 0 ||
					choosedNumber > this.maxNumber
				) {
					this.error.style.display = "block";
					return;
				}
			}

			this.error.style.display = "none";
			this.input.value = "";
			this.trials++;
			this.check(choosedNumber);
		});

		// Gestionnaire d'événement pour le bouton reset
		this.resetButton.addEventListener("click", () => {
			this.resetGame();
		});

		// Gestionnaire d'événement pour le bouton d'indice
		this.hintButton.addEventListener("click", () => {
			this.giveHint();
		});

		// Gestionnaire d'événement pour le changement de difficulté
		this.difficultySelector.addEventListener("change", () => {
			this.resetGame();
		});

		// Gestionnaire d'événement pour le changement de thème
		this.themeSelector.addEventListener("change", () => {
			const container = document.querySelector(".juste-prix-container");
			container.className = `juste-prix-container ${this.themeSelector.value}`;
			this.theme = this.themeSelector.value;
			localStorage.setItem("justePrix_theme", this.theme);
		});

		// Charger le thème préféré de l'utilisateur
		const savedTheme = localStorage.getItem("justePrix_theme");
		if (savedTheme) {
			this.theme = savedTheme;
			this.themeSelector.value = savedTheme;
			const container = document.querySelector(".juste-prix-container");
			container.className = `juste-prix-container ${savedTheme}`;
		}
	}

	// Méthode pour nettoyer les ressources (appelée quand on change d'application)
	destroy() {
		// Arrêter le timer
		this.stopTimer();

		// Supprimer les écouteurs d'événements
		if (this.form) {
			this.form.onsubmit = null;
			this.resetButton.onclick = null;
			this.hintButton.onclick = null;
			this.difficultySelector.onchange = null;
			this.themeSelector.onchange = null;
		}

		// Supprimer les confettis qui pourraient être encore présents
		const confettis = document.querySelectorAll(".confetti");
		confettis.forEach((confetti) => confetti.remove());
	}

	// Méthode publique pour initialiser tout le jeu
	init() {
		if (this.initialized) return;

		// Étape 1: Injecter le CSS
		this.injectCSS();

		// Étape 2: Générer le HTML
		this.generateHTML();

		// Étape 3: Initialiser les scripts JS
		this.initializeScripts();

		this.initialized = true;
		console.log("Jeu du Juste Prix initialisé avec succès");
	}
}
