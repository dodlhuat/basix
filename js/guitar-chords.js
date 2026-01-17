const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E']; // High E to Low E
const FRETS = 15;

// Standard tuning offsets from C (C=0)
// E=4, B=11, G=7, D=2, A=9, E=4
// But we need absolute pitch to know octaves if we want to be precise, 
// but for simple note names, relative is fine.
// Let's map open strings to their semitone value (0-11)
const STRING_TUNING = [4, 11, 7, 2, 9, 4];

// Chord Formulas (intervals in semitones)
const CHORD_FORMULAS = {
    'Major': [0, 4, 7],
    'Minor': [0, 3, 7],
    '5': [0, 7],
    '7': [0, 4, 7, 10],
    'Maj7': [0, 4, 7, 11],
    'm7': [0, 3, 7, 10],
    'sus4': [0, 5, 7],
    'sus2': [0, 2, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8]
};

// Common open chords for the dropdown
const COMMON_CHORDS = {
    'C Major': [0, 1, 0, 2, 3, -1], // -1 for muted/unused
    'A Major': [0, 2, 2, 2, 0, -1],
    'G Major': [3, 0, 0, 0, 2, 3],
    'E Major': [0, 0, 1, 2, 2, 0],
    'D Major': [2, 3, 2, 0, -1, -1],
    'A Minor': [0, 1, 2, 2, 0, -1],
    'E Minor': [0, 0, 0, 2, 2, 0],
    'D Minor': [1, 3, 2, 0, -1, -1]
};

// State
let selectedFrets = [-1, -1, -1, -1, -1, -1];
let startFret = 0;
let visibleFrets = 15;

function init() {
    handleResize();
    window.addEventListener('resize', handleResize);

    renderFretboard();
    populateChordSelect();
    setupEventListeners();
}

function handleResize() {
    const isMobile = window.innerWidth <= 768;
    const newVisible = isMobile ? 5 : 15;
    if (newVisible !== visibleFrets) {
        visibleFrets = newVisible;
        renderFretboard();
    }
}

function renderFretboard() {
    const container = document.getElementById('fretboard');
    container.innerHTML = '';

    STRINGS.forEach((stringName, stringIndex) => {
        const stringDiv = document.createElement('div');
        stringDiv.className = 'string';

        // Label for string name (optional, but good for context)
        // For now, keeping it simple as before

        // Create frets (showing visibleFrets count)
        for (let i = 0; i <= visibleFrets; i++) {
            // Actual semantic fret number
            const currentFretNum = startFret + i;

            // Skip rendering if beyond max reasonable frets (e.g., 24), but let's just stick to logic

            const fretDiv = document.createElement('div');
            fretDiv.className = 'fret';

            // Mark if this is the Nut (fret 0)
            if (currentFretNum === 0) {
                fretDiv.classList.add('nut');
            }

            // Check if selected
            if (selectedFrets[stringIndex] === currentFretNum) {
                fretDiv.classList.add('active');
            }

            // Note marker
            const marker = document.createElement('div');
            marker.className = 'note-marker';

            // Calculate note
            const noteIndex = (STRING_TUNING[stringIndex] + currentFretNum) % 12;
            marker.textContent = NOTES[noteIndex];

            fretDiv.appendChild(marker);

            // Click handler
            fretDiv.addEventListener('click', () => toggleFret(stringIndex, currentFretNum));

            // Fret labels (markers)
            // Adding dots logic dynamically might be complex. 
            // Simplified: showing note name is good enough? 
            // Let's add a small number indicator for the fret number if needed?
            // User didn't request explicit fret numbers, but it helps.
            // Let's leave it clean for now.

            stringDiv.appendChild(fretDiv);
        }

        container.appendChild(stringDiv);
    });

    // Add Fret Numbers Row
    const numberRow = document.createElement('div');
    numberRow.className = 'fret-numbers';

    for (let i = 0; i <= visibleFrets; i++) {
        const currentFretNum = startFret + i;
        const numberDiv = document.createElement('div');
        numberDiv.className = 'fret-number';

        // Handle Nut alignment matching
        if (currentFretNum === 0) {
            numberDiv.classList.add('nut-number');
            numberDiv.style.flex = '0 0 50px';
            numberDiv.style.borderRightWidth = '8px'; // Match nut border
            numberDiv.style.borderRightColor = 'transparent';
            numberDiv.textContent = '0';
        } else {
            numberDiv.textContent = currentFretNum;
        }

        numberRow.appendChild(numberDiv);
    }
    container.appendChild(numberRow);
}

