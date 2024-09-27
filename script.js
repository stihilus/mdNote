let currentNote = '';
let currentTag = '';
const markdownEditor = document.getElementById('markdownEditor');
const previewPane = document.getElementById('previewPane');
const documentList = document.getElementById('documentList');
const currentDocTitle = document.getElementById('currentDocTitle');
const saveTitleButton = document.getElementById('saveTitleButton');

migrateOldNotes();

function getFirstNote() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);
        if (noteData && noteData.content !== undefined) {
            return key;
        }
    }
    return null; // Return null if no valid notes are found
}

function initializeNotes() {
    if (localStorage.length === 0) {
        const welcomeNote = "# Welcome to mdNotepad!\n\n" +
            "## Quick Tips:\n" +
            "1. Click on a note title to edit it\n" +
            "2. Use tags to organize your notes\n" +
            "3. Filter notes by tags using the dropdown in the sidebar\n" +
            "4. Access the Markdown syntax guide by clicking [md cheat sheet] in the sidebar\n\n" +
            "## Features:\n" +
            "1. **Real-time Markdown Preview**: See your formatted text as you type\n" +
            "2. **Document Management**: Create, edit, and delete notes with ease\n" +
            "3. **Export Functionality**: Save your notes as Markdown files\n" +
            "4. **Dark Theme**: Easy on the eyes for long writing sessions\n" +
            "5. **Responsive Design**: Works on desktop and mobile browsers\n" +
            "6. **Local Storage**: Your notes are saved in your browser's local storagem\n" +
            "7. **Drag and Drop**: Import Markdown files by dragging them into the app\n" +
            "8. **Import Feature**: Use the 'import' button to select and load .md files\n" +
            "7. **Resizable Interface**: Adjust the app window by dragging the bottom-right corner\n" +
            "8. **Drag and Drop**: Import Markdown files by dragging them into the app\n" +
            "9. **Markdown Cheat Sheet**: Quick access to Markdown syntax reference\n" +
            "10. **Tagging System**: Organize your notes using tags for quick retrieval\n" +
            "Enjoy writing in **Markdown**!\n"
            ;

        const markdownGuide = `# Markdown Syntax Guide
## Headers
# H1
## H2
### H3
#### H4
##### H5
###### H6
## Emphasis
*This text will be italic*
*This will also be italic*
**This text will be bold**
**This will also be bold**
*You ****can**** combine them*
## Lists
### Unordered
* Item 1
* Item 2
  * Item 2a
  * Item 2b
### Ordered
1. Item 1
2. Item 2
3. Item 3
   1. Item 3a
   2. Item 3b
## Links
[GitHub](http://github.com)
## Images
![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)
## Blockquotes
As Kanye West said:
> We're living the future so
> the present is our past.
## Inline code
I think you should use an
\`<addr>\` element here instead.
## Code Blocks
\`\`\`javascript
function fancyAlert(arg) {
  if(arg) {
    $.facebox({div:'#foo'})
  }
}
\`\`\`
## Task Lists
- [x] @mentions, #refs, [links](), **formatting**, and <del>tags</del> supported
- [x] list syntax required (any unordered or ordered list supported)
- [x] this is a complete item
- [ ] this is an incomplete item
## Tables
| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
## Strikethrough
~~This text is strikethrough~~
## Horizontal Rule
---
## Emoji
:smile: :laughing: :blush: :smiley: :relaxed:
## Footnotes
Here's a sentence with a footnote. [^1]
[^1]: This is the footnote.
## Definition Lists
term
: definition
## Abbreviations
The HTML specification is maintained by the W3C.
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium
## LaTeX Math (if supported by your Markdown renderer)
When $a \\ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are 
$$ x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a} $$`;

        setNoteData("Welcome Note", welcomeNote, [], new Date().toISOString());
        setNoteData("Markdown Guide", markdownGuide, [], new Date().toISOString());
    }
    updateDocumentList();
    const firstNoteKey = getFirstNote();
    if (firstNoteKey) {
        loadNote(firstNoteKey);
    } else {
        newNote();
    }
}

