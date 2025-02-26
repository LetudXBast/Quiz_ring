const alertSound = new Audio("https://www.myinstants.com/media/sounds/alarm.mp3"); 

// 🔹 Fonction pour hacher un mot de passe en SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
    return hashHex;
}


function showSection(sectionId) {
    let sections = document.querySelectorAll("section");

    sections.forEach(sec => {
        // ✅ Vérifier si la section est déjà active pour éviter une nouvelle animation
        if (sec.id !== sectionId) {
            sec.classList.remove("active");
            sec.style.opacity = "0";
            sec.style.transform = "translateY(-100%)"; /* Cache la section */
            sec.style.visibility = "hidden";
            sec.style.maxHeight = "0"; /* Ferme la section */
            sec.style.overflowY = "hidden";
        }
    });

    let targetSection = document.getElementById(sectionId);
    // 🔹 Si l'utilisateur n'est pas connecté, empêcher l'accès aux documents
    if (sectionId === "documents" && !localStorage.getItem("loggedInUser")) {
        alert("Vous devez être connecté pour accéder aux documents !");
        return;
    }
  
    // ✅ Si la section est déjà active, ne pas la réanimer
    if (targetSection.classList.contains("active")) {
        return;
    }

    setTimeout(() => {
        targetSection.classList.add("active");
        targetSection.style.opacity = "1";
        targetSection.style.transform = "translateY(0)"; /* Affiche la section */
        targetSection.style.visibility = "visible";
        targetSection.style.maxHeight = "100vh"; /* Ouvre la section */
        targetSection.style.overflowY = "auto";

        // ✅ Assurer un bon positionnement et éviter de descendre trop bas
        window.scrollTo({ top: 140, behavior: "smooth" });
    }, 50);
}


// 🔹 Vérifier l’état de connexion à l’ouverture de la page
document.addEventListener("DOMContentLoaded", function () {
    updateUI();
});


const sections = document.querySelectorAll("section");
document.addEventListener("DOMContentLoaded", function() {
    showSection("home"); // Afficher automatiquement la page d'accueil au chargement
});


function updateScoreDisplay() {
    let bestScoresList = document.getElementById("best-scores");
    let lastScoreDisplay = document.getElementById("last-score");

    let currentQuizLevel = ""; // Stocke le niveau actuel du quiz

    // Récupérer les scores enregistrés
    let scores = JSON.parse(localStorage.getItem("bestScores")) || [];

    // Mettre à jour le dernier score
    if (scores.length > 0) {
        lastScoreDisplay.innerText = `${scores[0].score} (${scores[0].time})`;
    }

    // Vider la liste des meilleurs scores
    bestScoresList.innerHTML = "";

    // Ajouter les scores au HTML
    scores.forEach((entry, index) => {
        let li = document.createElement("li");
        li.innerText = `#${index + 1} - ${entry.score} points (${entry.time})`;
        bestScoresList.appendChild(li);
    });
}

let timer; // Stocke l'intervalle du timer
let timeLeft = 300; // 5 minutes (300 secondes)





// Données des quiz
const quizData = {
    beginner: [
        { question: "Qu'est-ce que la cristallisation ?", answers: ["Processus chimique", "Réaction thermique", "Fusion"], correct: 0 },
        { question: "Quel solvant est souvent utilisé ?", answers: ["Eau", "Acide sulfurique", "Éthanol"], correct: 0 },
        { question: "Quelle est la première étape de la cristallisation ?", answers: ["Dissolution", "Filtration", "Solidification"], correct: 0 },
        { question: "Quel est l'effet du refroidissement lent sur la taille des cristaux ?", answers: ["Cristaux plus grands", "Cristaux plus petits", "Aucun effet"], correct: 0 },
        { question: "Quelle est la différence entre une cristallisation naturelle et industrielle ?", answers: ["Contrôle des conditions", "Composition chimique", "Processus différent"], correct: 0 },
        { question: "Quel paramètre influence le plus la cristallisation ?", answers: ["Température", "Lumière", "Pression"], correct: 0 },
        { question: "Pourquoi ajoute-t-on parfois des impuretés dans un processus de cristallisation ?", answers: ["Pour déclencher la nucléation", "Pour accélérer la fusion", "Pour améliorer la dissolution"], correct: 0 },
        { question: "Dans quel domaine la cristallisation industrielle est-elle utilisée ?", answers: ["Pharmacie", "Astronomie", "Génie civil"], correct: 0 }
    ],
    intermediate: [
        { question: "À quelle température l'eau cristallise ?", answers: ["0°C", "100°C", "50°C"], correct: 0 },
        { question: "Quel est le but principal ?", answers: ["Purification", "Évaporation", "Fusion"], correct: 0 },
    ],
    advanced: [
        { question: "Quel type de cristallisation existe ?", answers: ["Fractionnée", "Fusion", "Condensation"], correct: 0 },
        { question: "Comment améliorer la cristallisation ?", answers: ["Refroidissement lent", "Chauffage rapide", "Congélation"], correct: 0 },
    ]
};

