// Lógica para el Traductor de Lengua de Señas

document.addEventListener('DOMContentLoaded', () => {
    // 1. Diccionario de señas (simulado)
    const signLibrary = {
        'hola': 'assets/signs/hola.gif',
        'adiós': 'assets/signs/adios.gif',
        'gracias': 'assets/signs/gracias.gif',
        'por': 'assets/signs/por.gif',
        'favor': 'assets/signs/favor.gif',
        'buenos': 'assets/signs/buenos.gif',
        'días': 'assets/signs/dias.gif',
        'cómo': 'assets/signs/como.gif',
        'estás': 'assets/signs/estas.gif',
        'yo': 'assets/signs/yo.gif',
        'bien': 'assets/signs/bien.gif',
        'tú': 'assets/signs/tu.gif',
        'casa': 'assets/signs/casa.gif',
        'ayuda': 'assets/signs/ayuda.gif',
        'qué': 'assets/signs/que.gif'
    };

    // Variables de estado
    let currentSignSequence = [];
    let currentSignIndex = 0;
    let wordIndexToEdit = -1;

    // Referencias a elementos del DOM
    const translatorForm = document.getElementById('translator-form');
    const textInput = document.getElementById('text-input');
    const viewModeRadios = document.querySelectorAll('input[name="view-mode"]');
    const signsContainer = document.getElementById('signs-container');
    const stepPlayerContainer = document.getElementById('step-player-container');
    const stepSignDisplay = document.getElementById('step-sign-display');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepCounter = document.getElementById('step-counter');
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalSignsGrid = document.getElementById('modal-signs-grid');
    const speakBtn = document.getElementById('speak-btn');

    // --- EVENT LISTENERS ---
    translatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        translateTextToSigns();
    });

    speakBtn.addEventListener('click', speakText);

    viewModeRadios.forEach(radio => radio.addEventListener('change', renderTranslation));
    nextBtn.addEventListener('click', () => {
        if (currentSignIndex < currentSignSequence.length - 1) {
            currentSignIndex++;
            renderStepView();
        }
    });
    prevBtn.addEventListener('click', () => {
        if (currentSignIndex > 0) {
            currentSignIndex--;
            renderStepView();
        }
    });

    closeModalBtn.addEventListener('click', closeSignSelector);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeSignSelector();
    });

    // --- FUNCIONES PRINCIPALES ---
    function translateTextToSigns() {
        const inputText = textInput.value.trim();
        signsContainer.innerHTML = '';
        stepSignDisplay.innerHTML = '';
        stepCounter.textContent = '';
        currentSignSequence = [];

        if (inputText === '') {
            signsContainer.innerHTML = '<p>Por favor, escribe algo para traducir.</p>';
            document.querySelector('input[name="view-mode"][value="grid"]').checked = true;
            renderTranslation();
            return;
        }

        const normalizedText = inputText.toLowerCase().replace(/[.,!?;¿¡]/g, '');
        currentSignSequence = normalizedText.split(/\s+/).filter(word => word.length > 0);
        currentSignIndex = 0;
        renderTranslation();
    }

    function renderTranslation() {
        const selectedView = document.querySelector('input[name="view-mode"]:checked').value;
        document.querySelectorAll('.view-mode-container').forEach(c => c.classList.remove('active-view'));
        if (selectedView === 'grid') {
            signsContainer.classList.add('active-view');
            renderGridView();
        } else {
            stepPlayerContainer.classList.add('active-view');
            renderStepView();
        }
    }

    function renderGridView() {
        signsContainer.innerHTML = '';
        if (currentSignSequence.length === 0) return;
        currentSignSequence.forEach((word, index) => {
            const signElement = createSignElement(word, index);
            signsContainer.appendChild(signElement);
        });
    }

    function renderStepView() {
        stepSignDisplay.innerHTML = '';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        if (currentSignSequence.length === 0) {
            stepCounter.textContent = '0 / 0';
            return;
        }
        const word = currentSignSequence[currentSignIndex];
        const signElement = createSignElement(word, currentSignIndex);
        stepSignDisplay.appendChild(signElement);
        stepCounter.textContent = `${currentSignIndex + 1} / ${currentSignSequence.length}`;
        prevBtn.disabled = currentSignIndex === 0;
        nextBtn.disabled = currentSignIndex >= currentSignSequence.length - 1;
    }

    function createSignElement(word, index) {
        const signWrapper = document.createElement('div');
        signWrapper.classList.add('sign-wrapper');

        const signPath = signLibrary[word];
        let element;
        if (signPath) {
            element = document.createElement('img');
            element.src = signPath;
            element.alt = word;
            element.classList.add('sign-image');
            element.onerror = () => element.replaceWith(createFallbackText(word));
        } else {
            element = createFallbackText(word);
        }

        const wordLabel = document.createElement('p');
        wordLabel.textContent = word;
        wordLabel.classList.add('sign-label');
        signWrapper.appendChild(element);
        signWrapper.appendChild(wordLabel);

        if (index !== -1) { // No añadir botón de editar a los elementos del modal
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✏️';
            editBtn.className = 'edit-sign-btn';
            editBtn.title = 'Cambiar seña';
            editBtn.addEventListener('click', () => openSignSelector(index));
            signWrapper.appendChild(editBtn);
        }
        return signWrapper;
    }

    function createFallbackText(word) {
        const fallback = document.createElement('span');
        fallback.textContent = word;
        fallback.classList.add('word-text');
        return fallback;
    }

    // --- LÓGICA DEL MODAL DE EDICIÓN ---
    function openSignSelector(index) {
        wordIndexToEdit = index;
        modalSignsGrid.innerHTML = '';
        for (const word in signLibrary) {
            const signElement = createSignElement(word, -1);
            signElement.dataset.newWord = word;
            signElement.addEventListener('click', handleSignSelection);
            modalSignsGrid.appendChild(signElement);
        }
        editModal.classList.remove('modal-hidden');
    }

    function closeSignSelector() {
        editModal.classList.add('modal-hidden');
    }

    function handleSignSelection(event) {
        const newWord = event.currentTarget.dataset.newWord;
        if (newWord && wordIndexToEdit > -1) {
            currentSignSequence[wordIndexToEdit] = newWord;
            closeSignSelector();
            renderTranslation();
        }
    }

    // --- FUNCIÓN DE TEXTO A VOZ ---
    function speakText() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Detener cualquier discurso anterior

            const textToSpeak = textInput.value.trim();
            if (textToSpeak === '') {
                const utterance = new SpeechSynthesisUtterance("Por favor, escribe algo para leer.");
                utterance.lang = 'es-ES';
                window.speechSynthesis.speak(utterance);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'es-ES';
            utterance.pitch = 1;
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Lo siento, tu navegador no es compatible con la función de Texto a Voz.');
        }
    }
});