function updateDocumentList() {
    documentList.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);

        // Skip this note if it doesn't have the current tag (unless no tag is selected)
        if (currentTag && (!noteData.tags || !noteData.tags.includes(currentTag))) {
            continue;
        }

        const li = document.createElement('li');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = key; // Removed the ├ character
        li.appendChild(titleSpan);

        // Add creation date
        if (noteData.createdAt) {
            const dateSpan = document.createElement('span');
            dateSpan.textContent = new Date(noteData.createdAt).toLocaleDateString();
            dateSpan.style.color = '#999'; // Lighter gray color
            dateSpan.style.fontSize = '0.8em';
            dateSpan.style.marginLeft = '10px';
            li.appendChild(dateSpan);
        }

        li.onclick = () => loadNote(key);
        if (key === currentNote) {
            li.classList.add('active');
        }
        documentList.appendChild(li);
    }
}


function loadNote(key) {
    if (currentNote) {
        saveNote();
    }

    const noteData = getNoteData(key);
    console.log('Loading note:', key, 'Data:', noteData);  // Add this line

    if (!noteData || noteData.content === undefined) {
        console.warn(`Note "${key}" not found. Loading first available note.`);
        const firstNoteKey = getFirstNote();

        if (firstNoteKey) {
            currentNote = firstNoteKey;
            loadNote(firstNoteKey);
        } else {
            console.error("No valid notes found. Creating a new note.");
            newNote();
        }
        return;
    }

    currentNote = key;
    markdownEditor.value = noteData.content || '';
    currentDocTitle.textContent = key;
    currentTag = '';
    document.getElementById('tagFilter').value = '';
    updateDocumentList();
    renderMarkdown();
    displayTags();

    // Ensure all elements in the document header are visible
    document.getElementById('tagInput').style.display = 'inline-block';
    document.querySelector('button[onclick="saveNote()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="exportNote()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="showDeleteModal()"]').style.display = 'inline-block';

    // Hide the save title button if it exists
    const saveTitleButton = document.getElementById('saveTitleButton');
    if (saveTitleButton) {
        saveTitleButton.style.display = 'none';
    }

    console.log('Header elements visibility set');  // Add this line
}

function renderMarkdown() {
    const markdown = markdownEditor.value;
    const html = DOMPurify.sanitize(marked.parse(markdown));
    previewPane.innerHTML = html;
}

function saveNote() {
    if (currentNote) {
        const noteData = getNoteData(currentNote);
        noteData.content = markdownEditor.value;
        noteData.createdAt = noteData.createdAt || new Date().toISOString(); // Ensure createdAt is saved
        setNoteData(currentNote, noteData.content, noteData.tags, noteData.createdAt); // Save tags and createdAt
        updateDocumentList();
    }
}

function autoSave() {
    saveNote();
    renderMarkdown();
}

function showDeleteModal() {
    document.getElementById('deleteModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function deleteNote() {
    localStorage.removeItem(currentNote);
    markdownEditor.value = '';
    currentNote = '';
    currentDocTitle.textContent = 'No document selected';
    updateDocumentList();
    closeModal('deleteModal');
}

function newNote() {
    if (currentNote) {
        saveNote();
    }
    let newNoteName = `New Note`;
    let counter = 1;
    while (localStorage.getItem(newNoteName)) {
        newNoteName = `New Note (${counter})`;
        counter++;
    }
    setNoteData(newNoteName, '', [], new Date().toISOString());
    loadNote(newNoteName);
}

function exportNote() {
    if (currentNote) {
        const noteData = getNoteData(currentNote);
        const blob = new Blob([noteData.content], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${currentNote}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('Please select a document first.');
    }
}

function editTitle() {
    if (currentNote) {
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = currentNote;
        titleInput.className = 'title-input';
        currentDocTitle.replaceWith(titleInput);
        titleInput.focus();

        // Create save button if it doesn't exist
        let saveTitleButton = document.getElementById('saveTitleButton');
        if (!saveTitleButton) {
            saveTitleButton = document.createElement('button');
            saveTitleButton.id = 'saveTitleButton';
            saveTitleButton.textContent = 'Save';
            currentDocTitle.parentNode.insertBefore(saveTitleButton, currentDocTitle.nextSibling);
        }
        saveTitleButton.style.display = 'inline-block';

        // Hide other buttons
        document.querySelectorAll('.document-header button:not(#saveTitleButton)').forEach(btn => {
            btn.style.display = 'none';
        });

        titleInput.onblur = () => {
            if (!saveTitleButton.contains(document.activeElement)) {
                saveTitle();
            }
        };

        titleInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTitle();
            } else if (e.key === 'Escape') {
                restoreTitle();
            }
        };

        // Add click event for the save button
        saveTitleButton.onclick = (e) => {
            e.preventDefault();
            saveTitle();
        };
    }
}