let currentQuiz, currentQuestionIndex, score;

function startQuiz(level) {  
    currentQuiz = quizData[level];
    currentQuizLevel = level;  // 🔹 Stocke le niveau actuel ici ✅
    currentQuestionIndex = 0;
    score = 0;
    timeLeft = 300; // Réinitialise le temps à 5 minutes
      // ✅ Réinitialiser le progress ring AVANT de commencer le quiz
    updateProgressRing(0, currentQuiz.length); // ✅ Réinitialisation à vide

    updateTimerDisplay();
      // Démarrer le timer
    clearInterval(timer); // Réinitialise le timer s'il était actif
    timer = setInterval(updateTimer, 1000); // mise à jour toutes les 1000 ms

  
    showQuestion();
    document.getElementById("quiz-container").classList.remove("hidden");
    document.getElementById("quiz-result").classList.add("hidden");
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--; // Diminue le temps restant
        updateTimerDisplay();

        // Joue un son si le temps restant est 10 secondes
        if (timeLeft === 10) {
            alertSound.play();
        }
    } else {
        clearInterval(timer);
        showTimeUpMessage(); // Affiche un message "Temps écoulé !"
    }
}

/*//Ajouter un timer
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--; // Diminue le temps restant
        updateTimerDisplay();
    } else {
        clearInterval(timer);
        endQuiz(); // Termine le quiz quand le temps est écoulé
    }
}*/

// Met à jour l’affichage numérique du timer (MM:SS). Met à jour la largeur de la barre de temps pour qu’elle diminue progressivement. Change la barre en rouge quand il reste moins d’une minute !
function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById("timer-text").innerText = 
        (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

    // Mise à jour de la barre de progression
    let progress = (timeLeft / 300) * 100; // Calcul du pourcentage restant
    document.getElementById("timer-bar").style.width = progress + "%";

    // Change la couleur en rouge quand il reste moins d'une minute
    if (timeLeft <= 60) {
        document.getElementById("timer-bar").style.background = "#dc3545"; // Rouge
    }
}




function showQuestion() {
    let q = currentQuiz[currentQuestionIndex];
    document.getElementById("question").innerText = q.question;
    let answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = ""; // Nettoyage des anciennes réponses

    q.answers.forEach((answer, i) => {
        let btn = document.createElement("button");
        btn.innerText = answer;
        btn.classList.add("answer-btn");
        btn.onclick = () => checkAnswer(i, btn);
        answersDiv.appendChild(btn);
    });
}


function checkAnswer(selected, selectedBtn) {
    let correctIndex = currentQuiz[currentQuestionIndex].correct;
    let answerButtons = document.querySelectorAll(".answer-btn");

    // Ajouter les couleurs
    answerButtons.forEach((btn, index) => {
        if (index === correctIndex) {
            btn.classList.add("correct"); // Bonne réponse en vert
        }
        if (index === selected && index !== correctIndex) {
            btn.classList.add("wrong"); // Mauvaise réponse en rouge
        }
        // Désactiver tous les boutons après réponse
        btn.disabled = true;
    });

    // Mise à jour du score si la réponse est correcte
    if (selected === correctIndex) score++;

    // Afficher le bouton "Suivant"
    document.getElementById("next-btn").classList.remove("hidden");
}

// Passer à la question suivante
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuiz.length) {
        showQuestion();
        document.getElementById("next-btn").classList.add("hidden"); // Cacher le bouton "Suivant"
    } else {
        endQuiz();
    }
}


