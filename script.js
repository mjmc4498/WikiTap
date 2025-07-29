document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DICCIONARIO Y ESTADO DE LA APLICACIÓN ---
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

    // --- 2. REFERENCIAS AL DOM ---
    const textInput = document.getElementById('text-input');
    const speakBtn = document.getElementById('speak-btn');

    // Vistas
    const viewModeRadios = document.querySelectorAll('input[name="view-mode"]');
    const signsContainer = document.getElementById('signs-container');
    const stepPlayerContainer = document.getElementById('step-player-container');
    const stepSignDisplay = document.getElementById('step-sign-display');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepCounter = document.getElementById('step-counter');

    // Modales
    const editModal = document.getElementById('edit-modal');
    const manageModal = document.getElementById('manage-modal');
    const modalSignsGrid = document.getElementById('modal-signs-grid');
    const dictListContainer = document.getElementById('dict-list-container');

    // Formularios
    const translatorForm = document.getElementById('translator-form');
    const addSignForm = document.getElementById('add-sign-form');
    const newWordInput = document.getElementById('new-word-input');
    const newUrlInput = document.getElementById('new-url-input');

    // --- 3. INICIALIZACIÓN ---
    initializeDictionary();

    // --- 4. EVENT LISTENERS ---
    translatorForm.addEventListener('submit', (e) => { e.preventDefault(); translateTextToSigns(); });
    speakBtn.addEventListener('click', speakText);
    document.getElementById('manage-signs-btn').addEventListener('click', openManagePanel);

    viewModeRadios.forEach(radio => radio.addEventListener('change', renderTranslation));
    nextBtn.addEventListener('click', () => { if (currentSignIndex < currentSignSequence.length - 1) { currentSignIndex++; renderStepView(); } });
    prevBtn.addEventListener('click', () => { if (currentSignIndex > 0) { currentSignIndex--; renderStepView(); } });

    // Listeners para Modales (usando delegación para algunos)
    document.getElementById('close-edit-modal-btn').addEventListener('click', closeSignSelector);
    editModal.addEventListener('click', (e) => { if (e.target.classList.contains('modal__backdrop')) closeSignSelector(); });

    document.getElementById('close-manage-modal-btn').addEventListener('click', closeManagePanel);
    manageModal.addEventListener('click', (e) => { if (e.target.classList.contains('modal__backdrop')) closeManagePanel(); });

    addSignForm.addEventListener('submit', handleAddNewSign);
    dictListContainer.addEventListener('click', handleDeleteSign);
    document.getElementById('save-dict-btn').addEventListener('click', saveDictionaryToLocalStorage);
    document.getElementById('reset-dict-btn').addEventListener('click', resetDictionary);
    modalSignsGrid.addEventListener('click', handleSignSelection);

    // --- 5. LÓGICA DE DICCIONARIO Y ALMACENAMIENTO ---
    function initializeDictionary() {
        const savedDict = localStorage.getItem('signLibrary');
        try {
            signLibrary = savedDict ? JSON.parse(savedDict) : { ...defaultSignLibrary };
        } catch (e) {
            console.error("Error al parsear el diccionario guardado:", e);
            signLibrary = { ...defaultSignLibrary };
        }
    }

    function saveDictionaryToLocalStorage() {
        const entries = dictListContainer.querySelectorAll('.dict-entry');
        const updatedLibrary = {};
        entries.forEach(entry => {
            const word = entry.querySelector('.dict-entry__word').textContent;
            const url = entry.querySelector('.dict-entry__url').value;
            if (word && url) updatedLibrary[word] = url;
        });
        signLibrary = updatedLibrary;
        localStorage.setItem('signLibrary', JSON.stringify(signLibrary));
        alert('¡Diccionario guardado!');
        populateManagePanel();
    }

    function resetDictionary() {
        if (confirm('¿Restaurar el diccionario original? Perderás todos tus cambios.')) {
            localStorage.removeItem('signLibrary');
            initializeDictionary();
            populateManagePanel();
            alert('Diccionario restaurado.');
        }
    }

    // --- 6. LÓGICA DE TRADUCCIÓN Y VISTAS ---
    function translateTextToSigns() {
        const inputText = textInput.value.trim();
        currentSignSequence = [];
        if (inputText) {
            const normalizedText = inputText.toLowerCase().replace(/[.,!?;¿¡]/g, '');
            currentSignSequence = normalizedText.split(/\s+/).filter(word => word.length > 0);
        }
        currentSignIndex = 0;
        renderTranslation();
    }

    function renderTranslation() {
        const selectedView = document.querySelector('input[name="view-mode"]:checked').value;
        const isGridView = selectedView === 'grid';

        signsContainer.style.display = isGridView ? 'flex' : 'none';
        stepPlayerContainer.style.display = isGridView ? 'none' : 'flex';

        if (isGridView) renderGridView();
        else renderStepView();
    }

    function renderGridView() {
        signsContainer.innerHTML = '';
        if (currentSignSequence.length === 0) {
            signsContainer.innerHTML = '<p>Escribe algo en el cuadro de arriba para empezar.</p>';
            return;
        }
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
        signWrapper.className = 'sign';
        const signPath = signLibrary[word];

        let element;
        if (signPath) {
            element = document.createElement('img');
            element.src = signPath;
            element.alt = word;
            element.className = 'sign__image';
            element.onerror = () => element.replaceWith(createFallbackText(word));
        } else {
            element = createFallbackText(word);
        }

        const wordLabel = document.createElement('p');
        wordLabel.textContent = word;
        wordLabel.className = 'sign__label';

        signWrapper.appendChild(element);
        signWrapper.appendChild(wordLabel);

        if (index !== -1) { // No añadir botón de editar a los elementos del modal de selección
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✏️';
            editBtn.className = 'sign__edit-btn';
            editBtn.title = 'Cambiar seña';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSignSelector(index);
            });
            signWrapper.appendChild(editBtn);
        }
        return signWrapper;
    }

    function createFallbackText(word) {
        const fallback = document.createElement('span');
        fallback.textContent = word;
        fallback.className = 'sign__fallback-text';
        return fallback;
    }

    // --- 7. LÓGICA DE MODALES ---
    function openModal(modalElement) {
        modalElement.setAttribute('aria-hidden', 'false');
        const firstFocusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
    }

    function closeModal(modalElement) {
        modalElement.setAttribute('aria-hidden', 'true');
    }

    // Modal de Edición
    function openSignSelector(index) {
        wordIndexToEdit = index;
        modalSignsGrid.innerHTML = '';
        for (const word in signLibrary) {
            const signElement = createSignElement(word, -1); // -1 para no mostrar botón de editar
            signElement.dataset.newWord = word;
            modalSignsGrid.appendChild(signElement);
        }
        openModal(editModal);
    }

    function closeSignSelector() { closeModal(editModal); }

    function handleSignSelection(event) {
        const selectedSign = event.target.closest('.sign');
        if (selectedSign) {
            const newWord = selectedSign.dataset.newWord;
            if (newWord && wordIndexToEdit > -1) {
                currentSignSequence[wordIndexToEdit] = newWord;
                closeSignSelector();
                renderTranslation();
            }
        }
    }

    // Modal de Administración
    function openManagePanel() {
        populateManagePanel();
        openModal(manageModal);
    }

    function closeManagePanel() { closeModal(manageModal); }

    function populateManagePanel() {
        dictListContainer.innerHTML = '';
        Object.entries(signLibrary).forEach(([word, url]) => {
            const entry = document.createElement('div');
            entry.className = 'dict-entry';
            entry.innerHTML = `
                <span class="dict-entry__word">${word}</span>
                <input type="url" class="dict-entry__url" value="${url}">
                <button class="dict-entry__delete-btn" data-word="${word}" title="Eliminar">&times;</button>
            `;
            dictListContainer.appendChild(entry);
        });
    }

    function handleAddNewSign(e) {
        e.preventDefault();
        const newWord = newWordInput.value.trim().toLowerCase();
        const newUrl = newUrlInput.value.trim();
        if (newWord && newUrl) {
            if (signLibrary[newWord]) {
                alert('Esa palabra ya existe. Edita la entrada existente.');
                return;
            }
            // No se guarda directamente, solo se añade a la UI. El usuario debe guardar.
            const entry = document.createElement('div');
            entry.className = 'dict-entry';
            entry.innerHTML = `
                <span class="dict-entry__word">${newWord}</span>
                <input type="url" class="dict-entry__url" value="${newUrl}">
                <button class="dict-entry__delete-btn" data-word="${newWord}" title="Eliminar">&times;</button>
            `;
            dictListContainer.appendChild(entry);
            addSignForm.reset();
        }
    }

    function handleDeleteSign(e) {
        if (e.target.classList.contains('dict-entry__delete-btn')) {
            // No se borra del objeto, solo de la UI. El usuario debe guardar.
            e.target.closest('.dict-entry').remove();
        }
    }

    // --- 8. OTRAS UTILIDADES ---
    function speakText() {
        if (!('speechSynthesis' in window)) {
            alert('Lo siento, tu navegador no es compatible con la función de Texto a Voz.');
            return;
        }
        window.speechSynthesis.cancel();
        const textToSpeak = textInput.value.trim();
        const utterance = new SpeechSynthesisUtterance(textToSpeak || "Por favor, escribe algo para leer.");
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }
});