function saveTitle() {
    const titleInput = document.querySelector('.title-input');
    if (titleInput && titleInput.value.trim() !== '') {
        const oldTitle = currentNote;
        const newTitle = titleInput.value.trim();

        if (oldTitle !== newTitle) {
            const noteData = getNoteData(oldTitle);
            localStorage.removeItem(oldTitle);
            setNoteData(newTitle, noteData.content, noteData.tags);
            currentNote = newTitle;
        }

        restoreTitle();
        updateDocumentList();

        // Focus on the newly renamed document
        const newDocumentItem = Array.from(documentList.children).find(li => li.textContent.includes(newTitle));
        if (newDocumentItem) {
            newDocumentItem.click();
        }
    } else {
        restoreTitle();
    }
}

function restoreTitle() {
    const titleInput = document.querySelector('.title-input');
    if (titleInput) {
        currentDocTitle.textContent = currentNote;
        titleInput.replaceWith(currentDocTitle);
        const saveTitleButton = document.getElementById('saveTitleButton');
        if (saveTitleButton) {
            saveTitleButton.style.display = 'none';
        }

        // Show other buttons
        document.querySelectorAll('.document-header button:not(#saveTitleButton)').forEach(btn => {
            btn.style.display = 'inline-block';
        });
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            let content = e.target.result;
            let fileName = file.name.replace('.md', '');
            let tags = [];
            let createdAt = new Date().toISOString();

            // Check if the content is JSON
            try {
                const jsonContent = JSON.parse(content);
                if (jsonContent.content) {
                    content = jsonContent.content;
                    tags = jsonContent.tags || [];
                    createdAt = jsonContent.createdAt || createdAt;
                }
            } catch (error) {
                // If it's not JSON, treat it as pure Markdown content
            }

            if (localStorage.getItem(fileName)) {
                let counter = 1;
                while (localStorage.getItem(`${fileName} (${counter})`)) {
                    counter++;
                }
                fileName = `${fileName} (${counter})`;
            }
            setNoteData(fileName, content, tags, createdAt);
            loadNote(fileName);
        };
        reader.readAsText(file);
    }
    // Reset the file input
    event.target.value = '';
}

// Drag and drop functionality
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        if (item.kind === 'file' && (item.type === 'text/markdown' || item.type === '')) {
            document.getElementById('dropOverlay').style.display = 'flex';
        }
    }
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
        document.getElementById('dropOverlay').style.display = 'none';
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropOverlay').style.display = 'none';
    dragCounter = 0;
    const files = e.dataTransfer.files;
    if (files.length > 0 && (files[0].type === 'text/markdown' || files[0].name.endsWith('.md'))) {
        const reader = new FileReader();
        reader.onload = function(e) {
            let content = e.target.result;
            let fileName = files[0].name.replace('.md', '');
            let tags = [];
            let createdAt = new Date().toISOString();

            // Check if the content is JSON
            try {
                const jsonContent = JSON.parse(content);
                if (jsonContent.content) {
                    content = jsonContent.content;
                    tags = jsonContent.tags || [];
                    createdAt = jsonContent.createdAt || createdAt;
                }
            } catch (error) {
                // If it's not JSON, treat it as pure Markdown content
            }

            if (getNoteData(fileName)) {
                let counter = 1;
                while (getNoteData(`${fileName} (${counter})`)) {
                    counter++;
                }
                fileName = `${fileName} (${counter})`;
            }
            setNoteData(fileName, content, tags, createdAt);
            console.log('Imported file:', fileName, 'Data:', getNoteData(fileName));  // Add this line
            loadNote(fileName);
        };
        reader.readAsText(files[0]);
    }
});