function endQuiz() {
    clearInterval(timer); // Stoppe le timer à la fin du quiz
    document.getElementById("score").innerText = score;
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("quiz-result").classList.remove("hidden");
    let resultContainer = document.getElementById("quiz-result");

    setTimeout(() => {
        resultContainer.classList.add("show");
    }, 200);
    resultContainer.classList.remove("hidden");

  updateProgressRing(score, currentQuiz.length);

    // Stockage du score avec l'heure actuelle
    let now = new Date();
    let scoreEntry = {
        score: score,
        time: now.toLocaleString()
    };

    // 🔹 Récupérer le pseudo entré avant le quiz
    let pseudo = document.getElementById("pseudo").value.trim();
    
    // Si aucun pseudo n'a été entré, utiliser "Anonyme"
    if (!pseudo) {
        pseudo = "Anonyme";
    }

    // 🔹 Enregistrer le score dans Google Sheets avec le pseudo
    saveScoreToGoogleSheet(pseudo, score, currentQuizLevel);

    // Récupérer les scores existants depuis localStorage
    let scores = JSON.parse(localStorage.getItem("bestScores")) || [];

    // Ajouter le nouveau score
    scores.push(scoreEntry);

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);

    // Garder uniquement les 3 meilleurs
    scores = scores.slice(0, 3);

    // Sauvegarder dans localStorage
    localStorage.setItem("bestScores", JSON.stringify(scores));

    // Mettre à jour l'affichage
    updateScoreDisplay();
}



function restartQuiz() {
    document.getElementById("quiz-result").classList.add("hidden");
    showSection("quiz");
}

function showTimeUpMessage() {
    let messageBox = document.getElementById("time-up-message");
    messageBox.classList.add("show");

    setTimeout(() => {
        messageBox.classList.remove("show");
        endQuiz(); // Termine le quiz après 2 secondes
    }, 2000);
}

//Sauvegarder les résultats en Google Sheet
function saveScoreToGoogleSheet(nom, score, niveau) {
    const url = "https://script.google.com/macros/s/AKfycbzeZr-t7NBSKM1exuIAReOR7n7PpIMbhCl286XLi7f9cGRg7df1sD0MXjTl_aNgn25t/exec"; // Remplace par ton URL Google Apps Script

    const data = {
        nom: nom,
        score: score,
        niveau: niveau
    };

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => console.log("Score envoyé !"))
    .catch(error => console.error("Erreur d'envoi :", error));
}

particlesJS("background", {
    particles: {
        number: { value: 100 },
        size: { value: 3 },
        move: { speed: 2 },
        line_linked: { enable: true, opacity: 0.3 },
    }
});

function updateVisitCount() {
    let visitCount = localStorage.getItem("visitCount") || 0; // Récupère le compteur global
    let userVisited = localStorage.getItem("userVisited"); // Vérifie si l'utilisateur a déjà été compté

    if (!userVisited) {
        visitCount++; // Incrémente uniquement si l'utilisateur n'a jamais été compté
        localStorage.setItem("visitCount", visitCount); // Sauvegarde le nouveau compteur
        localStorage.setItem("userVisited", "true"); // Marque cet utilisateur comme "déjà compté"
    }

    document.getElementById("visit-count").innerText = visitCount; // Met à jour l'affichage
}

// 🔹 Exécuter la fonction au chargement du site
document.addEventListener("DOMContentLoaded", updateVisitCount);

function setTheme(theme) {
    let themeToggle = document.getElementById("theme-toggle");
    let themeIcon = document.getElementById("theme-icon");

    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
        localStorage.setItem("theme", "dark");
        themeIcon.innerText = "🌙"; // Lune pour indiquer qu'on peut passer en mode sombre
    } else {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
        themeIcon.innerText = "☀️"; // Soleil pour indiquer qu'on peut passer en mode clair

    }
}

// 🔹 Activer le mode nuit par défaut si aucune préférence n'est enregistrée
document.addEventListener("DOMContentLoaded", function () {
    let savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
        // Pas de préférence enregistrée ? On met directement en mode nuit
        setTheme("dark");
    } else {
        // Charger le mode enregistré
        setTheme(savedTheme);
    }

    // Ajout de l'écouteur de clic sur le bouton
    document.getElementById("theme-toggle").addEventListener("click", function () {
        let currentTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
        setTheme(currentTheme);
    });
});


// 🔹 Alterner entre Connexion et Inscription
function toggleLogin() {
    document.getElementById("login-container").classList.remove("hidden");
    document.getElementById("register-container").classList.add("hidden");
}

function toggleRegister() {
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("register-container").classList.remove("hidden");
}





// 🔹 Inscription d'un nouvel utilisateur avec hachage du mot de passe
async function registerUser() {
    let username = document.getElementById("register-username").value.trim();
    let password = document.getElementById("register-password").value.trim();

    if (!username || !password) {
        alert("Veuillez remplir tous les champs !");
        return;
    }

    // Vérifier si l'utilisateur existe déjà
    if (localStorage.getItem(username)) {
        alert("Ce nom d'utilisateur est déjà pris !");
        return;
    }

    // Hacher le mot de passe avant de le stocker
    const hashedPassword = await hashPassword(password);

    // Stocker l'utilisateur avec le mot de passe haché
    let userData = { password: hashedPassword };
    localStorage.setItem(username, JSON.stringify(userData));

    alert("Inscription réussie !");
    toggleLogin(); // Bascule vers le formulaire de connexion
}


