// Lógica para el Traductor de Lengua de Señas

document.addEventListener('DOMContentLoaded', () => {
    // --- DICCIONARIO Y ESTADO ---
    const defaultSignLibrary = {
        'hola': 'assets/signs/hola.gif',
        'adiós': 'assets/signs/adios.gif',
        'gracias': 'assets/signs/gracias.gif',
        'por favor': 'assets/signs/por-favor.gif',
        'buenos días': 'assets/signs/buenos-dias.gif',
        'cómo estás': 'assets/signs/como-estas.gif',
        'yo': 'assets/signs/yo.gif',
        'bien': 'assets/signs/bien.gif',
        'tú': 'assets/signs/tu.gif',
        'casa': 'assets/signs/casa.gif',
        'ayuda': 'assets/signs/ayuda.gif',
        'qué': 'assets/signs/que.gif'
    };

    let signLibrary = {};
    let currentSignSequence = [];
    let currentSignIndex = 0;
    let wordIndexToEdit = -1;

    // --- REFERENCIAS AL DOM ---
    // Paneles, modales y botones principales
    const translatorForm = document.getElementById('translator-form');
    const textInput = document.getElementById('text-input');
    const speakBtn = document.getElementById('speak-btn');
    const manageSignsBtn = document.getElementById('manage-signs-btn');

    // Traducción y vistas
    const viewModeRadios = document.querySelectorAll('input[name="view-mode"]');
    const signsContainer = document.getElementById('signs-container');

    // Reproductor paso a paso
    const stepPlayerContainer = document.getElementById('step-player-container');
    const stepSignDisplay = document.getElementById('step-sign-display');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepCounter = document.getElementById('step-counter');

    // Modal de edición
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalSignsGrid = document.getElementById('modal-signs-grid');

    // Modal de administración
    const manageModal = document.getElementById('manage-modal');
    const closeManageModalBtn = document.getElementById('close-manage-modal-btn');
    const dictListContainer = document.getElementById('dict-list-container');
    const addSignForm = document.getElementById('add-sign-form');
    const newWordInput = document.getElementById('new-word-input');
    const newUrlInput = document.getElementById('new-url-input');
    const saveDictBtn = document.getElementById('save-dict-btn');
    const resetDictBtn = document.getElementById('reset-dict-btn');

    // --- INICIALIZACIÓN ---
    initializeDictionary();

    // --- EVENT LISTENERS ---
    // Principales
    translatorForm.addEventListener('submit', (e) => { e.preventDefault(); translateTextToSigns(); });
    speakBtn.addEventListener('click', speakText);
    manageSignsBtn.addEventListener('click', openManagePanel);

    // Vistas y navegación
    viewModeRadios.forEach(radio => radio.addEventListener('change', renderTranslation));
    nextBtn.addEventListener('click', () => { if (currentSignIndex < currentSignSequence.length - 1) { currentSignIndex++; renderStepView(); } });
    prevBtn.addEventListener('click', () => { if (currentSignIndex > 0) { currentSignIndex--; renderStepView(); } });

    // Modales
    closeModalBtn.addEventListener('click', closeSignSelector);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeSignSelector(); });
    closeManageModalBtn.addEventListener('click', () => manageModal.classList.add('modal-hidden'));

    // Administración del diccionario
    addSignForm.addEventListener('submit', handleAddNewSign);
    dictListContainer.addEventListener('click', handleDeleteSign);
    saveDictBtn.addEventListener('click', saveDictionaryToLocalStorage);
    resetDictBtn.addEventListener('click', resetDictionary);

    // --- LÓGICA DE DICCIONARIO ---
    function initializeDictionary() {
        const savedDict = localStorage.getItem('signLibrary');
        try {
            signLibrary = savedDict ? JSON.parse(savedDict) : { ...defaultSignLibrary };
        } catch (e) {
            console.error("Error parsing saved dictionary:", e);
            signLibrary = { ...defaultSignLibrary };
        }
    }

    function saveDictionaryToLocalStorage() {
        // Primero, actualizamos el objeto `signLibrary` con los valores de los inputs
        const entries = dictListContainer.querySelectorAll('.dict-entry');
        const updatedLibrary = {};
        entries.forEach(entry => {
            const word = entry.querySelector('.word').textContent;
            const url = entry.querySelector('.url-input').value;
            if (word && url) {
                updatedLibrary[word] = url;
            }
        });
        signLibrary = updatedLibrary;

        localStorage.setItem('signLibrary', JSON.stringify(signLibrary));
        alert('¡Diccionario guardado en tu navegador!');
        populateManagePanel(); // Repoblar para asegurar consistencia
    }

    function resetDictionary() {
        if (confirm('¿Estás seguro de que quieres borrar tu diccionario personalizado y restaurar el original?')) {
            localStorage.removeItem('signLibrary');
            initializeDictionary();
            populateManagePanel();
            alert('Diccionario restaurado a la versión por defecto.');
        }
    }

    // --- LÓGICA DEL PANEL DE ADMINISTRACIÓN ---
    function openManagePanel() {
        populateManagePanel();
        manageModal.classList.remove('modal-hidden');
    }

    function populateManagePanel() {
        dictListContainer.innerHTML = '';
        for (const word in signLibrary) {
            const entry = document.createElement('div');
            entry.className = 'dict-entry';
            entry.innerHTML = `
                <span class="word">${word}</span>
                <input type="url" class="url-input" value="${signLibrary[word]}">
                <button class="delete-btn" data-word="${word}" title="Eliminar">&times;</button>
            `;
            dictListContainer.appendChild(entry);
        }
    }

    function handleAddNewSign(e) {
        e.preventDefault();
        const newWord = newWordInput.value.trim().toLowerCase();
        const newUrl = newUrlInput.value.trim();
        if (newWord && newUrl) {
            if (signLibrary[newWord]) {
                alert('Esa palabra ya existe en el diccionario.');
                return;
            }
            signLibrary[newWord] = newUrl;
            populateManagePanel(); // Refrescar la lista
            newWordInput.value = '';
            newUrlInput.value = '';
        }
    }

    function handleDeleteSign(e) {
        if (e.target.classList.contains('delete-btn')) {
            const wordToDelete = e.target.dataset.word;
            if (confirm(`¿Seguro que quieres eliminar la palabra "${wordToDelete}"?`)) {
                delete signLibrary[wordToDelete];
                populateManagePanel();
            }
        }
    }

    // --- LÓGICA DE TRADUCCIÓN Y VISTAS (MODIFICADA LIGERAMENTE) ---
    // (El resto de funciones como translateTextToSigns, renderTranslation, etc. permanecen mayormente igual
    // pero ahora usan la variable `signLibrary` que puede ser la por defecto o la personalizada)

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
            signsContainer.appendChild(createSignElement(word, index));
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
        stepSignDisplay.appendChild(createSignElement(word, currentSignIndex));
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
        if (index !== -1) {
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
            window.speechSynthesis.cancel();
            const textToSpeak = textInput.value.trim();
            if (textToSpeak === '') {
                const utterance = new SpeechSynthesisUtterance("Por favor, escribe algo para leer.");
                utterance.lang = 'es-ES';
                window.speechSynthesis.speak(utterance);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Lo siento, tu navegador no es compatible con la función de Texto a Voz.');
        }
    }
});