function openCheatSheet() {
    const modal = document.getElementById('cheatSheetModal');
    const content = document.getElementById('cheatSheetContent');

    // Populate the cheat sheet content
    content.innerHTML = `
    <h3>Headers</h3>
    <pre># H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6</pre>

    <h3>Emphasis</h3>
    <pre>*italic*   **bold**\n_italic_   __bold__</pre>

    <h3>Lists</h3>
    <pre>1. First ordered item\n2. Second item\n\n- Unordered item\n- Another item</pre>

    <h3>Links</h3>
    <pre>[Link Text](http://www.example.com)</pre>

    <h3>Images</h3>
    <pre>![Alt Text](http://www.example.com/image.jpg)</pre>

    <h3>Blockquotes</h3>
    <pre>> This is a blockquote</pre>

    <h3>Code</h3>
    <pre>\`inline code\`\n\n\`\`\`\ncode block\n\`\`\`</pre>
  `;

    modal.style.display = 'block';
}

function closeCheatSheet() {
    const modal = document.getElementById('cheatSheetModal');
    modal.style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('cheatSheetModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


function addTag(event) {
    if (event.key === 'Enter' && currentNote) {
        const tags = event.target.value.split(',').map(tag => tag.trim());
        const noteData = getNoteData(currentNote);
        noteData.tags = [...new Set([...(noteData.tags || []), ...tags])];
        setNoteData(currentNote, noteData.content, noteData.tags);
        event.target.value = '';
        displayTags();
        updateTagFilter();
        updateDocumentList(); // Add this line
    }
}

function displayTags() {
    const tagDisplay = document.getElementById('tagDisplay');
    const noteData = getNoteData(currentNote);
    tagDisplay.innerHTML = '';
    if (noteData.tags) {
        noteData.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-pill';
            tagElement.innerHTML = `${tag}<span class="remove-tag" onclick="removeTag('${tag}')">×</span>`;
            tagDisplay.appendChild(tagElement);
        });
    }
}

function removeTag(tag) {
    const noteData = getNoteData(currentNote);
    noteData.tags = noteData.tags.filter(t => t !== tag);
    setNoteData(currentNote, noteData.content, noteData.tags);
    displayTags();
    updateTagFilter();
    updateDocumentList(); // Add this line
}

function updateTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    const allTags = new Set();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);
        if (noteData.tags) {
            noteData.tags.forEach(tag => allTags.add(tag));
        }
    }
    tagFilter.innerHTML = '<option value="">Filter by tag</option>';
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

function migrateOldNotes() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);
        setNoteData(key, noteData.content, noteData.tags);
    }
}

function filterByTag(tag) {
    currentTag = tag;
    updateDocumentList();
}

function getNoteData(key) {
    const data = localStorage.getItem(key);
    try {
        return JSON.parse(data);
    } catch (e) {
        // If parsing fails, it's probably an old format note (just a string)
        return { content: data, tags: [] };
    }
}

function setNoteData(key, content, tags = [], createdAt = new Date().toISOString()) {
    localStorage.setItem(key, JSON.stringify({ content, tags, createdAt }));
}

document.getElementById('tagInput').addEventListener('keypress', addTag);
document.getElementById('tagFilter').addEventListener('change', (e) => {
    filterByTag(e.target.value);
});

markdownEditor.addEventListener('input', autoSave);
initializeNotes();

// Make the notepad draggable
const notepad = document.querySelector('.notepad');
const header = document.querySelector('.header');

let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

header.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    const rect = notepad.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    if (e.target === header) {
        isDragging = true;
        notepad.style.transition = 'none'; // Disable transition during drag
        notepad.style.transform = 'none'; // Remove centering transform
        notepad.style.left = `${rect.left}px`;
        notepad.style.top = `${rect.top}px`;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        setTranslate(currentX, currentY, notepad);
    }
}

function dragEnd(e) {
    isDragging = false;
    // Save the final position
    const rect = notepad.getBoundingClientRect();
    xOffset = rect.left;
    yOffset = rect.top;
}

function setTranslate(xPos, yPos, el) {
    el.style.left = `${xPos}px`;
    el.style.top = `${yPos}px`;
}

// Add this function to your existing code
function initializeNotepadPosition() {
    const rect = notepad.getBoundingClientRect();
    notepad.style.transform = 'none';
    notepad.style.left = `${rect.left}px`;
    notepad.style.top = `${rect.top}px`;
}

// Call this function after the page loads
window.addEventListener('load', initializeNotepadPosition);