// 🔹 Connexion avec vérification du mot de passe haché
async function loginUser() {
    let username = document.getElementById("login-username").value.trim();
    let password = document.getElementById("login-password").value.trim();

    let userData = JSON.parse(localStorage.getItem(username));

    if (!userData) {
        alert("Nom d'utilisateur ou mot de passe incorrect !");
        return;
    }

    // Hacher le mot de passe entré pour le comparer avec celui enregistré
    const hashedPassword = await hashPassword(password);

    if (userData.password !== hashedPassword) {
        alert("Nom d'utilisateur ou mot de passe incorrect !");
        return;
    }

    localStorage.setItem("loggedInUser", username);
    alert("Connexion réussie !");
    updateUI();
}



// 🔹 Mise à jour de l'interface utilisateur après connexion/déconnexion
// 🔹 Vérifier si l'utilisateur est connecté et lui permettre d'accéder aux documents
// 🔹 Met à jour l'interface après connexion/déconnexion
function updateUI() {
    let loggedInUser = localStorage.getItem("loggedInUser");

    if (loggedInUser) {
        document.getElementById("login-container").classList.add("hidden");
        document.getElementById("register-container").classList.add("hidden");
        document.getElementById("download-container").classList.remove("hidden");
        document.getElementById("logout-btn").classList.remove("hidden"); // 🔹 Affiche "Se Déconnecter"
        document.getElementById("doc-access-btn").classList.remove("hidden");
        document.getElementById("user-name").innerText = loggedInUser;
        document.getElementById("user-doc-name").innerText = loggedInUser;

        // 🔹 Défilement automatique vers le haut après connexion
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
    } else {
        document.getElementById("login-container").classList.remove("hidden");
        document.getElementById("register-container").classList.add("hidden");
        document.getElementById("download-container").classList.add("hidden");
        document.getElementById("logout-btn").classList.add("hidden"); // 🔹 Cache "Se Déconnecter"
        document.getElementById("doc-access-btn").classList.add("hidden");
    }
}


// 🔹 Vérifier si un utilisateur est déjà connecté au chargement de la page
document.addEventListener("DOMContentLoaded", updateUI);

// 🔹 Déconnexion
function logoutUser() {   localStorage.removeItem("loggedInUser");
    updateUI();
}





function updateProgressRing(score, total) {
    const segments = [
        document.getElementById("segment1"), // 🔴 Rouge → Rouge Orangé
        document.getElementById("segment2"), // 🟠 Rouge Orangé → Orange/Jaune
        document.getElementById("segment3"), // 🟡 Orange/Jaune → Jaune/Vert
        document.getElementById("segment4")  // 🟢 Jaune/Vert → Vert Puissant
    ];
    const scoreText = document.getElementById("score-text");

    let percentage = score / total;
    let filledSegments = Math.floor(percentage * 4); // ✅ Nombre de quarts remplis
    let lastSegmentFill = (percentage * 4) % 1; // ✅ Proportion du dernier segment

    // ✅ Réinitialisation instantanée des segments avant l'animation
    segments.forEach(seg => {
        seg.style.transition = "none";
        seg.style.strokeDashoffset = 79;
    });

    // ✅ Délai pour éviter un clignotement avant l'animation
    setTimeout(() => {
        // ✅ Active les transitions de remplissage fluide
        segments.forEach(seg => seg.style.transition = "stroke-dashoffset 0.4s linear");

        // ✅ Remplit les segments un par un avec un **léger chevauchement**
        for (let i = 0; i < filledSegments; i++) {
            setTimeout(() => {
                segments[i].style.strokeDashoffset = 0;
            }, i * 370); // ✅ Passage fluide avec **un léger chevauchement**
        }

        // ✅ Remplit partiellement le dernier segment si nécessaire
        if (filledSegments < 4) {
            setTimeout(() => {
                segments[filledSegments].style.strokeDashoffset = 79 * (1 - lastSegmentFill);
            }, filledSegments * 370);
        }

        // ✅ Mise à jour du texte central (affiché légèrement avant la fin complète)
        setTimeout(() => {
            scoreText.innerText = `${score} / ${total}`;
        }, filledSegments * 370 /2);
    }, 100);
}