function toggleFret(stringIndex, fretIndex) {
    if (selectedFrets[stringIndex] === fretIndex) {
        // Deselect
        selectedFrets[stringIndex] = -1;
    } else {
        // Select
        selectedFrets[stringIndex] = fretIndex;
    }
    renderFretboard();
    detectChord();
}

function populateChordSelect() {
    const select = document.getElementById('chord-select');
    for (const [name, frets] of Object.entries(COMMON_CHORDS)) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }
}

function setupEventListeners() {
    document.getElementById('chord-select').addEventListener('change', (e) => {
        const chordName = e.target.value;
        if (chordName && COMMON_CHORDS[chordName]) {
            selectedFrets = [...COMMON_CHORDS[chordName]];
            // If selected frets are out of view, maybe jump startFret?
            // Let's just render.
            // Find min/max fret to adjust view?
            // Optional polish. For now, leave startFret as user set.
            renderFretboard();
            detectChord();
        }
    });

    document.getElementById('transpose-up').addEventListener('click', () => transpose(1));
    document.getElementById('transpose-down').addEventListener('click', () => transpose(-1));

    const startFretInput = document.getElementById('start-fret');
    if (startFretInput) {
        startFretInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (val < 0) val = 0;
            if (val > 15) val = 15; // Arbitrary max
            startFret = val;
            renderFretboard();
        });
    }
}

function transpose(semitones) {
    // Shift all selected frets
    for (let i = 0; i < selectedFrets.length; i++) {
        if (selectedFrets[i] !== -1) { // Don't shift muted strings
            let newFret = selectedFrets[i] + semitones;
            // logic for open strings shifting down implies they can't go below 0 unless muted.
            if (newFret < 0) newFret = 0; // clamp
            if (newFret > 24) newFret = 24; // arbitrary max
            selectedFrets[i] = newFret;
        }
    }
    renderFretboard();
    detectChord();

    // Reset select to custom because we modified it
    document.getElementById('chord-select').value = "";
}

function detectChord() {
    // Collect all notes being played
    const playedNotes = [];
    const playedIndices = [];

    selectedFrets.forEach((fret, stringIndex) => {
        if (fret !== -1) {
            const noteIndex = (STRING_TUNING[stringIndex] + fret) % 12;
            playedNotes.push(NOTES[noteIndex]);
            playedIndices.push(noteIndex);
        }
    });

    if (playedNotes.length === 0) {
        document.getElementById('detected-chord').textContent = "--";
        return;
    }

    // Remove duplicates and sort
    const uniqueIndices = [...new Set(playedIndices)].sort((a, b) => a - b);

    // Try to match against formulas
    // We need to check every note as a potential root
    let bestMatch = null;

    for (const rootIndex of uniqueIndices) {
        const rootNote = NOTES[rootIndex];

        // Calculate intervals relative to this root
        const currentIntervals = uniqueIndices.map(index => {
            let interval = index - rootIndex;
            if (interval < 0) interval += 12;
            return interval;
        }).sort((a, b) => a - b);

        // Compare with formulas
        for (const [type, formula] of Object.entries(CHORD_FORMULAS)) {
            if (arraysEqual(currentIntervals, formula)) {
                bestMatch = `${rootNote} ${type}`;
                break;
            }
        }
        if (bestMatch) break;
    }

    document.getElementById('detected-chord').textContent = bestMatch || "Unknown";
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

init();
